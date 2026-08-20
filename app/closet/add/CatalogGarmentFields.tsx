"use client";

import { useMemo, useState } from "react";
import { FitDimensionFields } from "@/app/closet/FitDimensionFields";
import { GARMENT_MARKET_SEGMENTS } from "@/lib/domain";

type Brand={id:string;name:string};
type Product={id:string;name:string;brand_id:string;brand_name:string;garment_type_key:string|null;market_segment:string;manufacturer_style_number:string|null};
type ProductFamily={id:string;name:string;brand_id:string;brand_name:string;garment_type_key:string;market_segment:string};
type GarmentType={key:string;label:string;category?:string|null};
type Dimension={garment_type_key:string;dimension_key:string;label:string;sort_order:number};
type Response={dimension_key:string;response_key:string;label:string;sort_order:number};
type AttributeDefinition={key:string;label:string;category:string|null;sort_order:number};
type AttributeOption={attribute_key:string;option_key:string;label:string;sort_order:number};
type Material={key:string;label:string};

function normalize(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"");}

export function CatalogGarmentFields({brands,products,families,garmentTypes,dimensions,responses,attributeDefinitions,attributeOptions,materials}:{brands:Brand[];products:Product[];families:ProductFamily[];garmentTypes:GarmentType[];dimensions:Dimension[];responses:Response[];attributeDefinitions:AttributeDefinition[];attributeOptions:AttributeOption[];materials:Material[]}){
  const [brand,setBrand]=useState("");
  const [product,setProduct]=useState("");
  const [garmentType,setGarmentType]=useState("");
  const [marketSegment,setMarketSegment]=useState("unknown");
  const [styleNumber,setStyleNumber]=useState("");
  const [existingProductId,setExistingProductId]=useState("");
  const [familyId,setFamilyId]=useState("");

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

  const compatibleFamilies=useMemo(()=>{
    if(existingProductId||!brand||!garmentType)return [];
    const selectedBrand=brands.find((item)=>normalize(item.name)===normalize(brand));
    if(!selectedBrand)return [];
    return families.filter((family)=>family.brand_id===selectedBrand.id&&family.garment_type_key===garmentType&&family.market_segment===marketSegment).slice(0,50);
  },[brand,brands,existingProductId,families,garmentType,marketSegment]);

  const selectedCategory=useMemo(()=>garmentTypes.find((item)=>item.key===garmentType)?.category??null,[garmentType,garmentTypes]);
  const relevantAttributes=useMemo(()=>attributeDefinitions.filter((definition)=>definition.key!=="primary_material"&&(definition.category===null||definition.category===selectedCategory)).sort((a,b)=>a.sort_order-b.sort_order),[attributeDefinitions,selectedCategory]);
  const optionsByAttribute=useMemo(()=>{
    const map=new Map<string,AttributeOption[]>();
    for(const option of attributeOptions){const list=map.get(option.attribute_key)??[];list.push(option);map.set(option.attribute_key,list);}
    for(const list of map.values())list.sort((a,b)=>a.sort_order-b.sort_order);
    return map;
  },[attributeOptions]);

  function clearExact(){if(existingProductId)setExistingProductId("");}
  function chooseExisting(id:string){
    const selected=products.find((item)=>item.id===id);
    if(!selected)return;
    setExistingProductId(selected.id);
    setFamilyId("");
    setBrand(selected.brand_name);
    setProduct(selected.name);
    setGarmentType(selected.garment_type_key??"");
    setMarketSegment(selected.market_segment||"unknown");
    setStyleNumber(selected.manufacturer_style_number??"");
  }

  return <>
    <input type="hidden" name="existing_product_id" value={existingProductId}/>
    <div className="privacyNote"><b>Find the exact garment first.</b> LikeSized resolves a known Product by exact catalog selection, then UPC/barcode, product URL, Brand + Style ID, and finally normalized Brand + Product name. Unknown garments become provisional catalog records instead of unverified permanent truth.</div>
    <div className="fieldPair">
      <label>Brand
        <input name="brand" list="brand-options" maxLength={120} placeholder="Levi's" value={brand} onChange={(event)=>{clearExact();setFamilyId("");setBrand(event.target.value);}} required/>
        <datalist id="brand-options">{brands.map((item)=><option value={item.name} key={item.id}/>)}</datalist>
        <span className="fieldHelp">Start with an existing brand when possible. Punctuation and case normalize to the same canonical brand.</span>
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
      <span className="fieldHelp">Choosing a match reuses its exact Product ID. Verified catalog facts are not rewritten by this Closet log.</span>
    </label>:null}
    {existingProductId?<div className="privacyNote"><b>Existing canonical product selected.</b> Identity fields come from that Product. Construction/material answers below are submitted as evidence and cannot overwrite verified facts from one member.</div>:null}

    <div className="fieldPair">
      <label>Manufacturer style / Style ID
        <input name="style_number" maxLength={100} placeholder="Optional" value={styleNumber} onChange={(event)=>{clearExact();setStyleNumber(event.target.value);}}/>
        <span className="fieldHelp">A Brand + Style ID can resolve an existing Product even when the product name was entered differently.</span>
      </label>
      <label>UPC / barcode / SKU
        <input name="identifier" maxLength={120} inputMode="numeric" placeholder="Scan or enter if available"/>
        <span className="fieldHelp">Numeric UPC/barcodes are the strongest automatic identifier. A SKU is stored, but is not treated as globally unique.</span>
      </label>
    </div>
    <label>Product URL <span className="muted inlineMuted">optional</span>
      <input name="product_url" type="url" maxLength={1000} placeholder="https://brand-or-retailer.com/product/..."/>
      <span className="fieldHelp">A known normalized product URL can resolve the canonical Product before LikeSized creates anything new.</span>
    </label>

    <div className="fieldPair">
      <label>Garment type
        <select name="garment_type" value={garmentType} onChange={(event)=>{clearExact();setFamilyId("");setGarmentType(event.target.value);}} required>
          <option value="" disabled>Select garment type</option>
          {garmentTypes.map((type)=><option value={type.key} key={type.key}>{type.label}</option>)}
        </select>
        <span className="fieldHelp">Garment type establishes the safe base measurement path even when no other product details are known.</span>
      </label>
      <label>Market / cut segment
        <select name="market_segment" value={marketSegment} onChange={(event)=>{clearExact();setFamilyId("");setMarketSegment(event.target.value);}}>
          {GARMENT_MARKET_SEGMENTS.map((item)=><option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
        <span className="fieldHelp">Describes the garment sizing/cut system—not your gender identity.</span>
      </label>
    </div>

    {!existingProductId?<label>Same fit / cut family <span className="muted inlineMuted">optional</span>
      <select name="product_family_id" value={familyId} onChange={(event)=>setFamilyId(event.target.value)}>
        <option value="">Start a new fit family for this product</option>
        {compatibleFamilies.map((family)=><option value={family.id} key={family.id}>{family.brand_name} · {family.name}</option>)}
      </select>
      <span className="fieldHelp">Only join an existing family when this is genuinely the same fit/cut released under another non-fit-critical style, color, wash, or release.</span>
    </label>:null}

    {garmentType&&materials.length?<fieldset className="fitDimensionFields"><legend>Fiber / material composition</legend><p className="fieldHelp">Use the care label when available. Fiber composition is stored separately from knit/woven construction and stretch because they affect fit differently. Percentages are optional.</p><div className="fieldPair">{[1,2,3].map((slot)=><div className="fieldPair" key={slot}><label>Material {slot}<select name={`product_material__${slot}__key`} defaultValue=""><option value="">Not specified</option>{materials.map((material)=><option value={material.key} key={material.key}>{material.label}</option>)}</select></label><label>Percent <span className="muted inlineMuted">optional</span><input name={`product_material__${slot}__percentage`} type="number" min="0" max="100" step="0.1" inputMode="decimal" placeholder="e.g. 98"/></label></div>)}</div></fieldset>:null}

    {garmentType&&relevantAttributes.length?<fieldset className="fitDimensionFields"><legend>Product construction details</legend><p className="fieldHelp">Only answer what you know. New member-entered details are provisional and influence matching softly until corroborated or verified; unknown details are never guessed.</p><div className="fieldPair">{relevantAttributes.map((definition)=><label key={definition.key}>{definition.label}<select name={`product_attribute__${definition.key}`} defaultValue=""><option value="">Not specified</option>{(optionsByAttribute.get(definition.key)??[]).map((option)=><option value={option.option_key} key={option.option_key}>{option.label}</option>)}</select></label>)}</div></fieldset>:null}

    <FitDimensionFields garmentType={garmentType} dimensions={dimensions} responses={responses}/>
  </>;
}
