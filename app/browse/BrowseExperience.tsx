"use client";

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import styles from "./browse.module.css";

type Mode="garments"|"outfits";
type Scope="matches"|"all";
type SearchTab="all"|"garments"|"outfits"|"people";
type Person={id:string;name:string;username:string;overall:number;tops:number;bottoms:number;followers:number;styleLikes:number;fitTwin:boolean;bio:string};
type Garment={id:string;brand:string;name:string;category:string;type:string;style:string;color:string;wearerId:string;wearer:string;size:string;fit:string;rating:number;match:number;overall:number;likes:number;age:number};
type Outfit={id:string;creatorId:string;creator:string;caption:string;type:string;season:string;match:number;likes:number;age:number;garments:string[]};
type Overlay={kind:"garment";id:string}|{kind:"outfit";id:string}|{kind:"person";id:string}|{kind:"style";id:string}|{kind:"reports";id:string}|null;

const people:Person[]=[
{id:"p1",name:"Tina Carter",username:"tinac",overall:94,tops:96,bottoms:91,followers:2400,styleLikes:18700,fitTwin:true,bio:"Denim, easy layers, and practical fit notes."},
{id:"p2",name:"Maya Reed",username:"mayareed",overall:91,tops:88,bottoms:95,followers:860,styleLikes:6420,fitTwin:true,bio:"Workwear, neutrals, and everyday outfits."},
{id:"p3",name:"Alex Jordan",username:"alexj",overall:87,tops:90,bottoms:84,followers:1310,styleLikes:9100,fitTwin:false,bio:"Casual staples and activewear."},
{id:"p4",name:"Sam Brooks",username:"samb",overall:82,tops:85,bottoms:79,followers:420,styleLikes:2880,fitTwin:false,bio:"Simple fits, jackets, and travel layers."},
{id:"p5",name:"Jordan Lee",username:"jlee",overall:78,tops:77,bottoms:81,followers:205,styleLikes:1330,fitTwin:false,bio:"Relaxed basics and weekend looks."},
];

const baseGarments=[
["Levi's","501 Original","Bottoms","Jeans","Straight","Dark Blue"],
["Madewell","Perfect Vintage Jean","Bottoms","Jeans","High-Waisted","Light Blue"],
["Everlane","Organic Cotton Box-Cut Tee","Tops","T-Shirts","Crop","White"],
["Aritzia","Contour Crew Bodysuit","Dresses & One-Pieces","Bodysuits","Fitted","Black"],
["Nike","One High-Waisted Leggings","Activewear","Bottoms","Leggings","Black"],
["J.Crew","Garçon Classic Shirt","Tops","Shirts & Blouses","Oversized","Blue"],
["Lululemon","Define Jacket","Activewear","Jackets & Layers","Zip-Up","Black"],
["Abercrombie","Sloane Tailored Pant","Bottoms","Pants","Dress Pants","Brown/Tan"],
["Free People","Hot Shot Onesie","Dresses & One-Pieces","Jumpsuits","Relaxed","Green"],
["Reformation","Tagliatelle Linen Dress","Dresses & One-Pieces","Dresses","Midi","White"],
] as const;

const garments:Garment[]=Array.from({length:50},(_,i)=>{
 const b=baseGarments[i%baseGarments.length],p=people[i%people.length];
 return{id:`g${i+1}`,brand:b[0],name:b[1],category:b[2],type:b[3],style:b[4],color:b[5],wearerId:p.id,wearer:p.name,size:["XS","S","M","L","XL","28","30","32"][i%8],fit:["Just Right","Snug","Relaxed","Just Right","Too Big"][i%5],rating:3+(i%3),match:99-(i%35),overall:p.overall,likes:36+((i*37)%520),age:i%31};
});

const outfits:Outfit[]=Array.from({length:30},(_,i)=>{const p=people[i%people.length];return{id:`o${i+1}`,creatorId:p.id,creator:p.name,caption:["Easy everyday layers","Workday neutrals","Dinner out","Weekend travel fit","Summer day look"][i%5],type:["Casual","Work","Going Out","Travel","Active"][i%5],season:["Year-Round","Fall","Summer","Spring","Winter"][i%5],match:97-(i%23),likes:18+((i*29)%410),age:i%24,garments:[garments[i%garments.length].id,garments[(i+3)%garments.length].id]};});

