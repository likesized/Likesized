import Link from "next/link";
import { redirect } from "next/navigation";
import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { createClient } from "@/lib/supabase/server";
import { ReportContentForm } from "@/components/ReportContentForm";
import styles from "./circle.module.css";

type SearchParams = Promise<Record<string,string|string[]|undefined>>;
type Category = "overall" | "tops" | "bottoms";
type FitCommunity = "men" | "women" | "both";
type FeedRow = {
  activity_id: string;
  activity_type: "closet_shared" | "fit_report_added" | "outfit_posted";
  actor_id: string;
  username: string;
  display_name: string | null;
  occurred_at: string;
  relevant_match_category: Category;
  closet_item_id: string | null;
  outfit_post_id: string | null;
  product_slug: string | null;
  product_name: string | null;
  brand_name: string | null;
  garment_type_key: string | null;
  size_label: string | null;
  fit: string | null;
  fit_notes: string | null;
  outfit_caption: string | null;
  outfit_photo_path: string | null;
};
type Match = { user_id: string; match_score: number };
type FitPhoto = { id: string; closet_item_id: string; storage_path: string };
const FIT: Record<string, string> = {
  too_small: "Too small",
  snug: "Snug",
  just_right: "Just right",
  relaxed: "Relaxed",
  too_big: "Too big",
};
const COMMUNITY_LABELS:Record<FitCommunity,string>={men:"Men",women:"Women",both:"Both"};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function requestedCommunity(value:string|undefined):FitCommunity|null{return value==="men"||value==="women"||value==="both"?value:null;}
function savedCommunity(value:unknown):FitCommunity{return value==="men"||value==="women"?value:"both";}
function circleHref(community:FitCommunity){return `/circle?community=${community}`;}
function activity(type: FeedRow["activity_type"]) {
  if (type === "fit_report_added") return "Posted a new fit update";
  if (type === "outfit_posted") return "Posted a new outfit";
  return "Added a garment to their Shared Closet";
}
function date(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
function note(value: string | null) {
  if (!value) return null;
  return value.length > 220 ? `${value.slice(0, 217).trimEnd()}…` : value;
}

export default async function MyCirclePage({searchParams}:{searchParams:SearchParams}) {
  const params=await searchParams;
  const override=requestedCommunity(first(params.community));
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const viewerId = claims?.claims?.sub;
  if (claimsError || !viewerId) redirect("/login?next=/circle");
  const [
    { data: profile, error: profileError },
    { data: fitProfile, error: fitProfileError },
    { data: feedData, error: feedError },
    { data: matchData, error: matchError },
    { data: settings, error: settingsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username")
      .eq("id", viewerId)
      .maybeSingle(),
    supabase
      .from("fit_profiles")
      .select("completed_at,fit_community")
      .eq("user_id", viewerId)
      .maybeSingle(),
    supabase.rpc("get_following_feed", { p_result_limit: 50, p_before: null, p_fit_community:override }),
    supabase.rpc("get_fit_matches", {
      p_match_category: "overall",
      p_result_limit: 100,
      p_fit_community:override,
    }),
    supabase
      .from("fit_twin_settings")
      .select("threshold_percent")
      .eq("singleton", true)
      .maybeSingle(),
  ]);
  if (
    profileError ||
    fitProfileError ||
    feedError ||
    matchError ||
    settingsError
  )
    throw new Error("Could not load My Circle.");
  if (!profile?.username || !fitProfile?.completed_at) redirect("/onboarding");
  const community=override??savedCommunity(fitProfile.fit_community);
  const threshold = settings?.threshold_percent ?? 85;
  const overall = new Map(
    ((matchData ?? []) as Match[]).map((row) => [row.user_id, row.match_score]),
  );
  const feed = [...((feedData ?? []) as FeedRow[])].sort((a, b) => {
    const aTwin = (overall.get(a.actor_id) ?? 0) >= threshold ? 1 : 0;
    const bTwin = (overall.get(b.actor_id) ?? 0) >= threshold ? 1 : 0;
    return (
      bTwin - aTwin ||
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    );
  });
  const closetIds = [
    ...new Set(
      feed
        .map((row) => row.closet_item_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  let fitPhotos: FitPhoto[] = [];
  if (closetIds.length) {
    const result = await supabase
      .from("fit_reference_photos")
      .select("id,closet_item_id,storage_path")
      .in("closet_item_id", closetIds);
    if (!result.error) fitPhotos = (result.data ?? []) as FitPhoto[];
  }
  const fitPaths = new Map(fitPhotos.map((row) => [row.closet_item_id, row]));
  const signedFit = new Map<string, string>();
  await Promise.all(
    [...fitPaths].map(async ([id, photo]) => {
      const { data } = await supabase.storage
        .from("fit-reference-photos")
        .createSignedUrl(photo.storage_path, 1800);
      if (data?.signedUrl) signedFit.set(id, data.signedUrl);
    }),
  );
  const signedOutfits = new Map<string, string>();
  await Promise.all(
    feed
      .filter((row) => row.outfit_post_id && row.outfit_photo_path)
      .map(async (row) => {
        const path = outfitFeedPhotoPath(row.outfit_photo_path!);
        let { data } = await supabase.storage
          .from("outfit-photos")
          .createSignedUrl(path, 1800);
        if (!data?.signedUrl && path !== row.outfit_photo_path)
          ({ data } = await supabase.storage
            .from("outfit-photos")
            .createSignedUrl(row.outfit_photo_path!, 1800));
        if (data?.signedUrl)
          signedOutfits.set(row.outfit_post_id!, data.signedUrl);
      }),
  );
  const twinPeople = new Set(
    feed
      .filter((row) => (overall.get(row.actor_id) ?? 0) >= threshold)
      .map((row) => row.actor_id),
  );
  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">MY CIRCLE</span>
        <h1>Your Style Feed starts with Fit Twins.</h1>
        <p>
          My Circle contains everyone you follow. LikeSized shows Fit Twin
          activity first, then fills the feed with posts from everyone else you
          follow—without duplicates.
        </p>
        <div className="authActions">
          <Link className="secondaryButton" href={`/people?community=${community}`}>
            Find people my size
          </Link>
        </div>
      </div>
      <span className="muted">Fit Community · defaults to your Fit Profile. This filters by the member wearing/posting the clothing, not by the garment’s Men’s or Women’s Department.</span>
      <div className="filterBar">
        {(Object.keys(COMMUNITY_LABELS) as FitCommunity[]).map((key)=><Link key={key} className={`filter${community===key?" active":""}`} href={circleHref(key)}>{COMMUNITY_LABELS[key]}</Link>)}
      </div>
      <section className="emptyState">
        <span className="eyebrow">FIT TWINS</span>
        <h2>
          {twinPeople.size
            ? `${twinPeople.size} followed ${twinPeople.size === 1 ? "person qualifies" : "people qualify"} right now.`
            : "No followed person qualifies yet—and that is okay."}
        </h2>
        <p>
          A Fit Twin is someone in this Fit Community whom you follow with an Overall
          Match of at least {threshold}%. Switching Men, Women, or Both changes only this view.
        </p>
      </section>
      <div className="pageTitle">
        <span className="eyebrow">STYLE FEED</span>
        <h2>Fit Twins first. The rest of your relevant following fills the feed.</h2>
      </div>
      {feed.length ? (
        <div className={styles.feed}>
          {feed.map((row) => {
            const name = row.display_name?.trim() || row.username;
            const score = overall.get(row.actor_id);
            const isTwin = typeof score === "number" && score >= threshold;
            const fitPhoto = row.closet_item_id
              ? signedFit.get(row.closet_item_id)
              : undefined;
            const outfitPhoto = row.outfit_post_id
              ? signedOutfits.get(row.outfit_post_id)
              : undefined;
            const short = note(row.fit_notes);
            return (
              <article className={styles.card} key={row.activity_id}>
                <div className={styles.avatar}>
                  {name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className={styles.header}>
                    <div>
                      <div className={styles.identity}>
                        <Link
                          className="textLink"
                          href={`/people/${row.username}`}
                        >
                          <strong>{name}</strong>
                        </Link>
                        <span className={styles.handle}>@{row.username}</span>
                      </div>
                      <span className={styles.time}>
                        {date(row.occurred_at)}
                      </span>
                    </div>
                    <span className={styles.badge}>
                      {isTwin
                        ? `Fit Twin · ${score}% Overall Match`
                        : typeof score === "number"
                          ? `Following · ${score}% Overall Match`
                          : "Following"}
                    </span>
                  </div>
                  <div className={styles.activity}>
                    {activity(row.activity_type)}
                  </div>
                  {row.activity_type !== "outfit_posted" ? (
                    <>
                      {fitPhoto ? (
                        <img
                          className={styles.photo}
                          src={fitPhoto}
                          alt={`Fit reference for ${row.product_name || "garment"}`}
                        />
                      ) : null}
                      <div className={styles.garment}>
                        <strong>
                          {row.brand_name ? `${row.brand_name} · ` : ""}
                          {row.product_name || "Shared garment"}
                        </strong>
                        <span>
                          {row.size_label
                            ? `Size ${row.size_label}`
                            : "Size not listed"}
                          {row.fit ? ` · ${FIT[row.fit] || row.fit}` : ""}
                        </span>
                        {row.garment_type_key ? (
                          <span>
                            {row.garment_type_key.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>
                      {short ? <p className={styles.note}>“{short}”</p> : null}
                      <div className={styles.actions}>
                        <Link
                          className="textLink"
                          href={`/people/${row.username}`}
                        >
                          View {name} →
                        </Link>
                        {row.product_slug ? (
                          <Link
                            className="textLink"
                            href={`/item/${row.product_slug}`}
                          >
                            View product →
                          </Link>
                        ) : null}
                      </div>
                      {row.actor_id !== viewerId &&
                      row.closet_item_id &&
                      fitPaths.get(row.closet_item_id) ? (
                        <ReportContentForm
                          targetType="fit_reference_photo"
                          targetId={fitPaths.get(row.closet_item_id)!.id}
                          returnTo={circleHref(community)}
                        />
                      ) : null}
                      <div className={styles.context}>
                        The badge uses your current Overall Match. Garment
                        evidence remains tied to the body snapshot from the
                        try-on.
                      </div>
                    </>
                  ) : (
                    <>
                      {outfitPhoto ? (
                        <img
                          className={styles.photo}
                          src={outfitPhoto}
                          alt={`Outfit by ${name}`}
                        />
                      ) : null}
                      {row.outfit_caption ? (
                        <p className={styles.outfitCaption}>
                          {row.outfit_caption}
                        </p>
                      ) : null}
                      <div className={styles.actions}>
                        <Link
                          className="textLink"
                          href="/explore?view=outfits&scope=matches"
                        >
                          Explore outfits →
                        </Link>
                        <Link
                          className="textLink"
                          href={`/people/${row.username}`}
                        >
                          View {name} →
                        </Link>
                      </div>
                      {row.actor_id !== viewerId && row.outfit_post_id ? (
                        <ReportContentForm
                          targetType="outfit_post"
                          targetId={row.outfit_post_id}
                          returnTo={circleHref(community)}
                        />
                      ) : null}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="emptyState">
          <span className="eyebrow">YOUR STYLE FEED IS READY</span>
          <h2>Follow people to bring their posts into My Circle.</h2>
          <p>
            Fit Twins will automatically move to the front when a followed
            person in this Fit Community meets the current threshold.
          </p>
          <Link className="primaryButton" href={`/people?community=${community}`}>
            Find people my size →
          </Link>
        </div>
      )}
    </main>
  );
}
