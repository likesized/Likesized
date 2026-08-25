import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Profile={username:string;display_name:string|null};
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!UUID.test(id))return Response.json({error:"Invalid Outfit."},{status:400});
  const supabase=await createClient();
  const {data:post,error}=await supabase.from("outfit_posts").select("id,headline,caption,photo_url,status,created_at,profile:profiles(username,display_name)").eq("id",id).maybeSingle();
  if(error||!post||post.status!=="published")return Response.json({error:"Outfit not found."},{status:404});
  const person=one<Profile>(post.profile);
  const name=person?.display_name?.trim()||person?.username||"LikeSized member";
  let imageUrl:string|null=null;
  if(post.photo_url){
    const feedPath=outfitFeedPhotoPath(post.photo_url);
    let {data}=await supabase.storage.from("outfit-photos").createSignedUrl(feedPath,60*30);
    if(!data?.signedUrl&&feedPath!==post.photo_url)({data}=await supabase.storage.from("outfit-photos").createSignedUrl(post.photo_url,60*30));
    imageUrl=data?.signedUrl??null;
  }
  return Response.json({
    title:post.headline?.trim()||"Outfit",
    subtitle:`By ${name}`,
    imageUrl,
    description:post.caption?.trim()||null,
    details:[],
  });
}