const categories=["All","Tops","Bottoms","Dresses & One-Pieces","Outerwear","Activewear","Swimwear","Lingerie","Shoes"];
const outfitTypes=["All","Casual","Work","Going Out","Formal","Active","Travel","Lounge","Swimwear","Lingerie"];
const seasons=["All","Spring","Summer","Fall","Winter","Year-Round"];
const tier=(score:number)=>score>=90?0:score>=85?1:score>=80?2:score>=75?3:4;
const hot=(likes:number,age:number)=>Math.log1p(likes)*.72+(1/(1+age/14))*2.8;
const person=(id:string)=>people.find(p=>p.id===id)!;
const sameProduct=(g:Garment)=>garments.filter(x=>x.brand===g.brand&&x.name===g.name);
const canonicalGarments=(items:Garment[])=>[...new Map([...items].sort((a,b)=>b.match-a.match).map(g=>[`${g.brand}::${g.name}`,g])).values()];

export default function BrowseExperience(){
 const[mode,setMode]=useState<Mode>("garments"),[gScope,setGScope]=useState<Scope>("matches"),[oScope,setOScope]=useState<Scope>("matches");
 const[gSort,setGSort]=useState("best"),[oSort,setOSort]=useState("best"),[category,setCategory]=useState("All"),[type,setType]=useState("All"),[style,setStyle]=useState("All"),[brand,setBrand]=useState("All"),[model,setModel]=useState("All"),[color,setColor]=useState("All");
 const[oType,setOType]=useState("All"),[season,setSeason]=useState("All"),[limit,setLimit]=useState(24),[query,setQuery]=useState(""),[searchOpen,setSearchOpen]=useState(false),[searchTab,setSearchTab]=useState<SearchTab>("all");
 const[overlay,setOverlay]=useState<Overlay>(null),[stack,setStack]=useState<Overlay[]>([]),[likedGarments,setLikedGarments]=useState<Set<string>>(new Set()),[likedOutfits,setLikedOutfits]=useState<Set<string>>(new Set()),[savedGarments,setSavedGarments]=useState<Set<string>>(new Set()),[savedOutfits,setSavedOutfits]=useState<Set<string>>(new Set()),[notified,setNotified]=useState<Set<string>>(new Set()),[following,setFollowing]=useState<Set<string>>(new Set(["p1"])),[personNotify,setPersonNotify]=useState<Set<string>>(new Set());
 const scope=mode==="garments"?gScope:oScope,q=query.trim().toLowerCase();

 useEffect(()=>{if(!overlay)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=old}},[overlay]);

 const brands=[...new Set(garments.map(g=>g.brand))].sort();
 const models=[...new Set(garments.filter(g=>brand!=="All"&&g.brand===brand).map(g=>g.name))].sort();
 const types=[...new Set(garments.filter(g=>category==="All"||g.category===category).map(g=>g.type))].sort();
 const stylesList=[...new Set(garments.filter(g=>(category==="All"||g.category===category)&&(type==="All"||g.type===type)).map(g=>g.style))].sort();
 const colors=[...new Set(garments.filter(g=>category==="All"||g.category===category).map(g=>g.color))].sort();

 const filteredG=useMemo(()=>garments.filter(g=>(category==="All"||g.category===category)&&(type==="All"||g.type===type)&&(style==="All"||g.style===style)&&(brand==="All"||g.brand===brand)&&(model==="All"||g.name===model)&&(color==="All"||g.color===color)),[category,type,style,brand,model,color]);
 const filteredO=useMemo(()=>outfits.filter(o=>(oType==="All"||o.type===oType)&&(season==="All"||o.season===season)),[oType,season]);
 const rankedG=useMemo(()=>{const a=filteredG.filter(g=>gScope==="all"||g.match>=75);return [...a].sort((x,y)=>gSort==="newest"?x.age-y.age:gSort==="liked"?y.likes-x.likes:gScope==="all"?hot(y.likes,y.age)-hot(x.likes,x.age):tier(x.match)-tier(y.match)||y.match-x.match||x.age-y.age||y.likes-x.likes)},[filteredG,gScope,gSort]);
 const rankedO=useMemo(()=>{const a=filteredO.filter(o=>oScope==="all"||o.match>=75);return [...a].sort((x,y)=>oSort==="newest"?x.age-y.age:oSort==="liked"?y.likes-x.likes:oScope==="all"?hot(y.likes,y.age)-hot(x.likes,x.age):tier(x.match)-tier(y.match)||y.match-x.match||x.age-y.age||y.likes-x.likes)},[filteredO,oScope,oSort]);
 const carousel=(mode==="garments"?rankedG:rankedO).slice(0,8),results=(mode==="garments"?rankedG:rankedO).slice(8,8+limit);

 const searchG=useMemo(()=>q?canonicalGarments(garments.filter(g=>`${g.brand} ${g.name} ${g.category} ${g.type} ${g.style} ${g.color} ${g.wearer}`.toLowerCase().includes(q))):[],[q]);
 const searchO=useMemo(()=>q?outfits.filter(o=>`${o.creator} ${o.caption} ${o.type} ${o.season}`.toLowerCase().includes(q)):[],[q]);
 const searchP=useMemo(()=>q?people.filter(p=>`${p.name} ${p.username}`.toLowerCase().includes(q)):[],[q]);

 function open(next:Overlay){if(!next)return;if(overlay)setStack(s=>[...s,overlay]);setOverlay(next)}
 function back(){setStack(s=>{const n=[...s];setOverlay(n.pop()??null);return n})}
 function close(){setOverlay(null);setStack([])}
 function toggle(setter:Dispatch<SetStateAction<Set<string>>>,id:string){setter(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})}
 function saveGarment(id:string){setSavedGarments(s=>{const n=new Set(s);if(n.has(id)){n.delete(id);setNotified(v=>{const x=new Set(v);x.delete(id);return x})}else n.add(id);return n})}
 function notifyGarment(id:string){setNotified(s=>{const n=new Set(s);if(n.has(id))n.delete(id);else{n.add(id);setSavedGarments(v=>new Set(v).add(id))}return n})}
 function changeScope(next:Scope){if(mode==="garments"){setGScope(next);setGSort(next==="matches"?"best":"popular")}else{setOScope(next);setOSort(next==="matches"?"best":"popular")}setLimit(24)}
 function clearSearch(){setQuery("");setSearchOpen(false);setSearchTab("all")}

 return <>
  <div className={styles.notice}>Vercel Preview Demo · test data only · production database untouched</div>
  <div className={styles.searchShell}>
   <form className={styles.search} onSubmit={e=>{e.preventDefault();if(q){setSearchOpen(true);setSearchTab("all")}}}>
    <span className={styles.searchIcon}>⌕</span>
    <input value={query} onChange={e=>{setQuery(e.target.value);setSearchOpen(false)}} placeholder="Search garments, outfits, or people"/>
    {q?<button type="button" className={styles.clearSearch} onClick={clearSearch}>×</button>:null}
    <button type="submit" className={styles.searchSubmit}>Search</button>
   </form>
   {q&&!searchOpen?<SearchSuggestions gs={searchG} os={searchO} ps={searchP} open={open} full={t=>{setSearchTab(t);setSearchOpen(true)}}/>:null}
  </div>

  {searchOpen&&q?<SearchResults tab={searchTab} setTab={setSearchTab} gs={searchG} os={searchO} ps={searchP} open={open} clear={clearSearch}/>:<>
   <div className={styles.mainTabs}>
    <button type="button" className={mode==="garments"?styles.active:""} onClick={()=>{setMode("garments");setLimit(24)}}>Garments</button>
    <button type="button" className={mode==="outfits"?styles.active:""} onClick={()=>{setMode("outfits");setLimit(24)}}>Outfits</button>
   </div>
   <div className={styles.toolbar}>
    <div className={styles.scope}><button type="button" className={scope==="matches"?styles.active:""} onClick={()=>changeScope("matches")}>My Fit Matches</button><button type="button" className={scope==="all"?styles.active:""} onClick={()=>changeScope("all")}>All</button></div>
    <label className={styles.sortControl}>Sort<select value={mode==="garments"?gSort:oSort} onChange={e=>mode==="garments"?setGSort(e.target.value):setOSort(e.target.value)}>{scope==="matches"?<option value="best">Best Match</option>:<option value="popular">Popular</option>}<option value="newest">Newest</option><option value="liked">Most Liked</option></select></label>
   </div>

   {mode==="garments"?<>
    <div className={styles.categoryRow}>{categories.map(c=><button type="button" key={c} className={category===c?styles.filterActive:""} onClick={()=>{setCategory(c);setType("All");setStyle("All");setColor("All")}}>{c}</button>)}</div>
    <div className={styles.filters}>
     {category!=="All"?<Filter label="Type" value={type} set={v=>{setType(v);setStyle("All")}} values={types}/>:null}
     {category!=="All"&&type!=="All"?<Filter label="Style" value={style} set={setStyle} values={stylesList}/>:null}
     <Filter label="Brand" value={brand} set={v=>{setBrand(v);setModel("All")}} values={brands}/>
     {brand!=="All"?<Filter label="Model" value={model} set={setModel} values={models}/>:null}
     {category!=="All"?<Filter label="Color" value={color} set={setColor} values={colors}/>:null}
    </div>
   </>:<div className={styles.filters}><Filter label="Type" value={oType} set={setOType} values={outfitTypes.filter(v=>v!=="All")} all/><Filter label="Season" value={season} set={setSeason} values={seasons.filter(v=>v!=="All")} all/></div>}

   {(mode==="garments"?rankedG:rankedO).length===0?<div className="emptyState"><span className="eyebrow">NO RESULTS</span><h2>{scope==="matches"?"No Fit Matches yet.":"No results with these filters."}</h2><button className="secondaryButton" type="button" onClick={()=>changeScope("all")}>Browse All</button></div>:<>
    <section><div className="sectionHeading"><div><span className="eyebrow">FOR YOU</span><h2>{mode==="garments"?(scope==="matches"?"Popular Near Your Fit":"Popular Garments"):(scope==="matches"?"Styled by People Like You":"Popular Outfits")}</h2></div></div>
     <div className={styles.carousel}>{carousel.map(item=>mode==="garments"?<GarmentCard key={(item as Garment).id} g={item as Garment} scope={gScope} open={open} liked={likedGarments.has((item as Garment).id)} saved={savedGarments.has((item as Garment).id)} notified={notified.has((item as Garment).id)} like={()=>toggle(setLikedGarments,(item as Garment).id)} save={()=>saveGarment((item as Garment).id)} notify={()=>notifyGarment((item as Garment).id)}/>:<OutfitCard key={(item as Outfit).id} o={item as Outfit} open={open} liked={likedOutfits.has((item as Outfit).id)} saved={savedOutfits.has((item as Outfit).id)} like={()=>toggle(setLikedOutfits,(item as Outfit).id)} save={()=>toggle(setSavedOutfits,(item as Outfit).id)}/>)}</div>
    </section>
    <section><div className="sectionHeading"><div><span className="eyebrow">{scope==="matches"?"MY FIT MATCHES":"ALL"}</span><h2>{mode==="garments"?(scope==="matches"?"Garments matched to you":"Every Shared garment"):(scope==="matches"?"Outfits from people like you":"Every Shared outfit")}</h2></div></div>
     <div className={styles.grid}>{results.map(item=>mode==="garments"?<GarmentCard key={(item as Garment).id} g={item as Garment} scope={gScope} open={open} liked={likedGarments.has((item as Garment).id)} saved={savedGarments.has((item as Garment).id)} notified={notified.has((item as Garment).id)} like={()=>toggle(setLikedGarments,(item as Garment).id)} save={()=>saveGarment((item as Garment).id)} notify={()=>notifyGarment((item as Garment).id)}/>:<OutfitCard key={(item as Outfit).id} o={item as Outfit} open={open} liked={likedOutfits.has((item as Outfit).id)} saved={savedOutfits.has((item as Outfit).id)} like={()=>toggle(setLikedOutfits,(item as Outfit).id)} save={()=>toggle(setSavedOutfits,(item as Outfit).id)}/>)}</div>
     {8+limit<(mode==="garments"?rankedG:rankedO).length?<button className="secondaryButton" type="button" onClick={()=>setLimit(v=>v+24)}>Keep Browsing</button>:<div className={styles.end}>{scope==="matches"?<><strong>You’ve reached the end of your Fit Matches.</strong><button className="textLink" type="button" onClick={()=>changeScope("all")}>Browse All {mode==="garments"?"Garments":"Outfits"} →</button></>:"You’ve reached the end."}</div>}
    </section>
   </>}
  </>}

  {overlay?<OverlayView state={overlay} stack={stack} back={back} close={close} open={open} likedGarments={likedGarments} likedOutfits={likedOutfits} savedGarments={savedGarments} savedOutfits={savedOutfits} notified={notified} following={following} personNotify={personNotify} setLikedGarments={setLikedGarments} setLikedOutfits={setLikedOutfits} setSavedOutfits={setSavedOutfits} setFollowing={setFollowing} setPersonNotify={setPersonNotify} toggle={toggle} saveGarment={saveGarment} notifyGarment={notifyGarment}/>:null}
 </>;
}

