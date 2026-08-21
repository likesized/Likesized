"use client";

import { useState } from "react";
import { saveFitProfile } from "@/app/onboarding/actions";
import { MeasurementHelpDialog } from "@/app/onboarding/MeasurementHelp";
import helpStyles from "@/app/onboarding/MeasurementHelp.module.css";

type UnitSystem = "imperial" | "metric";
export type MeasurementType = { key:string; label:string; core:boolean; measurement_group:string; dimension:"length"|"weight"; manual_step_imperial:number|string; manual_step_metric:number|string; sort_order:number };
export type BodyMeasurement = { measurement_type_key:string; entered_value:number|string; entered_unit:string };

type Props={username:string;unitSystem:UnitSystem;types:MeasurementType[];measurements:BodyMeasurement[];errorMessage:string|null};

const INCH_FRACTIONS=[
  {value:"0",label:"0"},
  {value:"0.25",label:"¼"},
  {value:"0.5",label:"½"},
  {value:"0.75",label:"¾"},
];
const HEIGHT_INCHES=Array.from({length:12},(_,index)=>index);
const DISPLAY_LABELS:Record<string,string>={
  chest_circumference:"Chest",
  full_bust:"Full Bust",
  high_bust:"High Bust",
  natural_waist:"Natural Waist",
  lower_pants_waist:"Pants Waist",
  high_hip:"High Hip",
  full_hip_seat:"Hips / Seat",
  waist_to_hip_length:"Waist-to-Hip Length",
  shoulder_width:"Shoulder Width",
  individual_shoulder_length:"Individual Shoulder Length",
  torso_body_length:"Torso Length",
  torso_girth:"Torso Girth",
  bust_point_to_bust_point:"Bust Point to Bust Point",
  shoulder_to_bust_point:"Shoulder to Bust Point",
  front_waist_length:"Front Waist Length",
  back_waist_length:"Back Waist Length",
  shoulder_to_waist:"Shoulder to Waist",
  across_back_width:"Across-Back Width",
  across_front_chest_width:"Across-Front Chest Width",
  arm_sleeve_length:"Arm / Sleeve Length",
  bicep_upper_arm:"Upper Arm Circumference",
  elbow_circumference:"Elbow Circumference",
  wrist_circumference:"Wrist Circumference",
  neck_collar_circumference:"Neck / Collar Circumference",
  thigh_circumference:"Thigh Circumference",
  knee_circumference:"Knee Circumference",
  calf_circumference:"Calf Circumference",
  outseam:"Outseam",
  front_rise:"Front Rise",
  back_rise:"Back Rise",
  crotch_depth:"Crotch Depth",
  total_crotch_length:"Total Crotch Length",
  foot_length:"Foot Length",
  foot_width:"Foot Width",
};

function displayLabel(type:MeasurementType){return DISPLAY_LABELS[type.key]??type.label;}
function targetUnit(type:MeasurementType,system:UnitSystem){return type.dimension==="weight"?(system==="imperial"?"lb":"kg"):(system==="imperial"?"in":"cm");}
function convert(value:number,from:string,to:string){
  if(from===to)return value;
  if(from==="in"&&to==="cm")return value*2.54;
  if(from==="cm"&&to==="in")return value/2.54;
  if(from==="lb"&&to==="kg")return value*0.45359237;
  if(from==="kg"&&to==="lb")return value/0.45359237;
  return value;
}
function roundStep(value:number,step:number){return Number((Math.round(value/step)*step).toFixed(4));}
function stepFor(type:MeasurementType,system:UnitSystem){
  if(system==="imperial"&&type.dimension==="length")return type.key==="height"?1:0.25;
  return Number(system==="imperial"?type.manual_step_imperial:type.manual_step_metric);
}
function inchParts(raw:string){
  if(!raw)return{whole:"",fraction:"0"};
  const value=Number(raw);
  if(!Number.isFinite(value))return{whole:"",fraction:"0"};
  let whole=Math.floor(value+0.000001);
  let fraction=Math.round((value-whole)*4)/4;
  if(fraction>=1){whole+=1;fraction=0;}
  return{whole:String(whole),fraction:String(fraction)};
}
function heightParts(raw:string){
  if(!raw)return{feet:"",inches:"0"};
  const total=Math.max(0,Math.round(Number(raw)));
  if(!Number.isFinite(total))return{feet:"",inches:"0"};
  return{feet:String(Math.floor(total/12)),inches:String(total%12)};
}

