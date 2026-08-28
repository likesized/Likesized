import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CanonicalProductImageAdmin from "../CanonicalProductImageAdmin";

export default async function ProductImageModerationPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login?next=/moderation/product-images");
  const { data: isAdmin } = await supabase.rpc("is_current_user_admin");
  if (!isAdmin) redirect("/");

  return <main className="pageShell">
    <div className="pageTitle">
      <span className="eyebrow">ADMIN</span>
      <h1>Product images</h1>
      <p>Review automatic Product-image winners, tracked-variation candidates, eligibility and intentional admin locks.</p>
    </div>
    <CanonicalProductImageAdmin />
  </main>;
}
