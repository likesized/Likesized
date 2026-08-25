import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LINK_PATTERN=/(https?:\/\/|www\.)/i;
type SortMode="top"|"newest";
type CommentRow={comment_id:string;body:string;created_at:string;username:string;display_name:string|null;avatar_url:string|null;like_count:number|string;liked_by_viewer:boolean;can_delete:boolean};

function commentPayload(supabase:Awaited<ReturnType<typeof createClient>>,row:CommentRow){
  return {
    id:row.comment_id,
    body:row.body,
    createdAt:row.created_at,
    username:row.username,
    displayName:row.display_name,
    avatarUrl:currentProfilePhotoUrl(supabase,row.avatar_url),
    likeCount:Number(row.like_count)||0,
    likedByViewer:Boolean(row.liked_by_viewer),
    canDelete:Boolean(row.can_delete),
  };
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const url=new URL(request.url);
  const sort=(url.searchParams.get("sort")??"top") as SortMode;
  if(sort!=="top"&&sort!=="newest")return Response.json({error:"Invalid comment sort."},{status:400});
  const requestedLimit=Number(url.searchParams.get("limit")??20);
  const limit=Math.max(1,Math.min(50,Number.isFinite(requestedLimit)?Math.floor(requestedLimit):20));
  const beforeCreatedAt=url.searchParams.get("before_created_at");
  const beforeId=url.searchParams.get("before_id");
  const beforeLikeRaw=url.searchParams.get("before_like_count");
  const beforeLikeCount=beforeLikeRaw===null?null:Number(beforeLikeRaw);
  if((beforeCreatedAt&&!beforeId)||(!beforeCreatedAt&&beforeId)||Boolean(beforeId&&!UUID.test(beforeId)))return Response.json({error:"Invalid comment cursor."},{status:400});
  if(beforeCreatedAt&&Number.isNaN(Date.parse(beforeCreatedAt)))return Response.json({error:"Invalid comment cursor."},{status:400});
  if(sort==="top"&&beforeCreatedAt&&(beforeLikeCount===null||!Number.isInteger(beforeLikeCount)||beforeLikeCount<0))return Response.json({error:"Invalid comment cursor."},{status:400});

  const supabase=await createClient();
  const {data,error}=await supabase.rpc("get_outfit_comments_sorted_page",{
    p_post_id:postId,
    p_sort:sort,
    p_before_like_count:sort==="top"?beforeLikeCount:null,
    p_before_created_at:beforeCreatedAt||null,
    p_before_id:beforeId||null,
    p_result_limit:limit,
  });
  if(error)return Response.json({error:"Could not load comments."},{status:500});
  const rows=(data??[]) as CommentRow[];
  const comments=rows.map((row)=>commentPayload(supabase,row));
  const last=rows.at(-1);
  return Response.json({comments,nextCursor:rows.length===limit&&last?{createdAt:last.created_at,id:last.comment_id,likeCount:Number(last.like_count)||0}:null});
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const payload=await request.json().catch(()=>null) as {body?:unknown}|null;
  const body=typeof payload?.body==="string"?payload.body.trim():"";
  if(!body||body.length>500||LINK_PATTERN.test(body))return Response.json({error:"Comment must be plain text, 500 characters or less, with no external links."},{status:400});
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const userId=claims?.claims?.sub;
  if(!userId)return Response.json({error:"Sign in to comment."},{status:401});
  const {data:created,error}=await supabase.from("outfit_comments").insert({post_id:postId,user_id:userId,body}).select("id,body,created_at,like_count").single();
  if(error||!created)return Response.json({error:"Could not add comment."},{status:400});
  const {data:profile}=await supabase.from("profiles").select("username,display_name,avatar_url").eq("id",userId).maybeSingle();
  if(!profile?.username)return Response.json({error:"Could not load comment identity."},{status:500});
  return Response.json({comment:{
    id:created.id,
    body:created.body,
    createdAt:created.created_at,
    username:profile.username,
    displayName:profile.display_name,
    avatarUrl:currentProfilePhotoUrl(supabase,profile.avatar_url),
    likeCount:Number(created.like_count)||0,
    likedByViewer:false,
    canDelete:true,
  }},{status:201});
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const payload=await request.json().catch(()=>null) as {commentId?:unknown;liked?:unknown}|null;
  const commentId=typeof payload?.commentId==="string"?payload.commentId:"";
  const liked=payload?.liked;
  if(!UUID.test(commentId)||typeof liked!=="boolean")return Response.json({error:"Invalid comment action."},{status:400});
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const userId=claims?.claims?.sub;
  if(!userId)return Response.json({error:"Sign in to Like comments."},{status:401});
  const {data:comment,error:commentError}=await supabase.from("outfit_comments").select("id,post_id").eq("id",commentId).eq("post_id",postId).maybeSingle();
  if(commentError||!comment)return Response.json({error:"Comment not found."},{status:404});
  const operation=liked
    ? supabase.from("outfit_comment_likes").upsert({comment_id:commentId,user_id:userId},{onConflict:"comment_id,user_id"})
    : supabase.from("outfit_comment_likes").delete().eq("comment_id",commentId).eq("user_id",userId);
  const {error}=await operation;
  if(error)return Response.json({error:"Could not update comment Like."},{status:400});
  const {data:updated}=await supabase.from("outfit_comments").select("like_count").eq("id",commentId).maybeSingle();
  return Response.json({liked,likeCount:Number(updated?.like_count)||0});
}
