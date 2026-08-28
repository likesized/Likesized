import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MatchPercentageBadge } from "@/components/MatchPercentageBadge";
import { resolveCanonicalProductImages, canonicalProductImageKey } from "@/lib/canonical-product-images";
import { EVIDENCE_LABELS, type EvidenceLevel } from "@/lib/domain";
import { STRONG_FIT_REPORT_MATCH_THRESHOLD, FIT_RESULT_LABELS } from "@/lib/quick-fit-evidence";
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
import { trackedVariationDetail, trackedVariationDifferences, trackedVariationShortLabel, type GarmentAnswers } from "@/lib/tracked-variation";
import ExpandedEvidenceClient from "./ExpandedEvidenceClient";
import ItemActionsClient, { type RetailerListing } from "./ItemActionsClient";
import styles from "./itemDetail.module.css";

type Params=Promise<{slug:string}>;
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type ProductRecord={id:string;name:string;slug:string;category:string;garment_type_key:string|null;image_url:string|null;brand_id:string;product_family_id:string|null;brand:unknown};
type BrandRecord={name:string};
type Candidate={fit_report_id:string;user_id:string;closet_item_id:string;evidence_product_id:string;evidence_variant_id:string|null;fit_profile_version_id:string;original_size_label:string;normalized_size_id:string|null;fit:RecommendationEvidence["fit"];would_buy_again:boolean;historical_match_score:number;historical_coverage_percent:number;evidence_level:EvidenceLevel;evidence_rank:number;attribute_overlap:number;directional_fit_support:number|null};
type CandidateMeta={id:string;tracked_variation_key:string|null;garment_answers:Record<string,string>|null;created_at:string};
type TargetVariationRow={id:string;user_id:string;tracked_variation_key:string|null;garment_answers:Record<string,string>|null;created_at:string};
type Profile={id:string;username:string;display_name:string|null};
type EvidenceProduct={id:string;name:string;slug:string;brand_id:string;product_family_id:string|null;garment_type_key:string|null;category:string;brand:unknown};
type SizeRow={id:string;normalized_key:string;display_label:string;kind:string;sizing_system:string|null;alpha_size:string|null;numeric_size:number|null;shoe_size:number|null};
type OwnReport={id:string;user_id:string;product_id:string;normalized_size_id:string|null;size_label:string;fit:RecommendationEvidence["fit"];created_at:string;garment_condition:string;tracked_variation_key:string|null;garment_answers:Record<string,string>|null};
type SnapshotMatch={fit_report_id:string;historical_match_score:number;historical_coverage_percent:number};
type AttributeRow={product_id:string;attribute_key:string;option_key:string};
type Adjacency={current:{sizeKey:string;sizeLabel:string};up:{sizeKey:string;sizeLabel:string}|null;down:{sizeKey:string;sizeLabel:string}|null};
type RetailerRelation={name:string};
type RetailerRow={id:string;product_url:string;retailer:unknown};
type VariationOption={key:string;label:string;detail:string;answers:Record<string,string>|null;wearerCount:number;latestAt:string};

