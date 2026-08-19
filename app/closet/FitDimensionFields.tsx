"use client";

import { useMemo, useState } from "react";

type GarmentType={key:string;label:string;category?:string|null};
type Dimension={garment_type_key:string;dimension_key:string;label:string;sort_order:number};
type Response={dimension_key:string;response_key:string;label:string;sort_order:number};

export function FitDimensionFields({garmentTypes,dimensions,responses,garmentType,showGarmentSelect=false}:{garmentTypes?:GarmentType[];dimensions:Dimension[];responses:Response[];garmentType?:string|null;showGarmentSelect?:boolean}){
  const [selectedGarment,setSelectedGarment]=useState(garmentType??"");
  const relevant=useMemo(()=>dimensions.filter((item)=>item.garment_type_key===selectedGarment).sort((a,b)=>a.sort_order-b.sort_order),[dimensions,selectedGarment]);
  const responsesByDimension=useMemo(()=>{
    const map=new Map<string,Response[]>();
    for(const response of responses){const list=map.get(response.dimension_key)??[];list.push(response);map.set(response.dimension_key,list);}
    for(const list of map.values())list.sort((a,b)=>a.sort_order-b.sort_order);
    return map;
  },[responses]);

  return <>
    {showGarmentSelect?<label>Garment type<select name="garment_type" value={selectedGarment} onChange={(event)=>setSelectedGarment(event.target.value)} required><option value="" disabled>Select garment type</option>{(garmentTypes??[]).map((type)=><option value={type.key} key={type.key}>{type.label}</option>)}</select></label>:null}
    {relevant.length?<fieldset className="fitDimensionFields"><legend>How did each part fit?</legend><p className="fieldHelp">Optional, controlled fit details help LikeSized compare this garment more accurately.</p><div className="fieldPair">{relevant.map((dimension)=><label key={dimension.dimension_key}>{dimension.label}<select name={`fit_dimension__${dimension.dimension_key}`} defaultValue=""><option value="">Not answered</option>{(responsesByDimension.get(dimension.dimension_key)??[]).map((response)=><option value={response.response_key} key={response.response_key}>{response.label}</option>)}</select></label>)}</div></fieldset>:selectedGarment?<p className="fieldHelp">No additional fit questions are defined for this garment type yet.</p>:null}
  </>;
}
