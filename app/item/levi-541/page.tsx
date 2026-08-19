import { people } from "@/lib/mock-data";

export default function ItemPage() {
  const matches = [...people].sort((a,b) => b.bottomMatch - a.bottomMatch).slice(0,3);
  return (
    <main className="pageShell">
      <section className="itemHero">
        <div className="productImage">541</div>
        <div className="itemDetails">
          <span className="eyebrow">LEVI'S · BOTTOMS</span>
          <h1>541 Athletic Taper</h1>
          <p>Fit evidence from real wearers, ranked by how closely their lower-body measurements match yours.</p>
          <div className="recommendation">
            <span>YOUR LIKELY SIZE</span>
            <strong>36×30</strong>
            <b>89% confidence</b>
          </div>
          <div className="statsRow"><span><b>327</b> fit reports</span><span><b>41</b> close matches</span><span><b>78%</b> would buy again</span></div>
        </div>
      </section>
      <section className="section flush">
        <div className="sectionHeading"><div><span className="eyebrow">BEST EVIDENCE FIRST</span><h2>People closest to your fit</h2></div></div>
        <div className="evidenceList">
          {matches.map((p) => (
            <div className="evidence" key={p.id}>
              <div className="avatar small">{p.name.slice(0,1)}</div>
              <div><strong>{p.name}</strong><span>{p.handle}</span></div>
              <div><span>Bottom match</span><strong>{p.bottomMatch}%</strong></div>
              <div><span>Wore</span><strong>{p.size}</strong></div>
              <div><span>Reported fit</span><strong>{p.fit}</strong></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
