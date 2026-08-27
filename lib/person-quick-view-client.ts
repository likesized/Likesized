export type PersonQuickViewSummary={
  userId:string|null;
  username:string;
  displayName:string|null;
  avatarUrl:string|null;
  signedIn:boolean;
  owner:boolean;
  following:boolean;
  notificationsOn:boolean;
  overallMatch:number|null;
  topsMatch:number|null;
  bottomsMatch:number|null;
  totalGarments:number|null;
  totalOutfits:number|null;
};

const resolved=new Map<string,PersonQuickViewSummary>();
const pending=new Map<string,Promise<PersonQuickViewSummary|null>>();

function key(username:string){return username.trim().toLowerCase();}

export function readPersonQuickView(username:string){return resolved.get(key(username))??null;}

export function loadPersonQuickView(username:string){
  const normalized=key(username);
  const cached=resolved.get(normalized);
  if(cached)return Promise.resolve(cached);
  const inFlight=pending.get(normalized);
  if(inFlight)return inFlight;
  const request=fetch(`/api/people/${encodeURIComponent(username)}/quick-view`,{cache:"no-store"})
    .then(async(response)=>{
      if(!response.ok)return null;
      const payload=await response.json() as PersonQuickViewSummary;
      resolved.set(normalized,payload);
      return payload;
    })
    .catch(()=>null)
    .finally(()=>{pending.delete(normalized);});
  pending.set(normalized,request);
  return request;
}

export function warmPersonQuickView(username:string){void loadPersonQuickView(username);}
