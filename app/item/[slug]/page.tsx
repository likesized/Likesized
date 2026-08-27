import { notFound, redirect } from "next/navigation";
import { reportProductItem } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { EVIDENCE_LABELS, type EvidenceLevel } from "@/lib/domain";
import {
  buildSafeSizeAdjacency,
  closetEvidenceRelevance,
  recommendSize,
  recommendationConfidenceLabel,
  simpleAlphaAdjacency,
  type NormalizedSizeDescriptor,
  type RecommendationEvidence,
} from "@/lib/recommendation";

type Params=Promise<{slug:string}>;
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type ProductRecord={id:string;name:string;slug:string;category:string;garment_type_key:string|null;image_url:string|null;brand_id:string;product_family_id:string|null;brand:unknown};
type BrandRecord={name:string};
type Candidate={fit_report_id:string;user_id:string;closet_item_id:string;evidence_product_id:string;evidence_variant_id:string|null;fit_profile_version_id:string;original_size_label:string;normalized_size_id:string|null;fit:RecommendationEvidence["fit"];would_buy_again:boolean;historical_match_score:number;historical_coverage_percent:number;evidence_level:EvidenceLevel;evidence_rank:number;attribute_overlap:number;directional_fit_support:number|null};
type Profile={id:string;username:string;display_name:string|null};
type EvidenceProduct={id:string;name:string;slug:string;brand_id:string;product_family_id:string|null;garment_type_key:string|null;category:string;brand:unknown};
type SizeRow={id:string;normalized_key:string;display_label:string;kind:string;sizing_system:string|null;alpha_size:string|null;numeric_size:number|null;shoe_size:number|null};
type VariantRecord={id:string;size_label:string;color_label:string|null;sku:string|null;normalized_size:unknown};
type NormalizedSize={display_label:string};
type ProductFitSummary={total_fit_count:number;too_small_count:number;snug_count:number;just_right_count:number;relaxed_count:number;too_big_count:number};
type OwnReport={id:string;user_id:string;product_id:string;variant_id:string|null;normalized_size_id:string|null;size_label:string;fit:RecommendationEvidence["fit"];created_at:string;garment_condition:string;objective_variant_key:string|null};
type SnapshotMatch={fit_report_id:string;historical_match_score:number;historical_coverage_percent:number};
type AttributeRow={product_id:string;attribute_key:string;option_key:string};
type Adjacency={current:{sizeKey:string;sizeLabel:string};up:{sizeKey:string;sizeLabel:string}|null;down:{sizeKey:string;sizeLabel:string}|null};
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function variantLabel(variant:VariantRecord){const normalized=one<NormalizedSize>(variant.normalized_size);return `Size ${normalized?.display_label||variant.size_label}${variant.color_label?` · ${variant.color_label}`:""}${variant.sku?` · SKU ${variant.sku}`:""}`;}
function percent(count:number,total:number){return total?Math.round((count/total)*100):0;}
const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};

function sizeAdjacency(normalizedId:string|null,sizeLabel:string,byId:Map<string,SizeRow>,safe:Map<string,Adjacency>):Adjacency{
  if(normalizedId){const mapped=safe.get(normalizedId);if(mapped)return mapped;const normalized=byId.get(normalizedId);if(normalized)return{current:{sizeKey:normalized.normalized_key,sizeLabel:normalized.display_label},up:null,down:null};}
  const alpha=simpleAlphaAdjacency(sizeLabel);if(alpha.current)return{current:alpha.current,up:alpha.up,down:alpha.down};
  return{current:{sizeKey:`raw:${sizeLabel.trim().toUpperCase()}`,sizeLabel},up:null,down:null};
}
function attributeSets(rows:AttributeRow[]){const result=new Map<string,Set<string>>();for(const row of rows){const set=result.get(row.product_id)??new Set<string>();set.add(`${row.attribute_key}:${row.option_key}`);result.set(row.product_id,set);}return result;}
function overlap(a:Set<string>|undefined,b:Set<string>|undefined){if(!a||!b)return 0;let count=0;for(const value of a)if(b.has(value))count+=1;return count;}
function closetLevel(report:OwnReport,target:ProductRecord,source:EvidenceProduct,selectedVariant:VariantRecord|null,attributeOverlap:number):EvidenceLevel{
  if(report.product_id===target.id&&selectedVariant&&report.variant_id===selectedVariant.id)return"exact_variant";
  if(report.product_id===target.id)return"exact_product";
  if(target.product_family_id&&source.product_family_id===target.product_family_id)return"product_family";
  if(source.garment_type_key===target.garment_type_key&&attributeOverlap>0)return"similar_garments";
  if(source.brand_id===target.brand_id&&source.garment_type_key===target.garment_type_key)return"brand_garment_type";
  return"category_fit";
}

