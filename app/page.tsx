import Link from "next/link";

const capabilities = [
  {
    eyebrow: "PEOPLE MY SIZE",
    title: "Discover people shaped like you.",
    description: "Ranked by what matters most.",
    href: "/people",
    link: "Find My Matches →",
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
    link: "Get Inspired →",
  },
];

const faqs = [
  {
    question: "What is a Fit Twin?",
    answer: "A Fit Twin is someone LikeSized identifies as a strong current body match. Fit Twin status comes from matching—not from following or manually saving someone.",
  },
  {
    question: "Can other members see my measurements?",
    answer: "No. Your exact current and historical body measurements stay private. Other members see safe Match percentages and the fit information you intentionally share.",
  },
  {
    question: "Why can my Match change by clothing type?",
    answer: "Different garments depend on different measurements. LikeSized emphasizes the measurements that matter for tops, bottoms, and specific garment types instead of using one generic score for everything.",
  },
  {
    question: "What does Fit Result mean?",
    answer: "Fit Result describes how a garment physically fit: Too Small, Snug, Just Right, Relaxed, or Too Big. It is not a star rating.",
  },
  {
    question: "Can I follow someone who is not my Fit Twin?",
    answer: "Yes. Following is your choice and helps you keep up with someone’s shared style and fit activity. It is separate from system-generated Fit Twin status.",
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

      <section className="section faqSection" id="faq" aria-labelledby="faq-title">
        <span className="eyebrow">HELP / FAQ</span>
        <h2 className="sectionTitle" id="faq-title">Questions before you get started?</h2>
        <p className="faqIntro">The basics about matching, privacy, Fit Results, Fit Twins, and Following.</p>
        <div className="faqGrid">
          {faqs.map((faq) => (
            <details className="faqItem" key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
