import type { ReactNode } from "react";
import Link from "next/link";

type MatchCardProps = {
  name: string;
  handle: string;
  style: string;
  avatarUrl?: string | null;
  match?: number;
  secondary?: string;
  description?: string;
  item?: string;
  size?: string;
  fit?: string;
  href?: string;
  linkLabel?: string;
  footer?: ReactNode;
};

export function MatchCard({
  name,
  handle,
  style,
  avatarUrl,
  match,
  secondary,
  description,
  item,
  size,
  fit,
  href = "",
  linkLabel,
  footer,
}: MatchCardProps) {
  const resolvedLinkLabel = linkLabel ?? (item ? "See fit details →" : "View profile →");

  return (
    <article className="matchCard">
      <div className="photoPlaceholder">
        {avatarUrl ? <img className="avatar photoAvatar" src={avatarUrl} alt={`${name} profile`} /> : <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>}
        <span>{style}</span>
      </div>
      <div className="matchCardBody">
        <div className="matchTopline">
          <div>
            <strong>{name}</strong>
            <span className="muted">{handle}</span>
          </div>
          {typeof match === "number" ? <div className="matchBadge">{match}% match</div> : null}
        </div>
        {secondary ? <div className="tiny">{secondary}</div> : null}
        {item ? (
          <div className="garment">
            <strong>{item}</strong>
            <span>
              {size ? `Size ${size}` : "Size not logged"}
              {fit ? ` · ${fit}` : ""}
            </span>
          </div>
        ) : description ? (
          <div className="garment">
            <span>{description}</span>
          </div>
        ) : null}
        {href ? (
          <Link href={href} className="textLink">
            {resolvedLinkLabel}
          </Link>
        ) : null}
        {footer ? <div className="authActions">{footer}</div> : null}
      </div>
    </article>
  );
}
