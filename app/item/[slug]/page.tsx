import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { resolveCanonicalProductImages, canonicalProductImageKey } from "@/lib/canonical-product-images";
import { createClient } from "@/lib/supabase/server";
import { trackedVariationParts, type TrackedVariationPart } from "@/lib/tracked-variation";
import { FituitionEvidenceFallback, FituitionEvidenceSections } from "./FituitionSections";
import ItemActionsClient, { type RetailerListing } from "./ItemActionsClient";
import StyleInspiration, { StyleInspirationFallback } from "./StyleInspiration";
import styles from "./itemDetail.module.css";

type Params=Promise<{slug:string}>;
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type ProductRecord={id:string;name:string;slug:string;category:string;garment_type_key:string|null;image_url:string|null;brand_id:string;product_family_id:string|null;brand:unknown};
type BrandRecord={name:string};
type TargetVariationRow={user_id:string;tracked_variation_key:string|null;garment_answers:Record<string,string>|null;created_at:string};
type RetailerRelation={name:string};
type RetailerRow={id:string;product_url:string;retailer:unknown};
type Variation={key:string;parts:TrackedVariationPart[];answers:Record<string,string>|null;wearerCount:number;latestAt:string};
type FilterRow={key:string;label:string;options:{value:string;label:string;href:string;active:boolean}[]};

function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function buildVariations(rows:TargetVariationRow[],garmentTypeKey:string|null):Variation[]{
  const groups=new Map<string,{answers:Record<string,string>|null;users:Set<string>;latestAt:string}>();
  for(const row of rows){if(!row.tracked_variation_key)continue;const current=groups.get(row.tracked_variation_key);if(!current){groups.set(row.tracked_variation_key,{answers:row.garment_answers,users:new Set([row.user_id]),latestAt:row.created_at});continue;}current.users.add(row.user_id);if(row.created_at>current.latestAt){current.latestAt=row.created_at;current.answers=row.garment_answers;}}
  return [...groups.entries()].map(([key,value])=>({key,parts:trackedVariationParts(garmentTypeKey,value.answers),answers:value.answers,wearerCount:value.users.size,latestAt:value.latestAt})).filter((variation)=>variation.parts.length).sort((a,b)=>b.wearerCount-a.wearerCount||b.latestAt.localeCompare(a.latestAt));
}
function matchesSelection(variation:Variation,selection:Map<string,string>,ignoreKey?:string){const values=new Map(variation.parts.map((part)=>[part.key,part.value]));for(const [key,value] of selection){if(key===ignoreKey)continue;if(values.get(key)!==value)return false;}return true;}
function selectionHref(slug:string,selection:Map<string,string>){const params=new URLSearchParams();for(const [key,value] of selection)params.set(`opt_${key}`,value);const query=params.toString();return `/item/${slug}${query?`?${query}`:""}`;}
function filterHref(slug:string,selection:Map<string,string>,key:string,value:string){const next=new Map(selection);next.set(key,value);return selectionHref(slug,next);}

