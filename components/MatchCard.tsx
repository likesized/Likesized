import Link from "next/link";

type MatchCardProps = {
  name: string;
  handle: string;
  style: string;
  match: number;
  secondary?: string;
  description?: string;
  item?: string;
  size?: string;
  fit?: string;
  href?: string;
};

export function MatchCard({
  name,
  handle,
  style,
  match,
  secondary,
  description,
  item,
  size,
  fit,
  href = "/item/levi-541",
}: MatchCardProps) {
  return (
    <article className="matchCard">
      <div className="photoPlaceholder">
        <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
        <span>{style}</span>
      </div>
      <div className="matchCardBody">
        <div className="matchTopline">
          <div>
            <strong>{name}</strong>
            <span className="muted">{handle}</span>
          </div>
          <div className="matchBadge">{match}% match</div>
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
        {href && item ? (
          <Link href={href} className="textLink">
            See fit details →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
