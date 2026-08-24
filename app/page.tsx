import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "@/app/home.module.css";
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
    link: "Find My Fit Twin →",
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
    description: "See what they wear, how they style it, what they recommend, and how they put it all together.",
    href: "/circle",
    link: "Get Inspired →",
  },
];

const faqs = [
  {
    question: "What does a Fit Report tell me, and what does Fit Result mean?",
    answer: <div className={styles.faqAnswer}>
      <p className={styles.faqLead}>A Fit Report tells you what happened when another person actually wore the garment.</p>
      <p><strong>Body Match</strong> tells you how similar you are to that person.</p>
      <p><strong>Fit Report</strong> tells you what size they wore and how it fit them.</p>
      <p><strong>Fit Result</strong> is the person’s description of that fit:</p>
      <div className={styles.faqTerms}>Too Small <span>·</span> Snug <span>·</span> Just Right <span>·</span> Relaxed <span>·</span> Too Big</div>
      <p>You’ll see it alongside the size they wore when viewing Fit Reports for an item.</p>
    </div>,
  },
  {
    question: "What does my Body Match percentage mean, and does a high match guarantee the same fit?",
    answer: <div className={styles.faqAnswer}>
      <p className={styles.faqLead}>Your <strong>Body Match</strong> shows how closely your body measurements match the person who submitted a Fit Report.</p>
      <p>For example, <strong>92% Body Match</strong> means that person’s measurements are very similar to yours. It does not mean the garment has a 92% chance of fitting you or that the same size is guaranteed to fit you the same way.</p>
      <p>People with similar measurements can still experience fit differently because of garment construction, fabric, body shape, and personal fit preference.</p>
      <p className={styles.faqTakeaway}><strong>Body Match</strong> tells you how similar you are to the person. Their <strong>Fit Report</strong> tells you what happened when they actually wore the garment.</p>
    </div>,
  },
  {
    question: "Why can my Match change by clothing type?",
    answer: <div className={styles.faqAnswer}><p>Different garments depend on different measurements. LikeSized emphasizes the measurements that matter for tops, bottoms, and specific garment types instead of using one generic score for everything.</p></div>,
  },
  {
    question: "Does a low Body Match mean the item will not fit me?",
    answer: <div className={styles.faqAnswer}>
      <p className={styles.faqLead}><strong>No.</strong></p>
      <p>A lower Body Match may simply mean we do not yet have a Fit Report for that item from someone whose measurements are very close to yours.</p>
      <p>The garment may still fit you perfectly. As more people submit Fit Reports, LikeSized can show you evidence from people who are closer to your size and proportions.</p>
    </div>,
  },
  {
    question: "Why am I seeing a lower Body Match before a stronger one?",
    answer: <div className={styles.faqAnswer}>
      <p className={styles.faqLead}>Because LikeSized shows evidence from the <strong>exact variation</strong> you are viewing first.</p>
      <p>Someone who wore a related version of the garment may be a much stronger Body Match, but they did not wear the exact same version.</p>
      <p className={styles.faqTakeaway}>The exact-variation report tells you what happened with the same version you’re viewing. A related report can give you additional evidence from someone built more like you while clearly showing what was different about the garment they wore.</p>
    </div>,
  },
  {
    question: "What are Strong Fit Reports?",
    answer: <div className={styles.faqAnswer}>
      <p className={styles.faqLead}>When multiple people with strong Body Matches have reported on the <strong>same garment variation</strong>, LikeSized may summarize those reports together.</p>
      <p>This helps you see whether several people built similarly to you had similar experiences with the garment.</p>
      <p>Different sizes or Fit Results do not necessarily mean one report is wrong—people with similar measurements can still experience or prefer fit differently.</p>
      <p className={styles.faqTakeaway}>The closest individual Body Match is still shown first, while <strong>Strong Fit Reports</strong> show the broader pattern behind it.</p>
    </div>,
  },
  {
    question: "What makes LikeSized different from other sizing and fashion tools?",
    answer: <div className={styles.faqAnswer}>
      <p className={styles.faqLead}>Many sizing tools start with size charts, general reviews, or a predicted size. LikeSized starts with real Fit Reports from people whose bodies are similar to yours and uses the measurements that matter for the garment you’re looking at.</p>
      <p>LikeSized also tracks fit down to the individual item whenever real Fit Reports exist. Two pairs of pants from the same brand can fit completely differently, so we don’t assume a brand, clothing category, or printed size fits the same across every product.</p>
      <p className={styles.faqTakeaway}>If someone built like you has already worn the exact item, you can see what size they wore and how it actually fit them. That’s a lot more useful than assuming every item from the same brand fits the same.</p>
    </div>,
  },
  {
    question: "Can other members see my measurements?",
    answer: <div className={styles.faqAnswer}><p><strong>No.</strong> Your exact current and historical body measurements stay private. Other members see safe Match percentages and the fit information you intentionally share.</p></div>,
  },
  {
    question: "What is a Fit Twin, and do I have to be Fit Twins to follow someone?",
    answer: <div className={styles.faqAnswer}>
      <p><strong>No.</strong> Following and Twin status are different. You can follow anyone whose style or fit activity you want to keep up with.</p>
      <p>LikeSized compares your current <strong>Tops Match</strong> and <strong>Bottoms Match</strong> separately. When a person you follow clears the current strong-match threshold in both regions, they qualify as a <strong>Fit Twin</strong>. If only Tops clears it, they can be a <strong>Tops Twin</strong>; if only Bottoms clears it, they can be a <strong>Bottoms Twin</strong>.</p>
      <p>Your <strong>Overall Match</strong> still shows your general body similarity. A high Overall Match by itself does not create a Fit Twin designation.</p>
    </div>,
  },
  {
    question: "How does the community-built clothing catalog work?",
    answer: <div className={styles.faqAnswer}>
      <p>LikeSized’s catalog grows from real Fit Reports submitted by people who actually own the clothes.</p>
      <p>Add what you know and leave anything you’re unsure about blank rather than guessing. Other members can help fill in missing details, and incorrect information can be flagged for review.</p>
    </div>,
  },
  {
    question: "What if I’m not sure of the item, style, or model?",
    answer: <div className={styles.faqAnswer}>
      <p>Enter the best information you can find and check <strong>“I’m not sure this is the correct item/style name.”</strong></p>
      <p>You can still save your Fit Report and use the garment in your Styles while LikeSized reviews it. A retail link, Product Photo, or clear photo of the label/tag can help us identify it.</p>
    </div>,
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
          <span className="heroEyebrowLine">YOUR BODY ISN’T A SIZE CHART.</span>
        </div>
        <h1>
          <span className="heroLine heroLinePrimary">Billions of bodies.</span>
          <span className="heroLine">A handful of sizes.</span>
        </h1>
        <p>
          <strong>Yeah, we thought that sounded ridiculous too.</strong>
          <br /><br />
          A size label was never going to tell the whole story. LikeSized adds what’s been missing: measurements, firsthand Fit Reports, and a better way to compare the information that actually matters.
          <br /><br />
          <strong>LikeSized. Because not all sizes are alike.</strong>
        </p>
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
              {faq.answer}
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
