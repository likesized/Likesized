import Link from "next/link";
import { redirect } from "next/navigation";
import { addToWishLocker, likeProduct, removeFromWishLocker, requestEvidenceNotification, cancelEvidenceNotification, unlikeProduct } from "@/app/likelocker/actions";
import { ExploreFilters } from "@/components/ExploreFilters";
import { ExploreSearch } from "@/components/ExploreSearch";
import { ProductMiniBrowser } from "@/components/ProductMiniBrowser";
import { ReportContentForm } from "@/components/ReportContentForm";
import { EXPLORE_FIXTURE_OUTFITS, EXPLORE_FIXTURE_PEOPLE, EXPLORE_FIXTURE_PRODUCTS, allowExploreFixtures } from "@/lib/explore-fixtures";
import { GARMENT_TYPE_BY_KEY, isAllowedGarmentAnswer } from "@/lib/garment-taxonomy";
import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";
import styles from "./explore.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Product = { id:string; name:string; slug:string; category:string; garment_type_key:string|null; image_url:string|null; brand_id?:string; catalog_status?:string; catalog_review_needed?:boolean; brand:unknown; fixture?:boolean; color_family_key?:string; attributes?:Record<string,string>; score?:number; report_count?:number; wearer_id?:string; size?:string; fit?:string };
type Brand = { name:string };
type BrandOption = { id:string; name:string };
type Outfit = { id:string; user_id:string; caption:string|null; photo_url:string; created_at:string; profile:unknown; fixture?:boolean };
type Profile = { username:string; display_name:string|null; avatar_url?:string|null };
type Match = { user_id:string; username:string; display_name:string|null; avatar_url:string|null; match_score:number };
type Evidence = { user_id:string; original_size_label:string; fit:string; historical_match_score:number };
type Person = { id:string; username:string; display_name:string|null; avatar_url:string|null };

function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function clean(value:string|undefined){return (value??"").trim().replace(/%/g,"").replace(/\s+/g," ").slice(0,80);}
function label(value:string){return value.replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());}
function tier(score:number){if(score>=90)return "Exceptional fit evidence";if(score>=85)return "Strong fit evidence";if(score>=80)return "Good fit evidence";return "Useful fit evidence";}
function trustRank(product:Product){if(product.catalog_review_needed)return 3;return product.catalog_status==="verified"?0:product.catalog_status==="corroborated"?1:2;}
function intersect(current:string[]|null,next:string[]){if(current===null)return next;const allowed=new Set(next);return current.filter((id)=>allowed.has(id));}

