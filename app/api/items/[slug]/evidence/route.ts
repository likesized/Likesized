import { EVIDENCE_LABELS, type EvidenceLevel } from "@/lib/domain";
import { FIT_RESULT_LABELS } from "@/lib/quick-fit-evidence";
import { createClient } from "@/lib/supabase/server";
import { trackedVariationDetail } from "@/lib/tracked-variation";

type Candidate={fit_report_id:string;user_id:string;evidence_product_id:string;original_size_label:string;historical_match_score:number;historical_coverage_percent:number;evidence_level:EvidenceLevel;fit:string};
type CandidateMeta={id:string;tracked_variation_key:string|null;garment_answers:Record<string,string>|null;created_at:string};
type Profile={id:string;username:string;display_name:string|null};
type Product={id:string;name:string;garment_type_key:string|null;brand:unknown};
type Brand={name:string};
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function dedupe(rows:Candidate[],metaById:Map<string,CandidateMeta>){const ordered=[...rows].sort((a,b)=>(metaById.get(b.fit_report_id)?.created_at??"").localeCompare(metaById.get(a.fit_report_id)?.created_at??"")||b.fit_report_id.localeCompare(a.fit_report_id));const seen=new Set<string>();return ordered.filter((row)=>{const meta=metaById.get(row.fit_report_id);const key=`${row.user_id}:${row.evidence_product_id}:${meta?.tracked_variation_key??row.fit_report_id}`;if(seen.has(key))return false;seen.add(key);return true;});}

export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const variation=new URL(request.url).searchParams.get("variation")?.trim()||null;
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub??null;
  if(!viewerId)return Response.json({error:"Authentication required."},{status:401});

  const {data:productData,error:productError}=await supabase.from("products").select("id,name,garment_type_key").eq("slug",slug).maybeSingle();
  if(productError||!productData)return Response.json({error:"Garment not found."},{status:404});
  const product=productData as {id:string;name:string;garment_type_key:string|null};
  const {data:candidateData,error:candidateError}=await supabase.rpc("get_product_evidence_candidates",{p_product_id:product.id,p_variant_id:null,p_result_limit:200});
  if(candidateError)return Response.json({error:"Evidence could not load."},{status:500});
  const raw=((candidateData??[]) as Candidate[]).filter((row)=>row.user_id!==viewerId);
  const reportIds=[...new Set(raw.map((row)=>row.fit_report_id))];
  if(!reportIds.length)return Response.json({rows:[]});

  const [metaResult,profileResult,productResult]=await Promise.all([
    supabase.from("fit_reports").select("id,tracked_variation_key,garment_answers,created_at").in("id",reportIds),
    supabase.from("profiles").select("id,username,display_name").in("id",[...new Set(raw.map((row)=>row.user_id))]),
    supabase.from("products").select("id,name,garment_type_key,brand:brands(name)").in("id",[...new Set(raw.map((row)=>row.evidence_product_id))]),
  ]);
  if(metaResult.error||profileResult.error||productResult.error)return Response.json({error:"Evidence details could not load."},{status:500});
  const metaById=new Map(((metaResult.data??[]) as CandidateMeta[]).map((row)=>[row.id,row]));
  const profileById=new Map(((profileResult.data??[]) as Profile[]).map((row)=>[row.id,row]));
  const productById=new Map(((productResult.data??[]) as Product[]).map((row)=>[row.id,row]));
  const rows=dedupe(raw,metaById).map((row)=>{
    const meta=metaById.get(row.fit_report_id);const source=productById.get(row.evidence_product_id);const brand=one<Brand>(source?.brand);
    const level:EvidenceLevel=row.evidence_product_id===product.id&&variation&&meta?.tracked_variation_key===variation?"exact_variant":row.evidence_product_id===product.id?"exact_product":row.evidence_level;
    const profile=profileById.get(row.user_id);
    return{fitReportId:row.fit_report_id,member:profile?.display_name||`@${profile?.username??"member"}`,bodyMatch:row.historical_match_score,sizeLabel:row.original_size_label,fitLabel:FIT_RESULT_LABELS[row.fit]??row.fit,evidenceLabel:EVIDENCE_LABELS[level],garment:`${brand?.name?`${brand.name} · `:""}${source?.name??"Garment"}`,variationDetail:trackedVariationDetail(source?.garment_type_key,meta?.garment_answers)};
  });
  return Response.json({rows},{headers:{"cache-control":"private, no-store"}});
}
