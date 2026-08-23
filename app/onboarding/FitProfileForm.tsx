"use client";

import { useEffect, useMemo, useState } from "react";
import { saveFitProfile } from "@/app/onboarding/actions";
import { MeasurementHelpDialog } from "@/app/onboarding/MeasurementHelp";
import helpStyles from "@/app/onboarding/MeasurementHelp.module.css";

type UnitSystem = "imperial" | "metric";
export type FitCommunity = "men" | "women" | "both";
export type MeasurementType = { key:string; label:string; core:boolean; measurement_group:string; dimension:"length"|"weight"; manual_step_imperial:number|string; manual_step_metric:number|string; reconfirm_after_days:number|string; sort_order:number };
export type BodyMeasurement = { measurement_type_key:string; entered_value:number|string; entered_unit:string; confirmed_at:string|null };
type Props={username:string;isInitialSetup:boolean;unitSystem:UnitSystem;fitCommunity:FitCommunity;types:MeasurementType[];measurements:BodyMeasurement[];errorMessage:string|null};
type ReviewRow={key:string;label:string;value:string;status:string|null};

const INCH_FRACTIONS=[{value:"0",label:"0"},{value:"0.25",label:"¼"},{value:"0.5",label:"½"},{value:"0.75",label:"¾"}];
const HEIGHT_INCHES=Array.from({length:12},(_,index)=>index);
const DAY_MS=86_400_000;
const DISPLAY_LABELS:Record<string,string>={chest_circumference:"Chest",full_bust:"Full Bust",high_bust:"High Bust",natural_waist:"Natural Waist",lower_pants_waist:"Pants Waist",high_hip:"High Hip",full_hip_seat:"Hips / Seat",waist_to_hip_length:"Waist-to-Hip Length",shoulder_width:"Shoulder Width",individual_shoulder_length:"Individual Shoulder Length",torso_body_length:"Torso Length",torso_girth:"Torso Girth",bust_point_to_bust_point:"Bust Point to Bust Point",shoulder_to_bust_point:"Shoulder to Bust Point",front_waist_length:"Front Waist Length",back_waist_length:"Back Waist Length",shoulder_to_waist:"Shoulder to Waist",across_back_width:"Across-Back Width",across_front_chest_width:"Across-Front Chest Width",arm_sleeve_length:"Arm / Sleeve Length",bicep_upper_arm:"Upper Arm Circumference",elbow_circumference:"Elbow Circumference",wrist_circumference:"Wrist Circumference",neck_collar_circumference:"Neck / Collar Circumference",thigh_circumference:"Thigh Circumference",knee_circumference:"Knee Circumference",calf_circumference:"Calf Circumference",outseam:"Outseam",front_rise:"Front Rise",back_rise:"Back Rise",crotch_depth:"Crotch Depth",total_crotch_length:"Total Crotch Length",foot_length:"Foot Length",foot_width:"Foot Width"};

function displayLabel(type:MeasurementType){return DISPLAY_LABELS[type.key]??type.label;}
function targetUnit(type:MeasurementType,system:UnitSystem){return type.dimension==="weight"?(system==="imperial"?"lb":"kg"):(system==="imperial"?"in":"cm");}
function convert(value:number,from:string,to:string){if(from===to)return value;if(from==="in"&&to==="cm")return value*2.54;if(from==="cm"&&to==="in")return value/2.54;if(from==="lb"&&to==="kg")return value*0.45359237;if(from==="kg"&&to==="lb")return value/0.45359237;return value;}
function roundStep(value:number,step:number){return Number((Math.round(value/step)*step).toFixed(4));}
function stepFor(type:MeasurementType,system:UnitSystem){if(system==="imperial"&&type.dimension==="length")return type.key==="height"?1:0.25;return Number(system==="imperial"?type.manual_step_imperial:type.manual_step_metric);}
function inchParts(raw:string){if(!raw)return{whole:"",fraction:"0"};const value=Number(raw);if(!Number.isFinite(value))return{whole:"",fraction:"0"};let whole=Math.floor(value+0.000001);let fraction=Math.round((value-whole)*4)/4;if(fraction>=1){whole+=1;fraction=0;}return{whole:String(whole),fraction:String(fraction)};}
function heightParts(raw:string){if(!raw)return{feet:"",inches:"0"};const total=Math.max(0,Math.round(Number(raw)));if(!Number.isFinite(total))return{feet:"",inches:"0"};return{feet:String(Math.floor(total/12)),inches:String(total%12)};}
function canonical(type:MeasurementType,value:number,unit:string){if(type.dimension==="weight")return unit==="lb"?value*0.45359237:value;return unit==="in"?value*2.54:value;}
function reviewValue(type:MeasurementType,raw:string,system:UnitSystem){const value=Number(raw);if(system==="imperial"&&type.dimension==="length"&&type.key==="height"){const total=Math.round(value);return `${Math.floor(total/12)} ft ${total%12} in`;}return `${value} ${targetUnit(type,system)}`;}
function needsReconfirm(type:MeasurementType,row:BodyMeasurement|undefined){if(!row?.confirmed_at)return false;const confirmedAt=Date.parse(row.confirmed_at);const days=Number(type.reconfirm_after_days);if(!Number.isFinite(confirmedAt)||!Number.isFinite(days)||days<=0)return false;return Date.now()-confirmedAt>=days*DAY_MS;}
function confirmedLabel(raw:string|null){if(!raw)return "an earlier date";const value=new Date(raw);return Number.isNaN(value.getTime())?"an earlier date":value.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});}
function fitCommunityLabel(value:FitCommunity|""){return value==="men"?"Men":value==="women"?"Women":value==="both"?"Both":"Not selected";}

