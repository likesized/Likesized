"use client";

import { useState } from "react";
import styles from "./circle.module.css";

const COLLAPSED_LENGTH=260;

export function StyleFeedNote({text}:{text:string}){
  const [expanded,setExpanded]=useState(false);
  const needsToggle=text.length>COLLAPSED_LENGTH;
  if(!needsToggle)return <p className={styles.note}>{text}</p>;
  const collapsed=`${text.slice(0,COLLAPSED_LENGTH-3).trimEnd()}…`;
  return <div className={styles.noteBlock}>
    <p className={styles.note}>{expanded?text:collapsed}</p>
    <button className={styles.noteToggle} type="button" aria-expanded={expanded} onClick={()=>setExpanded((current)=>!current)}>{expanded?"Show less":"More"}</button>
  </div>;
}