export default async function ItemPage({params,searchParams}:{params:Params;searchParams:SearchParams}){
  const {slug}=await params;const query=await searchParams;const supabase=await createClient();const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();const viewerId=claimsData?.claims?.sub;if(claimsError||!viewerId)redirect(`/login?next=${encodeURIComponent(`/item/${slug}`)}`);
  const [{data:viewerProfile},{data:viewerFit},{data:productData,error:productError}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",viewerId).maybeSingle(),supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),supabase.from("products").select("id,name,slug,category,garment_type_key,image_url,brand_id,product_family_id,brand:brands(name)").eq("slug",slug).maybeSingle(),
  ]);
  if(!viewerProfile?.username||!viewerFit?.completed_at)redirect("/onboarding");if(productError)throw new Error("Could not load product.");if(!productData)notFound();const product=productData as ProductRecord;const brand=one<BrandRecord>(product.brand);
  const [variationResult,retailerResult,likeResult,wishResult]=await Promise.all([
    supabase.from("fit_reports").select("user_id,tracked_variation_key,garment_answers,created_at").eq("product_id",product.id).not("tracked_variation_key","is",null).order("created_at",{ascending:false}).limit(300),
    supabase.from("retailer_listings").select("id,product_url,retailer:retailers(name)").eq("product_id",product.id).not("product_url","is",null),
    supabase.from("product_likes").select("product_id").eq("user_id",viewerId).eq("product_id",product.id).maybeSingle(),supabase.from("wish_locker_items").select("product_id").eq("user_id",viewerId).eq("product_id",product.id).maybeSingle(),
  ]);if(variationResult.error)throw new Error("Could not load garment options.");

  const variations=buildVariations((variationResult.data??[]) as TargetVariationRow[],product.garment_type_key);const defaultVariation=variations[0]??null;const requestedSelection=new Map<string,string>();for(const [key,value] of Object.entries(query)){if(!key.startsWith("opt_")||!value)continue;const resolved=first(value);if(resolved)requestedSelection.set(key.slice(4),resolved);}
  let selectedVariation=variations.find((variation)=>matchesSelection(variation,requestedSelection))??defaultVariation;
  const selection=new Map<string,string>();if(selectedVariation)for(const part of selectedVariation.parts)selection.set(part.key,requestedSelection.get(part.key)??part.value);
  const exact=variations.find((variation)=>matchesSelection(variation,selection));if(exact)selectedVariation=exact;
  const selectedVariationKey=selectedVariation?.key??null;
  if(selectedVariation){selection.clear();for(const part of selectedVariation.parts)selection.set(part.key,part.value);}

  const dimensions=new Map<string,{label:string;values:Map<string,string>}>();for(const variation of variations)for(const part of variation.parts){const dimension=dimensions.get(part.key)??{label:part.label,values:new Map<string,string>()};dimension.values.set(part.value,part.valueLabel);dimensions.set(part.key,dimension);}
  const filterRows:FilterRow[]=[...dimensions.entries()].flatMap(([key,dimension])=>{const compatible=variations.filter((variation)=>matchesSelection(variation,selection,key));const values=new Map<string,string>();for(const variation of compatible){const part=variation.parts.find((candidate)=>candidate.key===key);if(part)values.set(part.value,part.valueLabel);}if(values.size<2)return[];return[{key,label:dimension.label,options:[...values.entries()].map(([value,label])=>({value,label,href:filterHref(slug,selection,key,value),active:selection.get(key)===value}))}];});

  const canonicalReturnTo=selectionHref(slug,selection);
  const canonicalImages=await resolveCanonicalProductImages(supabase,[{productId:product.id,variationKey:selectedVariationKey}]);const image=canonicalImages.get(canonicalProductImageKey(product.id,selectedVariationKey));const placeholder=product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,3).toUpperCase()||"FIT";
  const retailers:RetailerListing[]=((retailerResult.error?[]:(retailerResult.data??[])) as RetailerRow[]).flatMap((row)=>{const retailer=one<RetailerRelation>(row.retailer);return row.product_url?[{id:row.id,name:retailer?.name?.trim()||"Retailer",url:row.product_url}]:[];});

  return <main className="pageShell">
    <section className="itemHero">
      <div className="productImage">{image?<img className={styles.heroImage} src={image.imageUrl} alt={`${brand?.name?`${brand.name} `:""}${product.name}`}/>:<span className={styles.heroFallback}>{placeholder}</span>}</div>
      <div className="itemDetails"><span className="eyebrow">{brand?.name?.toUpperCase()||"BRAND"}{product.garment_type_key?` · ${product.garment_type_key.replaceAll("_"," ").toUpperCase()}`:""}</span><h1>{product.name}</h1>
        {filterRows.length?<div className={styles.optionGroups}>{filterRows.map((row)=><div className={styles.optionGroup} key={row.key}><strong>{row.label}</strong><div className={styles.variationPicker}>{row.options.map((option)=><Link key={option.value} prefetch={false} className={`${styles.variationLink} ${option.active?styles.variationLinkActive:""}`} href={option.href}>{option.label}</Link>)}</div></div>)}</div>:null}
        <ItemActionsClient productId={product.id} productName={`${brand?.name?`${brand.name} `:""}${product.name}`} returnTo={canonicalReturnTo} initialLiked={Boolean(likeResult.error?null:likeResult.data)} initialWished={Boolean(wishResult.error?null:wishResult.data)} retailers={retailers}/>
      </div>
    </section>
    <Suspense fallback={<FituitionEvidenceFallback/>}><FituitionEvidenceSections productId={product.id} viewerId={viewerId} slug={slug} selectedVariationKey={selectedVariationKey} retryHref={canonicalReturnTo}/></Suspense>
    <Suspense fallback={<StyleInspirationFallback/>}><StyleInspiration productId={product.id} variationKey={selectedVariationKey}/></Suspense>
  </main>;
}
