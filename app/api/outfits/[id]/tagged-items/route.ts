import { GARMENT_TYPES } from "@/lib/garment-taxonomy";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPE_LABELS=new Map(GARMENT_TYPES.map((item)=>[item.key,item.label]));
type PublicTaggedItem={closet_item_id:string;product_slug:string;brand_name:string;product_name:string;image_url:string|null;garment_type_key:string|null};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const supabase=await createClient();
  const {data,error}=await supabase.rpc("get_public_outfit_tagged_items",{p_post_id:postId});
  if(error)return Response.json({error:"Could not load tagged garments."},{status:500});
  const items=((data??[]) as PublicTaggedItem[]).map((item)=>({
    closetItemId:item.closet_item_id,
    label:`${item.brand_name} · ${item.product_name}`,
    detail:item.garment_type_key?(TYPE_LABELS.get(item.garment_type_key)??item.garment_type_key.replaceAll("_"," ")):"Garment",
    href:`/item/${item.product_slug}`,
    imageUrl:item.image_url,
  }));
  return Response.json({items});
}
