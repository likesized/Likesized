import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!UUID.test(id))return new NextResponse(null,{status:204});
  const supabase=await createClient();
  await supabase.rpc("record_outfit_view",{p_post_id:id});
  return new NextResponse(null,{status:204});
}
