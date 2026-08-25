import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function OutfitsIndexPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  redirect(`/closet?tab=outfits${first(params.deleted) === "1" ? "&deleted=1" : ""}`);
}