function ProductCard({product,score,evidence,wearer,reportCount,liked,wished,watching,returnTo}:{product:Product;score:number;evidence?:Evidence;wearer?:Person;reportCount:number;liked:boolean;wished:boolean;watching:boolean;returnTo:string}){
  const brand=one<Brand>(product.brand);
  const fixtureHref=`/explore/preview?kind=garment&id=${product.id}`;
  return <article className={styles.card}>{product.fixture?<span className={styles.testBadge}>TEST GARMENT</span>:null}<ProductMiniBrowser href={product.fixture?fixtureHref:`/item/${product.slug}`} label={`${brand?.name??""} ${product.name}`.trim()}><span className={styles.imageLink}>{product.image_url?<img src={product.image_url} alt={`${brand?.name??""} ${product.name}`.trim()}/>:<span className={styles.fallback}>{product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()||"LS"}</span>}</span></ProductMiniBrowser><div className={styles.body}><span className="muted">{brand?.name||"Brand"} · {GARMENT_TYPE_BY_KEY.get(product.garment_type_key??"")?.label||"Garment"}</span><ProductMiniBrowser href={product.fixture?fixtureHref:`/item/${product.slug}`} label={`${brand?.name??""} ${product.name}`.trim()}><span className={styles.title}>{product.name}</span></ProductMiniBrowser>{score?<div><strong>{score}% historical Match</strong><span className="muted">{tier(score)} · {reportCount} Fit {reportCount===1?"Report":"Reports"}</span></div>:<span className="muted">Fit evidence is still growing.</span>}{evidence&&wearer?<p className={styles.evidence}>{product.fixture?<span>{wearer.display_name?.trim()||wearer.username}</span>:<Link href={`/people/${wearer.username}`}>{wearer.display_name?.trim()||wearer.username}</Link>} wore size {evidence.original_size_label} · {label(evidence.fit)}</p>:null}{product.fixture?<div className={styles.previewActions}>Like · Wish Locker · Notify controls verified with real-data tests</div>:<div className={styles.actions}><form action={liked?unlikeProduct:likeProduct}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" aria-pressed={liked}>{liked?"♥ Liked":"♡ Like"}</button></form><form action={wished?removeFromWishLocker:addToWishLocker}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" aria-pressed={wished}>{wished?"In Wish Locker":"+ Wish Locker"}</button></form>{score<75?<form action={watching?cancelEvidenceNotification:requestEvidenceNotification}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" aria-pressed={watching}>{watching?"Notification on":"Notify me"}</button></form>:null}</div>}</div></article>;
}

export default async function ExplorePage({searchParams}:{searchParams:SearchParams}){
  const params=await searchParams;
  const view=first(params.view)==="outfits"?"outfits":"garments";
  const scope=first(params.scope)==="all"?"all":"matches";
  const category=clean(first(params.category));
  const garmentType=clean(first(params.type));
  const brandId=clean(first(params.brand));
  const itemName=clean(first(params.item));
  const color=clean(first(params.color));
  const resultLimit=Math.min(96,Math.max(24,Number(first(params.limit))||24));
  const fixtureMode=allowExploreFixtures(first(params.preview)==="fixtures");
  const selectedAttributes=Object.fromEntries(Object.entries(params).filter(([key,value])=>key.startsWith("attr_")&&typeof first(value)==="string").map(([key,value])=>[key.slice(5),clean(first(value))]).filter(([key,value])=>Boolean(value)&&isAllowedGarmentAnswer(garmentType,key,value))) as Record<string,string>;

  const supabase=await createClient();
  const {data:claims,error:claimsError}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub;
  if(claimsError||!viewerId)redirect("/login?next=/explore");
  const [{data:profile},{data:fitProfile},{data:matchData,error:matchError},{data:brandData}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",viewerId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),
    supabase.rpc("get_fit_matches",{p_match_category:"overall",p_result_limit:100}),
    supabase.from("brands").select("id,name").order("name"),
  ]);
  if(!profile?.username||!fitProfile?.completed_at)redirect("/onboarding");
  if(matchError)throw new Error("Could not load Explore matches.");
  const matches=(matchData??[]) as Match[];
  const matchByUser=new Map(matches.map((row)=>[row.user_id,row.match_score]));
  const brands=[...(brandData??[]) as BrandOption[]];
  if(fixtureMode)for(const product of EXPLORE_FIXTURE_PRODUCTS)if(!brands.some((brand)=>brand.id===product.brand_id))brands.push({id:product.brand_id,name:product.brand.name});
  brands.sort((a,b)=>a.name.localeCompare(b.name));

  let strictProductIds:string[]|null=null;
  for(const [attributeKey,optionKey] of Object.entries(selectedAttributes)){
    const {data,error}=await supabase.from("product_attribute_values").select("product_id").eq("attribute_key",attributeKey).eq("option_key",optionKey).neq("source_status","rejected");
    if(error)throw new Error("Could not apply controlled garment filters.");
    strictProductIds=intersect(strictProductIds,(data??[]).map((row)=>row.product_id));
  }
  if(color){
    let result=await supabase.from("product_variants").select("product_id").eq("color_family_key",color);
    if(result.error){const display=label(color);result=await supabase.from("product_variants").select("product_id").ilike("color_label",display);}
    strictProductIds=intersect(strictProductIds,(result.data??[]).map((row)=>row.product_id));
  }

  let products:Product[]=[];
  if(view==="garments"){
    let query=supabase.from("products").select("id,name,slug,category,garment_type_key,image_url,brand_id,catalog_status,catalog_review_needed,brand:brands(name)").neq("catalog_status","rejected").order("created_at",{ascending:false}).limit(resultLimit);
    if(category)query=query.eq("category",category);
    if(garmentType)query=query.eq("garment_type_key",garmentType);
    if(brandId&&!brandId.startsWith("preview-brand-"))query=query.eq("brand_id",brandId);
    if(itemName)query=query.ilike("name",`%${itemName}%`);
    if(strictProductIds)query=strictProductIds.length?query.in("id",strictProductIds):query.eq("id","00000000-0000-0000-0000-000000000000");
    const result=await query;
    if(result.error)throw new Error("Could not load garments.");
    products=(result.data??[]) as Product[];
    if(fixtureMode){
      const fixtureProducts=(EXPLORE_FIXTURE_PRODUCTS as Product[]).filter((product)=>!category||product.category===category).filter((product)=>!garmentType||product.garment_type_key===garmentType).filter((product)=>!brandId||product.brand_id===brandId).filter((product)=>!itemName||product.name.toLowerCase().includes(itemName.toLowerCase())).filter((product)=>!color||product.color_family_key===color).filter((product)=>Object.entries(selectedAttributes).every(([key,value])=>product.attributes?.[key]===value));
      products=[...fixtureProducts,...products].slice(0,resultLimit);
    }
  }

  const scores=new Map<string,number>();
  const bestEvidence=new Map<string,Evidence>();
  const reportCounts=new Map<string,number>();
  for(const product of products.filter((item)=>item.fixture)){
    scores.set(product.id,product.score??0);reportCounts.set(product.id,product.report_count??0);
    if(product.wearer_id)bestEvidence.set(product.id,{user_id:product.wearer_id,original_size_label:product.size??"",fit:product.fit??"just_right",historical_match_score:product.score??0});
  }
  await Promise.all(products.filter((item)=>!item.fixture).map(async(product)=>{const {data}=await supabase.rpc("get_product_evidence_candidates",{p_product_id:product.id,p_variant_id:null,p_result_limit:40});const candidates=(data??[]) as Evidence[];scores.set(product.id,Math.max(...candidates.map((row)=>row.historical_match_score),0));reportCounts.set(product.id,candidates.length);const strongest=candidates.reduce<Evidence|undefined>((current,row)=>!current||row.historical_match_score>current.historical_match_score?row:current,undefined);if(strongest)bestEvidence.set(product.id,strongest);}));
  if(view==="garments"){
    if(scope==="matches")products=products.filter((product)=>(scores.get(product.id)??0)>=75);
    products.sort((a,b)=>scope==="all"?trustRank(a)-trustRank(b)||(scores.get(b.id)??0)-(scores.get(a.id)??0):(scores.get(b.id)??0)-(scores.get(a.id)??0)||trustRank(a)-trustRank(b));
  }

  const evidenceUserIds=[...new Set([...bestEvidence.values()].map((row)=>row.user_id))].filter((id)=>!id.startsWith("preview-"));
  const {data:evidenceProfiles}=evidenceUserIds.length?await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id",evidenceUserIds):{data:[]};
  const evidencePeople=new Map(((evidenceProfiles??[]) as Person[]).map((person)=>[person.id,person]));
  if(fixtureMode)for(const person of EXPLORE_FIXTURE_PEOPLE)evidencePeople.set(person.id,person);

  let outfits:Outfit[]=[];
  if(view==="outfits"){
    const result=await supabase.from("outfit_posts").select("id,user_id,caption,photo_url,created_at,profile:profiles(username,display_name,avatar_url)").order("created_at",{ascending:false}).limit(resultLimit);
    if(result.error)throw new Error("Could not load outfits.");
    outfits=(result.data??[]) as Outfit[];
    if(fixtureMode)outfits=[...(EXPLORE_FIXTURE_OUTFITS as Outfit[]),...outfits].slice(0,resultLimit);
    if(scope==="matches")outfits=outfits.filter((post)=>post.fixture||(matchByUser.get(post.user_id)??0)>=75);
    outfits.sort((a,b)=>(matchByUser.get(b.user_id)??(b.fixture?90:0))-(matchByUser.get(a.user_id)??(a.fixture?90:0)));
  }

  const [{data:likedData},{data:wishedData},{data:watchedData}]=await Promise.all([supabase.from("product_likes").select("product_id").eq("user_id",viewerId),supabase.from("wish_locker_items").select("product_id").eq("user_id",viewerId),supabase.from("product_evidence_notifications").select("product_id").eq("user_id",viewerId)]);
  const liked=new Set((likedData??[]).map((row)=>row.product_id));const wished=new Set((wishedData??[]).map((row)=>row.product_id));const watched=new Set((watchedData??[]).map((row)=>row.product_id));
  const signed=new Map<string,string>();
  await Promise.all(outfits.filter((post)=>!post.fixture).map(async(post)=>{const feedPath=outfitFeedPhotoPath(post.photo_url);let {data}=await supabase.storage.from("outfit-photos").createSignedUrl(feedPath,1800);if(!data?.signedUrl&&feedPath!==post.photo_url)({data}=await supabase.storage.from("outfit-photos").createSignedUrl(post.photo_url,1800));if(data?.signedUrl)signed.set(post.id,data.signedUrl);}));
  const outfitProfilePhotos=new Map<string,string>();
  for(const post of outfits){if(post.fixture)continue;const person=one<Profile>(post.profile);const avatar=currentProfilePhotoUrl(supabase,person?.avatar_url);if(avatar)outfitProfilePhotos.set(post.user_id,avatar);}

  const filterQuery=new URLSearchParams({view,scope});if(category)filterQuery.set("category",category);if(garmentType)filterQuery.set("type",garmentType);if(brandId)filterQuery.set("brand",brandId);if(itemName)filterQuery.set("item",itemName);if(color)filterQuery.set("color",color);for(const [key,value] of Object.entries(selectedAttributes))filterQuery.set(`attr_${key}`,value);if(fixtureMode)filterQuery.set("preview","fixtures");if(resultLimit>24)filterQuery.set("limit",String(resultLimit));
  const base=`/explore?${filterQuery.toString()}`;const nextLimit=Math.min(96,resultLimit+24);
  const viewHref=(nextView:string)=>`/explore?view=${nextView}&scope=${scope}${fixtureMode?"&preview=fixtures":""}`;
  const scopeHref=(nextScope:string)=>`/explore?view=${view}&scope=${nextScope}${fixtureMode?"&preview=fixtures":""}`;
  return <main className="pageShell">
    {fixtureMode?<div className={styles.previewBanner}><b>Owner-review test environment</b><span>Temporary Garments, Outfits, and Wearers are clearly labeled and are not stored in Supabase.</span></div>:null}
    <div className="pageTitle"><span className="eyebrow">EXPLORE</span><h1>Discover clothes through real fit evidence.</h1><p>Start with garments and outfits backed by people whose fit data is most relevant to you. Switch to All whenever you want the wider catalog.</p></div>
    <ExploreSearch fixtures={fixtureMode}/>
    <div className={styles.controls}><nav className="filterBar" aria-label="Explore content"><Link className={`filter${view==="garments"?" active":""}`} href={viewHref("garments")}>Garments</Link><Link className={`filter${view==="outfits"?" active":""}`} href={viewHref("outfits")}>Outfits</Link></nav><nav className="filterBar" aria-label="Explore scope"><Link className={`filter${scope==="matches"?" active":""}`} href={scopeHref("matches")}>My Fit Matches</Link><Link className={`filter${scope==="all"?" active":""}`} href={scopeHref("all")}>All</Link></nav></div>
    {view==="garments"?<ExploreFilters scope={scope} brands={brands} initial={{category,type:garmentType,brand:brandId,item:itemName,color,attributes:selectedAttributes}} fixtures={fixtureMode}/>:null}
    {view==="garments"&&products.length?<><div className={styles.carousel} aria-label="Top eight Explore results">{products.slice(0,8).map((product)=>{const evidence=bestEvidence.get(product.id);return <ProductCard key={product.id} product={product} score={scores.get(product.id)??0} evidence={evidence} wearer={evidence?evidencePeople.get(evidence.user_id):undefined} reportCount={reportCounts.get(product.id)??0} liked={liked.has(product.id)} wished={wished.has(product.id)} watching={watched.has(product.id)} returnTo={base}/>;})}</div>{products.length>8?<div className={styles.grid}>{products.slice(8).map((product)=>{const evidence=bestEvidence.get(product.id);return <ProductCard key={product.id} product={product} score={scores.get(product.id)??0} evidence={evidence} wearer={evidence?evidencePeople.get(evidence.user_id):undefined} reportCount={reportCounts.get(product.id)??0} liked={liked.has(product.id)} wished={wished.has(product.id)} watching={watched.has(product.id)} returnTo={base}/>;})}</div>:null}</>:null}
    {view==="outfits"&&outfits.length?<div className={styles.grid}>{outfits.map((post)=>{const person=one<Profile>(post.profile);const name=person?.display_name?.trim()||person?.username||"LikeSized wearer";const score=matchByUser.get(post.user_id);const avatar=outfitProfilePhotos.get(post.user_id);return <article className={styles.card} key={post.id}>{post.fixture?<span className={styles.testBadge}>TEST OUTFIT</span>:null}{signed.get(post.id)?<img className={styles.outfit} src={signed.get(post.id)} alt={`Outfit by ${name}`}/>:<div className={styles.outfitFallback}>{post.fixture?"Temporary outfit preview":"Outfit photo unavailable"}</div>}<div className={styles.body}><span className="muted">{score?`${score}% Overall Match`:post.fixture?"Test fit context":"LikeSized community"}</span><div className={styles.outfitCreator}>{avatar?<img className={styles.outfitCreatorAvatar} src={avatar} alt=""/>:<span className={styles.outfitCreatorFallback}>{name.slice(0,1).toUpperCase()}</span>}<strong>{name}</strong></div>{post.caption?<p>{post.caption}</p>:null}{post.fixture?<ProductMiniBrowser href={`/explore/preview?kind=outfit&id=${post.id}`} label={post.caption||"Test outfit"}><span className="textLink">Open test outfit →</span></ProductMiniBrowser>:<>{person?.username?<Link className="textLink" href={`/people/${person.username}`}>View wearer →</Link>:null}{post.user_id!==viewerId?<ReportContentForm targetType="outfit_post" targetId={post.id} returnTo={base}/>:null}</>}</div></article>;})}</div>:null}
    {((view==="garments"&&!products.length)||(view==="outfits"&&!outfits.length))?<div className={styles.filterEmpty}><h2>No {view} found.</h2><p>{scope==="matches"?"Try All or remove a filter. Explore will grow as more people share Fit Reports and Outfits.":"Try removing a filter or clearing your choices."}</p><Link className="secondaryButton" href={scopeHref("all")}>{scope==="matches"?`See all ${view} →`:"Clear filters →"}</Link></div>:null}
    {resultLimit<96&&((view==="garments"&&products.length)||(view==="outfits"&&outfits.length))?<div className={styles.more}><Link className="secondaryButton" href={`${base.replace(/&limit=\d+/,"")}&limit=${nextLimit}`}>Keep Browsing · +24</Link></div>:null}
  </main>;
}
