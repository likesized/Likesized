import Link from "next/link";
import { redirect } from "next/navigation";
import { addGarment } from "@/app/closet/actions";
import { CatalogGarmentFields } from "@/app/closet/add/CatalogGarmentFields";
import { GarmentSizeFields } from "@/app/closet/add/GarmentSizeFields";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}

export default async function AddGarmentPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login?next=/closet/add");
  const [{ data: garmentTypes }, { data: brands }, { data: products }, { data: families }, { data: mappings }, { data: definitions }, { data: responses }, {data:attributeDefinitions},{data:attributeOptions},{data:materials}] = await Promise.all([
    supabase.from("garment_types").select("key, label, category").eq("active", true).order("sort_order"),
    supabase.from("brands").select("id, name").order("name").limit(300),
    supabase.from("products").select("id,name,brand_id,garment_type_key,market_segment,manufacturer_style_number,brand:brands(name)").order("name").limit(300),
    supabase.from("product_families").select("id,name,brand_id,garment_type_key,market_segment,brand:brands(name)").order("name").limit(300),
    supabase.from("garment_type_fit_dimensions").select("garment_type_key,dimension_key,sort_order").order("sort_order"),
    supabase.from("fit_dimension_definitions").select("key,label"),
    supabase.from("fit_dimension_responses").select("dimension_key,response_key,label,sort_order").order("sort_order"),
    supabase.from("garment_attribute_definitions").select("key,label,category,sort_order").order("sort_order"),
    supabase.from("garment_attribute_options").select("attribute_key,option_key,label,sort_order").order("sort_order"),
    supabase.from("materials").select("key,label").order("label"),
  ]);
  const labelByKey=new Map((definitions??[]).map((item)=>[item.key,item.label]));
  const dimensions=(mappings??[]).map((item)=>({...item,label:labelByKey.get(item.dimension_key)??item.dimension_key}));
  const catalogProducts=(products??[]).map((product)=>({
    id:product.id,
    name:product.name,
    brand_id:product.brand_id,
    brand_name:one<{name:string}>(product.brand)?.name??"",
    garment_type_key:product.garment_type_key,
    market_segment:product.market_segment,
    manufacturer_style_number:product.manufacturer_style_number,
  }));
  const catalogFamilies=(families??[]).map((family)=>({
    id:family.id,
    name:family.name,
    brand_id:family.brand_id,
    brand_name:one<{name:string}>(family.brand)?.name??"",
    garment_type_key:family.garment_type_key,
    market_segment:family.market_segment,
  }));
  const params = await searchParams;
  const error = first(params.error);
  const errorMessage = error === "invalid_fields" ? "Check the controlled garment details and try again." : error === "invalid_photo" ? "Fit photo must be JPEG, PNG, or WebP and no larger than 8 MB." : error === "save_failed" ? "That garment could not be saved." : null;

  return <main className="pageShell addGarmentShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET · ADD GARMENT</span><h1>Log what you actually wear.</h1><p>LikeSized resolves known garments first and keeps unknown product details provisional until the catalog evidence is corroborated.</p></div><Link className="secondaryButton" href="/closet">Back to Closet</Link></div>
    <form className="garmentForm" action={addGarment}>
      {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}
      <CatalogGarmentFields brands={brands??[]} products={catalogProducts} families={catalogFamilies} garmentTypes={garmentTypes??[]} dimensions={dimensions} responses={responses??[]} attributeDefinitions={attributeDefinitions??[]} attributeOptions={attributeOptions??[]} materials={materials??[]}/>
      <GarmentSizeFields />
      <label>Color / variant<input name="color_label" maxLength={80} placeholder="Optional" /></label>
      <div className="fieldPair"><label>Closet visibility<select name="visibility" defaultValue="private"><option value="private">Private</option><option value="shared">Shared with LikeSized members</option></select></label><label>Overall fit<select name="fit" defaultValue="" required><option value="" disabled>Select physical fit</option><option value="too_small">Too small</option><option value="snug">Snug</option><option value="just_right">Just right</option><option value="relaxed">Relaxed</option><option value="too_big">Too big</option></select><span className="fieldHelp">Physical Fit Result drives size evidence. It is separate from whether you personally liked the garment.</span></label></div>
      <div className="fieldPair"><label>Fit rating<select name="fit_rating" defaultValue="" required><option value="" disabled>Rate it 1–5</option><option value="5">★★★★★ · Excellent</option><option value="4">★★★★☆ · Good</option><option value="3">★★★☆☆ · Okay</option><option value="2">★★☆☆☆ · Poor</option><option value="1">★☆☆☆☆ · Very poor</option></select><span className="fieldHelp">Your 1–5 satisfaction rating never changes your body Match %.</span></label><label>Would you buy it again?<select name="would_buy_again" defaultValue="unsure"><option value="yes">Yes</option><option value="no">No</option><option value="unsure">Not sure</option></select></label></div>
      <label>Times worn<input name="wears_count" type="number" min="0" max="100000" step="1" defaultValue="0" /></label>
      <label>Add a Fit Photo — Optional<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><span className="fieldHelp"><b>Fit photos are shared with LikeSized members as real-world fit references. Don’t upload a photo you don’t want other members to see.</b></span></label>
      <label>Fit notes <span className="muted inlineMuted">optional</span><textarea name="fit_notes" maxLength={1000} rows={5} placeholder="Roomy in the thighs, right at the waist..." /></label>
      <button className="primaryButton fullButton" type="submit">Add to my Closet →</button>
    </form>
  </main>;
}