function Filter({label,value,set,values,all=true}:{label:string;value:string;set:(v:string)=>void;values:string[];all?:boolean}){return <label className={styles.filterControl}>{label}<select value={value} onChange={e=>set(e.target.value)}>{all?<option>All</option>:null}{values.map(v=><option key={v}>{v}</option>)}</select></label>}

function GarmentCard({g,scope,open,liked,saved,notified,like,save,notify}:{g:Garment;scope:Scope;open:(o:Overlay)=>void;liked:boolean;saved:boolean;notified:boolean;like:()=>void;save:()=>void;notify:()=>void}){
 return <article className={styles.card}>
  <button type="button" className={styles.productArea} onClick={()=>open({kind:"garment",id:g.id})}><GenericImage label={g.type}/><div className={styles.cardBody}><small>{g.brand}</small><h3>{g.name}</h3><p>{g.type} · {g.style} · {g.color}</p><strong>{scope==="matches"?`${g.match}% Garment Match`:`Closest Fit Match: ${Math.max(...sameProduct(g).map(x=>x.match))}%`}</strong></div></button>
  <div className={styles.evidenceRow}><button type="button" className={styles.wearerButton} onClick={()=>open({kind:"person",id:g.wearerId})}><Avatar p={person(g.wearerId)} small/><span>Worn by <b>{g.wearer}</b><small>{g.fit} · Size {g.size} · {"★".repeat(g.rating)}</small></span></button></div>
  <div className={styles.cardActions}><button type="button" onClick={like}>{liked?"♥":"♡"} {g.likes+(liked?1:0)}</button><button type="button" onClick={save}>{saved?"Saved":"Save"}</button><button type="button" onClick={notify}>{notified?"Notify On":"Notify"}</button></div>
 </article>;
}

