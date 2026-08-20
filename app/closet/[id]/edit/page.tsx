import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteGarment, logFitObservation, removeFitPhoto, updateClosetSettings } from "@/app/closet/edit-actions";
import { FitDimensionFields } from "@/app/closet/FitDimensionFields";
import { createClient } from "@/lib/supabase/server";

type Params=Promise<{id:string}>;
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type Product={name:string;slug:string;garment_type_key:string|null;market_segment:string;brand:unknown};
type Brand={name:string};
type Report={id:string;fit:string;fit_rating:number|null;fit_notes:string|null;would_buy_again:boolean|null;created_at:string};
const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function dateLabel(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}
function stars(value:number|null){return value?`${"★".repeat(value)}${"☆".repeat(5-value)} · ${value}/5`:"—";}

export default async function EditClosetItemPage({params,searchParams}:{params:Params;searchParams:SearchParams}){
  const {id}=await params;
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect(`/login?next=${encodeURIComponent(`/closet/${id}/edit`)}`);

  const [{data:item,error:itemError},{data:reports,error:reportError},{data:photo,error:photoError},{data:mappings},{data:definitions},{data:responses}]=await Promise.all([
    supabase.from("closet_items").select("id,size_label,wears_count,visibility,product:products(name,slug,garment_type_key,market_segment,brand:brands(name))").eq("id",id).eq("user_id",userId).maybeSingle(),
    supabase.from("fit_reports").select("id,fit,fit_rating,fit_notes,would_buy_again,created_at").eq("closet_item_id",id).eq("user_id",userId).order("created_at",{ascending:false}),
    supabase.from("fit_reference_photos").select("storage_path").eq("closet_item_id",id).eq("user_id",userId).maybeSingle(),
    supabase.from("garment_type_fit_dimensions").select("garment_type_key,dimension_key,sort_order").order("sort_order"),
    supabase.from("fit_dimension_definitions").select("key,label"),
    supabase.from("fit_dimension_responses").select("dimension_key,response_key,label,sort_order").order("sort_order"),
  ]);
  if(itemError||reportError||photoError)throw new Error("Could not load garment.");
  if(!item)notFound();
  const product=one<Product>(item.product);
  const brand=one<Brand>(product?.brand);
  const labelByKey=new Map((definitions??[]).map((entry)=>[entry.key,entry.label]));
  const dimensions=(mappings??[]).map((entry)=>({...entry,label:labelByKey.get(entry.dimension_key)??entry.dimension_key}));
  const history=(reports??[]) as Report[];
  let signedPhoto:string|null=null;
  if(photo?.storage_path){const {data}=await supabase.storage.from("fit-reference-photos").createSignedUrl(photo.storage_path,60*30);signedPhoto=data?.signedUrl??null;}
  const query=await searchParams;
  const error=first(query.error);
  const message=first(query.saved)==="1"?"Closet settings saved.":first(query.observed)==="1"?"New fit observation saved with your current body snapshot.":first(query.photo_removed)==="1"?"Fit photo removed.":null;
  const errorMessage=error==="photo_requires_shared"?"A fit/reference photo is always shared. Remove the fit photo before making this Closet item private.":error==="invalid_settings"?"Check the Closet settings.":error==="invalid_observation"?"Check the physical Fit Result and 1–5 Fit Rating.":error==="confirm_delete"?"Type DELETE exactly to remove this garment and its fit history.":error==="save_failed"?"That change could not be saved.":null;

  return <main className="pageShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET · EDIT</span><h1>{brand?.name?`${brand.name} · `:""}{product?.name||"Garment"}</h1><p>Size {item.size_label}{product?.garment_type_key?` · ${product.garment_type_key.replaceAll("_"," ")}`:""}. Product identity and historical try-on records stay locked; new body states create new observations instead of rewriting old ones.</p></div><Link className="secondaryButton" href="/closet">Back to Closet</Link></div>
    {message?<div className="authMessage">{message}</div>:null}{errorMessage?<div className="authMessage error">{errorMessage}</div>:null}

    <section className="section flush"><div className="sectionHeading"><div><span className="eyebrow">CURRENT CLOSET SETTINGS</span><h2>Sharing and wear count</h2></div></div>
      {signedPhoto?<div className="privacyNote"><img className="garmentPhoto" src={signedPhoto} alt="Fit reference"/><div><b>Shared fit/reference photo</b><br/>Because this photo exists, this item must remain Shared. Remove the photo first if you want to make the garment private.</div></div>:null}
      <form className="garmentForm" action={updateClosetSettings}><input type="hidden" name="closet_item_id" value={id}/><div className="fieldPair"><label>Closet visibility<select name="visibility" defaultValue={item.visibility}><option value="private">Private</option><option value="shared">Shared with LikeSized members</option></select></label><label>Times worn<input name="wears_count" type="number" min="0" max="100000" step="1" defaultValue={item.wears_count}/></label></div><button className="primaryButton" type="submit">Save Closet settings</button></form>
      {photo?<form action={removeFitPhoto}><input type="hidden" name="closet_item_id" value={id}/><button className="secondaryButton" type="submit">Remove fit photo</button></form>:null}
    </section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">FIT NOW</span><h2>Log a new fit observation</h2><p>This records how the same garment fits your current body. Physical Fit Result drives sizing evidence; Fit Rating records how satisfied you are. Neither rewrites an older observation.</p></div></div>
      <form className="garmentForm" action={logFitObservation}><input type="hidden" name="closet_item_id" value={id}/><div className="fieldPair"><label>Overall fit<select name="fit" defaultValue="" required><option value="" disabled>Select physical fit</option><option value="too_small">Too small</option><option value="snug">Snug</option><option value="just_right">Just right</option><option value="relaxed">Relaxed</option><option value="too_big">Too big</option></select></label><label>Fit rating<select name="fit_rating" defaultValue="" required><option value="" disabled>Rate it 1–5</option><option value="5">★★★★★ · Excellent</option><option value="4">★★★★☆ · Good</option><option value="3">★★★☆☆ · Okay</option><option value="2">★★☆☆☆ · Poor</option><option value="1">★☆☆☆☆ · Very poor</option></select><span className="fieldHelp">Satisfaction only; this does not change your Match %.</span></label></div><label>Would you buy it again?<select name="would_buy_again" defaultValue="unsure"><option value="yes">Yes</option><option value="no">No</option><option value="unsure">Not sure</option></select></label><FitDimensionFields garmentType={product?.garment_type_key} dimensions={dimensions} responses={responses??[]}/><label>Fit notes <span className="muted inlineMuted">optional</span><textarea name="fit_notes" maxLength={1000} rows={4} placeholder="How does it fit now?"/></label><button className="primaryButton" type="submit">Save new fit observation</button></form>
    </section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">LOCKED FIT HISTORY</span><h2>{history.length} observation{history.length===1?"":"s"}</h2></div></div>{history.length?<div className="evidenceList">{history.map((report)=><div className="evidence" key={report.id}><div><strong>{dateLabel(report.created_at)}</strong><span>Body snapshot locked at this try-on</span></div><div><span>Fit</span><strong>{FIT_LABELS[report.fit]||report.fit}</strong></div><div><span>Rating</span><strong>{stars(report.fit_rating)}</strong></div><div><span>Buy again</span><strong>{report.would_buy_again===true?"Yes":report.would_buy_again===false?"No":"—"}</strong></div>{report.fit_notes?<div><span>Notes</span><strong>{report.fit_notes}</strong></div>:null}</div>)}</div>:null}</section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">REMOVE GARMENT</span><h2>Delete this Closet item and its fit history</h2><p>This removes the Closet item, all of its Fit Reports, fit dimensions, fit-reference-photo metadata, and outfit garment links. Product catalog records remain.</p></div></div><form className="garmentForm" action={deleteGarment}><input type="hidden" name="closet_item_id" value={id}/><label>Type DELETE to confirm<input name="confirm_delete" autoComplete="off" required/></label><button className="secondaryButton" type="submit">Delete garment</button></form></section>
  </main>;
}
