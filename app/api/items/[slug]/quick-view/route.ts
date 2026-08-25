import { createClient } from "@/lib/supabase/server";

type Brand={name:string};
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}

export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(!slug||slug.length>180)return Response.json({error:"Invalid garment."},{status:400});
  const supabase=await createClient();
  const {data:product,error}=await supabase.from("products").select("id,name,slug,category,garment_type_key,image_url,brand:brands(name)").eq("slug",slug).maybeSingle();
  if(error||!product)return Response.json({error:"Garment not found."},{status:404});
  const brand=one<Brand>(product.brand);
  return Response.json({
    title:product.name,
    subtitle:`${brand?.name||"Brand"} · ${(product.garment_type_key||product.category||"Garment").replaceAll("_"," ")}`,
    imageUrl:product.image_url||null,
    description:null,
    details:[{label:"Brand",value:brand?.name||"Brand"},{label:"Category",value:(product.category||"other").replaceAll("_"," ")}],
  });
}
