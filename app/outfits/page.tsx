import { redirect } from "next/navigation";

export default function OutfitsIndexPage() {
  redirect("/closet?tab=outfits");
}
