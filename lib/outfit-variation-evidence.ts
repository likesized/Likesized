export function variationEvidenceKey(userId:string,productId:string,objectiveVariantKey:string|null|undefined,fallbackId:string){
  return `${userId}:${productId}:${objectiveVariantKey||`report:${fallbackId}`}`;
}

type VariationEvidenceIdentity={userId:string;productId:string;objectiveVariantKey:string|null|undefined;reportId:string;createdAt:string};

export function newestUniqueVariationEvidence<T>(items:readonly T[],identityFor:(item:T)=>VariationEvidenceIdentity):T[]{
  const seen=new Set<string>();
  return [...items].sort((a,b)=>identityFor(b).createdAt.localeCompare(identityFor(a).createdAt)).filter((item)=>{
    const identity=identityFor(item);
    const key=variationEvidenceKey(identity.userId,identity.productId,identity.objectiveVariantKey,identity.reportId);
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