function OutfitCard({o,open,liked,saved,like,save}:{o:Outfit;open:(x:Overlay)=>void;liked:boolean;saved:boolean;like:()=>void;save:()=>void}){
 return <article className={styles.card}>
  <button type="button" className={styles.productArea} onClick={()=>open({kind:"outfit",id:o.id})}><GenericImage label="Outfit" outfit/><div className={styles.cardBody}><small>{o.type} outfit</small><h3>{o.caption}</h3><p>{o.season}</p><strong>{o.match}% Overall Match</strong></div></button>
  <div className={styles.evidenceRow}><button type="button" className={styles.wearerButton} onClick={()=>open({kind:"style",id:o.creatorId})}><Avatar p={person(o.creatorId)} small/><span>Styled by <b>{o.creator}</b><small>{person(o.creatorId).followers.toLocaleString()} Followers · {person(o.creatorId).styleLikes.toLocaleString()} Style Likes</small></span></button></div>
  <div className={`${styles.cardActions} ${styles.twoActions}`}><button type="button" onClick={like}>{liked?"♥":"♡"} {o.likes+(liked?1:0)}</button><button type="button" onClick={save}>{saved?"Saved":"Save"}</button></div>
 </article>;
}

function SearchSuggestions({gs,os,ps,open,full}:{gs:Garment[];os:Outfit[];ps:Person[];open:(o:Overlay)=>void;full:(t:SearchTab)=>void}){
 const total=gs.length+os.length+ps.length;
 return <div className={styles.suggestions}>{!total?<div className={styles.noSuggestion}>No matching results.</div>:<>
  <Suggestion title="Garments" count={gs.length} all={()=>full("garments")}>{gs.slice(0,3).map(g=><SearchRow key={`${g.brand}-${g.name}`} label={`${g.brand} · ${g.name}`} sub={`${g.type} · ${g.color}`} score={`${g.match}%`} kind={g.type} click={()=>open({kind:"garment",id:g.id})}/>)}</Suggestion>
  <Suggestion title="Outfits" count={os.length} all={()=>full("outfits")}>{os.slice(0,3).map(o=><SearchRow key={o.id} label={o.caption} sub={`${o.creator} · ${o.type}`} score={`${o.match}%`} kind="Outfit" outfit click={()=>open({kind:"outfit",id:o.id})}/>)}</Suggestion>
  <Suggestion title="People" count={ps.length} all={()=>full("people")}>{ps.slice(0,3).map(p=><button type="button" className={styles.searchRow} key={p.id} onClick={()=>open({kind:"person",id:p.id})}><Avatar p={p} small/><span className={styles.searchRowMain}><b>{p.name}</b><small>@{p.username}</small></span><strong>{p.overall}%</strong></button>)}</Suggestion>
  <button type="button" className={styles.allSearchResults} onClick={()=>full("all")}>View all search results</button>
 </>}</div>;
}
function Suggestion({title,count,all,children}:{title:string;count:number;all:()=>void;children:ReactNode}){if(!count)return null;return <section className={styles.suggestionGroup}><div className={styles.suggestionHeading}><strong>{title}</strong>{count>3?<button type="button" onClick={all}>See all {count}</button>:<span>{count}</span>}</div><div className={styles.searchList}>{children}</div></section>}
function SearchRow({label,sub,score,kind,outfit=false,click}:{label:string;sub:string;score:string;kind:string;outfit?:boolean;click:()=>void}){return <button type="button" className={styles.searchRow} onClick={click}><MiniVisual label={kind} outfit={outfit}/><span className={styles.searchRowMain}><b>{label}</b><small>{sub}</small></span><strong>{score}</strong></button>}

