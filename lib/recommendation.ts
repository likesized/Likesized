import type { EvidenceLevel } from "@/lib/domain";

export type PreferredFit = "fitted" | "standard" | "relaxed";
export type RecommendationEvidence = {
  sizeKey: string;
  sizeLabel: string;
  fit: "too_small" | "snug" | "just_right" | "relaxed" | "too_big";
  matchScore: number;
  coveragePercent?: number | null;
  evidenceLevel: EvidenceLevel;
  attributeOverlap?: number;
  directionalFitSupport?: number | null;
};

export type SizeRecommendation = {
  sizeKey: string;
  sizeLabel: string;
  confidence: number;
  similarWearerCount: number;
  sizeEvidenceCount: number;
  strongestEvidenceLevel: EvidenceLevel;
};

const FIT_SUPPORT: Record<RecommendationEvidence["fit"], number> = {
  too_small: -0.65,
  snug: 0.48,
  just_right: 1,
  relaxed: 0.72,
  too_big: -0.65,
};
const PREFERENCE_SUPPORT: Record<PreferredFit, Record<RecommendationEvidence["fit"], number>> = {
  fitted: {too_small:-0.65,snug:0.90,just_right:0.90,relaxed:0.35,too_big:-0.65},
  standard: FIT_SUPPORT,
  relaxed: {too_small:-0.65,snug:0.15,just_right:0.85,relaxed:1,too_big:-0.65},
};
const EVIDENCE_WEIGHT: Record<EvidenceLevel, number> = {
  exact_variant: 1,
  exact_product: 0.94,
  product_family: 0.82,
  similar_garments: 0.70,
  brand_garment_type: 0.58,
  category_fit: 0.42,
};
const EVIDENCE_RANK: Record<EvidenceLevel, number> = {
  exact_variant: 1,
  exact_product: 2,
  product_family: 3,
  similar_garments: 4,
  brand_garment_type: 5,
  category_fit: 6,
};

type Bucket = {
  sizeKey:string;sizeLabel:string;score:number;positive:number;positivePotential:number;negative:number;
  matchWeight:number;weightedMatch:number;evidenceWeight:number;weightedEvidence:number;
  coverageWeight:number;weightedCoverage:number;count:number;strongestEvidenceLevel:EvidenceLevel;
};

function clampSupport(value:number){return Math.max(-1,Math.min(1,value));}
function fitSupport(row:RecommendationEvidence,preference:PreferredFit){
  const baseline=FIT_SUPPORT[row.fit];
  const directional=row.directionalFitSupport;
  const directionalSupport=typeof directional==="number"&&Number.isFinite(directional)?clampSupport(directional):baseline;
  return clampSupport(PREFERENCE_SUPPORT[preference][row.fit]+(directionalSupport-baseline));
}

export function recommendationConfidenceLabel(confidence:number){
  if(confidence>=75)return "High confidence";
  if(confidence>=45)return "Good confidence";
  return "Limited confidence";
}

export function recommendSize(evidence:RecommendationEvidence[],preference:PreferredFit="standard"):SizeRecommendation|null{
  const eligible=evidence.filter((row)=>row.sizeKey.trim()&&row.sizeLabel.trim()&&Number.isFinite(row.matchScore)&&row.matchScore>=50&&row.matchScore<=100);
  if(!eligible.length)return null;
  const buckets=new Map<string,Bucket>();
  for(const row of eligible){
    const closeness=Math.pow(row.matchScore/100,2);
    const coverage=Math.max(.25,Math.min(1,(row.coveragePercent??100)/100));
    const coverageQuality=.70+.30*coverage;
    const exactness=EVIDENCE_WEIGHT[row.evidenceLevel];
    const attributeBoost=row.evidenceLevel==="similar_garments"?Math.min(1.12,1+(row.attributeOverlap??0)*.03):1;
    const support=fitSupport(row,preference);
    const base=closeness*exactness*attributeBoost;
    const signed=base*support;
    const bucket=buckets.get(row.sizeKey)??{sizeKey:row.sizeKey,sizeLabel:row.sizeLabel,score:0,positive:0,positivePotential:0,negative:0,matchWeight:0,weightedMatch:0,evidenceWeight:0,weightedEvidence:0,coverageWeight:0,weightedCoverage:0,count:0,strongestEvidenceLevel:row.evidenceLevel};
    bucket.score+=signed;
    bucket.positive+=Math.max(0,signed);
    bucket.negative+=Math.max(0,-signed);
    if(support>0)bucket.positivePotential+=base;
    bucket.matchWeight+=base;
    bucket.weightedMatch+=row.matchScore*base;
    bucket.evidenceWeight+=closeness;
    bucket.weightedEvidence+=exactness*closeness;
    bucket.coverageWeight+=closeness;
    bucket.weightedCoverage+=coverageQuality*closeness;
    bucket.count+=1;
    if(EVIDENCE_RANK[row.evidenceLevel]<EVIDENCE_RANK[bucket.strongestEvidenceLevel])bucket.strongestEvidenceLevel=row.evidenceLevel;
    buckets.set(row.sizeKey,bucket);
  }
  const candidates=[...buckets.values()].filter((bucket)=>bucket.score>0&&bucket.positive>0).sort((a,b)=>b.score-a.score||b.positive-a.positive||b.count-a.count);
  const top=candidates[0];
  if(!top)return null;
  const totalPositive=candidates.reduce((sum,bucket)=>sum+bucket.positive,0);
  const agreement=totalPositive>0?top.positive/totalPositive:0;
  const avgMatch=top.matchWeight>0?top.weightedMatch/top.matchWeight/100:0;
  const fitQuality=top.positivePotential>0?top.positive/top.positivePotential:0;
  const conflict=top.positive+top.negative>0?top.positive/(top.positive+top.negative):0;
  const evidenceQuality=top.evidenceWeight>0?top.weightedEvidence/top.evidenceWeight:0;
  const coverageQuality=top.coverageWeight>0?top.weightedCoverage/top.coverageWeight:0;
  const evidenceStrength=Math.min(1,Math.sqrt(top.count/10));
  const confidence=Math.max(0,Math.min(99,Math.round(100*agreement*avgMatch*fitQuality*conflict*evidenceQuality*coverageQuality*(.40+.60*evidenceStrength))));
  return{sizeKey:top.sizeKey,sizeLabel:top.sizeLabel,confidence,similarWearerCount:eligible.length,sizeEvidenceCount:top.count,strongestEvidenceLevel:top.strongestEvidenceLevel};
}
