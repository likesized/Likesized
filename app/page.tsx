import Link from "next/link";

const capabilities = [
  {
    eyebrow: "PEOPLE MY SIZE",
    title: "Discover people shaped like you.",
    description: "Ranked by what matters most.",
    href: "/people",
    link: "Find My Fit Twins →",
  },
  {
    eyebrow: "WHAT WORKS FOR THEM",
    title: "Explore what your matches actually wear.",
    description: "Learn which brands, sizes, and pieces fit best.",
    href: "/search",
    link: "Shop Smarter →",
  },
  {
    eyebrow: "STAY CONNECTED",
    title: "Follow the people whose fit you trust.",
    description: "See what they wear, share, and recommend next.",
    href: "/following",
    link: "Browse Their Closet →",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow heroEyebrow">
          <span className="heroEyebrowLine">REAL PEOPLE. SMARTER MATCHING.</span>{" "}
          <span className="heroEyebrowLine">BETTER FIT.</span>
        </div>
        <h1>
          <span className="heroLine heroLinePrimary">Find your Fit Twin.</span>
          <span className="heroLine">Find your fit.</span>
        </h1>
        <p>Match with people who have a body like yours. See the brands they wear, the sizes they buy, and what actually works on them.</p>
        <div className="heroActions">
          <Link className="primaryButton" href="/onboarding">Create My Fit Profile</Link>
          <Link className="secondaryButton" href="#how-it-works">See How It Works</Link>
        </div>
        <div className="proofStrip">
          <span><b>Your measurements stay private</b></span>
          <span><b>Matches change by clothing type</b></span>
          <span><b>Real people. Real size history.</b></span>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">WHAT LIKESIZED DOES</span>
            <h2 className="sectionTitle">
              <span className="sectionTitleLine">Makes shopping personal</span>
              <span className="sectionTitleLine">to your body.</span>
            </h2>
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

      <section className="howItWorks section" id="how-it-works">
        <span className="eyebrow">THE LOOP</span>
        <h2 className="loopTitle">
          <span className="loopTitleLine">The more you share,</span>
          <span className="loopTitleLine">the smarter LikeSized gets.</span>
        </h2>
        <div className="steps">
          <div><b>01</b><h3>Build your profile</h3><p>Tell us about your size and measurements.</p></div>
          <div><b>02</b><h3>Find your matches</h3><p>Get ranked matches based on the measurements that matter most for each garment type.</p></div>
          <div><b>03</b><h3>Share what works<span className="stepAside">(and what doesn’t)</span></h3><p>Help others learn from your real experience.</p></div>
          <div><b>04</b><h3>Shop with better answers</h3><p>Use personalized insights from people like you to make smarter choices and get the fit right the first time.</p></div>
        </div>
      </section>

      <section className="section" aria-label="Help and frequently asked questions">
        <span className="eyebrow">NEED HELP?</span>
        <h2 className="sectionTitle">Questions about LikeSized?</h2>
        <p>Learn how Fit Twins, matching, privacy, Closet sharing, and fit evidence work.</p>
        <Link className="textLink" href="/help">Help / FAQ →</Link>
      </section>
    </main>
  );
}
