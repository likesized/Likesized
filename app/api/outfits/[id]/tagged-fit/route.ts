import { GARMENT_TYPE_BY_KEY } from "@/lib/garment-taxonomy";
import { FIT_RESULT_LABELS, STRONG_FIT_REPORT_MATCH_THRESHOLD } from "@/lib/quick-fit-evidence";
import { newestUniqueVariationEvidence } from "@/lib/outfit-variation-evidence";
import {
  buildSafeSizeAdjacency,
  closetEvidenceRelevance,
  recommendSize,
  recommendationConfidenceLabel,
  simpleAlphaAdjacency,
  type NormalizedSizeDescriptor,
  type RecommendationEvidence,
} from "@/lib/recommendation";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Candidate={fit_report_id:string;user_id:string;evidence_product_id:string;normalized_size_id:string|null;original_size_label:string;fit:RecommendationEvidence["fit"];historical_match_score:number;historical_coverage_percent:number;evidence_level:RecommendationEvidence["evidenceLevel"];attribute_overlap:number;directional_fit_support:number|null};
type ProductRow={id:string;brand_id:string;product_family_id:string|null;garment_type_key:string|null;category:string};
type ProductRelation=ProductRow|ProductRow[]|null;
type OwnReport={id:string;user_id:string;product_id:string;normalized_size_id:string|null;size_label:string;fit:RecommendationEvidence["fit"];created_at:string;garment_condition:string;objective_variant_key:string|null;garment_answers:Record<string,string>|null;product:ProductRelation};
type ReportIdentity={id:string;user_id:string;product_id:string;objective_variant_key:string|null;created_at:string};
type SnapshotMatch={fit_report_id:string;historical_match_score:number;historical_coverage_percent:number};
type TargetReport=OwnReport;
type SizeRow={id:string;normalized_key:string;display_label:string;kind:string;sizing_system:string|null;alpha_size:string|null;numeric_size:number|null;shoe_size:number|null};
type AttributeRow={product_id:string;attribute_key:string;option_key:string};
type Adjacency={current:{sizeKey:string;sizeLabel:string};up:{sizeKey:string;sizeLabel:string}|null;down:{sizeKey:string;sizeLabel:string}|null};
type RelevantReport={fitReportId:string;bodyMatch:number|null;sizeLabel:string;fitLabel:string;isOwn:boolean};
type StrongAggregateEvidence={sizeLabel:string;fit:RecommendationEvidence["fit"]};

function firstProduct(value:ProductRelation){return Array.isArray(value)?(value[0]??null):value;}
function variationDetail(garmentTypeKey:string|null,answers:Record<string,string>|null){
  if(!garmentTypeKey||!answers)return"";
  const definition=GARMENT_TYPE_BY_KEY.get(garmentTypeKey);
  if(!definition)return"";
  return definition.questions.filter((question)=>question.classification==="variation-defining").flatMap((question)=>{
    const answer=answers[question.key];
    if(!answer)return[];
    const option=question.options.find((candidate)=>candidate.value===answer);
    return option?[`${question.label}: ${option.label}`]:[];
  }).join(" · ");
}
function sizeAdjacency(normalizedId:string|null,sizeLabel:string,byId:Map<string,SizeRow>,safe:Map<string,Adjacency>):Adjacency{
  if(normalizedId){
    const mapped=safe.get(normalizedId);if(mapped)return mapped;
    const normalized=byId.get(normalizedId);if(normalized)return{current:{sizeKey:normalized.normalized_key,sizeLabel:normalized.display_label},up:null,down:null};
  }
  const alpha=simpleAlphaAdjacency(sizeLabel);
  if(alpha.current)return{current:alpha.current,up:alpha.up,down:alpha.down};
  return{current:{sizeKey:`raw:${sizeLabel.trim().toUpperCase()}`,sizeLabel},up:null,down:null};
}

