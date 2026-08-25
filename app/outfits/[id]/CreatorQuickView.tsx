"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { followFromOutfit } from "@/app/outfits/actions";
import { setFollowingNotificationSubscription, unfollowPerson } from "@/app/people/actions";
import { UniversalActionBar, UniversalActionButton, UniversalActionLink } from "@/components/UniversalActionBar";
import outfitStyles from "./outfitDetail.module.css";
import styles from "./CreatorQuickView.module.css";

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
  fitReportCount: number | null;
  outfitCount: number | null;
};

function stat(value: number | undefined, suffix = "%") {
  return typeof value === "number" ? `${value}${suffix}` : "—";
}

export default function CreatorQuickView({ postId, creatorUserId, username, displayName, avatarUrl, publishedDate, signedIn, owner, following, notificationsOn, overallMatch, topsMatch, bottomsMatch, twinLabel, fitReportCount, outfitCount }: Props) {
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

    {open ? <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${displayName} quick view`} onClick={() => setOpen(false)}>
      <section className={styles.card} onClick={(event) => event.stopPropagation()}>
        <button className={styles.close} type="button" aria-label="Close profile quick view" onClick={() => setOpen(false)}>×</button>
        <div className={styles.identity}>
          {avatarUrl ? <img src={avatarUrl} alt=""/> : <span>{displayName.slice(0,1).toUpperCase()}</span>}
          <div><strong>{displayName}</strong>{username ? <small>@{username}</small> : null}</div>
        </div>
        <div className={styles.stats}>
          <div><strong>{owner ? "—" : stat(overallMatch)}</strong><span>Overall Match</span></div>
          <div><strong>{owner ? "—" : stat(topsMatch)}</strong><span>Tops Match</span></div>
          <div><strong>{owner ? "—" : stat(bottomsMatch)}</strong><span>Bottoms Match</span></div>
          <div><strong>{fitReportCount ?? "—"}</strong><span>Total Fit Reports</span></div>
          <div><strong>{outfitCount ?? "—"}</strong><span>Total Outfits</span></div>
        </div>
        {!signedIn && !owner ? <p className={styles.helper}>Sign in to see how closely your measurements match.</p> : null}
        {!owner ? <UniversalActionBar className={styles.actions} ariaLabel="Profile actions">
          {signedIn ? following ? <form action={unfollowPerson}>
            <input type="hidden" name="target_user_id" value={creatorUserId}/><input type="hidden" name="return_to" value={returnTo}/>
            <UniversalActionButton action="follow" active type="submit" showLabel/>
          </form> : <form action={followFromOutfit}>
            <input type="hidden" name="post_id" value={postId}/><input type="hidden" name="return_to" value={returnTo}/>
            <UniversalActionButton action="follow" type="submit" showLabel/>
          </form> : <UniversalActionLink action="follow" href={`/login?next=${encodeURIComponent(returnTo)}`} showLabel/>}
          {signedIn ? <form action={setFollowingNotificationSubscription}>
            <input type="hidden" name="target_user_id" value={creatorUserId}/><input type="hidden" name="enabled" value={notificationsOn ? "false" : "true"}/><input type="hidden" name="return_to" value={returnTo}/>
            <UniversalActionButton action="notify" active={notificationsOn} type="submit" showLabel/>
          </form> : <UniversalActionLink action="notify" href={`/login?next=${encodeURIComponent(returnTo)}`} showLabel/>}
        </UniversalActionBar> : null}
        <Link className={styles.fullProfile} href={profileHref} prefetch={false}>View Full Profile</Link>
      </section>
    </div> : null}
  </>;
}
