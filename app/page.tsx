import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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
    href: "/circle",
    link: "Get Inspired →",
  },
];

const faqs = [
  {
    question: "What is a Fit Twin?",
    answer: "A Fit Twin is someone you follow whom LikeSized identifies as a strong current body match. Following adds someone to My Circle; LikeSized decides whether that followed person qualifies as a Fit Twin.",
  },
  {
    question: "Can other members see my measurements?",
    answer: "No. Your exact current and historical body measurements stay private. Other members see safe Match percentages and the fit information you intentionally share.",
  },
  {
    question: "Does LikeSized work for both men and women?",
    answer: "Yes. LikeSized can match men and women, and every accurate measurement you add can improve precision. Some measurements may be especially useful depending on your body and the garments you wear. For many men’s fits, chest, shoulders, sleeve length, upper arm/bicep, waist, rise, and inseam can add useful detail. For many women’s fits, full bust, high bust, underbust, waist, hip/seat, torso length, and related shaping measurements can be especially informative. Those are examples, not rules—LikeSized still uses the garment-relevant measurements you provide, and any member can benefit from any measurement that applies to their body and clothing.",
  },
  {
    question: "Why can my Match change by clothing type?",
    answer: "Different garments depend on different measurements. LikeSized emphasizes the measurements that matter for tops, bottoms, and specific garment types instead of using one generic score for everything.",
  },
  {
    question: "What makes LikeSized different from other sizing and fashion tools?",
    answer: "Many sizing tools start with size charts, general reviews, or a predicted size. LikeSized starts with real Fit Reports from people whose bodies are similar to yours and uses the measurements that matter for the garment you’re looking at. LikeSized also tracks fit down to the individual item whenever real Fit Reports exist. Two pairs of pants from the same brand can fit completely differently, so we don’t treat a brand, clothing category, or printed size as if it fits the same across every product. Strong Product-specific evidence can therefore give you a more relevant answer than broader brand or category patterns, while your exact body measurements stay private.",
  },
  {
    question: "What does Fit Result mean?",
    answer: "Fit Result describes how a garment fits you: Too Small, Snug, Just Right, Relaxed, or Too Big. It is not a star rating.",
  },
  {
    question: "Can I follow someone who is not my Fit Twin?",
    answer: "Yes. Following is your choice and helps you keep up with someone’s shared style and fit activity. It is separate from system-generated Fit Twin status.",
  },
  {
    question: "Where does LikeSized get its product information?",
    answer: "LikeSized learns from real people who own and wear the clothes. The details members share through Fit Reports help build and improve the LikeSized clothing catalog over time.",
  },
  {
    question: "What if I don’t know all the details about my item?",
    answer: "Tell us what you confidently know. For the simple required garment questions, choose Not sure if needed. Optional catalog details can be left blank, and later members can help complete the record.",
  },
  {
    question: "How do you know the product information is accurate?",
    answer: "LikeSized looks for consistency across the information people share. When details line up, confidence grows. If something conflicts or isn’t clear, it’s flagged for review instead of automatically changing the product record.",
  },
];

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const showPublicInfo = first(params.view) === "info";

  if (!showPublicInfo) {
    const supabase = await createClient();
    const { data: claimsData, error } = await supabase.auth.getClaims();
    if (!error && claimsData?.claims?.sub) {
      redirect("/circle");
    }
  }

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
          <span><b>Powered by people who wear it</b></span>
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
        <p className="faqIntro">The basics about matching, privacy, Fit Results, Fit Twins, Following, and the community-built clothing catalog.</p>
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
