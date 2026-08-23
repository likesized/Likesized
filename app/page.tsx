import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const capabilities = [
  {
    eyebrow: "FIND PEOPLE MY SIZE",
    title: "Discover people shaped like you.",
    description: "Ranked by the measurements that matter most for each garment—not generic size charts that can vary widely between brands and products.",
    href: "/people",
    link: "Find My Matches →",
  },
  {
    eyebrow: "SEE WHAT WORKS FOR THEM",
    title: "Explore what your matches actually wear.",
    description: "Learn which brands, sizes, and individual pieces work best on people built like you.",
    href: "/search",
    link: "Shop Smarter →",
  },
  {
    eyebrow: "BUILD YOUR CIRCLE",
    title: "Follow people whose fit and style you trust.",
    description: "See what they wear, how they style it, what they recommend, and the looks they create.",
    href: "/circle",
    link: "Get Inspired →",
  },
];

const faqs = [
  {
    question: "What does a Fit Report tell me, and what does Fit Result mean?",
    answer: "A Fit Report tells you what happened when another person actually wore the garment. Body Match tells you how similar you are to that person. The Fit Report tells you what size they wore and how it fit them. Fit Result is the person’s description of that fit: Too Small, Snug, Just Right, Relaxed, or Too Big. You’ll see it alongside the size they wore when viewing Fit Reports for an item.",
  },
  {
    question: "What does my Body Match percentage mean, and does a high match guarantee the same fit?",
    answer: "Your Body Match shows how closely your body measurements match the person who submitted a Fit Report. For example, 92% Body Match means that person’s measurements are very similar to yours. It does not mean the garment has a 92% chance of fitting you or that the same size is guaranteed to fit you the same way. People with similar measurements can still experience fit differently because of garment construction, fabric, body shape, and personal fit preference. Body Match tells you how similar you are to the person. Their Fit Report tells you what happened when they actually wore the garment.",
  },
  {
    question: "Why can my Match change by clothing type?",
    answer: "Different garments depend on different measurements. LikeSized emphasizes the measurements that matter for tops, bottoms, and specific garment types instead of using one generic score for everything.",
  },
  {
    question: "Does a low Body Match mean the item will not fit me?",
    answer: "No. A lower Body Match may simply mean we do not yet have a Fit Report for that item from someone whose measurements are very close to yours. The garment may still fit you perfectly. As more people submit Fit Reports, LikeSized can show you evidence from people who are closer to your size and proportions.",
  },
  {
    question: "Why am I seeing a lower Body Match before a stronger one?",
    answer: "Because LikeSized shows evidence from the exact variation you are viewing first. Someone who wore a related version of the garment may be a much stronger Body Match, but they did not wear the exact same version. The exact-variation report tells you what happened with the same version you’re viewing. A related report can give you additional evidence from someone built more like you while clearly showing what was different about the garment they wore.",
  },
  {
    question: "What are Strong Fit Reports?",
    answer: "When multiple people with strong Body Matches have reported on the same garment variation, LikeSized may summarize those reports together. This helps you see whether several people built similarly to you had similar experiences with the garment. Different sizes or Fit Results do not necessarily mean one report is wrong—people with similar measurements can still experience or prefer fit differently. The closest individual Body Match is still shown first, while Strong Fit Reports show the broader pattern behind it.",
  },
  {
    question: "What makes LikeSized different from other sizing and fashion tools?",
    answer: "Many sizing tools start with size charts, general reviews, or a predicted size. LikeSized starts with real Fit Reports from people whose bodies are similar to yours and uses the measurements that matter for the garment you’re looking at. LikeSized also tracks fit down to the individual item whenever real Fit Reports exist. Two pairs of pants from the same brand can fit completely differently, so we don’t assume a brand, clothing category, or printed size fits the same across every product. If someone built like you has already worn the exact item, you can see what size they wore and how it actually fit them. That’s a lot more useful than assuming every item from the same brand fits the same.",
  },
  {
    question: "Can other members see my measurements?",
    answer: "No. Your exact current and historical body measurements stay private. Other members see safe Match percentages and the fit information you intentionally share.",
  },
  {
    question: "What is a Fit Twin, and do I have to be Fit Twins to follow someone?",
    answer: "No. Following and Fit Twin status are different. You can follow anyone whose style or fit activity you want to keep up with. A Fit Twin is someone you follow whom LikeSized identifies as a strong current body match. Following adds someone to My Circle; LikeSized decides whether that followed person also qualifies as a Fit Twin.",
  },
  {
    question: "How does the community-built clothing catalog work?",
    answer: "LikeSized’s catalog grows from real Fit Reports submitted by people who actually own the clothes. Add what you know and leave anything you’re unsure about blank rather than guessing. Other members can help fill in missing details, and incorrect information can be flagged for review.",
  },
  {
    question: "What if I’m not sure of the item, style, or model?",
    answer: "Enter the best information you can find and check “I’m not completely sure this is the correct item/style name.” You can still save your Fit Report and use the garment in your Styles while LikeSized reviews it. A retail link, Product Photo, or clear photo of the label/tag can help us identify it.",
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

      <section
        className="section"
        id="how-it-works"
        style={{
          background: "linear-gradient(135deg, #e8dfd3 0%, #f3e6e9 100%)",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
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
            <article
              className="matchCard"
              key={capability.eyebrow}
              style={{ boxShadow: "0 18px 50px rgba(18, 18, 18, 0.08)" }}
            >
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

      <section className="howItWorks section" id="the-loop">
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

      <section className="section faqSection" id="faq" aria-labelledby="faq-title">
        <span className="eyebrow">HELP / FAQ</span>
        <h2 className="sectionTitle" id="faq-title">Questions before you get started?</h2>
        <p className="faqIntro">The basics about Fit Reports, Body Match, privacy, Fit Twins, Following, and the community-built clothing catalog.</p>
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