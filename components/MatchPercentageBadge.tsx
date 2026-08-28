import styles from "./MatchPercentageBadge.module.css";

export type MatchPercentageTier = "strong" | "good" | "useful" | "low";

export function matchPercentageTier(score: number): MatchPercentageTier {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 50) return "useful";
  return "low";
}

export function MatchPercentageBadge({ score, label, compact = false }: { score: number; label?: string; compact?: boolean }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const tier = matchPercentageTier(safeScore);
  const text = `${safeScore}%${label ? ` ${label}` : ""}`;
  return <span className={`${styles.badge} ${styles[tier]}${compact ? ` ${styles.compact}` : ""}`} aria-label={text}>{text}</span>;
}
