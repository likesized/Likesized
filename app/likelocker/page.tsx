import Link from "next/link";
import { redirect } from "next/navigation";
import { removeFromWishLocker, unlikeProduct } from "@/app/likelocker/actions";
import { unlikeOutfit } from "@/app/outfits/actions";
import { EntityQuickView } from "@/components/EntityQuickView";
import { PersonQuickView } from "@/components/PersonQuickView";
import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { createClient } from "@/lib/supabase/server";
import styles from "./likelocker.module.css";

type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type ProductSave={product_id:string;created_at:string;product:unknown};
type Product={id:string;name:string;slug:string;category:string;image_url:string|null;brand:unknown};
type Brand={name:string};
type OutfitLike={post_id:string;created_at:string;post:unknown};
type Outfit={id:string;caption:string|null;photo_url:string;created_at:string;profile:unknown};
type Profile={username:string;display_name:string|null};
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
function one<T>(v:unknown):T|null{return Array.isArray(v)?((v[0] as T|undefined)??null):((v as T|null)??null);}

export default async function LikeLockerPage({searchParams}:{searchParams:SearchParams}){
  const params=await searchParams;
  const tab=first(params.tab)==="outfits"?"outfits":first(params.tab)==="wish"?"wish":"garments";
  const supabase=await createClient();
  const {data:claims,error}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub;
  if(error||!viewerId)redirect("/login?next=/likelocker");
  const [{data:profile},{data:fitProfile}]=await Promise.all([supabase.from("profiles").select("username").eq("id",viewerId).maybeSingle(),supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle()]);
  if(!profile?.username||!fitProfile?.completed_at)redirect("/onboarding");

  let garments:ProductSave[]=[];let wishes:ProductSave[]=[];let outfitLikes:OutfitLike[]=[];
  if(tab==="garments"){const {data,error:loadError}=await supabase.from("product_likes").select("product_id,created_at,product:products(id,name,slug,category,image_url,brand:brands(name))").eq("user_id",viewerId).order("created_at",{ascending:false});if(loadError)throw new Error("Could not load liked garments.");garments=(data??[]) as ProductSave[];}
  if(tab==="wish"){const {data,error:loadError}=await supabase.from("wish_locker_items").select("product_id,created_at,product:products(id,name,slug,category,image_url,brand:brands(name))").eq("user_id",viewerId).order("created_at",{ascending:false});if(loadError)throw new Error("Could not load Wish Locker.");wishes=(data??[]) as ProductSave[];}
  if(tab==="outfits"){const {data,error:loadError}=await supabase.from("outfit_likes").select("post_id,created_at,post:outfit_posts(id,caption,photo_url,created_at,profile:profiles(username,display_name))").eq("user_id",viewerId).order("created_at",{ascending:false});if(loadError)throw new Error("Could not load liked outfits.");outfitLikes=(data??[]) as OutfitLike[];}

  const signed=new Map<string,string>();
  await Promise.all(outfitLikes.map(async(like)=>{const post=one<Outfit>(like.post);if(!post)return;const feedPath=outfitFeedPhotoPath(post.photo_url);let {data}=await supabase.storage.from("outfit-photos").createSignedUrl(feedPath,1800);if(!data?.signedUrl&&feedPath!==post.photo_url)({data}=await supabase.storage.from("outfit-photos").createSignedUrl(post.photo_url,1800));if(data?.signedUrl)signed.set(post.id,data.signedUrl);}));
  const productRows=tab==="wish"?wishes:garments;

  return <main className="pageShell">
    <div className="pageTitle"><span className="eyebrow">LIKELOCKER</span><h1>Keep the fashion you want to find again.</h1><p>Likes collect inspiration. Wish Locker is only for garments you specifically want to buy.</p></div>
    <nav className={styles.tabs} aria-label="LikeLocker filters"><Link className={tab==="garments"?styles.active:styles.tab} href="/likelocker">Garments</Link><Link className={tab==="outfits"?styles.active:styles.tab} href="/likelocker?tab=outfits">Outfits</Link><Link className={tab==="wish"?styles.active:styles.tab} href="/likelocker?tab=wish">Wish Locker</Link></nav>

    {tab!=="outfits"&&productRows.length?<div className={styles.grid}>{productRows.map((row)=>{const product=one<Product>(row.product);if(!product)return null;const brand=one<Brand>(product.brand);const subtitle=`${brand?.name||"Brand"} · ${product.category}`;return <article className={styles.card} key={row.product_id}><EntityQuickView kind="garment" title={product.name} subtitle={subtitle} imageUrl={product.image_url} details={[{label:"Brand",value:brand?.name||"Brand"},{label:"Category",value:product.category}]} href={`/item/${product.slug}`} fullLabel="View Garment">{product.image_url?<img src={product.image_url} alt={`${brand?.name??""} ${product.name}`.trim()}/>:<span className={styles.fallback}>{product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()||"LS"}</span>}</EntityQuickView><div className={styles.body}><span className="muted">{subtitle}</span><EntityQuickView kind="garment" title={product.name} subtitle={subtitle} imageUrl={product.image_url} href={`/item/${product.slug}`} fullLabel="View Garment" inline><span className={styles.title}>{product.name}</span></EntityQuickView><form action={tab==="wish"?removeFromWishLocker:unlikeProduct}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="return_to" value={tab==="wish"?"/likelocker?tab=wish":"/likelocker"}/><button type="submit">Remove</button></form></div></article>;})}</div>:null}

    {tab==="outfits"&&outfitLikes.length?<div className={styles.grid}>{outfitLikes.map((like)=>{const post=one<Outfit>(like.post);if(!post)return null;const person=one<Profile>(post.profile);const name=person?.display_name?.trim()||person?.username||"LikeSized member";const photo=signed.get(post.id);return <article className={styles.card} key={like.post_id}><EntityQuickView kind="outfit" title={post.caption?.trim()||"Outfit"} subtitle={`By ${name}`} imageUrl={photo} description={post.caption} href={`/outfits/${post.id}`} fullLabel="View Full Outfit">{photo?<img src={photo} alt={`Outfit by ${name}`}/>:<span className={styles.fallback}>OUTFIT</span>}</EntityQuickView><div className={styles.body}>{person?.username?<PersonQuickView username={person.username} displayName={person.display_name} inline><strong>{name}</strong></PersonQuickView>:<strong>{name}</strong>}{post.caption?<EntityQuickView kind="outfit" title={post.caption} subtitle={`By ${name}`} imageUrl={photo} href={`/outfits/${post.id}`} fullLabel="View Full Outfit" inline><p>{post.caption}</p></EntityQuickView>:null}<form action={unlikeOutfit}><input type="hidden" name="post_id" value={post.id}/><input type="hidden" name="return_to" value="/likelocker?tab=outfits"/><button type="submit">Remove</button></form></div></article>;})}</div>:null}

    {((tab!=="outfits"&&!productRows.length)||(tab==="outfits"&&!outfitLikes.length))?<div className="emptyState"><span className="eyebrow">YOUR {tab==="wish"?"WISH LOCKER":tab.toUpperCase()} WILL APPEAR HERE</span><h2>{tab==="wish"?"Save the garments you want to buy.":`No liked ${tab} yet.`}</h2><p>{tab==="wish"?"Wish Locker is separate from ordinary likes, so buying intent stays clear.":"Use Explore to find pieces and looks worth keeping."}</p><Link className="primaryButton" href={`/explore?view=${tab==="outfits"?"outfits":"garments"}&scope=matches`}>Explore {tab==="wish"?"garments":tab} →</Link></div>:null}
  </main>;
}
