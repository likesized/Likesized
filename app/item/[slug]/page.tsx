import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EVIDENCE_LABELS, type EvidenceLevel } from "@/lib/domain";
import { recommendSize, type RecommendationEvidence } from "@/lib/recommendation";

type Params=Promise<{slug:string}>;
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type ProductRecord={id:string;name:string;slug:string;category:string;garment_type_key:string|null;image_url:string|null;brand:unknown};
type BrandRecord={name:string};
type Candidate={fit_report_id:string;user_id:string;closet_item_id:string;evidence_product_id:string;evidence_variant_id:string|null;fit_profile_version_id:string;original_size_label:string;normalized_size_id:string|null;fit:RecommendationEvidence["fit"];would_buy_again:boolean|null;historical_match_score:number;historical_coverage_percent:number;evidence_level:EvidenceLevel;evidence_rank:number;attribute_overlap:number};
type Profile={id:string;username:string;display_name:string|null};
type EvidenceProduct={id:string;name:string;slug:string;brand:unknown};
type SizeRow={id:string;normalized_key:string;display_label:string};
type VariantRecord={id:string;size_label:string;color_label:string|null;sku:string|null;normalized_size:unknown};
type NormalizedSize={display_label:string};
type ReportRating={id:string;fit_rating:number|null};
type ProductFitSummary={average_rating:number|null;rating_count:number;total_fit_count:number;too_small_count:number;snug_count:number;just_right_count:number;relaxed_count:number;too_big_count:number};
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function variantLabel(variant:VariantRecord){const normalized=one<NormalizedSize>(variant.normalized_size);return `Size ${normalized?.display_label||variant.size_label}${variant.color_label?` · ${variant.color_label}`:""}${variant.sku?` · SKU ${variant.sku}`:""}`;}
function stars(value:number|null|undefined){return value?`${"★".repeat(Math.round(value))}${"☆".repeat(5-Math.round(value))}`:"—";}
function percent(count:number,total:number){return total?Math.round((count/total)*100):0;}
const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};

