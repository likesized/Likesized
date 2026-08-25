import { GARMENT_TYPE_BY_KEY } from "@/lib/garment-taxonomy";
import { recommendSize, recommendationConfidenceLabel, type RecommendationEvidence } from "@/lib/recommendation";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Candidate={fit_report_id:string;user_id:string;evidence_product_id:string;original_size_label:string;fit:RecommendationEvidence["fit"];historical_match_score:number;historical_coverage_percent:number;evidence_level:RecommendationEvidence["evidenceLevel"];attribute_overlap:number;directional_fit_support:number|null};
type ProductRow={id:string;brand_id:string;product_family_id:string|null;garment_type_key:string|null;category:string};
type OwnReport={id:string;product_id:string;size_label:string;fit:RecommendationEvidence["fit"];created_at:string;garment_condition:string};
type SnapshotMatch={fit_report_id:string;historical_match_score:number;historical_coverage_percent:number};
const FIT_LABELS:Record<RecommendationEvidence["fit"],string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};

function evidenceForOwnReport(report:OwnReport,target:ProductRow,source:ProductRow,match:SnapshotMatch):RecommendationEvidence{
  const level:RecommendationEvidence["evidenceLevel"]=report.product_id===target.id
    ?"exact_product"
    :target.product_family_id&&source.product_family_id===target.product_family_id
      ?"product_family"
      :source.brand_id===target.brand_id&&source.garment_type_key===target.garment_type_key
        ?"brand_garment_type"
        :"category_fit";
  return{
    sizeKey:`raw:${report.size_label.trim().toUpperCase()}`,
    sizeLabel:report.size_label,
    fit:report.fit,
    matchScore:match.historical_match_score,
    coveragePercent:match.historical_coverage_percent,
    evidenceLevel:level,
    attributeOverlap:0,
    directionalFitSupport:null,
  };
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const url=new URL(request.url);
  const productIds=[...new Set((url.searchParams.get("products")??"").split(",").map((value)=>value.trim()).filter((value)=>UUID.test(value)))].slice(0,6);
  if(!productIds.length)return Response.json({items:{}});

  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub??null;
  if(!viewerId)return Response.json({error:"Authentication required."},{status:401});

  const [{data:fitProfile},{data:products,error:productError},{data:ownReportData,error:ownReportError}]=await Promise.all([
    supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),
    supabase.from("products").select("id,brand_id,product_family_id,garment_type_key,category").in("id",productIds),
    supabase.from("fit_reports").select("id,product_id,size_label,fit,created_at,garment_condition").eq("user_id",viewerId).order("created_at",{ascending:false}).limit(100),
  ]);
  if(productError||ownReportError)return Response.json({error:"Could not load tagged-item fit evidence."},{status:500});
  const productById=new Map(((products??[]) as ProductRow[]).map((row)=>[row.id,row]));
  const profileReady=Boolean(fitProfile?.completed_at);
  const ownReports=(ownReportData??[]) as OwnReport[];
  const ownProductIds=[...new Set(ownReports.map((row)=>row.product_id).filter(Boolean))];
  const ownProductRows=ownProductIds.length?await supabase.from("products").select("id,brand_id,product_family_id,garment_type_key,category").in("id",ownProductIds):{data:[],error:null};
  if(ownProductRows.error)return Response.json({error:"Could not load Closet history."},{status:500});
  const ownProductById=new Map(((ownProductRows.data??[]) as ProductRow[]).map((row)=>[row.id,row]));
  const snapshotResult=profileReady&&ownReports.length?await supabase.rpc("get_fit_report_snapshot_matches",{p_fit_report_ids:ownReports.map((row)=>row.id)}):{data:[],error:null};
  if(snapshotResult.error)return Response.json({error:"Could not compare Closet history."},{status:500});
  const snapshotByReport=new Map(((snapshotResult.data??[]) as SnapshotMatch[]).map((row)=>[row.fit_report_id,row]));

  const entries=await Promise.all(productIds.map(async(productId)=>{
    const product=productById.get(productId);
    if(!product)return [productId,{category:"Garment",profileReady,matchingFitReports:0,strong:false,fitSnippet:null,bestMatch:null}] as const;
    const category=product.garment_type_key?(GARMENT_TYPE_BY_KEY.get(product.garment_type_key)?.label??product.garment_type_key.replaceAll("_"," ")):"Garment";
    if(!profileReady)return [productId,{category,profileReady:false,matchingFitReports:0,strong:false,fitSnippet:null,bestMatch:null}] as const;

    const {data:candidateData,error:candidateError}=await supabase.rpc("get_product_evidence_candidates",{p_product_id:productId,p_variant_id:null,p_result_limit:160});
    if(candidateError)return [productId,{category,profileReady:true,matchingFitReports:0,strong:false,fitSnippet:null,bestMatch:null}] as const;
    const candidates=(candidateData??[]) as Candidate[];
    const usefulExact=candidates.filter((row)=>row.evidence_product_id===productId&&(row.evidence_level==="exact_product"||row.evidence_level==="exact_variant")&&row.historical_match_score>=50);
    const ownExactReports=ownReports.filter((report)=>report.product_id===product.id&&report.garment_condition==="normal");
    const usefulExactIds=new Set(usefulExact.map((row)=>row.fit_report_id));
    for(const report of ownExactReports)usefulExactIds.add(report.id);

    const bestExact=[...usefulExact].sort((a,b)=>b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent)[0]??null;
    const ownExactMatches=ownExactReports.flatMap((report)=>{
      const match=snapshotByReport.get(report.id);
      return match&&match.historical_match_score>0?[{report,match}]:[];
    }).sort((a,b)=>b.match.historical_match_score-a.match.historical_match_score||b.match.historical_coverage_percent-a.match.historical_coverage_percent);
    const bestOwnExact=ownExactMatches[0]??null;
    const candidateBestMatch=bestExact?{bodyMatch:bestExact.historical_match_score,sizeLabel:bestExact.original_size_label,fitLabel:FIT_LABELS[bestExact.fit]}:null;
    const ownBestMatch=bestOwnExact?{bodyMatch:bestOwnExact.match.historical_match_score,sizeLabel:bestOwnExact.report.size_label,fitLabel:FIT_LABELS[bestOwnExact.report.fit]}:null;
    const bestMatch=!candidateBestMatch?ownBestMatch:!ownBestMatch?candidateBestMatch:ownBestMatch.bodyMatch>candidateBestMatch.bodyMatch?ownBestMatch:candidateBestMatch;

    const otherEvidence:RecommendationEvidence[]=candidates.filter((row)=>row.user_id!==viewerId).map((row)=>({
      sizeKey:`raw:${row.original_size_label.trim().toUpperCase()}`,
      sizeLabel:row.original_size_label,
      fit:row.fit,
      matchScore:row.historical_match_score,
      coveragePercent:row.historical_coverage_percent,
      evidenceLevel:row.evidence_level,
      attributeOverlap:row.attribute_overlap,
      directionalFitSupport:row.directional_fit_support,
    }));
    const ownHistory:RecommendationEvidence[]=ownReports.flatMap((report)=>{
      if(report.garment_condition!=="normal")return [];
      const source=ownProductById.get(report.product_id);const match=snapshotByReport.get(report.id);
      if(!source||!match)return [];
      const related=report.product_id===product.id
        ||Boolean(product.product_family_id&&source.product_family_id===product.product_family_id)
        ||Boolean(product.garment_type_key&&source.garment_type_key===product.garment_type_key)
        ||source.category===product.category;
      return related?[evidenceForOwnReport(report,product,source,match)]:[];
    });
    const recommendation=recommendSize([...otherEvidence,...ownHistory],"standard");
    const strong=Boolean(recommendation&&recommendation.confidence>=45);
    return [productId,{
      category,
      profileReady:true,
      matchingFitReports:usefulExactIds.size,
      strong,
      fitSnippet:recommendation?`FITuition: ${recommendation.sizeLabel} · ${recommendationConfidenceLabel(recommendation.confidence)}`:null,
      bestMatch,
    }] as const;
  }));

  return Response.json({items:Object.fromEntries(entries)});
}
