"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./circle.module.css";

type FeedScope="twins"|"all";
type StyleOption={key:string;label:string};

function normalizeStyle(value:string){
  return value.trim().replace(/^#+/,"").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,30);
}

export function StyleFeedFilters({scope,occasion,styleDisplay,styleOptions}:{scope:FeedScope;occasion:string;styleDisplay:string;styleOptions:StyleOption[]}){
  const router=useRouter();
  const [styleValue,setStyleValue]=useState(styleDisplay);

  function destination(nextOccasion:string,nextStyle:string){
    const params=new URLSearchParams();
    if(scope==="all")params.set("scope","all");
    if(nextOccasion)params.set("occasion",nextOccasion);
    const normalized=normalizeStyle(nextStyle);
    if(normalized)params.set("style",normalized);
    const query=params.toString();
    return query?`/circle?${query}`:"/circle";
  }

  function applyStyle(value:string){
    router.push(destination(occasion,value));
  }

  return <div className={styles.filters} aria-label="Style Feed filters">
    <label>
      <span>Occasion</span>
      <select value={occasion} onChange={(event)=>router.push(destination(event.target.value,styleValue))}>
        <option value="">All occasions</option>
        {OUTFIT_OPTIONS.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
    <label>
      <span>Style Tags</span>
      <input
        value={styleValue}
        list="style-feed-tags"
        placeholder="Search style tags"
        autoComplete="off"
        onChange={(event)=>{
          const value=event.target.value;
          setStyleValue(value);
          if(!value.trim())router.push(destination(occasion,""));
          else if(styleOptions.some((option)=>option.label.toLowerCase()===value.trim().replace(/^#+/,"").toLowerCase()))applyStyle(value);
        }}
        onKeyDown={(event)=>{
          if(event.key==="Enter"){
            event.preventDefault();
            applyStyle(styleValue);
          }
        }}
      />
      <datalist id="style-feed-tags">
        {styleOptions.map((option)=><option key={option.key} value={option.label}/>) }
      </datalist>
    </label>
  </div>;
}

const OUTFIT_OPTIONS=[
  {value:"everyday",label:"Everyday"},
  {value:"work",label:"Work"},
  {value:"date_night",label:"Date Night"},
  {value:"going_out",label:"Going Out"},
  {value:"formal",label:"Formal"},
  {value:"wedding_guest",label:"Wedding Guest"},
  {value:"vacation",label:"Vacation"},
  {value:"travel",label:"Travel"},
  {value:"athleisure",label:"Athleisure"},
  {value:"workout",label:"Workout"},
  {value:"outdoors",label:"Outdoors"},
  {value:"festival",label:"Festival"},
  {value:"holiday",label:"Holiday"},
  {value:"other",label:"Other"},
] as const;
