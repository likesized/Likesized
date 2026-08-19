import Link from "next/link";

type MatchCardProps = {
  name: string;
  handle: string;
  style: string;
  item: string;
  size: string;
  fit: string;
  match: number;
  secondary?: string;
};

export function MatchCard({ name, handle, style, item, size, fit, match, secondary }: MatchCardProps) {
  return (
    <article className="matchCard">
      <div className="photoPlaceholder">
        <div className="avatar">{name.slice(0, 1)}</div>
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
        {secondary && <div className="tiny">{secondary}</div>}
        <div className="garment">
          <strong>{item}</strong>
          <span>Size {size} · {fit}</span>
        </div>
        <Link href="/item/levi-541" className="textLink">See fit details →</Link>
      </div>
    </article>
  );
}
