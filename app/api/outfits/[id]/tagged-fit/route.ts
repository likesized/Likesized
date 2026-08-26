import { GARMENT_TYPE_BY_KEY } from "@/lib/garment-taxonomy";
import { FIT_RESULT_LABELS, QUICK_VIEW_STRONG_MATCH_THRESHOLD } from "@/lib/quick-fit-evidence";
import { newestUniqueVariationEvidence } from "@/lib/outfit-variation-evidence";
import { recommendSize, recommendationConfidenceLabel, type RecommendationEvidence } from "@/lib/recommendation";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Candidate={fit_report_id:string;user_id:string;evidence_product_id:string;original_size_label:string;fit:RecommendationEvidence["fit"];historical_match_score:number;historical_coverage_percent:number;evidence_level:RecommendationEvidence["evidenceLevel"];attribute_overlap:number;directional_fit_support:number|null};
type ProductRow={id:string;brand_id:string;product_family_id:string|null;garment_type_key:string|null;category:string};
type OwnReport={id:string;user_id:string;product_id:string;size_label:string;fit:RecommendationEvidence["fit"];created_at:string;garment_condition:string;objective_variant_key:string|null};
type ReportIdentity={id:string;user_id:string;product_id:string;objective_variant_key:string|null;created_at:string};
type SnapshotMatch={fit_report_id:string;historical_match_score:number;historical_coverage_percent:number};
type TargetReport={id:string;product_id:string;objective_variant_key:string|null};

