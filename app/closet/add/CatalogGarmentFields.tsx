"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { COLOR_FAMILIES, GARMENT_CATEGORIES, GARMENT_TYPES, questionsForGarmentType } from "@/lib/garment-taxonomy";

type Brand={id:string;name:string};
type Product={id:string;name:string;brand_name:string;garment_type_key:string|null;manufacturer_style_number:string|null};
type External={id:string;provider:string;externalProductId:string;brand:string;itemName:string;sourceUrl:string|null;imageUrl:string|null;styleId:string|null;sourceName:string|null;garmentType:string|null;colors:string[];sourceRecord:Record<string,unknown>};
type IntakeMode={retailImport:boolean;hasImportedColors:boolean};
const IntakeModeContext=createContext<IntakeMode>({retailImport:false,hasImportedColors:false});

function itemNameWithoutBrand(brand:string,itemName:string){
  const normalizedBrand=brand.trim().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return normalizedBrand?itemName.replace(new RegExp(`^${normalizedBrand}\\s*[·:|—-]?\\s*`,"i"),"").trim()||itemName:itemName;
}

export function CatalogColorField(){
  const {retailImport,hasImportedColors}=useContext(IntakeModeContext);
  return !retailImport||!hasImportedColors
    ? <label>Color<select name="color_family" defaultValue="" required><option value="" disabled>Select a color</option>{COLOR_FAMILIES.map((item)=><option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
    : <input type="hidden" name="color_family" value=""/>;
}
export function CatalogManualIdentifiers(){
  const {retailImport}=useContext(IntakeModeContext);
  return retailImport?null:<div className="fieldPair"><label>Product link <span className="muted inlineMuted">optional</span><input name="product_url" type="url" maxLength={1000} placeholder="https://..." /></label><label>Barcode / SKU <span className="muted inlineMuted">optional</span><input name="identifier" maxLength={120} placeholder="Scan or enter if available" /></label></div>;
}

export function CatalogGarmentFields({brands,children}:{brands:Brand[];products:Product[];children:ReactNode}){
  const [step,setStep]=useState<"find"|"details">("find"),[query,setQuery]=useState(""),[brand,setBrand]=useState(""),[itemName,setItemName]=useState(""),[type,setType]=useState(""),[style,setStyle]=useState(""),[existing,setExisting]=useState(""),[confirmation,setConfirmation]=useState<""|"confirm"|"change"|"unsure">("");
  const [local,setLocal]=useState<Product[]>([]),[online,setOnline]=useState<External[]>([]),[error,setError]=useState(""),[retailSearch,setRetailSearch]=useState(false),[findMode,setFindMode]=useState<"barcode"|"likesized"|"retail">("likesized"),[sourceUrl,setSourceUrl]=useState(""),[provider,setProvider]=useState(""),[record,setRecord]=useState(""),[selectedImage,setSelectedImage]=useState(""),[hasImportedColors,setHasImportedColors]=useState(false),[answers,setAnswers]=useState<Record<string,string>>({}),[loadingExternalId,setLoadingExternalId]=useState("");
  const scannerVideo=useRef<HTMLVideoElement>(null),scannerControls=useRef<{stop:()=>void}|null>(null);
  const selectedType=GARMENT_TYPES.find((item)=>item.key===type);
  const questions=questionsForGarmentType(type).filter((item)=>item.key!=="neckline_height"||(answers.top_sleeve!=="strapless"&&answers.swim_top!=="strapless"));

  useEffect(()=>{
    if(step!=="find"||query.trim().length<3){setLocal([]);setOnline([]);setError("");return;}
    const controller=new AbortController(),timer=window.setTimeout(async()=>{
      try{
        const response=await fetch(`/api/catalog/search?q=${encodeURIComponent(query)}${retailSearch?"&retail=1":""}`,{signal:controller.signal});
        const body=await response.json() as {local?:Product[];external?:External[];error?:string};
        if(!response.ok){setLocal([]);setOnline([]);setError(body.error??"Item search could not load right now. Please try again.");return;}
        setLocal(body.local??[]);setOnline(body.external??[]);setError("");
      }catch(e){if((e as Error).name!=="AbortError")setError("Item search could not load right now. Please try again.");}
    },350);
    return()=>{clearTimeout(timer);controller.abort();};
  },[step,query,retailSearch]);

  function stopScanner(){scannerControls.current?.stop();scannerControls.current=null;}
  useEffect(()=>()=>stopScanner(),[]);
  async function startScanner(){
    try{
      stopScanner();
      const video=scannerVideo.current;
      if(!video)throw new Error("Scanner is not ready");
      const {BrowserMultiFormatReader}=await import("@zxing/browser");
      const reader=new BrowserMultiFormatReader();
      scannerControls.current=await reader.decodeFromConstraints({video:{facingMode:{ideal:"environment"}}},video,(result)=>{
        const code=result?.getText().replace(/\D/g,"");
        if(code){stopScanner();setQuery(code);setRetailSearch(true);}
      });
    }catch{setError("Camera access was not available. Type the UPC below instead.");}
  }
  useEffect(()=>{if(step!=="find"||findMode!=="barcode")return;const timer=window.setTimeout(()=>void startScanner(),50);return()=>{clearTimeout(timer);stopScanner();};},[step,findMode]);

  function clearSource(){
    setExisting("");setConfirmation("");setSourceUrl("");setProvider("");setRecord("");setHasImportedColors(false);
  }
  function chooseLocal(item:Product){
    clearSource();setSelectedImage("");setExisting(item.id);setBrand(item.brand_name);setItemName(item.name);setType(item.garment_type_key??"");setStyle(item.manufacturer_style_number??"");setAnswers({});setStep("details");
  }
  async function chooseOnline(item:External){
    let selected=item;
    setError("");
    setLoadingExternalId(item.id);
    try{
      if(item.provider==="channel3_catalog"&&item.sourceUrl){
        const response=await fetch("/api/catalog/lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:item.sourceUrl,productId:item.externalProductId})});
        const body=await response.json() as {product?:External;error?:string};
        if(!response.ok||!body.product)throw new Error(body.error??"Detailed product information could not be loaded.");
        selected=body.product;
      }
      clearSource();
      setSelectedImage(selected.imageUrl??"");
      setBrand(selected.brand);
      setItemName(itemNameWithoutBrand(selected.brand,selected.itemName));
      setType(selected.garmentType??"");
      setStyle(selected.styleId??"");
      setSourceUrl(selected.sourceUrl??"");
      setProvider(selected.provider);
      setRecord(JSON.stringify({externalProductId:selected.externalProductId,sourceRecord:selected.sourceRecord,imageUrl:selected.imageUrl}));
      setHasImportedColors(selected.colors.length>0);
      setAnswers({});
      setStep("details");
    }catch{
      setError("We found the item, but its detailed product information could not be loaded. Try another result or enter it manually.");
    }finally{
      setLoadingExternalId("");
    }
  }
  function chooseManual(){clearSource();setSelectedImage("");setBrand("");setItemName("");setType("");setStyle("");setAnswers({});setStep("details");}
  function reset(){stopScanner();clearSource();setSelectedImage("");setQuery("");setLocal([]);setOnline([]);setFindMode("likesized");setStep("find");}

  if(step==="find")return <section className="fitDimensionFields">
    {findMode==="barcode"
      ? <><button className="catalogBackButton" type="button" onClick={()=>{stopScanner();setFindMode("likesized");setQuery("");setLocal([]);setOnline([]);}}>← Search LikeSized instead</button><p className="fieldHelp">LikeSized checks the scanned UPC first, then imports a retail match when needed.</p><video className="barcodeScanner" ref={scannerVideo} muted playsInline/><label>UPC / barcode<input autoFocus value={query} inputMode="numeric" onChange={(e)=>{setQuery(e.target.value);setRetailSearch(true);}} placeholder="Scan or type barcode"/><span className="fieldHelp">Type it if your camera is unavailable.</span></label><button className="catalogManualButton" type="button" onClick={chooseManual}>Enter item manually</button></>
      : <><label>Find your item<input autoFocus value={query} onChange={(e)=>{setQuery(e.target.value);setRetailSearch(false);}} placeholder="Search LikeSized by brand, item name, Style ID, or barcode"/><span className="fieldHelp">Search LikeSized first.</span></label><div className="catalogSearchActions"><button className="catalogSearchButton" type="button" onClick={()=>{setFindMode("barcode");setError("");}}>Scan barcode</button><button className="catalogManualButton" type="button" onClick={chooseManual}>Enter item manually</button></div></>}
    {query.trim().length>=3?<div className="catalogSuggestionList">
      {local.map((item)=><button className="catalogSuggestion" type="button" onClick={()=>chooseLocal(item)} key={item.id}><span><b>{item.brand_name} · {item.name}</b><small>Already in LikeSized</small></span></button>)}
      {online.map((item)=><button className="catalogSuggestion" type="button" disabled={Boolean(loadingExternalId)} onClick={()=>void chooseOnline(item)} key={item.id}>{item.imageUrl?<img src={item.imageUrl} alt=""/>:null}<span><b>{item.brand?item.brand+" · ":""}{item.itemName}</b><small>{loadingExternalId===item.id?"Loading product details…":item.sourceName??"Retail catalog"}</small></span></button>)}
    </div>:null}
    {findMode==="likesized"&&query.trim().length>=3&&local.length===0?<div className="catalogSearchActions"><button className="catalogSearchButton" type="button" onClick={()=>{setFindMode("retail");setRetailSearch(true);}}>Can’t find the exact item? Search retail catalog</button></div>:null}
    {error?<p className="fieldHelp" role="status">{error}</p>:null}
  </section>;

  return <><input type="hidden" name="existing_product_id" value={existing}/><input type="hidden" name="catalog_confirmation" value={confirmation}/><input type="hidden" name="catalog_source_url" value={sourceUrl}/><input type="hidden" name="catalog_source_provider" value={provider}/><input type="hidden" name="catalog_source_record" value={record}/>
    <section className="fitDimensionFields">
      <button className="catalogBackButton" type="button" onClick={reset}>← Find a different item</button>
      {itemName?<div className="catalogSelectedItem">{selectedImage?<img src={selectedImage} alt=""/>:null}<span><small>{provider?"Imported from retail catalog":"Selected item"}</small><b>{brand?brand+" · ":""}{itemName}</b></span></div>:null}
      {provider?<><input type="hidden" name="brand" value={brand}/><input type="hidden" name="product" value={itemName}/></>:<div className="fieldPair"><label>Brand<input name="brand" list="brand-options" maxLength={120} value={brand} onChange={(e)=>{clearSource();setSelectedImage("");setBrand(e.target.value);}} required/><datalist id="brand-options">{brands.map((item)=><option value={item.name} key={item.id}/>)}</datalist></label><label>Item name<input name="product" maxLength={180} value={itemName} onChange={(e)=>{clearSource();setSelectedImage("");setItemName(e.target.value);}} required/></label></div>}
      {existing?<fieldset className="fitDimensionFields"><legend>Are the saved item details correct?</legend><div className="fieldPair"><label><input type="radio" checked={confirmation==="confirm"} onChange={()=>setConfirmation("confirm")}/> Yes, they’re correct</label><label><input type="radio" checked={confirmation==="change"} onChange={()=>setConfirmation("change")}/> I need to change something</label><label><input type="radio" checked={confirmation==="unsure"} onChange={()=>setConfirmation("unsure")}/> Not sure</label></div></fieldset>:null}

      {provider&&type?<input type="hidden" name="garment_type" value={type}/>:null}
      {provider&&!type?<label>Garment type<select name="garment_type" value={type} onChange={(e)=>{setType(e.target.value);setAnswers({});}} required><option value="" disabled>Select the specific garment</option>{GARMENT_CATEGORIES.map((category)=><optgroup key={category.value} label={category.label}>{GARMENT_TYPES.filter((item)=>item.category===category.value).map((item)=><option value={item.key} key={item.key}>{item.label}</option>)}</optgroup>)}</select><span className="fieldHelp">We found the product but need this one detail before continuing.</span></label>:null}
      {!provider?<label>Garment type<select name="garment_type" value={type} onChange={(e)=>{clearSource();setType(e.target.value);setAnswers({});}} required><option value="" disabled>Select the specific garment</option>{GARMENT_CATEGORIES.map((category)=><optgroup key={category.value} label={category.label}>{GARMENT_TYPES.filter((item)=>item.category===category.value).map((item)=><option value={item.key} key={item.key}>{item.label}</option>)}</optgroup>)}</select>{selectedType?<span className="fieldHelp">LikeSized files this under {GARMENT_CATEGORIES.find((item)=>item.value===selectedType.category)?.label} automatically.</span>:null}</label>:null}

      {type&&!provider&&(!existing||confirmation==="change")?<fieldset className="fitDimensionFields"><legend>Optional item details</legend><p className="fieldHelp">Choose only what you know. “Not sure” records no claim.</p><div className="fieldPair">{questions.map((item)=><label key={item.key}>{item.label}<select name={`product_attribute__${item.key}`} value={answers[item.key]??""} onChange={(e)=>{const value=e.target.value;setAnswers((current)=>{const next={...current,[item.key]:value};if((item.key==="top_sleeve"||item.key==="swim_top")&&value==="strapless")delete next.neckline_height;return next;});}}><option value="">Not sure</option>{item.options.map((option)=><option value={option.value} key={option.value}>{option.label}</option>)}</select></label>)}</div></fieldset>:null}
      {provider?<input type="hidden" name="style_number" value={style}/>:<label>Manufacturer Style ID <span className="muted inlineMuted">optional</span><input name="style_number" maxLength={100} value={style} onChange={(e)=>{clearSource();setStyle(e.target.value);}}/></label>}
    </section>
    <IntakeModeContext.Provider value={{retailImport:Boolean(provider),hasImportedColors}}>{children}</IntakeModeContext.Provider>
  </>;
}
