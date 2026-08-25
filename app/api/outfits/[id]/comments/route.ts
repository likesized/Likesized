import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type CommentRow={comment_id:string;body:string;created_at:string;username:string;display_name:string|null;avatar_url:string|null;like_count:number|string;liked_by_viewer:boolean;can_delete:boolean};

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const url=new URL(request.url);
  const requestedLimit=Number(url.searchParams.get("limit")??20);
  const limit=Math.max(1,Math.min(50,Number.isFinite(requestedLimit)?Math.floor(requestedLimit):20));
  const beforeCreatedAt=url.searchParams.get("before_created_at");
  const beforeId=url.searchParams.get("before_id");
  if((beforeCreatedAt&&!beforeId)||(!beforeCreatedAt&&beforeId)||Boolean(beforeId&&!UUID.test(beforeId)))return Response.json({error:"Invalid comment cursor."},{status:400});
  if(beforeCreatedAt&&Number.isNaN(Date.parse(beforeCreatedAt)))return Response.json({error:"Invalid comment cursor."},{status:400});

  const supabase=await createClient();
  const {data,error}=await supabase.rpc("get_outfit_comments_page",{
    p_post_id:postId,
    p_before_created_at:beforeCreatedAt||null,
    p_before_id:beforeId||null,
    p_result_limit:limit,
  });
  if(error)return Response.json({error:"Could not load comments."},{status:500});
  const rows=(data??[]) as CommentRow[];
  const comments=rows.map((row)=>({
    id:row.comment_id,
    body:row.body,
    createdAt:row.created_at,
    username:row.username,
    displayName:row.display_name,
    avatarUrl:currentProfilePhotoUrl(supabase,row.avatar_url),
    likeCount:Number(row.like_count)||0,
    likedByViewer:Boolean(row.liked_by_viewer),
    canDelete:Boolean(row.can_delete),
  }));
  const last=rows.at(-1);
  return Response.json({comments,nextCursor:rows.length===limit&&last?{createdAt:last.created_at,id:last.comment_id}:null});
}
