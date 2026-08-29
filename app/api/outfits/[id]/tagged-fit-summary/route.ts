import { STRONG_FIT_REPORT_MATCH_THRESHOLD } from "@/lib/quick-fit-evidence";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type SummaryRow={closet_item_id:string;matching_fit_reports:number};

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;
  if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});

  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub??null;
  if(!viewerId)return Response.json({error:"Authentication required."},{status:401});

  const {data:profile,error:profileError}=await supabase
    .from("fit_profiles")
    .select("completed_at")
    .eq("user_id",viewerId)
    .maybeSingle();
  if(profileError)return Response.json({error:"Could not load Fit Profile."},{status:500});

  const profileReady=Boolean(profile?.completed_at);
  if(!profileReady)return Response.json({profileReady:false,items:[]});

  const {data,error}=await supabase.rpc("get_outfit_tagged_fit_counts",{
    p_post_id:postId,
    p_match_threshold:STRONG_FIT_REPORT_MATCH_THRESHOLD,
  });
  if(error){
    console.error("[tagged-fit-summary] batch counts",error);
    return Response.json({error:"Relevant Fit Reports could not load."},{status:500});
  }

  const items=((data??[]) as SummaryRow[]).map((row)=>({
    closetItemId:row.closet_item_id,
    matchingFitReports:Number(row.matching_fit_reports)||0,
  }));
  return Response.json({profileReady:true,items});
}
