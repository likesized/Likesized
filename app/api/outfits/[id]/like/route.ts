import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Invalid Outfit." }, { status: 400 });

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) return Response.json({ error: "Authentication required." }, { status: 401 });

  let payload: { liked?: unknown } = {};
  try { payload = await request.json() as { liked?: unknown }; } catch {}
  if (typeof payload.liked !== "boolean") return Response.json({ error: "Invalid Like state." }, { status: 400 });

  if (payload.liked) {
    const { error } = await supabase.from("outfit_likes").insert({ post_id: id, user_id: userId });
    if (error && error.code !== "23505") return Response.json({ error: "Could not like Outfit." }, { status: 500 });
  } else {
    const { error } = await supabase.from("outfit_likes").delete().eq("post_id", id).eq("user_id", userId);
    if (error) return Response.json({ error: "Could not remove Outfit like." }, { status: 500 });
  }

  const { count, error: countError } = await supabase.from("outfit_likes").select("post_id", { count: "exact", head: true }).eq("post_id", id);
  if (countError) return Response.json({ liked: payload.liked, likeCount: null });
  return Response.json({ liked: payload.liked, likeCount: count ?? 0 });
}