function SearchResults({tab,setTab,gs,os,ps,open,clear}:{tab:SearchTab;setTab:(t:SearchTab)=>void;gs:Garment[];os:Outfit[];ps:Person[];open:(o:Overlay)=>void;clear:()=>void}){
 const total=gs.length+os.length+ps.length,counts={all:total,garments:gs.length,outfits:os.length,people:ps.length};
 return <section className={styles.searchResults}><div className={styles.searchResultsHeading}><div><span className="eyebrow">SEARCH RESULTS</span><h2>{total} results</h2></div><button className="textLink" type="button" onClick={clear}>Back to Browse</button></div>
  <div className={styles.searchTabs}>{(["all","garments","outfits","people"] as SearchTab[]).map(t=><button type="button" key={t} className={tab===t?styles.active:""} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)} {counts[t]}</button>)}</div>
  {!total?<div className="emptyState"><h2>No results.</h2></div>:<div className={styles.fullSearchGroups}>
   {(tab==="all"||tab==="garments")&&gs.length?<CompactGroup title="Garments" count={gs.length} all={tab==="all"?()=>setTab("garments"):undefined}>{gs.slice(0,tab==="all"?4:gs.length).map(g=><SearchRow key={`${g.brand}-${g.name}`} label={`${g.brand} · ${g.name}`} sub={`${g.type} · ${g.color}`} score={`${g.match}%`} kind={g.type} click={()=>open({kind:"garment",id:g.id})}/>)}</CompactGroup>:null}
   {(tab==="all"||tab==="outfits")&&os.length?<CompactGroup title="Outfits" count={os.length} all={tab==="all"?()=>setTab("outfits"):undefined}>{os.slice(0,tab==="all"?4:os.length).map(o=><SearchRow key={o.id} label={o.caption} sub={`${o.creator} · ${o.type}`} score={`${o.match}%`} kind="Outfit" outfit click={()=>open({kind:"outfit",id:o.id})}/>)}</CompactGroup>:null}
   {(tab==="all"||tab==="people")&&ps.length?<CompactGroup title="People" count={ps.length} all={tab==="all"?()=>setTab("people"):undefined}>{ps.slice(0,tab==="all"?4:ps.length).map(p=><button type="button" className={styles.searchRow} key={p.id} onClick={()=>open({kind:"person",id:p.id})}><Avatar p={p} small/><span className={styles.searchRowMain}><b>{p.name}</b><small>@{p.username}</small></span><strong>{p.overall}%</strong></button>)}</CompactGroup>:null}
  </div>}
 </section>;
}
function CompactGroup({title,count,all,children}:{title:string;count:number;all?:()=>void;children:ReactNode}){return <section className={styles.compactGroup}><div className={styles.compactHeading}><h3>{title}</h3>{all?<button type="button" onClick={all}>See all {count}</button>:<span>{count}</span>}</div><div className={styles.searchList}>{children}</div></section>}