export default async function ItemPage({params,searchParams}:{params:Params;searchParams:SearchParams}){
  const {slug}=await params;
  const query=await searchParams;
  const requestedVariant=first(query.variant)?.trim()||null;
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

  const {data:productData,error:productError}=await supabase.from("products").select("id,name,slug,category,garment_type_key,image_url,brand:brands(name)").eq("slug",slug).maybeSingle();
  if(productError)throw new Error("Could not load product.");
  if(!productData)notFound();
  const product=productData as ProductRecord;
  const brand=one<BrandRecord>(product.brand);

  const {data:variantData,error:variantError}=await supabase.from("product_variants").select("id,size_label,color_label,sku,normalized_size:normalized_sizes(display_label)").eq("product_id",product.id).order("size_label").order("color_label");
  if(variantError)throw new Error("Could not load product variants.");
  const variants=(variantData??[]) as VariantRecord[];
  const selectedVariant=requestedVariant?variants.find((variant)=>variant.id===requestedVariant)??null:null;
  const invalidVariant=Boolean(requestedVariant&&!selectedVariant);

  const [{data:candidateData,error:candidateError},{data:summaryData,error:summaryError}]=await Promise.all([
    supabase.rpc("get_product_evidence_candidates",{p_product_id:product.id,p_variant_id:selectedVariant?.id??null,p_result_limit:300}),
    supabase.rpc("get_product_fit_summary",{p_product_id:product.id}),
  ]);
  if(candidateError)throw new Error("Could not load product fit evidence.");
  if(summaryError)throw new Error("Could not load product fit summary.");
  const summary=(Array.isArray(summaryData)?summaryData[0]:summaryData) as ProductFitSummary|null;

  // Match % remains garment-specific body similarity. A poor Fit Result or low personal
  // Fit Rating never downgrades the person's Match %. Negative high-match evidence is
  // intentionally preserved because it is valuable size-recommendation evidence.
  const candidates=((candidateData??[]) as Candidate[]).filter((row)=>row.user_id!==viewerId);
  const ranked=[...candidates].sort((a,b)=>a.evidence_rank-b.evidence_rank||b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent||b.attribute_overlap-a.attribute_overlap);

  const profileIds=[...new Set(ranked.map((row)=>row.user_id))];
  const productIds=[...new Set(ranked.map((row)=>row.evidence_product_id))];
  const sizeIds=[...new Set(ranked.map((row)=>row.normalized_size_id).filter((value):value is string=>Boolean(value)))];
  const reportIds=[...new Set(ranked.map((row)=>row.fit_report_id))];
  let profiles:Profile[]=[]; let evidenceProducts:EvidenceProduct[]=[]; let sizes:SizeRow[]=[]; let reportRatings:ReportRating[]=[];
  if(profileIds.length){const {data}=await supabase.from("profiles").select("id,username,display_name").in("id",profileIds);profiles=(data??[]) as Profile[];}
  if(productIds.length){const {data}=await supabase.from("products").select("id,name,slug,brand:brands(name)").in("id",productIds);evidenceProducts=(data??[]) as EvidenceProduct[];}
  if(sizeIds.length){const {data}=await supabase.from("normalized_sizes").select("id,normalized_key,display_label").in("id",sizeIds);sizes=(data??[]) as SizeRow[];}
  if(reportIds.length){const {data}=await supabase.from("fit_reports").select("id,fit_rating").in("id",reportIds);reportRatings=(data??[]) as ReportRating[];}

  const profileById=new Map(profiles.map((row)=>[row.id,row]));
  const productById=new Map(evidenceProducts.map((row)=>[row.id,row]));
  const sizeById=new Map(sizes.map((row)=>[row.id,row]));
  const ratingByReportId=new Map(reportRatings.map((row)=>[row.id,row.fit_rating]));

  const recommendation=recommendSize(ranked.map((row)=>{
    const normalized=row.normalized_size_id?sizeById.get(row.normalized_size_id):null;
    return{
      sizeKey:normalized?.normalized_key||`raw:${row.original_size_label.trim().toUpperCase()}`,
      sizeLabel:normalized?.display_label||row.original_size_label,
      fit:row.fit,
      matchScore:row.historical_match_score,
      coveragePercent:row.historical_coverage_percent,
      evidenceLevel:row.evidence_level,
      attributeOverlap:row.attribute_overlap,
      wouldBuyAgain:row.would_buy_again,
    };
  }));

  const bestLevel=ranked[0]?.evidence_level??null;
  const bestCount=bestLevel?ranked.filter((row)=>row.evidence_level===bestLevel).length:0;
  const placeholder=product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase()||"FIT";
  const averageRating=summary?.average_rating??null;
  const ratingCount=summary?.rating_count??0;
  const fitCount=summary?.total_fit_count??0;

  return <main className="pageShell">
    <section className="itemHero"><div className="productImage">{placeholder}</div><div className="itemDetails"><span className="eyebrow">{brand?.name?.toUpperCase()||"BRAND"}{product.garment_type_key?` · ${product.garment_type_key.replaceAll("_"," ").toUpperCase()}`:""}</span><h1>{product.name}</h1><p>LikeSized separates three different signals: your garment-specific body Match %, the physical Fit Result people experienced, and their personal 1–5 Fit Rating.</p>
      <div className="recommendation"><span>COMMUNITY FIT RATING</span><strong>{averageRating!==null?`${Number(averageRating).toFixed(1)} ★`:"—"}</strong><b>{ratingCount?`${ratingCount} rating${ratingCount===1?"":"s"}`:"No ratings yet"}</b></div>
      {fitCount?<div className="tiny">Physical fit from the latest Shared observation per unique wearer: {percent(summary?.too_small_count??0,fitCount)}% Too small · {percent(summary?.snug_count??0,fitCount)}% Snug · {percent(summary?.just_right_count??0,fitCount)}% Just right · {percent(summary?.relaxed_count??0,fitCount)}% Relaxed · {percent(summary?.too_big_count??0,fitCount)}% Too big.</div>:<div className="tiny">No Shared physical fit observations for this exact product yet.</div>}
      {recommendation?<><div className="recommendation"><span>RECOMMENDED SIZE</span><strong>{recommendation.sizeLabel}</strong><b>{recommendation.confidence}% confidence</b></div><div className="tiny">Based on {recommendation.similarWearerCount} unique relevant wearer{recommendation.similarWearerCount===1?"":"s"}. Strongest supporting tier: {EVIDENCE_LABELS[recommendation.strongestEvidenceLevel]}. Fit Rating does not alter this body-match calculation.</div></>:<><div className="recommendation"><span>RECOMMENDED SIZE</span><strong>—</strong><b>Not enough relevant evidence yet</b></div><div className="tiny">No eligible shared historical fit evidence from sufficiently similar body snapshots yet.</div></>}
      <div className="statsRow"><span><b>{ranked.length}</b> unique wearer{ranked.length===1?"":"s"}</span><span><b>{bestLevel?EVIDENCE_LABELS[bestLevel]:"—"}</b> strongest tier</span><span><b>{bestCount}</b> at strongest tier</span></div>
    </div></section>

    <section className="section flush"><div className="sectionHeading"><div><span className="eyebrow">EVIDENCE TARGET</span><h2>{selectedVariant?"Exact variant":"Exact product"}</h2><p>{selectedVariant?variantLabel(selectedVariant):"All known variants of this product. Choose a specific variant when size/color construction matters and you want Exact Variant evidence prioritized first."}</p></div></div>
      {invalidVariant?<div className="authMessage error">That variant does not belong to this product. Showing the Exact Product target instead.</div>:null}
      {variants.length?<form className="garmentForm" method="get"><label>Variant to evaluate<select name="variant" defaultValue={selectedVariant?.id??""}><option value="">All variants — Exact Product target</option>{variants.map((variant)=><option value={variant.id} key={variant.id}>{variantLabel(variant)}</option>)}</select><span className="fieldHelp">Exact Variant evidence ranks first. If there is not enough, LikeSized still falls back through Exact Product, Product Family, Similar Garments, Brand + Garment Type, and Category Fit.</span></label><button className="secondaryButton" type="submit">Update evidence target</button></form>:<div className="privacyNote"><b>No logged variants yet.</b> Recommendations currently use Exact Product and broader fallback evidence until variant-level data exists.</div>}
    </section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">BEST EVIDENCE FIRST</span><h2>How this—or the closest relevant garments—fit bodies like yours</h2><p>A high Match with a bad physical Fit Result stays visible because that failure is useful evidence, not a reason to pretend the bodies were less similar.</p></div></div>
      {ranked.length?<div className="evidenceList">{ranked.slice(0,30).map((row)=>{
        const profile=profileById.get(row.user_id);
        const sourceProduct=productById.get(row.evidence_product_id);
        const sourceBrand=one<BrandRecord>(sourceProduct?.brand);
        const normalized=row.normalized_size_id?sizeById.get(row.normalized_size_id):null;
        const fitRating=ratingByReportId.get(row.fit_report_id)??null;
        return <div className="evidence" key={row.fit_report_id}>
          <div className="avatar small">{(profile?.display_name||profile?.username||"F").slice(0,1).toUpperCase()}</div>
          <div><strong>{profile?.display_name||profile?.username||"LikeSized member"}</strong><span>{row.historical_match_score}% match to your current body when this was worn · {row.historical_coverage_percent}% measurement coverage</span></div>
          <div><span>Evidence</span><strong>{EVIDENCE_LABELS[row.evidence_level]}</strong></div>
          <div><span>Garment</span><strong>{sourceBrand?.name?`${sourceBrand.name} · `:""}{sourceProduct?.name||"Garment"}</strong></div>
          <div><span>Size</span><strong>{normalized?.display_label||row.original_size_label}</strong></div>
          <div><span>Fit result</span><strong>{FIT_LABELS[row.fit]||row.fit}</strong></div>
          <div><span>Fit rating</span><strong>{stars(fitRating)}</strong></div>
        </div>;
      })}</div>:<div className="emptyState"><span className="eyebrow">NO FIT EVIDENCE YET</span><h2>Be the first useful data point.</h2><p>LikeSized will use exact variant/product evidence first, then family and clearly labeled similar-garment evidence as the user-built database grows.</p></div>}
    </section>
  </main>;
}
