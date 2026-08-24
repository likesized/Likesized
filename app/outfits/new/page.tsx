import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OutfitComposer, { type ClosetOption, type InitialOutfit } from "./OutfitComposer";

type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type ClosetRow={id:string;size_label:string;product:unknown}; type ProductRecord={name:string;brand:unknown}; type BrandRecord={name:string}; type FitReport={closet_item_id:string;fit:string;created_at:string};
type OutfitRow={id:string;status:"draft"|"published";headline:string|null;story:string|null;comments_enabled:boolean}; type OutfitPhotoRow={id:string;bucket:"outfit-photos"|"outfit-draft-photos";display_path:string;sort_order:number;is_main:boolean}; type OutfitPhotoTag={photo_id:string;closet_item_id:string;x:number;y:number};
const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"}; const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;} function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}

export default async function NewOutfitPage({searchParams}:{searchParams:SearchParams}){
  const params=await searchParams,supabase=await createClient(); const {data:claimsData,error:claimsError}=await supabase.auth.getClaims(); const userId=claimsData?.claims?.sub; if(claimsError||!userId)redirect("/login?next=/outfits/new");
  const [profileResult,closetResult,styleSuggestionResult]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",userId).maybeSingle(),
    supabase.from("closet_items").select("id,size_label,product:products(name,brand:brands(name))").eq("user_id",userId).order("created_at",{ascending:false}),
    supabase.rpc("get_outfit_style_tag_suggestions",{p_query:null,p_result_limit:50}),
  ]);
  if(profileResult.error||!profileResult.data?.username)redirect("/onboarding"); if(closetResult.error)throw new Error("Could not load your Closet."); if(styleSuggestionResult.error)throw new Error("Could not load Style Tag suggestions.");
  const styleSuggestions=[...new Set((styleSuggestionResult.data??[]).map((row)=>String(row.display_tag??"").trim()).filter(Boolean))];
  const closetRows=(closetResult.data??[]) as ClosetRow[],closetIds=closetRows.map((item)=>item.id); let reports:FitReport[]=[];
  if(closetIds.length){const {data,error}=await supabase.from("fit_reports").select("closet_item_id,fit,created_at").in("closet_item_id",closetIds).order("created_at",{ascending:false});if(error)throw new Error("Could not load Closet fit evidence.");reports=(data??[]) as FitReport[];}
  const reportByItem=new Map<string,FitReport>();for(const report of reports)if(!reportByItem.has(report.closet_item_id))reportByItem.set(report.closet_item_id,report);
  const closet:ClosetOption[]=closetRows.map((item)=>{const product=one<ProductRecord>(item.product),brand=one<BrandRecord>(product?.brand),report=reportByItem.get(item.id);return{id:item.id,label:`${brand?.name||"Brand"} · ${product?.name||"Garment"}`,detail:`Size ${item.size_label}${report?` · ${FIT_LABELS[report.fit]||report.fit}`:""}`};});

  const requestedId=first(params.draft)||first(params.edit)||""; let initial:InitialOutfit|null=null;
  if(requestedId){if(!UUID.test(requestedId))redirect("/outfits/new");const {data:outfit,error:outfitError}=await supabase.from("outfit_posts").select("id,status,headline,story,comments_enabled").eq("id",requestedId).eq("user_id",userId).maybeSingle();if(outfitError||!outfit)redirect("/outfits/new");const row=outfit as OutfitRow;
    const [itemsResult,occasionsResult,stylesResult,photosResult]=await Promise.all([supabase.from("outfit_post_items").select("closet_item_id").eq("post_id",requestedId),supabase.from("outfit_occasions").select("occasion,sort_order").eq("post_id",requestedId).order("sort_order"),supabase.from("outfit_style_tags").select("display_tag,sort_order").eq("post_id",requestedId).order("sort_order"),supabase.from("outfit_photos").select("id,bucket,display_path,sort_order,is_main").eq("post_id",requestedId).order("sort_order")]);
    if(itemsResult.error||occasionsResult.error||stylesResult.error||photosResult.error)throw new Error("Could not load this Outfit."); const photoRows=(photosResult.data??[]) as OutfitPhotoRow[],photoIds=photoRows.map((photo)=>photo.id); let photoTags:OutfitPhotoTag[]=[];
    if(photoIds.length){const {data,error}=await supabase.from("outfit_photo_tags").select("photo_id,closet_item_id,x,y").in("photo_id",photoIds);if(error)throw new Error("Could not load Outfit photo tags.");photoTags=(data??[]) as OutfitPhotoTag[];}
    const urlByPhoto=new Map<string,string>();await Promise.all(photoRows.map(async(photo)=>{if(photo.bucket==="outfit-photos")urlByPhoto.set(photo.id,supabase.storage.from("outfit-photos").getPublicUrl(photo.display_path).data.publicUrl);else{const {data}=await supabase.storage.from("outfit-draft-photos").createSignedUrl(photo.display_path,60*60);if(data?.signedUrl)urlByPhoto.set(photo.id,data.signedUrl);}}));
    initial={id:row.id,status:row.status,headline:row.headline??"",story:row.story??"",commentsEnabled:row.comments_enabled,closetItemIds:(itemsResult.data??[]).map((item)=>item.closet_item_id),occasions:(occasionsResult.data??[]).map((item)=>item.occasion),styleTags:(stylesResult.data??[]).map((item)=>item.display_tag),photos:photoRows.flatMap((photo)=>{const url=urlByPhoto.get(photo.id);return url?[{id:photo.id,url,isMain:photo.is_main,sortOrder:photo.sort_order,tags:photoTags.filter((tag)=>tag.photo_id===photo.id).map((tag)=>({closetItemId:tag.closet_item_id,x:Number(tag.x),y:Number(tag.y)}))}]:[];})};
  }
  const saved=first(params.saved)==="1";
  return <main className="pageShell"><div className="pageTitle rowTitle"><div><span className="eyebrow">{initial?.status==="published"?"EDIT OUTFIT":"NEW OUTFIT"}</span><h1>{initial?.status==="published"?"Keep the post current.":"Build the whole look."}</h1><p>Lead with the Outfit, then connect the garments back to real Fit Reports. Your body measurements stay private.</p></div><Link className="secondaryButton" href={initial?.status==="published"&&initial.id?`/outfits/${initial.id}`:"/outfits"}>Back to outfits</Link></div>{saved?<div className="authMessage">Draft saved.</div>:null}<OutfitComposer closet={closet} initial={initial} styleSuggestions={styleSuggestions}/></main>;
}