function evidenceForOwnReport(report:OwnReport,target:ProductRow,source:ProductRow,match:SnapshotMatch):RecommendationEvidence{
  const level:RecommendationEvidence["evidenceLevel"]=report.product_id===target.id
    ?"exact_product"
    :target.product_family_id&&source.product_family_id===target.product_family_id
      ?"product_family"
      :source.brand_id===target.brand_id&&source.garment_type_key===target.garment_type_key
        ?"brand_garment_type"
        :"category_fit";
  return{sizeKey:`raw:${report.size_label.trim().toUpperCase()}`,sizeLabel:report.size_label,fit:report.fit,matchScore:match.historical_match_score,coveragePercent:match.historical_coverage_percent,evidenceLevel:level,attributeOverlap:0,directionalFitSupport:null};
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const closetItemId=new URL(request.url).searchParams.get("closet_item_id")?.trim()??"";
  if(!UUID.test(closetItemId))return Response.json({error:"Invalid tagged garment."},{status:400});

  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub??null;
  if(!viewerId)return Response.json({error:"Authentication required."},{status:401});

  const [{data:tagLink,error:tagError},{data:fitProfile}]=await Promise.all([
    supabase.from("outfit_post_items").select("closet_item_id").eq("post_id",postId).eq("closet_item_id",closetItemId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),
  ]);
  if(tagError||!tagLink)return Response.json({error:"Tagged garment not found."},{status:404});
  const profileReady=Boolean(fitProfile?.completed_at);

  const {data:targetData,error:targetError}=await supabase.from("fit_reports").select("id,product_id,objective_variant_key").eq("closet_item_id",closetItemId).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle();
  if(targetError||!targetData)return Response.json({error:"Tagged garment has no Fit Report evidence."},{status:404});
  const targetReport=targetData as TargetReport;

  const {data:productData,error:productError}=await supabase.from("products").select("id,brand_id,product_family_id,garment_type_key,category").eq("id",targetReport.product_id).maybeSingle();
  if(productError||!productData)return Response.json({error:"Could not load tagged garment."},{status:500});
  const product=productData as ProductRow;
  const category=product.garment_type_key?(GARMENT_TYPE_BY_KEY.get(product.garment_type_key)?.label??product.garment_type_key.replaceAll("_"," ")):"Garment";
  if(!profileReady)return Response.json({category,profileReady:false,matchingFitReports:0,recommendation:null,relevantReports:[],objectiveVariantKey:targetReport.objective_variant_key??""});

  const [{data:candidateData,error:candidateError},{data:ownReportData,error:ownReportError}]=await Promise.all([
    supabase.rpc("get_product_evidence_candidates",{p_product_id:product.id,p_variant_id:null,p_result_limit:200}),
    supabase.from("fit_reports").select("id,user_id,product_id,size_label,fit,created_at,garment_condition,objective_variant_key").eq("user_id",viewerId).order("created_at",{ascending:false}).limit(160),
  ]);
  if(candidateError||ownReportError)return Response.json({error:"Could not load FITuition evidence."},{status:500});

  const rawCandidates=(candidateData??[]) as Candidate[];
  const candidateIds=[...new Set(rawCandidates.map((row)=>row.fit_report_id))];
  const identityResult=candidateIds.length?await supabase.from("fit_reports").select("id,user_id,product_id,objective_variant_key,created_at").in("id",candidateIds):{data:[],error:null};
  if(identityResult.error)return Response.json({error:"Could not resolve Fit Report variation identity."},{status:500});
  const identityById=new Map(((identityResult.data??[]) as ReportIdentity[]).map((row)=>[row.id,row]));
  const candidates=newestUniqueVariationEvidence(rawCandidates,(row)=>{const identity=identityById.get(row.fit_report_id);return{userId:row.user_id,productId:row.evidence_product_id,objectiveVariantKey:identity?.objective_variant_key,reportId:row.fit_report_id,createdAt:identity?.created_at??""};});
  const targetVariation=targetReport.objective_variant_key??"";
  const relevantExact=candidates.filter((row)=>{
    const identity=identityById.get(row.fit_report_id);
    return row.evidence_product_id===product.id&&(identity?.objective_variant_key??"")===targetVariation&&row.historical_match_score>=QUICK_VIEW_STRONG_MATCH_THRESHOLD;
  }).sort((a,b)=>b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent);

  const ownReports=newestUniqueVariationEvidence((ownReportData??[]) as OwnReport[],(report)=>({userId:report.user_id,productId:report.product_id,objectiveVariantKey:report.objective_variant_key,reportId:report.id,createdAt:report.created_at}));
  const ownProductIds=[...new Set(ownReports.map((row)=>row.product_id))];
  const ownProductRows=ownProductIds.length?await supabase.from("products").select("id,brand_id,product_family_id,garment_type_key,category").in("id",ownProductIds):{data:[],error:null};
  if(ownProductRows.error)return Response.json({error:"Could not load Closet history."},{status:500});
  const ownProductById=new Map(((ownProductRows.data??[]) as ProductRow[]).map((row)=>[row.id,row]));
  const snapshotResult=ownReports.length?await supabase.rpc("get_fit_report_snapshot_matches",{p_fit_report_ids:ownReports.map((row)=>row.id)}):{data:[],error:null};
  if(snapshotResult.error)return Response.json({error:"Could not compare Closet history."},{status:500});
  const snapshotByReport=new Map(((snapshotResult.data??[]) as SnapshotMatch[]).map((row)=>[row.fit_report_id,row]));

  const otherEvidence:RecommendationEvidence[]=candidates.filter((row)=>row.user_id!==viewerId).map((row)=>({sizeKey:`raw:${row.original_size_label.trim().toUpperCase()}`,sizeLabel:row.original_size_label,fit:row.fit,matchScore:row.historical_match_score,coveragePercent:row.historical_coverage_percent,evidenceLevel:row.evidence_level,attributeOverlap:row.attribute_overlap,directionalFitSupport:row.directional_fit_support}));
  const ownHistory:RecommendationEvidence[]=ownReports.flatMap((report)=>{
    if(report.garment_condition!=="normal")return[];
    const source=ownProductById.get(report.product_id);const match=snapshotByReport.get(report.id);
    if(!source||!match)return[];
    const related=report.product_id===product.id||Boolean(product.product_family_id&&source.product_family_id===product.product_family_id)||Boolean(product.garment_type_key&&source.garment_type_key===product.garment_type_key)||source.category===product.category;
    return related?[evidenceForOwnReport(report,product,source,match)]:[];
  });
  const recommendation=recommendSize([...otherEvidence,...ownHistory],"standard");
  const canRecommend=Boolean(recommendation&&recommendation.confidence>=45&&relevantExact.length>0);

  return Response.json({
    category,
    profileReady:true,
    matchingFitReports:relevantExact.length,
    objectiveVariantKey:targetVariation,
    recommendation:canRecommend&&recommendation?{sizeLabel:recommendation.sizeLabel,confidence:recommendation.confidence,confidenceLabel:recommendationConfidenceLabel(recommendation.confidence),similarWearerCount:recommendation.similarWearerCount,sizeEvidenceCount:recommendation.sizeEvidenceCount}:null,
    relevantReports:relevantExact.map((row)=>({fitReportId:row.fit_report_id,bodyMatch:row.historical_match_score,sizeLabel:row.original_size_label,fitLabel:FIT_RESULT_LABELS[row.fit]??row.fit,isOwn:row.user_id===viewerId})),
  });
}