function OverlayView({state,stack,back,close,open,likedGarments,likedOutfits,savedGarments,savedOutfits,notified,following,personNotify,setLikedGarments,setLikedOutfits,setSavedOutfits,setFollowing,setPersonNotify,toggle,saveGarment,notifyGarment}:{state:NonNullable<Overlay>;stack:Overlay[];back:()=>void;close:()=>void;open:(o:Overlay)=>void;likedGarments:Set<string>;likedOutfits:Set<string>;savedGarments:Set<string>;savedOutfits:Set<string>;notified:Set<string>;following:Set<string>;personNotify:Set<string>;setLikedGarments:Dispatch<SetStateAction<Set<string>>>;setLikedOutfits:Dispatch<SetStateAction<Set<string>>>;setSavedOutfits:Dispatch<SetStateAction<Set<string>>>;setFollowing:Dispatch<SetStateAction<Set<string>>>;setPersonNotify:Dispatch<SetStateAction<Set<string>>>;toggle:(s:Dispatch<SetStateAction<Set<string>>>,id:string)=>void;saveGarment:(id:string)=>void;notifyGarment:(id:string)=>void}){
 return <div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className={styles.overlay} role="dialog" aria-modal="true">
  <header className={styles.overlayHeader}><button type="button" onClick={back} disabled={!stack.length}>← Back</button><button type="button" onClick={close}>×</button></header>
  <div className={styles.overlayBody}>
   {state.kind==="garment"?<GarmentDetail g={garments.find(g=>g.id===state.id)!} open={open} liked={likedGarments.has(state.id)} saved={savedGarments.has(state.id)} notified={notified.has(state.id)} like={()=>toggle(setLikedGarments,state.id)} save={()=>saveGarment(state.id)} notify={()=>notifyGarment(state.id)}/>:state.kind==="outfit"?<OutfitDetail o={outfits.find(o=>o.id===state.id)!} open={open} liked={likedOutfits.has(state.id)} saved={savedOutfits.has(state.id)} like={()=>toggle(setLikedOutfits,state.id)} save={()=>toggle(setSavedOutfits,state.id)}/>:state.kind==="reports"?<ReportList g={garments.find(g=>g.id===state.id)!} open={open}/>:state.kind==="style"?<PersonDetail p={person(state.id)} style open={open} following={following.has(state.id)} notified={personNotify.has(state.id)} follow={()=>toggle(setFollowing,state.id)} notify={()=>{setFollowing(s=>new Set(s).add(state.id));toggle(setPersonNotify,state.id)}}/>:<PersonDetail p={person(state.id)} open={open} following={following.has(state.id)} notified={personNotify.has(state.id)} follow={()=>toggle(setFollowing,state.id)} notify={()=>{setFollowing(s=>new Set(s).add(state.id));toggle(setPersonNotify,state.id)}}/>}
  </div>
 </div></div>;
}

