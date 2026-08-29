"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { followPerson, unfollowPerson } from "@/app/people/actions";
import { MatchPercentageBadge } from "@/components/MatchPercentageBadge";
import { UniversalActionBar, UniversalActionButton, UniversalActionLink } from "@/components/UniversalActionBar";
import { createClient } from "@/lib/supabase/client";
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

function matchStat(value: number | null | undefined, owner: boolean, onExplain: () => void) {
  if (owner) return "—";
  if (typeof value !== "number") {
    return <span className={styles.matchUnavailable}><span>Not enough information</span><button type="button" className={styles.matchInfo} aria-label="Why is there not enough information for this match?" onClick={onExplain}>?</button></span>;
  }
  return <MatchPercentageBadge score={value} compact />;
}

export function CanonicalPersonQuickViewCard({ displayName, username, avatarUrl, userId, signedIn, owner, following, notificationsOn, overallMatch, topsMatch, bottomsMatch, garmentCount, outfitCount, returnTo, onClose, profileLink, loading = false }: Props) {
  const [followActive,setFollowActive]=useState(following);
  const [followPending,setFollowPending]=useState(false);
  const [followError,setFollowError]=useState("");
  const [notifyActive,setNotifyActive]=useState(notificationsOn);
  const [notifyPending,setNotifyPending]=useState(false);
  const [notifyError,setNotifyError]=useState("");
  const [matchExplanation,setMatchExplanation]=useState(false);

  useEffect(()=>{
    setFollowActive(following);
    setFollowPending(false);
    setFollowError("");
  },[following,userId]);

  useEffect(()=>{
    setNotifyActive(notificationsOn);
    setNotifyPending(false);
    setNotifyError("");
  },[notificationsOn,userId]);

  async function toggleFollow(){
    if(!userId||followPending)return;
    const next=!followActive;
    setFollowActive(next);
    setFollowPending(true);
    setFollowError("");
    const formData=new FormData();
    formData.set("target_user_id",userId);
    formData.set("return_to",returnTo);
    formData.set("stay_open","1");
    try{
      await(next?followPerson:unfollowPerson)(formData);
    }catch{
      setFollowActive(!next);
      setFollowError(next?"Could not follow this person. Try again.":"Could not unfollow this person. Try again.");
    }finally{
      setFollowPending(false);
    }
  }

  async function toggleNotifications(){
    if(!userId||notifyPending)return;
    const next=!notifyActive;
    setNotifyActive(next);
    setNotifyPending(true);
    setNotifyError("");
    try{
      const supabase=createClient();
      const {error}=await supabase.rpc("set_following_notification_subscription",{p_followed_id:userId,p_enabled:next});
      if(error)throw error;
    }catch{
      setNotifyActive(!next);
      setNotifyError("Notifications could not update. Try again.");
    }finally{
      setNotifyPending(false);
    }
  }

  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${displayName} quick view`} onClick={onClose}>
    <section className={styles.card} onClick={(event) => event.stopPropagation()}>
      <button className={styles.close} type="button" aria-label="Close profile quick view" onClick={onClose}>×</button>
      <div className={styles.identity}>
        {avatarUrl ? <img src={avatarUrl} alt=""/> : <span>{displayName.slice(0,1).toUpperCase()}</span>}
        <div><strong>{displayName}</strong>{username ? <small>@{username}</small> : null}</div>
      </div>
      {loading ? <p className={styles.helper}>Loading profile details…</p> : <div className={styles.stats}>
        <div className={styles.overallStat}><strong>{matchStat(overallMatch,owner,()=>setMatchExplanation(true))}</strong><span>Overall Match</span></div>
        <div><strong>{matchStat(topsMatch,owner,()=>setMatchExplanation(true))}</strong><span>Tops Match</span></div>
        <div><strong>{matchStat(bottomsMatch,owner,()=>setMatchExplanation(true))}</strong><span>Bottoms Match</span></div>
        <div><strong>{garmentCount ?? "—"}</strong><span>Total Garments</span></div>
        <div><strong>{outfitCount ?? "—"}</strong><span>Total Outfits</span></div>
      </div>}
      {matchExplanation ? <div className={styles.matchExplanation} role="status"><strong>Not enough information</strong><span>We need more shared measurements to calculate a reliable match.</span><button type="button" onClick={()=>setMatchExplanation(false)}>Close</button></div> : null}
      {!signedIn && !owner ? <p className={styles.helper}>Sign in to see how closely your measurements match.</p> : null}
      {!owner && userId ? <UniversalActionBar className={styles.actions} ariaLabel="Profile actions">
        {signedIn ? <UniversalActionButton action="follow" active={followActive} type="button" disabled={followPending} onClick={()=>void toggleFollow()} showLabel/> : <UniversalActionLink action="follow" href={`/login?next=${encodeURIComponent(returnTo)}`} showLabel/>}
        {signedIn ? <UniversalActionButton action="notify" active={notifyActive} type="button" disabled={notifyPending} onClick={()=>void toggleNotifications()} showLabel/> : <UniversalActionLink action="notify" href={`/login?next=${encodeURIComponent(returnTo)}`} showLabel/>}
      </UniversalActionBar> : null}
      {followError?<p className={styles.helper} role="status">{followError}</p>:null}
      {notifyError?<p className={styles.helper} role="status">{notifyError}</p>:null}
      {profileLink}
    </section>
  </div>;
}