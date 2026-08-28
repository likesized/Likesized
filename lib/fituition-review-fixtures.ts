import type { TaggedFituitionMeta } from "@/components/TaggedFituitionCard";

export type FituitionReviewFixture={
  id:string;
  title:string;
  brand:string;
  item:string;
  garment:string;
  variation:string;
  meta:TaggedFituitionMeta;
};

const sourceBreakdown={communityBlend:1,closetBlend:0,communityTopSizeLabel:"Medium",closetTopSizeLabel:null,sourcesAgree:null};

export const FITUITION_REVIEW_FIXTURES:FituitionReviewFixture[]=[
  {
    id:"strong-aggregate",
    title:"1 · Recommendation with Strong Fit Reports",
    brand:"Madewell",
    item:"Perfect Vintage Jean",
    garment:"Jeans",
    variation:"Cut: Straight · Rise: High",
    meta:{
      profileReady:true,
      matchingFitReports:11,
      recommendation:{sizeLabel:"Medium",confidence:82,confidenceLabel:"High confidence",similarWearerCount:11,sizeEvidenceCount:11,sourceBreakdown},
      relevantReports:[
        {fitReportId:"qa-strong-1",bodyMatch:96,sizeLabel:"Medium",fitLabel:"Just Right",isOwn:false},
        {fitReportId:"qa-strong-2",bodyMatch:94,sizeLabel:"Large",fitLabel:"Too Big",isOwn:false},
      ],
      strongFitReports:[
        {sizeLabel:"Medium",count:7,fitBreakdown:[{fit:"just_right",fitLabel:"Just Right",count:7,percent:100}]},
        {sizeLabel:"Large",count:4,fitBreakdown:[{fit:"too_big",fitLabel:"Too Big",count:4,percent:100}]},
      ],
      closetEvidenceCount:0,
    },
  },
  {
    id:"recommended-closest",
    title:"2 · Recommendation with closest report",
    brand:"Aritzia",
    item:"Contour Crew Bodysuit",
    garment:"Bodysuit",
    variation:"Sleeve: Long · Neckline: High",
    meta:{
      profileReady:true,
      matchingFitReports:3,
      recommendation:{sizeLabel:"Medium",confidence:61,confidenceLabel:"Good confidence",similarWearerCount:3,sizeEvidenceCount:3,sourceBreakdown},
      relevantReports:[
        {fitReportId:"qa-good-1",bodyMatch:91,sizeLabel:"Medium",fitLabel:"Just Right",isOwn:false},
        {fitReportId:"qa-good-2",bodyMatch:82,sizeLabel:"Large",fitLabel:"Too Big",isOwn:false},
        {fitReportId:"qa-good-3",bodyMatch:75,sizeLabel:"Medium",fitLabel:"Snug",isOwn:false},
      ],
      strongFitReports:[],
      closetEvidenceCount:0,
    },
  },
  {
    id:"no-recommendation-closest",
    title:"3 · No recommendation with closest report",
    brand:"Levi's",
    item:"541 Athletic Taper",
    garment:"Jeans",
    variation:"Cut: Straight · Rise: Mid",
    meta:{
      profileReady:true,
      matchingFitReports:1,
      recommendation:null,
      relevantReports:[{fitReportId:"qa-limited-1",bodyMatch:78,sizeLabel:"Medium",fitLabel:"Just Right",isOwn:false}],
      strongFitReports:[],
      closetEvidenceCount:0,
    },
  },
  {
    id:"no-size",
    title:"4 · No size evidence for you",
    brand:"Patagonia",
    item:"Nano Puff Jacket",
    garment:"Jacket / Coat",
    variation:"Style: Puffer · Fit: Regular",
    meta:{profileReady:true,matchingFitReports:0,recommendation:null,relevantReports:[],strongFitReports:[],closetEvidenceCount:0},
  },
];

export const MATCH_BADGE_REVIEW_SCORES=[94,78,63,44] as const;
