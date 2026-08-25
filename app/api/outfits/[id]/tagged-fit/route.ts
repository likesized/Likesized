import { GARMENT_TYPE_BY_KEY } from "@/lib/garment-taxonomy";
import { recommendSize, recommendationConfidenceLabel, type PreferredFit, type RecommendationEvidence } from "@/lib/recommendation";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Candidate={original_size_label:string;fit:RecommendationEvidence["fit"];historical_match_score:number;historical_coverage_percent:number;evidence_level:RecommendationEvidence["evidenceLevel"];attribute_overlap:number;directional_fit_support:number|null};
type Summary={total_fit_count:number};
type ProductRow={id:string;garment_type_key:string|null};

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const url=new URL(request.url);
  const productIds=[...new Set((url.searchParams.get("products")??"").split(",").map((value)=>value.trim()).filter((value)=>UUID.test(value)))].slice(0,6);
  if(!productIds.length)return Response.json({items:{}});

  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub??null;
  const {data:products,error:productError}=await supabase.from("products").select("id,garment_type_key").in("id",productIds);
  if(productError)return Response.json({error:"Could not load tagged items."},{status:500});
  const productById=new Map(((products??[]) as ProductRow[]).map((row)=>[row.id,row]));

  const preferenceByType=new Map<string,PreferredFit>();
  if(viewerId){
    const types=[...new Set(((products??[]) as ProductRow[]).map((row)=>row.garment_type_key).filter((value):value is string=>Boolean(value)))];
    if(types.length){
      const {data}=await supabase.from("user_garment_fit_preferences").select("garment_type_key,preference").eq("user_id",viewerId).in("garment_type_key",types);
      for(const row of data??[])if(row.preference==="fitted"||row.preference==="standard"||row.preference==="relaxed")preferenceByType.set(row.garment_type_key,row.preference);
    }
  }

  const entries=await Promise.all(productIds.map(async(productId)=>{
    const product=productById.get(productId);
    if(!product)return [productId,{category:"Garment",matchingFitReports:0,strong:false,fitSnippet:null}] as const;
    const category=product.garment_type_key?(GARMENT_TYPE_BY_KEY.get(product.garment_type_key)?.label??product.garment_type_key.replaceAll("_"," ")):"Garment";
    const [{data:summaryData},{data:candidateData}]=await Promise.all([
      supabase.rpc("get_product_fit_summary",{p_product_id:productId}),
      viewerId?supabase.rpc("get_product_evidence_candidates",{p_product_id:productId,p_variant_id:null,p_result_limit:120}):Promise.resolve({data:[]}),
    ]);
    const summary=(Array.isArray(summaryData)?summaryData[0]:summaryData) as Summary|null;
    const candidates=(candidateData??[]) as Candidate[];
    const recommendation=viewerId?recommendSize(candidates.map((row)=>({
      sizeKey:`raw:${row.original_size_label.trim().toUpperCase()}`,
      sizeLabel:row.original_size_label,
      fit:row.fit,
      matchScore:row.historical_match_score,
      coveragePercent:row.historical_coverage_percent,
      evidenceLevel:row.evidence_level,
      attributeOverlap:row.attribute_overlap,
      directionalFitSupport:row.directional_fit_support,
    })),preferenceByType.get(product.garment_type_key??"")??"standard"):null;
    const strong=Boolean(recommendation&&recommendation.confidence>=45);
    return [productId,{
      category,
      matchingFitReports:Number(summary?.total_fit_count)||0,
      strong,
      fitSnippet:strong&&recommendation?`FITuition: ${recommendation.sizeLabel} · ${recommendationConfidenceLabel(recommendation.confidence)}`:null,
    }] as const;
  }));

  return Response.json({items:Object.fromEntries(entries)});
}
