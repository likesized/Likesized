"use client";

import type { ReactNode } from "react";
import { followFromOutfit } from "@/app/outfits/actions";
import { followPerson, setFollowingNotificationSubscription, unfollowPerson } from "@/app/people/actions";
import { UniversalActionBar, UniversalActionButton, UniversalActionLink } from "@/components/UniversalActionBar";
import styles from "@/app/outfits/[id]/CreatorQuickView.module.css";

type Props = {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  userId: string | null;
  signedIn: boolean;
  owner: boolean;
  following: boolean;
  notificationsOn: boolean;
  overallMatch?: number | null;
  topsMatch?: number | null;
  bottomsMatch?: number | null;
  garmentCount: number | null;
  outfitCount: number | null;
  returnTo: string;
  onClose: () => void;
  profileLink: ReactNode;
  loading?: boolean;
  outfitPostId?: string | null;
};

function stat(value: number | null | undefined) {
  return typeof value === "number" ? `${value}%` : "—";
}

export function CanonicalPersonQuickViewCard({ displayName, username, avatarUrl, userId, signedIn, owner, following, notificationsOn, overallMatch, topsMatch, bottomsMatch, garmentCount, outfitCount, returnTo, onClose, profileLink, loading = false, outfitPostId = null }: Props) {
  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${displayName} quick view`} onClick={onClose}>
    <section className={styles.card} onClick={(event) => event.stopPropagation()}>
      <button className={styles.close} type="button" aria-label="Close profile quick view" onClick={onClose}>×</button>
      <div className={styles.identity}>
        {avatarUrl ? <img src={avatarUrl} alt=""/> : <span>{displayName.slice(0,1).toUpperCase()}</span>}
        <div><strong>{displayName}</strong>{username ? <small>@{username}</small> : null}</div>
      </div>
      {loading ? <p className={styles.helper}>Loading profile details…</p> : <div className={styles.stats}>
        <div className={styles.overallStat}><strong>{owner ? "—" : stat(overallMatch)}</strong><span>Overall Match</span></div>
        <div><strong>{owner ? "—" : stat(topsMatch)}</strong><span>Tops Match</span></div>
        <div><strong>{owner ? "—" : stat(bottomsMatch)}</strong><span>Bottoms Match</span></div>
        <div><strong>{garmentCount ?? "—"}</strong><span>Total Garments</span></div>
        <div><strong>{outfitCount ?? "—"}</strong><span>Total Outfits</span></div>
      </div>}
      {!signedIn && !owner ? <p className={styles.helper}>Sign in to see how closely your measurements match.</p> : null}
      {!owner && userId ? <UniversalActionBar className={styles.actions} ariaLabel="Profile actions">
        {signedIn ? following ? <form action={unfollowPerson}>
          <input type="hidden" name="target_user_id" value={userId}/><input type="hidden" name="return_to" value={returnTo}/>
          <UniversalActionButton action="follow" active type="submit" showLabel/>
        </form> : outfitPostId ? <form action={followFromOutfit}>
          <input type="hidden" name="post_id" value={outfitPostId}/><input type="hidden" name="return_to" value={returnTo}/>
          <UniversalActionButton action="follow" type="submit" showLabel/>
        </form> : <form action={followPerson}>
          <input type="hidden" name="target_user_id" value={userId}/><input type="hidden" name="return_to" value={returnTo}/>
          <UniversalActionButton action="follow" type="submit" showLabel/>
        </form> : <UniversalActionLink action="follow" href={`/login?next=${encodeURIComponent(returnTo)}`} showLabel/>}
        {signedIn ? <form action={setFollowingNotificationSubscription}>
          <input type="hidden" name="target_user_id" value={userId}/><input type="hidden" name="enabled" value={notificationsOn ? "false" : "true"}/><input type="hidden" name="return_to" value={returnTo}/>
          <UniversalActionButton action="notify" active={notificationsOn} type="submit" showLabel/>
        </form> : <UniversalActionLink action="notify" href={`/login?next=${encodeURIComponent(returnTo)}`} showLabel/>}
      </UniversalActionBar> : null}
      {profileLink}
    </section>
  </div>;
}
