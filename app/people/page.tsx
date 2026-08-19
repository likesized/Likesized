import { MatchCard } from "@/components/MatchCard";
import { people } from "@/lib/mock-data";

export default function PeoplePage() {
  const sorted = [...people].sort((a, b) => b.overallMatch - a.overallMatch);
  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">PEOPLE MY SIZE</span>
        <h1>Your closest Fit Matches</h1>
        <p>Overall match is useful for discovery. Once you open a product, LikeSized switches to measurements that matter most for that garment.</p>
      </div>
      <div className="filterBar">
        <button className="filter active">Overall</button>
        <button className="filter">Tops</button>
        <button className="filter">Bottoms</button>
        <button className="filter">Style</button>
      </div>
      <div className="cardGrid">
        {sorted.map((person) => (
          <MatchCard key={person.id} name={person.name} handle={person.handle} style={person.style} item={person.item} size={person.size} fit={person.fit} match={person.overallMatch} secondary={`${person.topMatch}% tops · ${person.bottomMatch}% bottoms`} />
        ))}
      </div>
    </main>
  );
}