export function FitProfileForm({username,isInitialSetup,unitSystem:initialSystem,fitCommunity:initialFitCommunity,types,measurements,errorMessage}:Props){
  const visibleTypes=types.filter((type)=>type.key!=="overbust");
  const byKey=new Map(measurements.map((row)=>[row.measurement_type_key,row]));
  const [system,setSystem]=useState<UnitSystem>(initialSystem);
  const [communityDraft,setCommunityDraft]=useState<FitCommunity|"">(()=>isInitialSetup?"":initialFitCommunity);
  const [helpKey,setHelpKey]=useState<string|null>(null);
  const [reviewing,setReviewing]=useState(false);
  const [usernameDraft,setUsernameDraft]=useState(username);
  const [confirmedUnchanged,setConfirmedUnchanged]=useState<Set<string>>(()=>new Set());
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(visibleTypes.map((type)=>{const row=byKey.get(type.key);if(!row)return[type.key,""];const to=targetUnit(type,initialSystem);return[type.key,String(roundStep(convert(Number(row.entered_value),row.entered_unit,to),stepFor(type,initialSystem)))];})));

  useEffect(()=>{
    if(!reviewing)return;
    const frame=requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:"auto"}));
    return()=>cancelAnimationFrame(frame);
  },[reviewing]);

  const reviewRows=useMemo<ReviewRow[]>(()=>visibleTypes.flatMap((type)=>{
    const raw=values[type.key];
    const original=byKey.get(type.key);
    if(!raw){
      if(!isInitialSetup&&original)return[{key:type.key,label:displayLabel(type),value:"Removed",status:null}];
      return[];
    }
    const currentCanonical=canonical(type,Number(raw),targetUnit(type,system));
    const originalCanonical=original?canonical(type,Number(original.entered_value),original.entered_unit):null;
    const changed=originalCanonical===null||Math.abs(currentCanonical-originalCanonical)>0.0001;
    const status:string|null=isInitialSetup?null:!original?"Added":changed?"Changed":confirmedUnchanged.has(type.key)?"Confirmed unchanged":null;
    return[{key:type.key,label:displayLabel(type),value:reviewValue(type,raw,system),status}];
  }),[values,system,visibleTypes,byKey,isInitialSetup,confirmedUnchanged]);

  function setMeasurementValue(key:string,value:string){setValues((current)=>({...current,[key]:value}));if(confirmedUnchanged.has(key))setConfirmedUnchanged((current)=>{const next=new Set(current);next.delete(key);return next;});}
  function setImperialLength(key:string,wholeRaw:string,fractionRaw:string){if(wholeRaw===""){setMeasurementValue(key,"");return;}const whole=Number(wholeRaw),fraction=Number(fractionRaw);if(!Number.isFinite(whole)||!Number.isFinite(fraction)){setMeasurementValue(key,"");return;}setMeasurementValue(key,String(whole+fraction));}
  function setHeight(feetRaw:string,inchesRaw:string){if(feetRaw===""){setMeasurementValue("height","");return;}const feet=Number(feetRaw),inches=Number(inchesRaw);if(!Number.isInteger(feet)||feet<0||!Number.isInteger(inches)||inches<0||inches>11){setMeasurementValue("height","");return;}setMeasurementValue("height",String(feet*12+inches));}
  function changeSystem(next:UnitSystem){if(next===system)return;const nextValues:{[key:string]:string}={};for(const type of visibleTypes){const raw=values[type.key];if(!raw){nextValues[type.key]="";continue;}nextValues[type.key]=String(roundStep(convert(Number(raw),targetUnit(type,system),targetUnit(type,next)),stepFor(type,next)));}setValues(nextValues);setSystem(next);}
  function toggleConfirm(key:string,checked:boolean){setConfirmedUnchanged((current)=>{const next=new Set(current);checked?next.add(key):next.delete(key);return next;});}

  const core=visibleTypes.filter((row)=>row.core),advanced=visibleTypes.filter((row)=>!row.core);
  const reconfirm=(type:MeasurementType)=>{const row=byKey.get(type.key);if(!needsReconfirm(type,row))return null;return <div className={helpStyles.reconfirmNote}><strong>Remeasure recommended.</strong><span>Last confirmed {confirmedLabel(row?.confirmed_at??null)}. If this measurement still matches your body, confirm it without re-entering the number.</span><label className={helpStyles.confirmUnchanged}><input type="checkbox" checked={confirmedUnchanged.has(type.key)} onChange={(event)=>toggleConfirm(type.key,event.target.checked)}/>Confirm unchanged</label></div>;};
  const field=(type:MeasurementType)=>{const suffix=targetUnit(type,system),inputId=`measurement_${type.key}`,label=displayLabel(type);
    if(system==="imperial"&&type.dimension==="length"&&type.key==="height"){const parts=heightParts(values[type.key]??"");return <div key={type.key} className={helpStyles.measurementField}><div className={helpStyles.measurementLabelRow}><label htmlFor={`${inputId}_feet`}>{label}</label><button type="button" className={helpStyles.helpButton} aria-label={`How to measure ${label}`} onClick={()=>setHelpKey(type.key)}>?</button></div><input type="hidden" name={`measurement_${type.key}`} value={values[type.key]??""}/><div className={`${helpStyles.measurementInputRow} ${helpStyles.imperialMeasurementRow}`}><input id={`${inputId}_feet`} aria-label={`${label} feet`} type="number" inputMode="numeric" min="0" max="9" step="1" value={parts.feet} onChange={(event)=>setHeight(event.target.value,parts.inches)}/><span>ft</span><select aria-label={`${label} inches`} value={parts.inches} onChange={(event)=>setHeight(parts.feet,event.target.value)} disabled={!parts.feet}>{HEIGHT_INCHES.map((inch)=><option key={inch} value={inch}>{inch}</option>)}</select><span>in</span></div>{reconfirm(type)}</div>;}
    if(system==="imperial"&&type.dimension==="length"){const parts=inchParts(values[type.key]??"");return <div key={type.key} className={helpStyles.measurementField}><div className={helpStyles.measurementLabelRow}><label htmlFor={`${inputId}_whole`}>{label}</label><button type="button" className={helpStyles.helpButton} aria-label={`How to measure ${label}`} onClick={()=>setHelpKey(type.key)}>?</button></div><input type="hidden" name={`measurement_${type.key}`} value={values[type.key]??""}/><div className={`${helpStyles.measurementInputRow} ${helpStyles.imperialMeasurementRow}`}><input id={`${inputId}_whole`} aria-label={`${label} whole inches`} type="number" inputMode="numeric" min="0" step="1" value={parts.whole} onChange={(event)=>setImperialLength(type.key,event.target.value,parts.fraction)}/><select aria-label={`${label} fractional inches`} value={parts.fraction} onChange={(event)=>setImperialLength(type.key,parts.whole,event.target.value)} disabled={!parts.whole}>{INCH_FRACTIONS.map((fraction)=><option key={fraction.value} value={fraction.value}>{fraction.label}</option>)}</select><span>in</span></div>{reconfirm(type)}</div>;}
    const step=stepFor(type,system);return <div key={type.key} className={helpStyles.measurementField}><div className={helpStyles.measurementLabelRow}><label htmlFor={inputId}>{label}</label><button type="button" className={helpStyles.helpButton} aria-label={`How to measure ${label}`} onClick={()=>setHelpKey(type.key)}>?</button></div><div className={helpStyles.measurementInputRow}><input id={inputId} name={`measurement_${type.key}`} type="number" inputMode="decimal" min="0" step={step} value={values[type.key]??""} onChange={(event)=>setMeasurementValue(type.key,event.target.value)}/><span>{suffix}</span></div>{reconfirm(type)}</div>;};

  return <form className="fitForm" action={saveFitProfile} onSubmit={(event)=>{if(!reviewing){event.preventDefault();(document.activeElement as HTMLElement|null)?.blur();setReviewing(true);}}}>
    {errorMessage?<div className="authMessage error">{errorMessage}</div>:null}
    <h2>{reviewing?(isInitialSetup?"Review Fit Profile":"Review Changes"):"Core Fit Profile"}</h2>
    {reviewing?<>
      <p className={helpStyles.coreIntro}>Review what you entered. Nothing is saved until you confirm.</p>
      {isInitialSetup?<div className="evidence"><div><strong>Username</strong><span>{usernameDraft}</span></div></div>:null}
      {isInitialSetup?<div className="evidence"><div><strong>Fit Community</strong><span>{fitCommunityLabel(communityDraft)}</span></div></div>:null}
      <div className={`evidenceList ${helpStyles.reviewGrid}`}>{reviewRows.map((row)=><div className={`evidence ${helpStyles.reviewItem}`} key={row.key}><div><strong>{row.label}</strong><span>{row.value}{row.status?` · ${row.status}`:""}</span></div></div>)}</div>
      <input type="hidden" name="username" value={isInitialSetup?usernameDraft:""}/><input type="hidden" name="unit_system" value={system}/>{isInitialSetup?<input type="hidden" name="fit_community" value={communityDraft}/>:null}{visibleTypes.map((type)=><span key={type.key}><input type="hidden" name={`measurement_${type.key}`} value={values[type.key]??""}/>{confirmedUnchanged.has(type.key)?<input type="hidden" name={`confirm_measurement__${type.key}`} value="1"/>:null}</span>)}
      <div className="buttonRow"><button type="button" className="secondaryButton" onClick={()=>setReviewing(false)}>← Back to Edit</button><button type="submit" className="primaryButton">Confirm & Save</button></div>
    </>:<>
      <p className={helpStyles.coreIntro}>Add only what you know right now. More details lead to better fit matches and recommendations. You can always update your profile measurements anytime.</p>
      <div className="fieldPair">{isInitialSetup?<label>Username<div><input name="username" type="text" value={usernameDraft} onChange={(event)=>setUsernameDraft(event.target.value)} minLength={3} maxLength={32} pattern="[A-Za-z0-9_]{3,32}" autoCapitalize="none" autoCorrect="off" spellCheck={false} required /></div></label>:null}<label>Units<select name="unit_system" value={system} onChange={(event)=>changeSystem(event.target.value as UnitSystem)}><option value="imperial">Inches / pounds</option><option value="metric">Centimeters / kilograms</option></select></label></div>
      {isInitialSetup?<label>Fit Community<select name="fit_community" value={communityDraft} onChange={(event)=>setCommunityDraft(event.target.value as FitCommunity)} required><option value="" disabled>Choose your Fit Community</option><option value="men">Men</option><option value="women">Women</option><option value="both">Both</option></select><span className="fieldHelp">Choose which member-fit community LikeSized should prioritize for your personalized feed and Fit Twin suggestions. This does not change your body Match %, and you can switch views anytime without changing this default.</span></label>:null}
      <div className="fieldPair">{core.map(field)}</div>
      <details open={advanced.some((type)=>Boolean(values[type.key]))}><summary>Optional advanced measurements</summary><p className="muted">Add more detailed measurements for even smarter fit matches. Fill in only what you know and come back anytime to add more or make changes.</p><div className="fieldPair optionalFields">{advanced.map(field)}</div></details>
      <button type="submit" className="primaryButton fullButton">{isInitialSetup?"Review Fit Profile →":"Review Changes →"}</button>
    </>}
    {helpKey?<MeasurementHelpDialog measurementKey={helpKey} onClose={()=>setHelpKey(null)}/>:null}
  </form>;
}