function GarmentDetail({g,open,liked,saved,notified,like,save,notify}:{g:Garment;open:(o:Overlay)=>void;liked:boolean;saved:boolean;notified:boolean;like:()=>void;save:()=>void;notify:()=>void}){
 const p=person(g.wearerId),count=sameProduct(g).length;
 return <div className={styles.detail}><div className={styles.detailHero}><GenericImage label={g.type} large/><div className={styles.detailSummary}><span className="eyebrow">{g.brand}</span><h2>{g.name}</h2><p className={styles.detailMeta}>{g.type} · {g.style} · {g.color}</p><div className={styles.bigMatch}>{g.match}%<span>Garment Match</span></div><div className={styles.stats}><span>Size<b>{g.size}</b></span><span>Fit Result<b>{g.fit}</b></span><span>Fit Rating<b>{"★".repeat(g.rating)}</b></span><span>Overall Match<b>{g.overall}%</b></span></div><div className={styles.detailActions}><button type="button" onClick={like}>{liked?"♥ Liked":"♡ Like"} · {g.likes+(liked?1:0)}</button><button type="button" onClick={save}>{saved?"Saved":"Save"}</button><button type="button" onClick={notify}>{notified?"Notifications On":"Notify"}</button></div></div></div>
  <button type="button" className={styles.wearerDetail} onClick={()=>open({kind:"person",id:p.id})}><Avatar p={p}/><span>Worn by <b>{p.name}</b><small>{p.overall}% Overall · {p.tops}% Tops · {p.bottoms}% Bottoms</small></span><strong>View profile →</strong></button>
  <button type="button" className={styles.fullWidthButton} onClick={()=>open({kind:"reports",id:g.id})}>View More Fit Reports ({count})</button>
  <button className="secondaryButton" type="button">View Full Product Details →</button>
 </div>;
}

function ReportList({g,open}:{g:Garment;open:(o:Overlay)=>void}){const list=[...sameProduct(g)].sort((a,b)=>b.match-a.match);return <div className={styles.detail}><div><span className="eyebrow">FIT REPORTS</span><h2>{g.brand} · {g.name}</h2><p className={styles.detailMeta}>Closest Match first</p></div><div className={styles.reportList}>{list.map(r=><button type="button" key={r.id} onClick={()=>open({kind:"garment",id:r.id})}><Avatar p={person(r.wearerId)} small/><span><b>{r.wearer}</b><small>Size {r.size} · {r.fit} · {"★".repeat(r.rating)}</small></span><strong>{r.match}%</strong></button>)}</div></div>}

