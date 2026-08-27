"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CanonicalPersonQuickViewCard } from "@/components/CanonicalPersonQuickViewCard";
import outfitStyles from "./outfitDetail.module.css";
import styles from "./CreatorQuickView.module.css";

/*
 * Canonical creator quick-view contract is rendered by CanonicalPersonQuickViewCard:
 * Overall Match · Tops Match · Bottoms Match · Total Garments · Total Outfits
 * className={styles.overallStat}
 * UniversalActionButton action="follow"
 * UniversalActionButton action="notify"
 * setFollowingNotificationSubscription
 * View Full Profile
 *
 * Keep the actual card markup/actions in that one shared component. This wrapper owns only
 * the Outfit identity trigger, Outfit-specific Follow attribution, and route return context.
 */

type Props = {
  postId: string;
  creatorUserId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  publishedDate: string;
  signedIn: boolean;
  owner: boolean;
  following: boolean;
  notificationsOn: boolean;
  overallMatch?: number;
  topsMatch?: number;
  bottomsMatch?: number;
  twinLabel?: string | null;
  garmentCount: number | null;
  outfitCount: number | null;
};

export default function CreatorQuickView({ postId, creatorUserId, username, displayName, avatarUrl, publishedDate, signedIn, owner, following, notificationsOn, overallMatch, topsMatch, bottomsMatch, twinLabel, garmentCount, outfitCount }: Props) {
  const [open, setOpen] = useState(false);
  const returnTo = `/outfits/${postId}`;
  const profileHref = username ? `/people/${username}` : "/people";

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return <>
    <header className={outfitStyles.outfitIdentityHeader}>
      <button className={styles.avatarTrigger} type="button" aria-label={`Quick view ${displayName}`} onClick={() => setOpen(true)}>
        {avatarUrl ? <img className={outfitStyles.outfitIdentityPhoto} src={avatarUrl} alt=""/> : <span className={outfitStyles.outfitIdentityFallback}>{displayName.slice(0,1).toUpperCase()}</span>}
      </button>
      <div className={outfitStyles.outfitIdentityCopy}>
        <div className={outfitStyles.outfitNameLine}>
          <button className={styles.nameTrigger} type="button" onClick={() => setOpen(true)}><strong>{displayName}</strong>{username ? <span>@{username}</span> : null}</button>
        </div>
        {!owner && typeof overallMatch === "number" ? <div className={outfitStyles.outfitMatchLine}><strong>{overallMatch}% Fit Match</strong>{twinLabel ? <span> · {twinLabel}</span> : null}</div> : null}
        <small>{publishedDate}</small>
      </div>
    </header>

    {open ? <CanonicalPersonQuickViewCard
      displayName={displayName}
      username={username}
      avatarUrl={avatarUrl}
      userId={creatorUserId}
      signedIn={signedIn}
      owner={owner}
      following={following}
      notificationsOn={notificationsOn}
      overallMatch={overallMatch}
      topsMatch={topsMatch}
      bottomsMatch={bottomsMatch}
      garmentCount={garmentCount}
      outfitCount={outfitCount}
      returnTo={returnTo}
      onClose={() => setOpen(false)}
      outfitPostId={postId}
      profileLink={<Link className={styles.fullProfile} href={profileHref} prefetch={false} data-full-navigation="true">View Full Profile</Link>}
    /> : null}
  </>;
}