function attributeSets(rows:AttributeRow[]){
  const result=new Map<string,Set<string>>();
  for(const row of rows){const set=result.get(row.product_id)??new Set<string>();set.add(`${row.attribute_key}:${row.option_key}`);result.set(row.product_id,set);}
  return result;
}
function overlap(a:Set<string>|undefined,b:Set<string>|undefined){if(!a||!b)return 0;let count=0;for(const value of a)if(b.has(value))count+=1;return count;}
function evidenceLevelForOwn(report:OwnReport,target:ProductRow,source:ProductRow,targetVariation:string,attributeOverlap:number):RecommendationEvidence["evidenceLevel"]{
  if(report.product_id===target.id&&(report.objective_variant_key??"")===targetVariation)return"exact_variant";
  if(report.product_id===target.id)return"exact_product";
  if(target.product_family_id&&source.product_family_id===target.product_family_id)return"product_family";
  if(source.garment_type_key===target.garment_type_key&&attributeOverlap>0)return"similar_garments";
  if(source.brand_id===target.brand_id&&source.garment_type_key===target.garment_type_key)return"brand_garment_type";
  return"category_fit";
}
function strongAggregate(rows:StrongAggregateEvidence[]){
  const groups=new Map<string,{sizeLabel:string;count:number;fits:Record<RecommendationEvidence["fit"],number>}>();
  for(const row of rows){const group=groups.get(row.sizeLabel)??{sizeLabel:row.sizeLabel,count:0,fits:{too_small:0,snug:0,just_right:0,relaxed:0,too_big:0}};group.count+=1;group.fits[row.fit]+=1;groups.set(row.sizeLabel,group);}
  return [...groups.values()].sort((a,b)=>b.count-a.count||a.sizeLabel.localeCompare(b.sizeLabel)).map((group)=>({
    sizeLabel:group.sizeLabel,
    count:group.count,
    fitBreakdown:Object.entries(group.fits).filter(([,count])=>count>0).map(([fit,count])=>({fit,fitLabel:FIT_RESULT_LABELS[fit]??fit,count,percent:Math.round((count/group.count)*100)})),
  }));
}
function logEvidenceError(stage:string,error:unknown){if(error)console.error(`[tagged-fit] ${stage}`,error);}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const closetItemId=new URL(request.url).searchParams.get("closet_item_id")?.trim()??"";
  if(!UUID.test(closetItemId))return Response.json({error:"Invalid tagged garment."},{status:400});

  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub??null;
  if(!viewerId)return Response.json({error:"Authentication required."},{status:401});

  const reportSelect="id,user_id,product_id,normalized_size_id,size_label,fit,created_at,garment_condition,objective_variant_key,garment_answers,product:products!fit_reports_product_id_fkey(id,brand_id,product_family_id,garment_type_key,category)";
  const [tagResult,profileResult,targetResult,ownReportResult,sizeResult]=await Promise.all([
    supabase.from("outfit_post_items").select("closet_item_id").eq("post_id",postId).eq("closet_item_id",closetItemId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),
    supabase.from("fit_reports").select(reportSelect).eq("closet_item_id",closetItemId).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("fit_reports").select(reportSelect).eq("user_id",viewerId).order("created_at",{ascending:false}).limit(200),
    supabase.from("normalized_sizes").select("id,normalized_key,display_label,kind,sizing_system,alpha_size,numeric_size,shoe_size"),
  ]);
  if(tagResult.error||!tagResult.data)return Response.json({error:"Tagged garment not found."},{status:404});
  if(targetResult.error||!targetResult.data)return Response.json({error:"Tagged garment has no Fit Report evidence."},{status:404});
  logEvidenceError("Closet reports",ownReportResult.error);
  logEvidenceError("normalized sizes",sizeResult.error);

  const profileReady=Boolean(profileResult.data?.completed_at);
  const targetReport=targetResult.data as unknown as TargetReport;
  const product=firstProduct(targetReport.product);
  if(!product)return Response.json({error:"Could not load tagged garment."},{status:500});
  const category=product.garment_type_key?(GARMENT_TYPE_BY_KEY.get(product.garment_type_key)?.label??product.garment_type_key.replaceAll("_"," ")):"Garment";
  const targetVariationDetail=variationDetail(product.garment_type_key,targetReport.garment_answers);
  if(!profileReady)return Response.json({category,variationDetail:targetVariationDetail,profileReady:false,matchingFitReports:0,recommendation:null,relevantReports:[],strongFitReports:[],objectiveVariantKey:targetReport.objective_variant_key??"",closetEvidenceCount:0});

  const ownReportPool=((((ownReportResult.error?[]:ownReportResult.data)??[]) as unknown as OwnReport[]));
  if(targetReport.user_id===viewerId&&!ownReportPool.some((report)=>report.id===targetReport.id))ownReportPool.push(targetReport);
  const ownReports=newestUniqueVariationEvidence(ownReportPool,(report)=>({userId:report.user_id,productId:report.product_id,objectiveVariantKey:report.objective_variant_key,reportId:report.id,createdAt:report.created_at}));
  const ownProductIds=[...new Set(ownReports.map((row)=>row.product_id))];
  const [candidateResult,snapshotResult,attributeResult]=await Promise.all([
    supabase.rpc("get_product_evidence_candidates",{p_product_id:product.id,p_variant_id:null,p_result_limit:300}),
    ownReports.length?supabase.rpc("get_fit_report_snapshot_matches",{p_fit_report_ids:ownReports.map((row)=>row.id)}):Promise.resolve({data:[] as SnapshotMatch[],error:null}),
    supabase.from("product_attribute_values").select("product_id,attribute_key,option_key").in("product_id",[...new Set([product.id,...ownProductIds])]).neq("source_status","rejected").gte("confidence",0.75),
  ]);
  logEvidenceError("community evidence",candidateResult.error);
  logEvidenceError("Closet historical matches",snapshotResult.error);
  logEvidenceError("structured garment attributes",attributeResult.error);

  const rawCandidates=((candidateResult.error?[]:candidateResult.data)??[]) as Candidate[];
  const candidateIds=[...new Set(rawCandidates.map((row)=>row.fit_report_id))];
  const identityResult=candidateIds.length?await supabase.from("fit_reports").select("id,user_id,product_id,objective_variant_key,created_at").in("id",candidateIds):{data:[] as ReportIdentity[],error:null};
  logEvidenceError("variation identity",identityResult.error);
  const identityRows=identityResult.error?[]:((identityResult.data??[]) as ReportIdentity[]);
  const identityById=new Map(identityRows.map((row)=>[row.id,row]));
  const candidates=newestUniqueVariationEvidence(rawCandidates,(row)=>{const identity=identityById.get(row.fit_report_id);return{userId:row.user_id,productId:row.evidence_product_id,objectiveVariantKey:identity?.objective_variant_key,reportId:row.fit_report_id,createdAt:identity?.created_at??""};});
  const targetVariation=targetReport.objective_variant_key??"";
  const relevantExact=candidates.filter((row)=>{
    const identity=identityById.get(row.fit_report_id);
    return row.evidence_product_id===product.id&&(identity?.objective_variant_key??"")===targetVariation&&row.historical_match_score>=STRONG_FIT_REPORT_MATCH_THRESHOLD;
  }).sort((a,b)=>b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent);
  const otherRelevantExact=relevantExact.filter((row)=>row.user_id!==viewerId);
  const ownRelevantExact=ownReports.filter((report)=>report.garment_condition==="normal"&&report.product_id===product.id&&(report.objective_variant_key??"")===targetVariation);
  const ownExactReports:RelevantReport[]=ownRelevantExact.map((report)=>({fitReportId:report.id,bodyMatch:null,sizeLabel:report.size_label,fitLabel:FIT_RESULT_LABELS[report.fit]??report.fit,isOwn:true}));

  const ownProductById=new Map<string,ProductRow>();
  for(const report of ownReports){const source=firstProduct(report.product);if(source)ownProductById.set(source.id,source);}
  const snapshotByReport=new Map((((snapshotResult.error?[]:snapshotResult.data)??[]) as SnapshotMatch[]).map((row)=>[row.fit_report_id,row]));
  const attrs=attributeSets(((attributeResult.error?[]:attributeResult.data)??[]) as AttributeRow[]);
  const sizes=((sizeResult.error?[]:sizeResult.data)??[]) as SizeRow[];
  const sizeById=new Map(sizes.map((row)=>[row.id,row]));
  const safeSizes=buildSafeSizeAdjacency(sizes.map((row):NormalizedSizeDescriptor=>({id:row.id,normalizedKey:row.normalized_key,displayLabel:row.display_label,kind:row.kind,sizingSystem:row.sizing_system,alphaSize:row.alpha_size,numericSize:row.numeric_size,shoeSize:row.shoe_size}))) as Map<string,Adjacency>;
  const sharedDirectional=new Map(candidates.filter((row)=>row.user_id===viewerId).map((row)=>[row.fit_report_id,row.directional_fit_support]));

  const otherEvidence:RecommendationEvidence[]=candidates.filter((row)=>row.user_id!==viewerId).map((row)=>{
    const identity=identityById.get(row.fit_report_id);const size=sizeAdjacency(row.normalized_size_id,row.original_size_label,sizeById,safeSizes);
    const exactVariation=row.evidence_product_id===product.id&&(identity?.objective_variant_key??"")===targetVariation;
    return{sizeKey:size.current.sizeKey,sizeLabel:size.current.sizeLabel,fit:row.fit,matchScore:row.historical_match_score,coveragePercent:row.historical_coverage_percent,evidenceLevel:exactVariation?"exact_variant":row.evidence_level,attributeOverlap:row.attribute_overlap,directionalFitSupport:row.directional_fit_support,source:"community",sourceRelevance:1,adjacentSizeUp:size.up,adjacentSizeDown:size.down};
  });
  const ownHistory:RecommendationEvidence[]=ownReports.flatMap((report)=>{
    if(report.garment_condition!=="normal")return[];
    const source=ownProductById.get(report.product_id);const match=snapshotByReport.get(report.id);
    if(!source||!match)return[];
    const attributeOverlap=overlap(attrs.get(product.id),attrs.get(source.id));
    const sourceRelevance=closetEvidenceRelevance({sameProduct:report.product_id===product.id,sameVariation:report.product_id===product.id&&(report.objective_variant_key??"")===targetVariation,sameBrand:source.brand_id===product.brand_id,sameGarmentType:Boolean(source.garment_type_key&&source.garment_type_key===product.garment_type_key),sameCategory:source.category===product.category,attributeOverlap});
    if(sourceRelevance<=0)return[];
    const size=sizeAdjacency(report.normalized_size_id,report.size_label,sizeById,safeSizes);
    return[{sizeKey:size.current.sizeKey,sizeLabel:size.current.sizeLabel,fit:report.fit,matchScore:match.historical_match_score,coveragePercent:match.historical_coverage_percent,evidenceLevel:evidenceLevelForOwn(report,product,source,targetVariation,attributeOverlap),attributeOverlap,directionalFitSupport:sharedDirectional.get(report.id)??null,source:"closet" as const,sourceRelevance,adjacentSizeUp:size.up,adjacentSizeDown:size.down}];
  });
  const recommendation=recommendSize([...otherEvidence,...ownHistory]);
  const canRecommend=Boolean(recommendation&&recommendation.confidence>=45);
  const sizeLabelForCandidate=(row:Candidate)=>sizeAdjacency(row.normalized_size_id,row.original_size_label,sizeById,safeSizes).current.sizeLabel;
  const strongOtherReports:RelevantReport[]=otherRelevantExact.map((row)=>({fitReportId:row.fit_report_id,bodyMatch:row.historical_match_score,sizeLabel:sizeLabelForCandidate(row),fitLabel:FIT_RESULT_LABELS[row.fit]??row.fit,isOwn:false}));
  const relevantReports=[...ownExactReports,...strongOtherReports];
  const strongExactEvidence:StrongAggregateEvidence[]=[
    ...ownRelevantExact.map((report)=>({sizeLabel:report.size_label,fit:report.fit})),
    ...otherRelevantExact.map((row)=>({sizeLabel:sizeLabelForCandidate(row),fit:row.fit})),
  ];

  return Response.json({
    category,
    variationDetail:targetVariationDetail,
    profileReady:true,
    matchingFitReports:relevantReports.length,
    objectiveVariantKey:targetVariation,
    recommendation:canRecommend&&recommendation?{
      sizeLabel:recommendation.sizeLabel,
      confidence:recommendation.confidence,
      confidenceLabel:recommendationConfidenceLabel(recommendation.confidence),
      similarWearerCount:recommendation.similarWearerCount,
      sizeEvidenceCount:recommendation.sizeEvidenceCount,
      sourceBreakdown:recommendation.sourceBreakdown,
    }:null,
    relevantReports,
    strongFitReports:strongAggregate(strongExactEvidence),
    closetEvidenceCount:ownHistory.length,
  });
}