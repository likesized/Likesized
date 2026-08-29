import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { resolveCanonicalProductImages, canonicalProductImageKey } from "@/lib/canonical-product-images";
import { createClient } from "@/lib/supabase/server";
import { FituitionEvidenceFallback, FituitionEvidenceSections } from "./FituitionSections";
import ItemActionsClient, { type RetailerListing } from "./ItemActionsClient";
import StyleInspiration, { StyleInspirationFallback } from "./StyleInspiration";
import styles from "./itemDetail.module.css";

type Params=Promise<{slug:string}>;
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type ProductRecord={id:string;name:string;slug:string;category:string;garment_type_key:string|null;image_url:string|null;brand_id:string;product_family_id:string|null;brand:unknown};
type BrandRecord={name:string};
type TargetVariationRow={tracked_variation_key:string|null};
type RetailerRelation={name:string};
type RetailerRow={id:string;product_url:string;retailer:unknown};

function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

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

  const [targetVariationsResult,retailerResult,likeResult,wishResult]=await Promise.all([
    supabase.from("fit_reports").select("tracked_variation_key").eq("product_id",product.id).not("tracked_variation_key","is",null).limit(500),
    supabase.from("retailer_listings").select("id,product_url,retailer:retailers(name)").eq("product_id",product.id).not("product_url","is",null),
    supabase.from("product_likes").select("product_id").eq("user_id",viewerId).eq("product_id",product.id).maybeSingle(),
    supabase.from("wish_locker_items").select("product_id").eq("user_id",viewerId).eq("product_id",product.id).maybeSingle(),
  ]);
  if(targetVariationsResult.error)throw new Error("Could not load garment context.");

  const variationKeys=new Set(((targetVariationsResult.data??[]) as TargetVariationRow[]).map((row)=>row.tracked_variation_key).filter((value):value is string=>Boolean(value)));
  const selectedVariationKey=requestedVariation&&variationKeys.has(requestedVariation)?requestedVariation:null;
  const canonicalReturnTo=`/item/${slug}${selectedVariationKey?`?variation=${encodeURIComponent(selectedVariationKey)}`:""}`;
  const canonicalImages=await resolveCanonicalProductImages(supabase,[{productId:product.id,variationKey:selectedVariationKey}]);
  const image=canonicalImages.get(canonicalProductImageKey(product.id,selectedVariationKey));
  const placeholder=product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase()||"FIT";
  const retailers:RetailerListing[]=((retailerResult.error?[]:(retailerResult.data??[])) as RetailerRow[]).flatMap((row)=>{const retailer=one<RetailerRelation>(row.retailer);return row.product_url?[{id:row.id,name:retailer?.name?.trim()||"Retailer",url:row.product_url}]:[];});

  return <main className="pageShell">
    <section className="itemHero">
      <div className="productImage">{image?<img className={styles.heroImage} src={image.imageUrl} alt={`${brand?.name?`${brand.name} `:""}${product.name}`} />:<span className={styles.heroFallback}>{placeholder}</span>}</div>
      <div className="itemDetails">
        <span className="eyebrow">{brand?.name?.toUpperCase()||"BRAND"}{product.garment_type_key?` · ${product.garment_type_key.replaceAll("_"," ").toUpperCase()}`:""}</span>
        <h1>{product.name}</h1>
        <ItemActionsClient productId={product.id} productName={`${brand?.name?`${brand.name} `:""}${product.name}`} returnTo={canonicalReturnTo} initialLiked={Boolean(likeResult.error?null:likeResult.data)} initialWished={Boolean(wishResult.error?null:wishResult.data)} retailers={retailers}/>
      </div>
    </section>

    <Suspense fallback={<FituitionEvidenceFallback/>}>
      <FituitionEvidenceSections productId={product.id} viewerId={viewerId} slug={slug} selectedVariationKey={selectedVariationKey} retryHref={canonicalReturnTo}/>
    </Suspense>

    <Suspense fallback={<StyleInspirationFallback/>}>
      <StyleInspiration productId={product.id} variationKey={selectedVariationKey}/>
    </Suspense>
  </main>;
}
