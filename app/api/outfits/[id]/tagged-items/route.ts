import { GARMENT_TYPES } from "@/lib/garment-taxonomy";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPE_LABELS=new Map(GARMENT_TYPES.map((item)=>[item.key,item.label]));
type PublicTaggedItem={closet_item_id:string;product_id:string;product_slug:string;brand_name:string;product_name:string;image_url:string|null;garment_type_key:string|null};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const supabase=await createClient();
  const [{data,error},{data:claims}]=await Promise.all([
    supabase.rpc("get_public_outfit_tagged_items",{p_post_id:postId}),
    supabase.auth.getClaims(),
  ]);
  if(error)return Response.json({error:"Could not load tagged garments."},{status:500});

  const publicItems=(data??[]) as PublicTaggedItem[];
  const viewerId=claims?.claims?.sub??null;
  const productIds=[...new Set(publicItems.map((item)=>item.product_id))];
  const liked=new Set<string>();
  const wished=new Set<string>();
  const shoppable=new Set<string>();

  if(viewerId&&productIds.length){
    const [listingResult,likeResult,wishResult]=await Promise.all([
      supabase.from("retailer_listings").select("product_id").in("product_id",productIds),
      supabase.from("product_likes").select("product_id").eq("user_id",viewerId).in("product_id",productIds),
      supabase.from("wish_locker_items").select("product_id").eq("user_id",viewerId).in("product_id",productIds),
    ]);
    if(listingResult.error||likeResult.error||wishResult.error)return Response.json({error:"Could not load tagged garment actions."},{status:500});
    for(const row of listingResult.data??[])shoppable.add(row.product_id);
    for(const row of likeResult.data??[])liked.add(row.product_id);
    for(const row of wishResult.data??[])wished.add(row.product_id);
  }

  const items=publicItems.map((item)=>({
    closetItemId:item.closet_item_id,
    productId:item.product_id,
    label:`${item.brand_name} · ${item.product_name}`,
    detail:item.garment_type_key?(TYPE_LABELS.get(item.garment_type_key)??item.garment_type_key.replaceAll("_"," ")):"Garment",
    href:`/item/${item.product_slug}`,
    imageUrl:item.image_url,
    liked:liked.has(item.product_id),
    wished:wished.has(item.product_id),
    canShop:Boolean(viewerId)&&shoppable.has(item.product_id),
  }));
  return Response.json({items});
}