function OutfitDetail({o,open,liked,saved,like,save}:{o:Outfit;open:(x:Overlay)=>void;liked:boolean;saved:boolean;like:()=>void;save:()=>void}){
 const p=person(o.creatorId);
 return <div className={styles.detail}><GenericImage label="Outfit" outfit large/><button type="button" className={styles.wearerDetail} onClick={()=>open({kind:"style",id:p.id})}><Avatar p={p}/><span>Styled by <b>{p.name}</b><small>{o.match}% Overall Match</small></span><strong>View styles →</strong></button><div className={styles.outfitLabels}><span>{o.type}</span><span>{o.season}</span></div><p className={styles.caption}>{o.caption}</p><div className={styles.detailActions}><button type="button" onClick={like}>{liked?"♥ Liked":"♡ Like"} · {o.likes+(liked?1:0)}</button><button type="button" onClick={save}>{saved?"Saved to LikeLocker":"Save to LikeLocker"}</button></div><h3>Tagged garments</h3><div className={styles.tagged}>{o.garments.map(id=>{const g=garments.find(x=>x.id===id)!;return <button type="button" key={id} onClick={()=>open({kind:"garment",id})}><MiniVisual label={g.type}/><span><b>{g.brand} · {g.name}</b><small>Size {g.size}</small></span><strong>{g.match}% Match</strong></button>})}</div><button type="button" className={styles.fullWidthButton} onClick={()=>open({kind:"style",id:p.id})}>See More Styles from {p.name}</button><button className="secondaryButton" type="button">View Full Outfit Details →</button></div>;
}

function PersonDetail({p,style=false,open,following,notified,follow,notify}:{p:Person;style?:boolean;open:(x:Overlay)=>void;following:boolean;notified:boolean;follow:()=>void;notify:()=>void}){
 const recentG=garments.filter(g=>g.wearerId===p.id).slice(0,2),recentO=outfits.filter(o=>o.creatorId===p.id).slice(0,3);
 return <div className={styles.detail}><div className={styles.personHero}><Avatar p={p}/><div className={styles.personHeroMain}><div className={styles.personNameLine}><div><h2>{p.name}</h2><span>@{p.username}</span></div>{p.fitTwin?<b className={styles.fitTwinBadge}>Fit Twin</b>:null}</div><div className={styles.matchRow}><b>{p.overall}% Overall</b><b>{p.tops}% Tops</b><b>{p.bottoms}% Bottoms</b></div><p className={styles.socialProof}>{p.followers.toLocaleString()} Followers · {p.styleLikes.toLocaleString()} Style Likes</p><div className={styles.detailActions}><button type="button" onClick={follow}>{following?"Following":"Follow"}</button><button type="button" onClick={notify}>{notified?"Notify On":"Notify"}</button></div></div></div><p className={styles.bio}>{p.bio}</p>
  {style?<><h3>Recent Shared outfits</h3><div className={styles.styleTiles}>{recentO.map(o=><button type="button" key={o.id} onClick={()=>open({kind:"outfit",id:o.id})}><GenericImage label="Outfit" outfit/></button>)}</div></>:<><h3>Recent Shared posts</h3><div className={styles.recentPosts}>{recentG.map(g=><button type="button" key={g.id} onClick={()=>open({kind:"garment",id:g.id})}><MiniVisual label={g.type}/><span><b>{g.brand} · {g.name}</b><small>{g.match}% garment match</small></span></button>)}{recentO[0]?<button type="button" onClick={()=>open({kind:"outfit",id:recentO[0].id})}><MiniVisual label="Outfit" outfit/><span><b>Outfit</b><small>{recentO[0].caption}</small></span></button>:null}</div></>}
  <button className="primaryButton" type="button">View Their Closet →</button>
 </div>;
}

function Avatar({p,small=false}:{p:Person;small?:boolean}){return <span className={small?styles.avatarCompact:styles.avatar}>{p.name.split(" ").map(v=>v[0]).join("").slice(0,2)}</span>}
function MiniVisual({label,outfit=false}:{label:string;outfit?:boolean}){return <span className={styles.compactVisual}><span>{outfit?"◫":"◇"}</span><small>{label}</small></span>}
function GenericImage({label,outfit=false,large=false}:{label:string;outfit?:boolean;large?:boolean}){return <div className={`${styles.genericImage} ${outfit?styles.outfitVisual:""} ${large?styles.genericImageLarge:""}`}><svg viewBox="0 0 160 180" role="img" aria-label={`Generic ${label} image`}>{outfit?<><circle cx="80" cy="32" r="15"/><path d="M58 65 80 54l22 11 18 30-16 9-9-16v36l16 45H88l-8-36-8 36H49l16-45V88l-9 16-16-9z"/></>:<><path d="M55 30 80 20l25 10 24 24-19 18-12-12v96H62V60L50 72 31 54z"/><path d="M68 39c5 7 19 7 24 0"/></>}</svg><span className={styles.genericLabel}><b>{label}</b><small>Generic LikeSized image</small></span></div>}
