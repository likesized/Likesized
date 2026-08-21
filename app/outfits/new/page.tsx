import Link from "next/link";
import { redirect } from "next/navigation";
import { createOutfit } from "@/app/outfits/actions";
import { createClient } from "@/lib/supabase/server";
import OutfitPhotoInput from "./OutfitPhotoInput";
import styles from "../outfits.module.css";

type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type ClosetRow={id:string;size_label:string;visibility:"private"|"shared";product:unknown};
type ProductRecord={name:string;brand:unknown}; type BrandRecord={name:string}; type FitReport={closet_item_id:string;fit:string;created_at:string};
const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}

export default async function NewOutfitPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient(); const {data:claimsData,error:claimsError}=await supabase.auth.getClaims(); const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect("/login?next=/outfits/new");
  const params=await searchParams; const error=first(params.error);
  const errorMessage=error==="invalid_fields"?"Choose 1–6 Closet garments and keep the caption under 500 characters.":error==="invalid_photo"?"Choose a JPEG, PNG, or WebP photo no larger than 8 MB and wait for optimization to finish.":error==="invalid_items"?"One of those garments is no longer available in your Closet.":error==="save_failed"?"That outfit could not be posted. Try again.":null;
  const {data:closetData,error:closetError}=await supabase.from("closet_items").select("id,size_label,visibility,product:products(name,brand:brands(name))").eq("user_id",userId).order("created_at",{ascending:false});
  if(closetError)throw new Error("Could not load your Closet.");
  const closet=(closetData??[]) as ClosetRow[]; const ids=closet.map((item)=>item.id); let reports:FitReport[]=[];
  if(ids.length){const {data,error:reportError}=await supabase.from("fit_reports").select("closet_item_id,fit,created_at").in("closet_item_id",ids).order("created_at",{ascending:false});if(reportError)throw new Error("Could not load Closet fit evidence.");reports=(data??[]) as FitReport[];}
  const reportByItem=new Map<string,FitReport>();
  for(const report of reports){if(!reportByItem.has(report.closet_item_id))reportByItem.set(report.closet_item_id,report);}
  return <main className="pageShell"><div className="pageTitle rowTitle"><div><span className="eyebrow">POST AN OUTFIT</span><h1>Show the fit, not your measurements.</h1><p>Add one photo and tag 1–6 garments. Tagged garments become Shared Closet fit-reference evidence for signed-in members; your raw body measurements remain private.</p></div><Link className="secondaryButton" href="/outfits">Back to outfits</Link></div>
    {closet.length===0?<div className="emptyState"><span className="eyebrow">NO GARMENTS TO TAG</span><h2>Log something in your Closet first.</h2><Link className="primaryButton" href="/closet/add">Add a garment →</Link></div>:<form className={styles.form} action={createOutfit}>{errorMessage?<div className="authMessage error">{errorMessage}</div>:null}<OutfitPhotoInput/><label>Caption <span className="muted inlineMuted">optional</span><textarea name="caption" rows={4} maxLength={500} placeholder="What are you wearing? How does it feel?"/></label><fieldset className={styles.fieldset}><legend>Tag 1–6 garments from your Closet</legend><p className="fieldHelp">Selecting a private item here changes it to Shared because the outfit intentionally publishes its fit-reference evidence.</p><div className={styles.choices}>{closet.map((item)=>{const product=one<ProductRecord>(item.product);const brand=one<BrandRecord>(product?.brand);const report=reportByItem.get(item.id);return <label className={styles.choice} key={item.id}><input type="checkbox" name="closet_item_id" value={item.id}/><span><strong>{brand?.name||"Brand"} · {product?.name||"Garment"}</strong><small>Size {item.size_label}{report?` · Latest fit: ${FIT_LABELS[report.fit]||report.fit}`:""} · {item.visibility==="shared"?"Shared":"Private → will share"}</small></span></label>;})}</div></fieldset><button className="primaryButton fullButton" type="submit">Post outfit →</button></form>}
  </main>;
}
