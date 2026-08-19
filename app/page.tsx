import Link from "next/link";

const capabilities = [
  {
    eyebrow: "PEOPLE MY SIZE",
    title: "Find bodies that match yours.",
    description: "Compare current Fit Profiles overall, for tops, or for bottoms without exposing anyone's raw measurements.",
    href: "/people",
    link: "Browse Fit Matches →",
  },
  {
    eyebrow: "PRODUCT EVIDENCE",
    title: "Shop from real fit history.",
    description: "See what sizes worked for similar body states, with exact product evidence first and broader fit evidence only when needed.",
    href: "/search",
    link: "Search products →",
  },
  {
    eyebrow: "FIT TWINS",
    title: "Keep learning from useful matches.",
    description: "Save useful Fit Matches, then follow their future Shared garments, Fit Reports, and outfits through your Following Feed.",
    href: "/following",
    link: "Open Following Feed →",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow">CLOTHES. REAL BODIES. ACTUAL FIT.</div>
        <h1>See what fits<br />people built like you.</h1>
        <p>Stop guessing from model photos and vague reviews. LikeSized matches people using private garment-relevant Fit Profiles, then shows real-world size and fit evidence from Shared clothing history.</p>
        <div className="heroActions">
          <Link className="primaryButton" href="/onboarding">Build my Fit Profile</Link>
          <Link className="secondaryButton" href="/people">Browse matches</Link>
        </div>
        <div className="proofStrip">
          <span><b>Private by default</b> raw body measurements</span>
          <span><b>Garment-specific</b> current matching</span>
          <span><b>Historical</b> real-world fit evidence</span>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">WHAT LIKESIZED DOES</span>
            <h2>Fit evidence, not a demo score.</h2>
          </div>
          <Link href="/search" className="textLink">Search LikeSized →</Link>
        </div>
        <div className="cardGrid">
          {capabilities.map((capability) => (
            <article className="matchCard" key={capability.eyebrow}>
              <div className="matchCardBody">
                <span className="eyebrow">{capability.eyebrow}</span>
                <div className="garment">
                  <strong>{capability.title}</strong>
                  <span>{capability.description}</span>
                </div>
                <Link className="textLink" href={capability.href}>{capability.link}</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="howItWorks section">
        <span className="eyebrow">THE LOOP</span>
        <h2>Every Shared fit report makes the answer better.</h2>
        <div className="steps">
          <div><b>01</b><h3>Build your Fit Profile</h3><p>Enter the private measurements and size references clothing actually depends on.</p></div>
          <div><b>02</b><h3>Find useful matches</h3><p>Compare current bodies overall, for tops, or for bottoms and save the people whose fit experience helps you.</p></div>
          <div><b>03</b><h3>Log real fit</h3><p>Add clothing you own, the exact size identity, and how it actually fits. Each observation stays tied to the body state from that try-on.</p></div>
          <div><b>04</b><h3>Shop with evidence</h3><p>Use canonical product history and similar-body evidence instead of relying on generic reviews alone.</p></div>
        </div>
      </section>
    </main>
  );
}
