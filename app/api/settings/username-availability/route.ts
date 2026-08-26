import { createClient } from "@/lib/supabase/server";

export async function GET(request:Request){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  if(claimsError||!claimsData?.claims?.sub)return Response.json({error:"Authentication required."},{status:401});
  const username=new URL(request.url).searchParams.get("username")?.trim()??"";
  const formatValid=/^[A-Za-z0-9_]{3,32}$/.test(username);
  if(!formatValid)return Response.json({formatValid:false,available:false,canChange:false});
  const {data,error}=await supabase.rpc("get_username_change_status",{p_username:username});
  if(error)return Response.json({error:"Could not check username."},{status:500});
  const row=Array.isArray(data)?data[0]:data;
  return Response.json({formatValid:Boolean(row?.format_valid),available:Boolean(row?.available),canChange:Boolean(row?.can_change),nextChangeAt:row?.next_change_at??null});
}
