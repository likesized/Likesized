"use client";

import { useMemo, useState } from "react";
import { FitDimensionFields } from "@/app/closet/FitDimensionFields";
import { GARMENT_MARKET_SEGMENTS } from "@/lib/domain";

type Brand={id:string;name:string};
type Product={id:string;name:string;brand_id:string;brand_name:string;garment_type_key:string|null;market_segment:string;manufacturer_style_number:string|null};
type GarmentType={key:string;label:string;category?:string|null};
type Dimension={garment_type_key:string;dimension_key:string;label:string;sort_order:number};
type Response={dimension_key:string;response_key:string;label:string;sort_order:number};

function normalize(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"");}

export function CatalogGarmentFields({brands,products,garmentTypes,dimensions,responses}:{brands:Brand[];products:Product[];garmentTypes:GarmentType[];dimensions:Dimension[];responses:Response[]}){
  const [brand,setBrand]=useState("");
  const [product,setProduct]=useState("");
  const [garmentType,setGarmentType]=useState("");
  const [marketSegment,setMarketSegment]=useState("unknown");
  const [styleNumber,setStyleNumber]=useState("");
  const [existingProductId,setExistingProductId]=useState("");

  const matches=useMemo(()=>{
    const productNeedle=normalize(product);
    const brandNeedle=normalize(brand);
    if(productNeedle.length<2)return [];
    return products.filter((item)=>{
      const productMatch=normalize(item.name).includes(productNeedle);
      const brandMatch=!brandNeedle||normalize(item.brand_name).includes(brandNeedle);
      return productMatch&&brandMatch;
    }).slice(0,12);
  },[brand,product,products]);

  function clearExact(){if(existingProductId)setExistingProductId("");}
  function chooseExisting(id:string){
    const selected=products.find((item)=>item.id===id);
    if(!selected)return;
    setExistingProductId(selected.id);
    setBrand(selected.brand_name);
    setProduct(selected.name);
    setGarmentType(selected.garment_type_key??"");
    setMarketSegment(selected.market_segment||"unknown");
    setStyleNumber(selected.manufacturer_style_number??"");
  }

  return <>
    <input type="hidden" name="existing_product_id" value={existingProductId}/>
    <div className="fieldPair">
      <label>Brand
        <input name="brand" list="brand-options" maxLength={120} placeholder="Levi's" value={brand} onChange={(event)=>{clearExact();setBrand(event.target.value);}} required/>
        <datalist id="brand-options">{brands.map((item)=><option value={item.name} key={item.id}/>)}</datalist>
        <span className="fieldHelp">Start with an existing brand when possible. New punctuation/case variants still normalize to the same canonical brand.</span>
      </label>
      <label>Product / style
        <input name="product" maxLength={180} placeholder="541 Athletic Taper" value={product} onChange={(event)=>{clearExact();setProduct(event.target.value);}} required/>
        <span className="fieldHelp">Type at least 2 characters to search existing canonical products before creating a new one.</span>
      </label>
    </div>
    {matches.length&&!existingProductId?<label>Existing catalog matches
      <select value="" onChange={(event)=>chooseExisting(event.target.value)}>
        <option value="">Choose an exact existing product if this is it</option>
        {matches.map((item)=><option value={item.id} key={item.id}>{item.brand_name} · {item.name}{item.manufacturer_style_number?` · Style ${item.manufacturer_style_number}`:""} · {item.market_segment}</option>)}
      </select>
      <span className="fieldHelp">Choosing a match reuses its exact Product ID and fills its canonical identity fields.</span>
    </label>:null}
    {existingProductId?<div className="privacyNote"><b>Existing canonical product selected.</b> This Closet log will reuse that exact product record. Editing any identity field below clears the exact selection and returns to normalized search/create.</div>:null}
    <div className="fieldPair">
      <label>Garment type
        <select name="garment_type" value={garmentType} onChange={(event)=>{clearExact();setGarmentType(event.target.value);}} required>
          <option value="" disabled>Select garment type</option>
          {garmentTypes.map((type)=><option value={type.key} key={type.key}>{type.label}</option>)}
        </select>
      </label>
      <label>Market / cut segment
        <select name="market_segment" value={marketSegment} onChange={(event)=>{clearExact();setMarketSegment(event.target.value);}}>
          {GARMENT_MARKET_SEGMENTS.map((item)=><option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
        <span className="fieldHelp">Describes the garment sizing/cut system—not your gender identity.</span>
      </label>
    </div>
    <FitDimensionFields garmentType={garmentType} dimensions={dimensions} responses={responses}/>
    <label>Manufacturer style / Style ID
      <input name="style_number" maxLength={100} placeholder="Optional" value={styleNumber} onChange={(event)=>{clearExact();setStyleNumber(event.target.value);}}/>
      <span className="fieldHelp">If you choose an existing catalog match, its known Style ID is filled automatically.</span>
    </label>
  </>;
}
