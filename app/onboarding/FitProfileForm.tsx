"use client";

import { useState } from "react";
import { saveFitProfile } from "@/app/onboarding/actions";

type UnitSystem = "imperial" | "metric";
export type MeasurementType = { key:string; label:string; core:boolean; measurement_group:string; dimension:"length"|"weight"; manual_step_imperial:number|string; manual_step_metric:number|string; sort_order:number };
export type BodyMeasurement = { measurement_type_key:string; entered_value:number|string; entered_unit:string };

type Props={username:string;unitSystem:UnitSystem;types:MeasurementType[];measurements:BodyMeasurement[];errorMessage:string|null};

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

export function FitProfileForm({username,unitSystem:initialSystem,types,measurements,errorMessage}:Props){
  const byKey=new Map(measurements.map((row)=>[row.measurement_type_key,row]));
  const [system,setSystem]=useState<UnitSystem>(initialSystem);
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(types.map((type)=>{
    const row=byKey.get(type.key);
    if(!row)return[type.key,""];
    const to=targetUnit(type,initialSystem);
    const converted=convert(Number(row.entered_value),row.entered_unit,to);
    const step=Number(initialSystem==="imperial"?type.manual_step_imperial:type.manual_step_metric);
    return[type.key,String(roundStep(converted,step))];
  })));

  function changeSystem(next:UnitSystem){
    if(next===system)return;
    const nextValues:{[key:string]:string}={};
    for(const type of types){
      const raw=values[type.key];
      if(!raw){nextValues[type.key]="";continue;}
      const value=Number(raw);
      const converted=convert(value,targetUnit(type,system),targetUnit(type,next));
      const step=Number(next==="imperial"?type.manual_step_imperial:type.manual_step_metric);
      nextValues[type.key]=String(roundStep(converted,step));
    }
    setValues(nextValues);
    setSystem(next);
  }

  const core=types.filter((row)=>row.core);
  const advanced=types.filter((row)=>!row.core);
  const field=(type:MeasurementType)=>{
    const step=Number(system==="imperial"?type.manual_step_imperial:type.manual_step_metric);
    const suffix=targetUnit(type,system);
    return <label key={type.key}>{type.label}<div><input name={`measurement_${type.key}`} type="number" inputMode="decimal" min="0" step={step} value={values[type.key]??""} onChange={(event)=>setValues((current)=>({...current,[type.key]:event.target.value}))}/><span>{suffix}</span></div></label>;
  };

  return <form className="fitForm" action={saveFitProfile}>
    {errorMessage?<div className="authMessage error">{errorMessage}</div>:null}
    <div className="fieldPair"><label>Username<div><input name="username" type="text" defaultValue={username} minLength={3} maxLength={32} pattern="[A-Za-z0-9_]{3,32}" required /></div></label><label>Units<select name="unit_system" value={system} onChange={(event)=>changeSystem(event.target.value as UnitSystem)}><option value="imperial">Inches / pounds</option><option value="metric">Centimeters / kilograms</option></select></label></div>
    <h2>Core Fit Profile</h2><p className="muted">Enter what you know. Missing measurements reduce coverage/confidence; they do not make matching fail.</p>
    <div className="fieldPair">{core.map(field)}</div>
    <details open={advanced.some((type)=>Boolean(values[type.key]))}><summary>Optional advanced measurements</summary><p className="muted">Bust, underbust, neck/collar, sleeve/arm, rise, thigh, torso and foot measurements live here as controlled types. Garment-specific prompts can ask for only what matters later.</p><div className="fieldPair optionalFields">{advanced.map(field)}</div></details>
    <div className="privacyNote"><b>History:</b> saving changed measurements creates a new private body-state version. Existing garment Fit Reports stay permanently tied to the version from when they were logged.</div>
    <button type="submit" className="primaryButton fullButton">Save Fit Profile →</button>
  </form>;
}