export default async function ItemPage({params,searchParams}:{params:Params;searchParams:SearchParams}){
  const {slug}=await params;
  const query=await searchParams;
  const requestedVariant=first(query.variant)?.trim()||null;
  const reported=first(query.reported)==="1";
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const viewerId=claimsData?.claims?.sub;
  const requestedPath=`/item/${slug}${requestedVariant?`?variant=${encodeURIComponent(requestedVariant)}`:""}`;
  if(claimsError||!viewerId)redirect(`/login?next=${encodeURIComponent(requestedPath)}`);

  const [{data:viewerProfile},{data:viewerFit}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",viewerId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),
  ]);
  if(!viewerProfile?.username||!viewerFit?.completed_at)redirect("/onboarding");

  const {data:productData,error:productError}=await supabase.from("products").select("id,name,slug,category,garment_type_key,image_url,brand_id,product_family_id,brand:brands(name)").eq("slug",slug).maybeSingle();
  if(productError)throw new Error("Could not load product.");
  if(!productData)notFound();
  const product=productData as ProductRecord;
  const brand=one<BrandRecord>(product.brand);

  const {data:variantData,error:variantError}=await supabase.from("product_variants").select("id,size_label,color_label,sku,normalized_size:normalized_sizes(display_label)").eq("product_id",product.id).order("size_label").order("color_label");
  if(variantError)throw new Error("Could not load product variants.");
  const variants=(variantData??[]) as VariantRecord[];
  const selectedVariant=requestedVariant?variants.find((variant)=>variant.id===requestedVariant)??null:null;
  const invalidVariant=Boolean(requestedVariant&&!selectedVariant);

  const [{data:candidateData,error:candidateError},{data:summaryData,error:summaryError},{data:ownReportData,error:ownReportError},{data:sizeData,error:sizeError}]=await Promise.all([
    supabase.rpc("get_product_evidence_candidates",{p_product_id:product.id,p_variant_id:selectedVariant?.id??null,p_result_limit:300}),
    supabase.rpc("get_product_fit_summary",{p_product_id:product.id}),
    supabase.from("fit_reports").select("id,user_id,product_id,variant_id,normalized_size_id,size_label,fit,created_at,garment_condition,objective_variant_key").eq("user_id",viewerId).order("created_at",{ascending:false}).limit(200),
    supabase.from("normalized_sizes").select("id,normalized_key,display_label,kind,sizing_system,alpha_size,numeric_size,shoe_size"),
  ]);
  if(candidateError)throw new Error("Could not load product fit evidence.");
  if(summaryError)throw new Error("Could not load product fit summary.");
  if(ownReportError||sizeError)throw new Error("Could not load FITuition history.");
  const summary=(Array.isArray(summaryData)?summaryData[0]:summaryData) as ProductFitSummary|null;

  const allCandidates=(candidateData??[]) as Candidate[];
  const candidates=allCandidates.filter((row)=>row.user_id!==viewerId);
  const ranked=[...candidates].sort((a,b)=>a.evidence_rank-b.evidence_rank||b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent||b.attribute_overlap-a.attribute_overlap);

  const profileIds=[...new Set(ranked.map((row)=>row.user_id))];
  const evidenceProductIds=[...new Set(ranked.map((row)=>row.evidence_product_id))];
  const ownReports=(ownReportData??[]) as OwnReport[];
  const ownProductIds=[...new Set(ownReports.map((row)=>row.product_id))];
  const allProductIds=[...new Set([product.id,...evidenceProductIds,...ownProductIds])];
  const [profilesResult,productsResult,snapshotResult,attributeResult]=await Promise.all([
    profileIds.length?supabase.from("profiles").select("id,username,display_name").in("id",profileIds):Promise.resolve({data:[],error:null}),
    allProductIds.length?supabase.from("products").select("id,name,slug,brand_id,product_family_id,garment_type_key,category,brand:brands(name)").in("id",allProductIds):Promise.resolve({data:[],error:null}),
    ownReports.length?supabase.rpc("get_fit_report_snapshot_matches",{p_fit_report_ids:ownReports.map((row)=>row.id)}):Promise.resolve({data:[],error:null}),
    supabase.from("product_attribute_values").select("product_id,attribute_key,option_key").in("product_id",allProductIds).neq("source_status","rejected").gte("confidence",0.75),
  ]);
  const profiles=(profilesResult.error?[]:(profilesResult.data??[])) as Profile[];
  const evidenceProducts=(productsResult.error?[]:(productsResult.data??[])) as EvidenceProduct[];
  const profileById=new Map(profiles.map((row)=>[row.id,row]));
  const productById=new Map(evidenceProducts.map((row)=>[row.id,row]));
  const sizes=(sizeData??[]) as SizeRow[];
  const sizeById=new Map(sizes.map((row)=>[row.id,row]));
  const safeSizes=buildSafeSizeAdjacency(sizes.map((row):NormalizedSizeDescriptor=>({id:row.id,normalizedKey:row.normalized_key,displayLabel:row.display_label,kind:row.kind,sizingSystem:row.sizing_system,alphaSize:row.alpha_size,numericSize:row.numeric_size,shoeSize:row.shoe_size}))) as Map<string,Adjacency>;
  const snapshotByReport=new Map((((snapshotResult.error?[]:snapshotResult.data)??[]) as SnapshotMatch[]).map((row)=>[row.fit_report_id,row]));
  const attrs=attributeSets((((attributeResult.error?[]:attributeResult.data)??[]) as AttributeRow[]));
  const sharedDirectional=new Map(allCandidates.filter((row)=>row.user_id===viewerId).map((row)=>[row.fit_report_id,row.directional_fit_support]));

  const communityEvidence:RecommendationEvidence[]=ranked.map((row)=>{const size=sizeAdjacency(row.normalized_size_id,row.original_size_label,sizeById,safeSizes);return{sizeKey:size.current.sizeKey,sizeLabel:size.current.sizeLabel,fit:row.fit,matchScore:row.historical_match_score,coveragePercent:row.historical_coverage_percent,evidenceLevel:row.evidence_level,attributeOverlap:row.attribute_overlap,directionalFitSupport:row.directional_fit_support,source:"community",sourceRelevance:1,adjacentSizeUp:size.up,adjacentSizeDown:size.down};});
  const closetEvidence:RecommendationEvidence[]=ownReports.flatMap((report)=>{
    if(report.garment_condition!=="normal")return[];
    const source=productById.get(report.product_id);const match=snapshotByReport.get(report.id);if(!source||!match)return[];
    const attributeOverlap=overlap(attrs.get(product.id),attrs.get(source.id));
    const sameVariation=report.product_id===product.id&&Boolean(selectedVariant&&report.variant_id===selectedVariant.id);
    const sourceRelevance=closetEvidenceRelevance({sameProduct:report.product_id===product.id,sameVariation,sameBrand:source.brand_id===product.brand_id,sameGarmentType:Boolean(source.garment_type_key&&source.garment_type_key===product.garment_type_key),sameCategory:source.category===product.category,attributeOverlap});
    if(sourceRelevance<=0)return[];
    const size=sizeAdjacency(report.normalized_size_id,report.size_label,sizeById,safeSizes);
    return[{sizeKey:size.current.sizeKey,sizeLabel:size.current.sizeLabel,fit:report.fit,matchScore:match.historical_match_score,coveragePercent:match.historical_coverage_percent,evidenceLevel:closetLevel(report,product,source,selectedVariant,attributeOverlap),attributeOverlap,directionalFitSupport:sharedDirectional.get(report.id)??null,source:"closet" as const,sourceRelevance,adjacentSizeUp:size.up,adjacentSizeDown:size.down}];
  });
  const recommendation=recommendSize([...communityEvidence,...closetEvidence]);
  const bestLevel=ranked[0]?.evidence_level??null;
  const bestCount=bestLevel?ranked.filter((row)=>row.evidence_level===bestLevel).length:0;
  const placeholder=product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase()||"FIT";
  const fitCount=summary?.total_fit_count??0;
  const mixed=Boolean(recommendation?.sourceBreakdown.sourcesAgree===false);

  return <main className="pageShell">
    {reported?<div className="authMessage">Thanks. This item was flagged for review.</div>:null}
    <section className="itemHero"><div className="productImage">{placeholder}</div><div className="itemDetails"><span className="eyebrow">{brand?.name?.toUpperCase()||"BRAND"}{product.garment_type_key?` · ${product.garment_type_key.replaceAll("_"," ").toUpperCase()}`:""}</span><h1>{product.name}</h1><p>LikeSized keeps Body Match separate from physical Fit Result. FITuition combines relevant Size Match evidence with what your own Closet history has taught us about your current body.</p>
      {fitCount?<div className="tiny">Latest Shared normal-condition physical fit per unique wearer: {percent(summary?.too_small_count??0,fitCount)}% Too small · {percent(summary?.snug_count??0,fitCount)}% Snug · {percent(summary?.just_right_count??0,fitCount)}% Just right · {percent(summary?.relaxed_count??0,fitCount)}% Relaxed · {percent(summary?.too_big_count??0,fitCount)}% Too big.</div>:<div className="tiny">No Shared normal-condition physical fit observations for this exact product yet.</div>}
      {recommendation?<><div className="recommendation"><span>OUR FITUITION SUGGESTS</span><strong>{recommendation.sizeLabel}</strong><b>{recommendationConfidenceLabel(recommendation.confidence)}</b></div><div className="tiny">{mixed?<>Mixed evidence: Size Match currently leans <b>{recommendation.sourceBreakdown.communityTopSizeLabel??"another size"}</b>, while your Closet History leans <b>{recommendation.sourceBreakdown.closetTopSizeLabel??"another size"}</b>.</>:recommendation.sourceBreakdown.communityBlend>0&&recommendation.sourceBreakdown.closetBlend>0?<>Size Match evidence and your relevant Closet History point most strongly to this size.</>:recommendation.sourceBreakdown.closetBlend>0?<>Your relevant Closet History provides the strongest current signal.</>:<>Relevant Size Match evidence provides the strongest current signal.</>}</div></>:<><div className="recommendation"><span>OUR FITUITION SUGGESTS</span><strong>—</strong><b>Not enough relevant evidence yet</b></div><div className="tiny">FITuition will recommend a size when the available Size Match and/or Closet evidence is strong enough to support one safely.</div></>}
      <div className="statsRow"><span><b>{ranked.length}</b> community wearer{ranked.length===1?"":"s"}</span><span><b>{closetEvidence.length}</b> relevant Closet report{closetEvidence.length===1?"":"s"}</span><span><b>{bestLevel?EVIDENCE_LABELS[bestLevel]:"—"}</b> strongest community tier</span><span><b>{bestCount}</b> at strongest tier</span></div>
      <details className="privacyNote">
        <summary className="textLink">Report this item</summary>
        <form className="garmentForm" action={reportProductItem}>
          <input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="return_to" value={requestedPath}/>
          <label>What’s wrong?<select name="reason" defaultValue="" required><option value="" disabled>Select a reason</option><option value="inappropriate_content">Inappropriate content</option><option value="image_mismatch">Image doesn’t match this product</option><option value="incorrect_information">Incorrect product information</option><option value="other">Something else</option></select></label>
          <label>Details <span className="muted inlineMuted">optional</span><textarea name="details" maxLength={500} rows={3} placeholder="Tell us what looks wrong."/></label><button className="secondaryButton" type="submit">Send report</button>
        </form>
      </details>
    </div></section>

    <section className="section flush"><div className="sectionHeading"><div><span className="eyebrow">EVIDENCE TARGET</span><h2>{selectedVariant?"Exact variant":"Exact product"}</h2><p>{selectedVariant?variantLabel(selectedVariant):"All known variants of this product. Choose a specific variant when you need that stored variant targeted."}</p></div></div>
      {invalidVariant?<div className="authMessage error">That variant does not belong to this product. Showing the Exact Product target instead.</div>:null}
      {variants.length?<form className="garmentForm" method="get"><label>Variant to evaluate<select name="variant" defaultValue={selectedVariant?.id??""}><option value="">All variants — Exact Product target</option>{variants.map((variant)=><option value={variant.id} key={variant.id}>{variantLabel(variant)}</option>)}</select><span className="fieldHelp">FITuition still follows the canonical evidence ladder: exact evidence first, then clearly reduced related evidence.</span></label><button className="secondaryButton" type="submit">Update evidence target</button></form>:<div className="privacyNote"><b>No logged variants yet.</b> Recommendations currently use Exact Product and broader fallback evidence until more structured product data exists.</div>}
    </section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">SIZE MATCH EVIDENCE</span><h2>How this—or the closest relevant garments—fit bodies like yours</h2><p>A high Body Match with a bad Fit Result remains useful: Snug / Too Small can push evidence upward, while Relaxed / Too Big can push it downward when a safe adjacent size exists.</p></div></div>
      {ranked.length?<div className="evidenceList">{ranked.slice(0,30).map((row)=>{
        const profile=profileById.get(row.user_id);const sourceProduct=productById.get(row.evidence_product_id);const sourceBrand=one<BrandRecord>(sourceProduct?.brand);const size=sizeAdjacency(row.normalized_size_id,row.original_size_label,sizeById,safeSizes);
        return <div className="evidence" key={row.fit_report_id}><div className="avatar small">{(profile?.display_name||profile?.username||"F").slice(0,1).toUpperCase()}</div><div><strong>{profile?.display_name||profile?.username||"LikeSized member"}</strong><span>{row.historical_match_score}% Body Match · {row.historical_coverage_percent}% measurement coverage</span></div><div><span>Evidence</span><strong>{EVIDENCE_LABELS[row.evidence_level]}</strong></div><div><span>Garment</span><strong>{sourceBrand?.name?`${sourceBrand.name} · `:""}{sourceProduct?.name||"Garment"}</strong></div><div><span>Size</span><strong>{size.current.sizeLabel}</strong></div><div><span>Fit Result</span><strong>{FIT_LABELS[row.fit]||row.fit}</strong></div></div>;
      })}</div>:<div className="emptyState"><span className="eyebrow">NO SIZE MATCH EVIDENCE YET</span><h2>Community evidence is still growing.</h2><p>Your own relevant Closet History can still contribute when it exists; otherwise FITuition waits rather than fabricating a recommendation.</p></div>}
    </section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">YOUR CLOSET HISTORY</span><h2>{closetEvidence.length?"Personal evidence FITuition used":"No relevant Closet history yet"}</h2><p>Your older Fit Reports are compared against your current body, so personal history is not automatically treated as a perfect 100% match.</p></div></div>{closetEvidence.length?<div className="statsRow"><span><b>{closetEvidence.length}</b> useful report{closetEvidence.length===1?"":"s"}</span>{recommendation?.sourceBreakdown.closetTopSizeLabel?<span><b>{recommendation.sourceBreakdown.closetTopSizeLabel}</b> strongest Closet size signal</span>:null}</div>:null}</section>
  </main>;
}
