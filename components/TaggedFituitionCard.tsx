import type { ReactNode } from "react";
import { MatchPercentageBadge } from "@/components/MatchPercentageBadge";
import quickStyles from "@/app/outfits/[id]/TaggedItemsPanel.module.css";
import styles from "@/app/outfits/[id]/outfitDetail.module.css";

export type TaggedRelevantReport={fitReportId:string;bodyMatch:number|null;sizeLabel:string;fitLabel:string;isOwn:boolean};
export type TaggedStrongFitReport={sizeLabel:string;count:number;fitBreakdown:{fit:string;fitLabel:string;count:number;percent:number}[]};
export type TaggedSourceBreakdown={communityBlend:number;closetBlend:number;communityTopSizeLabel:string|null;closetTopSizeLabel:string|null;sourcesAgree:boolean|null};
export type TaggedRecommendation={sizeLabel:string;confidence:number;confidenceLabel:string;similarWearerCount:number;sizeEvidenceCount:number;sourceBreakdown:TaggedSourceBreakdown};
export type TaggedFituitionMeta={profileReady:boolean;matchingFitReports:number;recommendation:TaggedRecommendation|null;relevantReports:TaggedRelevantReport[];strongFitReports:TaggedStrongFitReport[];closetEvidenceCount:number};

function bestReport(meta:TaggedFituitionMeta){
  return meta.relevantReports.length?[...meta.relevantReports].sort((a,b)=>(b.bodyMatch??-1)-(a.bodyMatch??-1)||Number(b.isOwn)-Number(a.isOwn))[0]??null:null;
}

function RelevantReport({report}:{report:TaggedRelevantReport}){
  return <div className={styles.relevantReport}>
    <div>{report.bodyMatch===null?<strong>Your Fit Report</strong>:<><strong>Best Available Matching Fit Report</strong><MatchPercentageBadge score={report.bodyMatch} label="Body Match"/></>}</div>
    <div><span>Size</span><strong>{report.sizeLabel}</strong></div>
    <div><span>Fit Result</span><strong>{report.fitLabel}</strong></div>
  </div>;
}

function StrongReports({groups}:{groups:TaggedStrongFitReport[]}){
  return <><span className={quickStyles.inlineEvidenceLabel}>Strong Fit Reports</span><div className={styles.relevantReportList}>{groups.flatMap((group)=>group.fitBreakdown.filter((fit)=>fit.count>0).map((fit)=><div className={styles.relevantReport} key={`${group.sizeLabel}:${fit.fit}`}><div><strong>{fit.count}</strong><span>report{fit.count===1?"":"s"}</span></div><div><span>Size</span><strong>{group.sizeLabel}</strong></div><div><span>Fit Result</span><strong>{fit.fitLabel}</strong></div></div>))}</div></>;
}

export function TaggedFituitionCard({meta,isLoading=false,error="",onRetry,watchPrompt}:{meta:TaggedFituitionMeta|null;isLoading?:boolean;error?:string;onRetry?:()=>void;watchPrompt?:ReactNode}){
  const report=meta?bestReport(meta):null;
  const showRecommendation=Boolean(meta?.recommendation&&meta.matchingFitReports>0);
  return <section className={styles.fituitionCard} aria-label="FITuition">
    <span className={styles.fituitionKicker}>FITuition</span>
    {isLoading?<><strong className={styles.fituitionHeadline}>Checking your fit evidence…</strong><p>Comparing Size Match evidence with your Fit Profile and Closet history.</p></>:error||!meta?<><strong className={styles.fituitionHeadline}>FITuition couldn’t load this evidence.</strong><p>{error||"The evidence request did not finish."}</p>{onRetry?<button className={styles.notifyLink} type="button" onClick={onRetry}>Try again</button>:null}</>:!meta.profileReady?<><strong className={styles.fituitionHeadline}>Build your Fit Profile to use FITuition.</strong><p>Your measurements stay private.</p></>:showRecommendation&&meta.recommendation?<><strong className={styles.fituitionHeadline}>Our FITuition suggests: {meta.recommendation.sizeLabel}</strong><div className={styles.recommendationRow}><span className={styles.confidenceBadge}>Confidence: {meta.recommendation.confidenceLabel}</span></div>{meta.recommendation.sourceBreakdown.sourcesAgree===false?<p><strong>Mixed evidence.</strong> Size Match evidence leans {meta.recommendation.sourceBreakdown.communityTopSizeLabel??"another way"}, while your Closet History leans {meta.recommendation.sourceBreakdown.closetTopSizeLabel??"another way"}.</p>:meta.closetEvidenceCount>0?<p>Relevant Fit Reports and your Closet History point most strongly to this size.</p>:<p>Relevant Fit Reports point most strongly to this size.</p>}{meta.strongFitReports.length?<StrongReports groups={meta.strongFitReports}/>:report?<><p>Relevant Fit Reports: {meta.matchingFitReports}</p><div className={styles.relevantReportList}><RelevantReport report={report}/></div></>:null}</>:meta.matchingFitReports>0?<><strong className={styles.fituitionHeadline}>Not enough fit data to confidently recommend a size.</strong><p>Relevant Fit Reports: {meta.matchingFitReports}</p>{report?<div className={styles.relevantReportList}><RelevantReport report={report}/></div>:null}</>:<><strong className={styles.fituitionHeadline}>Not enough fit data to confidently recommend a size.</strong>{watchPrompt??null}</>}
  </section>;
}