function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function attributeSets(rows:AttributeRow[]){const result=new Map<string,Set<string>>();for(const row of rows){const set=result.get(row.product_id)??new Set<string>();set.add(`${row.attribute_key}:${row.option_key}`);result.set(row.product_id,set);}return result;}
function overlap(a:Set<string>|undefined,b:Set<string>|undefined){if(!a||!b)return 0;let count=0;for(const value of a)if(b.has(value))count+=1;return count;}
function sizeAdjacency(normalizedId:string|null,sizeLabel:string,byId:Map<string,SizeRow>,safe:Map<string,Adjacency>):Adjacency{
  if(normalizedId){const mapped=safe.get(normalizedId);if(mapped)return mapped;const normalized=byId.get(normalizedId);if(normalized)return{current:{sizeKey:normalized.normalized_key,sizeLabel:normalized.display_label},up:null,down:null};}
  const alpha=simpleAlphaAdjacency(sizeLabel);if(alpha.current)return{current:alpha.current,up:alpha.up,down:alpha.down};
  return{current:{sizeKey:`raw:${sizeLabel.trim().toUpperCase()}`,sizeLabel},up:null,down:null};
}
function variationOptions(rows:TargetVariationRow[],garmentTypeKey:string|null):VariationOption[]{
  const groups=new Map<string,{answers:Record<string,string>|null;users:Set<string>;latestAt:string}>();
  for(const row of rows){if(!row.tracked_variation_key)continue;const current=groups.get(row.tracked_variation_key);if(!current){groups.set(row.tracked_variation_key,{answers:row.garment_answers,users:new Set([row.user_id]),latestAt:row.created_at});continue;}current.users.add(row.user_id);if(row.created_at>current.latestAt){current.latestAt=row.created_at;current.answers=row.garment_answers;}}
  return [...groups.entries()].map(([key,value])=>({key,label:trackedVariationShortLabel(garmentTypeKey,value.answers),detail:trackedVariationDetail(garmentTypeKey,value.answers),answers:value.answers,wearerCount:value.users.size,latestAt:value.latestAt})).sort((a,b)=>b.wearerCount-a.wearerCount||b.latestAt.localeCompare(a.latestAt)||a.label.localeCompare(b.label));
}
function dedupeCandidates(rows:Candidate[],metaById:Map<string,CandidateMeta>){
  const ordered=[...rows].sort((a,b)=>(metaById.get(b.fit_report_id)?.created_at??"").localeCompare(metaById.get(a.fit_report_id)?.created_at??"")||b.fit_report_id.localeCompare(a.fit_report_id));
  const seen=new Set<string>();const result:Candidate[]=[];
  for(const row of ordered){const meta=metaById.get(row.fit_report_id);const key=`${row.user_id}:${row.evidence_product_id}:${meta?.tracked_variation_key??row.fit_report_id}`;if(seen.has(key))continue;seen.add(key);result.push(row);}
  return result;
}
function evidenceLevel(row:Candidate,meta:CandidateMeta|undefined,productId:string,selectedVariation:string|null):EvidenceLevel{
  if(row.evidence_product_id===productId&&selectedVariation&&meta?.tracked_variation_key===selectedVariation)return"exact_variant";
  if(row.evidence_product_id===productId)return"exact_product";
  return row.evidence_level;
}
function closetLevel(report:OwnReport,target:ProductRecord,source:EvidenceProduct,selectedVariation:string|null,attributeOverlap:number):EvidenceLevel{
  if(report.product_id===target.id&&selectedVariation&&report.tracked_variation_key===selectedVariation)return"exact_variant";
  if(report.product_id===target.id)return"exact_product";
  if(target.product_family_id&&source.product_family_id===target.product_family_id)return"product_family";
  if(source.garment_type_key===target.garment_type_key&&attributeOverlap>0)return"similar_garments";
  if(source.brand_id===target.brand_id&&source.garment_type_key===target.garment_type_key)return"brand_garment_type";
  return"category_fit";
}
function aggregateStrong(rows:Candidate[],sizeFor:(row:Candidate)=>string){
  const bySize=new Map<string,{count:number;fits:Map<string,number>}>();
  for(const row of rows){const size=sizeFor(row);const group=bySize.get(size)??{count:0,fits:new Map<string,number>()};group.count+=1;group.fits.set(row.fit,(group.fits.get(row.fit)??0)+1);bySize.set(size,group);}
  return [...bySize.entries()].map(([size,value])=>({size,count:value.count,fits:[...value.fits.entries()].map(([fit,count])=>({fit,label:FIT_RESULT_LABELS[fit]??fit,count,percent:Math.round(count/value.count*100)})).sort((a,b)=>b.count-a.count)})).sort((a,b)=>b.count-a.count||a.size.localeCompare(b.size));
}

