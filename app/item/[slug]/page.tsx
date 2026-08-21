import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EVIDENCE_LABELS, type EvidenceLevel } from "@/lib/domain";
import { recommendationConfidenceLabel, recommendSize, type RecommendationEvidence } from "@/lib/recommendation";

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
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function variantLabel(variant:VariantRecord){const normalized=one<NormalizedSize>(variant.normalized_size);return `Size ${normalized?.display_label||variant.size_label}${variant.color_label?` · ${variant.color_label}`:""}${variant.sku?` · SKU ${variant.sku}`:""}`;}
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

  const {data:candidateData,error:candidateError}=await supabase.rpc("get_product_evidence_candidates",{p_product_id:product.id,p_variant_id:selectedVariant?.id??null,p_result_limit:300});
  if(candidateError)throw new Error("Could not load product fit evidence.");

  // The database returns at most one strongest historical observation per unique wearer.
  // Every match score below compares the viewer's CURRENT body to the immutable snapshot attached to that Fit Report.
  const candidates=((candidateData??[]) as Candidate[]).filter((row)=>row.user_id!==viewerId);
  const ranked=[...candidates].sort((a,b)=>a.evidence_rank-b.evidence_rank||b.historical_match_score-a.historical_match_score||b.historical_coverage_percent-a.historical_coverage_percent||b.attribute_overlap-a.attribute_overlap);

  const profileIds=[...new Set(ranked.map((row)=>row.user_id))];
  const productIds=[...new Set(ranked.map((row)=>row.evidence_product_id))];
  const sizeIds=[...new Set(ranked.map((row)=>row.normalized_size_id).filter((value):value is string=>Boolean(value)))];
  let profiles:Profile[]=[]; let evidenceProducts:EvidenceProduct[]=[]; let sizes:SizeRow[]=[];
  if(profileIds.length){const {data}=await supabase.from("profiles").select("id,username,display_name").in("id",profileIds);profiles=(data??[]) as Profile[];}
  if(productIds.length){const {data}=await supabase.from("products").select("id,name,slug,brand:brands(name)").in("id",productIds);evidenceProducts=(data??[]) as EvidenceProduct[];}
  if(sizeIds.length){const {data}=await supabase.from("normalized_sizes").select("id,normalized_key,display_label").in("id",sizeIds);sizes=(data??[]) as SizeRow[];}

  const profileById=new Map(profiles.map((row)=>[row.id,row]));
  const productById=new Map(evidenceProducts.map((row)=>[row.id,row]));
  const sizeById=new Map(sizes.map((row)=>[row.id,row]));

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
    };
  }));

  const bestLevel=ranked[0]?.evidence_level??null;
  const bestCount=bestLevel?ranked.filter((row)=>row.evidence_level===bestLevel).length:0;
  const placeholder=product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase()||"FIT";

  return <main className="pageShell">
    <section className="itemHero"><div className="productImage">{placeholder}</div><div className="itemDetails"><span className="eyebrow">{brand?.name?.toUpperCase()||"BRAND"}{product.garment_type_key?` · ${product.garment_type_key.replaceAll("_"," ").toUpperCase()}`:""}</span><h1>{product.name}</h1><p>LikeSized uses the strongest relevant evidence available. Each garment report stays tied to the body measurements from when it was actually worn, even if that member's body changes later.</p>
      {recommendation?<><div className="recommendation"><span>RECOMMENDED SIZE</span><strong>{recommendation.sizeLabel}</strong><b>{recommendationConfidenceLabel(recommendation.confidence)}</b></div><div className="tiny">Based on {recommendation.similarWearerCount} unique relevant wearer{recommendation.similarWearerCount===1?"":"s"}. Strongest supporting tier: {EVIDENCE_LABELS[recommendation.strongestEvidenceLevel]}.</div></>:<><div className="recommendation"><span>RECOMMENDED SIZE</span><strong>—</strong><b>Not enough relevant evidence yet</b></div><div className="tiny">No eligible shared historical fit evidence from sufficiently similar body snapshots yet.</div></>}
      <div className="statsRow"><span><b>{ranked.length}</b> unique wearer{ranked.length===1?"":"s"}</span><span><b>{bestLevel?EVIDENCE_LABELS[bestLevel]:"—"}</b> strongest tier</span><span><b>{bestCount}</b> at strongest tier</span></div>
    </div></section>

    <section className="section flush"><div className="sectionHeading"><div><span className="eyebrow">EVIDENCE TARGET</span><h2>{selectedVariant?"Exact variant":"Exact product"}</h2><p>{selectedVariant?variantLabel(selectedVariant):"All known variants of this product. Choose a specific variant when size/color construction matters and you want Exact Variant evidence prioritized first."}</p></div></div>
      {invalidVariant?<div className="authMessage error">That variant does not belong to this product. Showing the Exact Product target instead.</div>:null}
      {variants.length?<form className="garmentForm" method="get"><label>Variant to evaluate<select name="variant" defaultValue={selectedVariant?.id??""}><option value="">All variants — Exact Product target</option>{variants.map((variant)=><option value={variant.id} key={variant.id}>{variantLabel(variant)}</option>)}</select><span className="fieldHelp">Exact Variant evidence ranks first. If there is not enough, LikeSized still falls back through Exact Product, Product Family, Similar Garments, Brand + Garment Type, and Category Fit.</span></label><button className="secondaryButton" type="submit">Update evidence target</button></form>:<div className="privacyNote"><b>No logged variants yet.</b> Recommendations currently use Exact Product and broader fallback evidence until variant-level data exists.</div>}
    </section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">BEST EVIDENCE FIRST</span><h2>How this—or the closest relevant garments—fit bodies like yours</h2></div></div>
      {ranked.length?<div className="evidenceList">{ranked.slice(0,30).map((row)=>{
        const profile=profileById.get(row.user_id);
        const sourceProduct=productById.get(row.evidence_product_id);
        const sourceBrand=one<BrandRecord>(sourceProduct?.brand);
        const normalized=row.normalized_size_id?sizeById.get(row.normalized_size_id):null;
        return <div className="evidence" key={row.fit_report_id}>
          <div className="avatar small">{(profile?.display_name||profile?.username||"F").slice(0,1).toUpperCase()}</div>
          <div><strong>{profile?.display_name||profile?.username||"LikeSized member"}</strong><span>{row.historical_match_score}% match to your current body when this was worn · {row.historical_coverage_percent}% measurement coverage</span></div>
          <div><span>Evidence</span><strong>{EVIDENCE_LABELS[row.evidence_level]}</strong></div>
          <div><span>Garment</span><strong>{sourceBrand?.name?`${sourceBrand.name} · `:""}{sourceProduct?.name||"Garment"}</strong></div>
          <div><span>Size</span><strong>{normalized?.display_label||row.original_size_label}</strong></div>
          <div><span>Fit Result</span><strong>{FIT_LABELS[row.fit]||row.fit}</strong></div>
        </div>;
      })}</div>:<div className="emptyState"><span className="eyebrow">NO FIT EVIDENCE YET</span><h2>Be the first useful data point.</h2><p>LikeSized will use exact variant/product evidence first, then family and clearly labeled similar-garment evidence as the user-built database grows.</p></div>}
    </section>
  </main>;
}