"use client";

import { useState } from "react";
import { addOutfitComment } from "@/app/outfits/actions";
import styles from "../outfits.module.css";

export default function CommentComposer({postId,returnTo}:{postId:string;returnTo:string}){
  const [body,setBody]=useState("");
  return <form className={styles.commentForm} action={addOutfitComment}>
    <input type="hidden" name="post_id" value={postId}/><input type="hidden" name="return_to" value={returnTo}/>
    <label>Add a comment <span className={styles.counter}>{body.length}/500</span><textarea name="body" value={body} onChange={(event)=>setBody(event.target.value)} rows={3} maxLength={500} required placeholder="Keep it useful and kind."/></label>
    <span className="fieldHelp">Plain text only · no images, GIFs, or external links.</span>
    <button className="primaryButton" type="submit" disabled={!body.trim()}>Comment</button>
  </form>;
}