export default async function ItemPage({params,searchParams}:{params:Params;searchParams:SearchParams}){
  const {slug}=await params;
  const query=await searchParams;
  const requestedVariation=first(query.variation)?.trim()||null;
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const viewerId=claimsData?.claims?.sub;
  const requestedPath=`/item/${slug}${requestedVariation?`?variation=${encodeURIComponent(requestedVariation)}`:""}`;
  if(claimsError||!viewerId)redirect(`/login?next=${encodeURIComponent(requestedPath)}`);

  const [{data:viewerProfile},{data:viewerFit},{data:productData,error:productError}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",viewerId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),
    supabase.from("products").select("id,name,slug,category,garment_type_key,image_url,brand_id,product_family_id,brand:brands(name)").eq("slug",slug).maybeSingle(),
  ]);
  if(!viewerProfile?.username||!viewerFit?.completed_at)redirect("/onboarding");
  if(productError)throw new Error("Could not load product.");
  if(!productData)notFound();
  const product=productData as ProductRecord;
  const brand=one<BrandRecord>(product.brand);

  const [targetVariationsResult,candidateResult,ownReportResult,sizeResult,retailerResult,likeResult,wishResult]=await Promise.all([
    supabase.from("fit_reports").select("id,user_id,tracked_variation_key,garment_answers,created_at").eq("product_id",product.id).not("tracked_variation_key","is",null).order("created_at",{ascending:false}).limit(500),
    supabase.rpc("get_product_evidence_candidates",{p_product_id:product.id,p_variant_id:null,p_result_limit:300}),
    supabase.from("fit_reports").select("id,user_id,product_id,normalized_size_id,size_label,fit,created_at,garment_condition,tracked_variation_key,garment_answers").eq("user_id",viewerId).order("created_at",{ascending:false}).limit(200),
    supabase.from("normalized_sizes").select("id,normalized_key,display_label,kind,sizing_system,alpha_size,numeric_size,shoe_size"),
    supabase.from("retailer_listings").select("id,product_url,retailer:retailers(name)").eq("product_id",product.id).not("product_url","is",null),
    supabase.from("product_likes").select("product_id").eq("user_id",viewerId).eq("product_id",product.id).maybeSingle(),
    supabase.from("wish_locker_items").select("product_id").eq("user_id",viewerId).eq("product_id",product.id).maybeSingle(),
  ]);
  if(targetVariationsResult.error||candidateResult.error||ownReportResult.error||sizeResult.error)throw new Error("Could not load garment detail evidence.");

  const variations=variationOptions((targetVariationsResult.data??[]) as TargetVariationRow[],product.garment_type_key);
  const selectedVariation=variations.find((variation)=>variation.key===requestedVariation)??variations[0]??null;
  const selectedVariationKey=selectedVariation?.key??null;
  const canonicalReturnTo=`/item/${slug}${selectedVariationKey?`?variation=${encodeURIComponent(selectedVariationKey)}`:""}`;
  const rawCandidates=(candidateResult.data??[]) as Candidate[];
  const candidateIds=[...new Set(rawCandidates.map((row)=>row.fit_report_id))];
  const ownReports=(ownReportResult.data??[]) as OwnReport[];
  const ownProductIds=[...new Set(ownReports.map((row)=>row.product_id))];
  const evidenceProductIds=[...new Set(rawCandidates.map((row)=>row.evidence_product_id))];
  const allProductIds=[...new Set([product.id,...ownProductIds,...evidenceProductIds])];

  const [candidateMetaResult,profilesResult,productsResult,snapshotResult,attributeResult,canonicalImages]=await Promise.all([
    candidateIds.length?supabase.from("fit_reports").select("id,tracked_variation_key,garment_answers,created_at").in("id",candidateIds):Promise.resolve({data:[],error:null}),
    rawCandidates.length?supabase.from("profiles").select("id,username,display_name").in("id",[...new Set(rawCandidates.map((row)=>row.user_id))]):Promise.resolve({data:[],error:null}),
    allProductIds.length?supabase.from("products").select("id,name,slug,brand_id,product_family_id,garment_type_key,category,brand:brands(name)").in("id",allProductIds):Promise.resolve({data:[],error:null}),
    ownReports.length?supabase.rpc("get_fit_report_snapshot_matches",{p_fit_report_ids:ownReports.map((row)=>row.id)}):Promise.resolve({data:[],error:null}),
    allProductIds.length?supabase.from("product_attribute_values").select("product_id,attribute_key,option_key").in("product_id",allProductIds).neq("source_status","rejected").gte("confidence",0.75):Promise.resolve({data:[],error:null}),
    resolveCanonicalProductImages(supabase,[{productId:product.id,variationKey:selectedVariationKey}]),
  ]);

  const candidateMeta=(candidateMetaResult.error?[]:(candidateMetaResult.data??[])) as CandidateMeta[];
  const metaById=new Map(candidateMeta.map((row)=>[row.id,row]));
  const deduped=dedupeCandidates(rawCandidates,metaById);
  const community=deduped.filter((row)=>row.user_id!==viewerId).sort((a,b)=>{
    const ar=evidenceLevel(a,metaById.get(a.fit_report_id),product.id,selectedVariationKey);const br=evidenceLevel(b,metaById.get(b.fit_report_id),product.id,selectedVariationKey);
    const ranks:Record<EvidenceLevel,number>={exact_variant:1,exact_product:2,product_family:3,similar_garments:4,brand_garment_type:5,category_fit:6};
    return ranks[ar]-ranks[br]||b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent;
  });
  const profiles=(profilesResult.error?[]:(profilesResult.data??[])) as Profile[];
  const profileById=new Map(profiles.map((row)=>[row.id,row]));
  const evidenceProducts=(productsResult.error?[]:(productsResult.data??[])) as EvidenceProduct[];
  const productById=new Map(evidenceProducts.map((row)=>[row.id,row]));
  const sizes=(sizeResult.data??[]) as SizeRow[];
  const sizeById=new Map(sizes.map((row)=>[row.id,row]));
  const safeSizes=buildSafeSizeAdjacency(sizes.map((row):NormalizedSizeDescriptor=>({id:row.id,normalizedKey:row.normalized_key,displayLabel:row.display_label,kind:row.kind,sizingSystem:row.sizing_system,alphaSize:row.alpha_size,numericSize:row.numeric_size,shoeSize:row.shoe_size}))) as Map<string,Adjacency>;
  const snapshotMatches=((snapshotResult.error?[]:snapshotResult.data)??[]) as SnapshotMatch[];
  const snapshotByReport=new Map(snapshotMatches.map((row)=>[row.fit_report_id,row]));
  const attributeRows=((attributeResult.error?[]:attributeResult.data)??[]) as AttributeRow[];
  const attrs=attributeSets(attributeRows);
  const sharedDirectional=new Map(deduped.filter((row)=>row.user_id===viewerId).map((row)=>[row.fit_report_id,row.directional_fit_support]));

  const communityEvidence:RecommendationEvidence[]=community.map((row)=>{const size=sizeAdjacency(row.normalized_size_id,row.original_size_label,sizeById,safeSizes);return{sizeKey:size.current.sizeKey,sizeLabel:size.current.sizeLabel,fit:row.fit,matchScore:row.historical_match_score,coveragePercent:row.historical_coverage_percent,evidenceLevel:evidenceLevel(row,metaById.get(row.fit_report_id),product.id,selectedVariationKey),attributeOverlap:row.attribute_overlap,directionalFitSupport:row.directional_fit_support,source:"community",sourceRelevance:1,adjacentSizeUp:size.up,adjacentSizeDown:size.down};});
  const closetEvidence:RecommendationEvidence[]=ownReports.flatMap((report)=>{
    if(report.garment_condition!=="normal")return[];
    const source=productById.get(report.product_id);const match=snapshotByReport.get(report.id);if(!source||!match)return[];
    const attributeOverlap=overlap(attrs.get(product.id),attrs.get(source.id));
    const sameVariation=report.product_id===product.id&&Boolean(selectedVariationKey&&report.tracked_variation_key===selectedVariationKey);
    const sourceRelevance=closetEvidenceRelevance({sameProduct:report.product_id===product.id,sameVariation,sameBrand:source.brand_id===product.brand_id,sameGarmentType:Boolean(source.garment_type_key&&source.garment_type_key===product.garment_type_key),sameCategory:source.category===product.category,attributeOverlap});
    if(sourceRelevance<=0)return[];
    const size=sizeAdjacency(report.normalized_size_id,report.size_label,sizeById,safeSizes);
    return[{sizeKey:size.current.sizeKey,sizeLabel:size.current.sizeLabel,fit:report.fit,matchScore:match.historical_match_score,coveragePercent:match.historical_coverage_percent,evidenceLevel:closetLevel(report,product,source,selectedVariationKey,attributeOverlap),attributeOverlap,directionalFitSupport:sharedDirectional.get(report.id)??null,source:"closet" as const,sourceRelevance,adjacentSizeUp:size.up,adjacentSizeDown:size.down}];
  });
  const recommendation=recommendSize([...communityEvidence,...closetEvidence]);
  const mixed=Boolean(recommendation?.sourceBreakdown.sourcesAgree===false);

  const exactCandidates=selectedVariationKey?community.filter((row)=>row.evidence_product_id===product.id&&metaById.get(row.fit_report_id)?.tracked_variation_key===selectedVariationKey).sort((a,b)=>b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent):[];
  const bestExact=exactCandidates[0]??null;
  const strongExact=exactCandidates.filter((row)=>row.historical_match_score>=STRONG_FIT_REPORT_MATCH_THRESHOLD);
  const sizeFor=(row:Candidate)=>sizeAdjacency(row.normalized_size_id,row.original_size_label,sizeById,safeSizes).current.sizeLabel;
  const strongGroups=aggregateStrong(strongExact,sizeFor);
  const related=selectedVariationKey?community.filter((row)=>row.evidence_product_id===product.id&&Boolean(metaById.get(row.fit_report_id)?.tracked_variation_key)&&metaById.get(row.fit_report_id)?.tracked_variation_key!==selectedVariationKey).sort((a,b)=>b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent)[0]??null:null;
  const relatedMeta=related?metaById.get(related.fit_report_id):null;
  const relatedDifferences=related?trackedVariationDifferences(product.garment_type_key,selectedVariation?.answers,relatedMeta?.garment_answers):[];
  const relatedDetail=relatedMeta?trackedVariationDetail(product.garment_type_key,relatedMeta.garment_answers):"";
  const image=canonicalImages.get(canonicalProductImageKey(product.id,selectedVariationKey));
  const placeholder=product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase()||"FIT";
  const retailers:RetailerListing[]=((retailerResult.error?[]:(retailerResult.data??[])) as RetailerRow[]).flatMap((row)=>{const retailer=one<RetailerRelation>(row.retailer);return row.product_url?[{id:row.id,name:retailer?.name?.trim()||"Retailer",url:row.product_url}]:[];});

  const closetExact=ownReports.filter((report)=>report.garment_condition==="normal"&&report.product_id===product.id&&Boolean(selectedVariationKey&&report.tracked_variation_key===selectedVariationKey));
  const closetJustRight=closetEvidence.filter((row)=>row.fit==="just_right");
  const closetTop=recommendation?.sourceBreakdown.closetTopSizeLabel??null;

  return <main className="pageShell">
    <section className="itemHero">
      <div className="productImage">{image?<img className={styles.heroImage} src={image.imageUrl} alt={`${brand?.name?`${brand.name} `:""}${product.name}`} />:<span className={styles.heroFallback}>{placeholder}</span>}</div>
      <div className="itemDetails">
        <span className="eyebrow">{brand?.name?.toUpperCase()||"BRAND"}{product.garment_type_key?` · ${product.garment_type_key.replaceAll("_"," ").toUpperCase()}`:""}</span>
        <h1>{product.name}</h1>
        {variations.length?<><div className={styles.variationPicker}>{variations.map((variation)=><Link key={variation.key} prefetch={false} className={`${styles.variationLink} ${variation.key===selectedVariationKey?styles.variationLinkActive:""}`} href={`/item/${slug}?variation=${encodeURIComponent(variation.key)}`}>{variation.label}</Link>)}</div>{selectedVariation?.detail?<div className={styles.variationDetail}>{selectedVariation.detail}</div>:null}</>:null}
        {recommendation?<><div className="recommendation"><span>OUR FITUITION SUGGESTS</span><strong>{recommendation.sizeLabel}</strong><b>{recommendationConfidenceLabel(recommendation.confidence)}</b></div><div className="tiny">{mixed?<>Mixed evidence: Size Match currently leans <b>{recommendation.sourceBreakdown.communityTopSizeLabel??"another size"}</b>, while your Closet History leans <b>{recommendation.sourceBreakdown.closetTopSizeLabel??"another size"}</b>.</>:recommendation.sourceBreakdown.communityBlend>0&&recommendation.sourceBreakdown.closetBlend>0?<>Size Match evidence and your relevant Closet History point most strongly to this size.</>:recommendation.sourceBreakdown.closetBlend>0?<>Your relevant Closet History provides the strongest current signal.</>:<>Relevant Size Match evidence provides the strongest current signal.</>}</div></>:<><div className="recommendation"><span>OUR FITUITION SUGGESTS</span><strong>—</strong><b>Not enough relevant evidence yet</b></div><div className="tiny">FITuition waits until Size Match and/or Closet evidence can support a size safely.</div></>}
        <ItemActionsClient productId={product.id} productName={`${brand?.name?`${brand.name} `:""}${product.name}`} returnTo={canonicalReturnTo} initialLiked={Boolean(likeResult.error?null:likeResult.data)} initialWished={Boolean(wishResult.error?null:wishResult.data)} retailers={retailers}/>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeader}><span className="eyebrow">SIZE MATCH EVIDENCE</span><h2>What happened for people built like you</h2><p>Body Match shows how closely your measurements match the person who submitted this Fit Report — not how likely the garment is to fit you.</p></div>
      {bestExact?<>
        <div className={styles.evidenceCard}>
          <div><span className="eyebrow">BEST EXACT VARIATION</span><strong>{selectedVariation?.label??"Exact variation"}</strong><span>{profileById.get(bestExact.user_id)?.display_name||`@${profileById.get(bestExact.user_id)?.username??"member"}`}</span></div>
          <div><MatchPercentageBadge score={bestExact.historical_match_score} compact/><span>Body Match</span></div>
          <div><strong>{sizeFor(bestExact)}</strong><span>Wore · {FIT_RESULT_LABELS[bestExact.fit]??bestExact.fit}</span></div>
        </div>
        {bestExact.historical_match_score<STRONG_FIT_REPORT_MATCH_THRESHOLD?<p className={styles.explanation}>This is the closest Fit Report we currently have for this exact variation. A lower Body Match does not mean this item will not fit you — it means we do not yet have a report from someone closer to your measurements.</p>:null}
      </>:<div className={styles.empty}>No Fit Report from another member exists for this exact tracked variation yet. FITuition can still use clearly reduced related evidence and your relevant Closet History.</div>}

      {strongExact.length>=2?<div className={styles.strongBox}><div className={styles.strongHeader}><strong>Strong Fit Reports · {strongExact.length} reports</strong><span>Exact variation only · {STRONG_FIT_REPORT_MATCH_THRESHOLD}%+ Body Match</span></div><div className={styles.strongGroups}>{strongGroups.map((group)=><div className={styles.strongRow} key={group.size}><strong>Size {group.size}</strong><div className={styles.fitBreakdown}>{group.fits.map((fit)=><span key={fit.fit}><b>{fit.percent}%</b> {fit.label} · {fit.count}</span>)}</div></div>)}</div></div>:null}

      {related?<div className={`${styles.evidenceCard} ${styles.section}`}>
        <div><span className="eyebrow">CLOSEST RELATED VARIATION</span><strong>{relatedDetail||"Related tracked variation"}</strong><span>{profileById.get(related.user_id)?.display_name||`@${profileById.get(related.user_id)?.username??"member"}`}</span>{relatedDifferences.length?<div className={styles.relatedDifference}>{relatedDifferences.join(" · ")}</div>:null}</div>
        <div><MatchPercentageBadge score={related.historical_match_score} compact/><span>Body Match</span></div>
        <div><strong>{sizeFor(related)}</strong><span>Wore · {FIT_RESULT_LABELS[related.fit]??related.fit}</span></div>
      </div>:null}
      <ExpandedEvidenceClient slug={slug} variationKey={selectedVariationKey}/>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeader}><span className="eyebrow">YOUR CLOSET HISTORY</span><h2>{closetEvidence.length?"What your own history adds":"No relevant Closet history yet"}</h2><p>Your older Fit Reports are compared against your current body state, so personal history is useful evidence without being treated as an automatic perfect match.</p></div>
      {closetEvidence.length?<div className={styles.closetSummary}>
        {closetTop?<div className={styles.closetCard}><strong>{closetTop}</strong><span>Your strongest current Closet size signal for this garment context.</span></div>:null}
        <div className={styles.closetCard}><strong>{closetEvidence.length} relevant report{closetEvidence.length===1?"":"s"}</strong><span>{closetJustRight.length} currently contribute Just Right evidence. {closetExact.length?`${closetExact.length} are from this exact tracked variation.`:""}</span></div>
      </div>:<div className={styles.empty}>As you log garments and Fit Reports, relevant Closet history can strengthen or challenge the community Size Match signal.</div>}
    </section>
  </main>;
}