export function FitProfileForm({username,unitSystem:initialSystem,types,measurements,errorMessage}:Props){
  const visibleTypes=types.filter((type)=>type.key!=="overbust");
  const byKey=new Map(measurements.map((row)=>[row.measurement_type_key,row]));
  const [system,setSystem]=useState<UnitSystem>(initialSystem);
  const [helpKey,setHelpKey]=useState<string|null>(null);
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(visibleTypes.map((type)=>{
    const row=byKey.get(type.key);
    if(!row)return[type.key,""];
    const to=targetUnit(type,initialSystem);
    const converted=convert(Number(row.entered_value),row.entered_unit,to);
    return[type.key,String(roundStep(converted,stepFor(type,initialSystem)))];
  })));

  function setMeasurementValue(key:string,value:string){
    setValues((current)=>({...current,[key]:value}));
  }

  function setImperialLength(key:string,wholeRaw:string,fractionRaw:string){
    if(wholeRaw===""){setMeasurementValue(key,"");return;}
    const whole=Number(wholeRaw);
    const fraction=Number(fractionRaw);
    if(!Number.isFinite(whole)||!Number.isFinite(fraction)){setMeasurementValue(key,"");return;}
    setMeasurementValue(key,String(whole+fraction));
  }

  function setHeight(feetRaw:string,inchesRaw:string){
    if(feetRaw===""){setMeasurementValue("height","");return;}
    const feet=Number(feetRaw);
    const inches=Number(inchesRaw);
    if(!Number.isInteger(feet)||feet<0||!Number.isInteger(inches)||inches<0||inches>11){setMeasurementValue("height","");return;}
    setMeasurementValue("height",String(feet*12+inches));
  }

  function changeSystem(next:UnitSystem){
    if(next===system)return;
    const nextValues:{[key:string]:string}={};
    for(const type of visibleTypes){
      const raw=values[type.key];
      if(!raw){nextValues[type.key]="";continue;}
      const value=Number(raw);
      const converted=convert(value,targetUnit(type,system),targetUnit(type,next));
      nextValues[type.key]=String(roundStep(converted,stepFor(type,next)));
    }
    setValues(nextValues);
    setSystem(next);
  }

  const core=visibleTypes.filter((row)=>row.core);
  const advanced=visibleTypes.filter((row)=>!row.core);
  const field=(type:MeasurementType)=>{
    const suffix=targetUnit(type,system);
    const inputId=`measurement_${type.key}`;
    const label=displayLabel(type);

    if(system==="imperial"&&type.dimension==="length"&&type.key==="height"){
      const parts=heightParts(values[type.key]??"");
      return <div key={type.key} className={helpStyles.measurementField}>
        <div className={helpStyles.measurementLabelRow}>
          <label htmlFor={`${inputId}_feet`}>{label}</label>
          <button type="button" className={helpStyles.helpButton} aria-label={`How to measure ${label}`} onClick={()=>setHelpKey(type.key)}>?</button>
        </div>
        <input type="hidden" name={`measurement_${type.key}`} value={values[type.key]??""}/>
        <div className={`${helpStyles.measurementInputRow} ${helpStyles.imperialMeasurementRow}`}>
          <input id={`${inputId}_feet`} aria-label={`${label} feet`} type="number" inputMode="numeric" min="0" max="9" step="1" value={parts.feet} onChange={(event)=>setHeight(event.target.value,parts.inches)}/>
          <span>ft</span>
          <select aria-label={`${label} inches`} value={parts.inches} onChange={(event)=>setHeight(parts.feet,event.target.value)} disabled={!parts.feet}>
            {HEIGHT_INCHES.map((inch)=><option key={inch} value={inch}>{inch}</option>)}
          </select>
          <span>in</span>
        </div>
      </div>;
    }

    if(system==="imperial"&&type.dimension==="length"){
      const parts=inchParts(values[type.key]??"");
      return <div key={type.key} className={helpStyles.measurementField}>
        <div className={helpStyles.measurementLabelRow}>
          <label htmlFor={`${inputId}_whole`}>{label}</label>
          <button type="button" className={helpStyles.helpButton} aria-label={`How to measure ${label}`} onClick={()=>setHelpKey(type.key)}>?</button>
        </div>
        <input type="hidden" name={`measurement_${type.key}`} value={values[type.key]??""}/>
        <div className={`${helpStyles.measurementInputRow} ${helpStyles.imperialMeasurementRow}`}>
          <input id={`${inputId}_whole`} aria-label={`${label} whole inches`} type="number" inputMode="numeric" min="0" step="1" value={parts.whole} onChange={(event)=>setImperialLength(type.key,event.target.value,parts.fraction)}/>
          <select aria-label={`${label} fractional inches`} value={parts.fraction} onChange={(event)=>setImperialLength(type.key,parts.whole,event.target.value)} disabled={!parts.whole}>
            {INCH_FRACTIONS.map((fraction)=><option key={fraction.value} value={fraction.value}>{fraction.label}</option>)}
          </select>
          <span>in</span>
        </div>
      </div>;
    }

    const step=stepFor(type,system);
    return <div key={type.key} className={helpStyles.measurementField}>
      <div className={helpStyles.measurementLabelRow}>
        <label htmlFor={inputId}>{label}</label>
        <button type="button" className={helpStyles.helpButton} aria-label={`How to measure ${label}`} onClick={()=>setHelpKey(type.key)}>?</button>
      </div>
      <div className={helpStyles.measurementInputRow}>
        <input id={inputId} name={`measurement_${type.key}`} type="number" inputMode="decimal" min="0" step={step} value={values[type.key]??""} onChange={(event)=>setMeasurementValue(type.key,event.target.value)}/>
        <span>{suffix}</span>
      </div>
    </div>;
  };

  return <form className="fitForm" action={saveFitProfile}>
    {errorMessage?<div className="authMessage error">{errorMessage}</div>:null}
    <h2>Core Fit Profile</h2>
    <p className={helpStyles.coreIntro}>Add only what you know right now. More details lead to better fit matches and recommendations. You can always update your profile measurements anytime.</p>
    <div className="fieldPair"><label>Username<div><input name="username" type="text" defaultValue={username} minLength={3} maxLength={32} pattern="[A-Za-z0-9_]{3,32}" autoCapitalize="none" autoCorrect="off" spellCheck={false} required /></div></label><label>Units<select name="unit_system" value={system} onChange={(event)=>changeSystem(event.target.value as UnitSystem)}><option value="imperial">Inches / pounds</option><option value="metric">Centimeters / kilograms</option></select></label></div>
    <div className="fieldPair">{core.map(field)}</div>
    <details open={advanced.some((type)=>Boolean(values[type.key]))}><summary>Optional advanced measurements</summary><p className="muted">Add more detailed measurements for even smarter fit matches. Fill in only what you know and come back anytime to add more or make changes.</p><div className="fieldPair optionalFields">{advanced.map(field)}</div></details>
    <button type="submit" className="primaryButton fullButton">Save Fit Profile →</button>
    {helpKey?<MeasurementHelpDialog measurementKey={helpKey} onClose={()=>setHelpKey(null)}/>:null}
  </form>;
}
