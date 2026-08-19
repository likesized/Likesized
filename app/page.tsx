import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { people } from "@/lib/mock-data";

export default function Home() {
  const top = [...people].sort((a, b) => b.overallMatch - a.overallMatch).slice(0, 3);

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">CLOTHES. REAL BODIES. ACTUAL FIT.</div>
        <h1>See what fits<br />people built like you.</h1>
        <p>Stop guessing from model photos and vague reviews. LikeSized matches you with real people by measurements, then shows what they actually bought and how it fits.</p>
        <div className="heroActions">
          <Link className="primaryButton" href="/onboarding">Build my Fit Profile</Link>
          <Link className="secondaryButton" href="/people">Browse matches</Link>
        </div>
        <div className="proofStrip">
          <span><b>96%</b> closest demo match</span>
          <span><b>Garment-specific</b> scoring</span>
          <span><b>Real-size</b> closet data</span>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">YOUR PEOPLE</span>
            <h2>Built more like you.</h2>
          </div>
          <Link href="/people" className="textLink">View all matches →</Link>
        </div>
        <div className="cardGrid">
          {top.map((person) => (
            <MatchCard
              key={person.id}
              name={person.name}
              handle={person.handle}
              style={person.style}
              item={person.item}
              size={person.size}
              fit={person.fit}
              match={person.overallMatch}
              secondary={`${person.topMatch}% tops · ${person.bottomMatch}% bottoms`}
            />
          ))}
        </div>
      </section>

      <section className="howItWorks section">
        <span className="eyebrow">THE LOOP</span>
        <h2>Every closet makes the answer better.</h2>
        <div className="steps">
          <div><b>01</b><h3>Measure once</h3><p>Create a private Fit Profile with the measurements clothing actually depends on.</p></div>
          <div><b>02</b><h3>Find your matches</h3><p>See people who match your build overall or for a specific kind of garment.</p></div>
          <div><b>03</b><h3>Log what fits</h3><p>Add clothing you own, the size, and whether the fit is snug, right, relaxed, or off.</p></div>
          <div><b>04</b><h3>Shop with evidence</h3><p>See what sizes worked for the people who are physically closest to you.</p></div>
        </div>
      </section>
    </main>
  );
}
