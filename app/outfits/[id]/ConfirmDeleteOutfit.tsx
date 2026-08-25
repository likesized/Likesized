"use client";

import { useState } from "react";
import { deleteOutfit } from "@/app/outfits/actions";
import styles from "./outfitDetail.module.css";

export default function ConfirmDeleteOutfit({postId}:{postId:string}){
  const [open,setOpen]=useState(false);
  return <>
    <button className={styles.deleteTrigger} type="button" onClick={()=>setOpen(true)}>Delete Outfit</button>
    {open?<div className={styles.confirmOverlay} role="dialog" aria-modal="true" aria-labelledby="delete-outfit-title" onClick={()=>setOpen(false)}>
      <div className={styles.confirmCard} onClick={(event)=>event.stopPropagation()}>
        <h3 id="delete-outfit-title">Delete this Outfit?</h3>
        <p>This permanently removes the Outfit, its photos, tags, comments, and activity.</p>
        <div className={styles.confirmActions}><button type="button" onClick={()=>setOpen(false)}>Cancel</button><form action={deleteOutfit}><input type="hidden" name="post_id" value={postId}/><button type="submit">Delete Outfit</button></form></div>
      </div>
    </div>:null}
  </>;
}
