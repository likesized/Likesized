"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/onboarding/MeasurementHelp.module.css";

type BodyGuide =
  | { kind: "body"; mode: "circumference"; y: number; cx?: number; rx?: number }
  | { kind: "body"; mode: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "body"; mode: "polyline"; points: string }
  | { kind: "body"; mode: "loop" };

type Guide =
  | BodyGuide
  | { kind: "foot"; axis: "length" | "width" }
  | { kind: "scale" }
  | { kind: "waistHip" }
  | { kind: "torsoGirth" }
  | { kind: "crotchDepth" }
  | { kind: "crotchLength" };

type HelpItem = {
  title: string;
  description: string;
  how: string;
  why?: string;
  tip?: string;
  guide: Guide;
};

const BODY_GUIDE_SRC = "/measurement-guides/body-guide.webp";
const WAIST_HIP_GUIDE_SRC = "/measurement-guides/waist-hip-guide.webp";
const TORSO_GIRTH_GUIDE_SRC = "/measurement-guides/torso-girth-guide.webp";
const CROTCH_DEPTH_GUIDE_SRC = "/measurement-guides/crotch-depth-guide.webp";
const TOTAL_CROTCH_LENGTH_GUIDE_SRC = "/measurement-guides/total-crotch-length-guide.webp";

const HELP: Record<string, HelpItem> = {
  height: { title: "Height", description: "Your full standing height.", how: "Stand barefoot on a flat floor with your back straight. Measure from the floor to the highest point of your head.", tip: "A wall and a flat book can make this easier.", guide: { kind: "body", mode: "line", x1: 42, y1: 24, x2: 42, y2: 278 } },
  weight: { title: "Weight", description: "Your current body weight.", how: "Use a scale on a hard, level surface and enter your current weight.", tip: "Light clothing and a consistent time of day give the most useful updates.", guide: { kind: "scale" } },
  chest_circumference: { title: "Chest", description: "The circumference around the fullest part of the chest.", how: "Wrap a soft tape around the fullest part of the chest, under the arms and across the shoulder blades. Keep the tape level.", guide: { kind: "body", mode: "circumference", y: 96 } },
  full_bust: { title: "Full Bust", description: "The circumference around the fullest part of the bust.", how: "Wrap the tape around the fullest point of the bust and straight around the back. Keep it snug without compressing.", guide: { kind: "body", mode: "circumference", y: 104 } },
  high_bust: { title: "High Bust", description: "Measures around the upper chest, above the fullest part of the bust.", how: "Place the tape high under the arms and around the upper chest, keeping it level across the back. The tape should sit above the fullest part of the bust.", why: "This helps show the difference between upper-chest size and Full Bust, which can improve fit for tops, dresses, and jackets.", guide: { kind: "body", mode: "circumference", y: 88 } },
  underbust: { title: "Underbust", description: "The circumference directly beneath the bust.", how: "Wrap the tape around the ribcage directly under the bust. Keep it level, snug and comfortable.", guide: { kind: "body", mode: "circumference", y: 114 } },
  natural_waist: { title: "Natural Waist", description: "The circumference of the natural waist.", how: "Find the natural waist where the torso creases when bending to the side. Wrap the tape around that point without pulling tight.", guide: { kind: "waistHip" } },
  lower_pants_waist: { title: "Pants Waist", description: "The circumference where a pants waistband normally sits.", how: "Wrap the tape around the point where pants typically sit. Keep the tape level and relaxed.", guide: { kind: "body", mode: "circumference", y: 150 } },
  high_hip: { title: "High Hip", description: "The circumference around the upper hip area.", how: "Measure around the upper hips, usually a few inches below the natural waist. Keep the tape parallel to the floor.", guide: { kind: "waistHip" } },
  full_hip_seat: { title: "Hips / Seat", description: "The circumference around the fullest part of the hips and seat.", how: "Stand with feet together and wrap the tape around the fullest point of the hips and buttocks. Keep it level.", guide: { kind: "waistHip" } },
  waist_to_hip_length: { title: "Waist-to-Hip Length", description: "The vertical distance from the natural waist to the fullest part of the hip.", how: "Measure straight down the side of the body from the natural waist to the level of the fullest hip.", guide: { kind: "waistHip" } },
  inseam: { title: "Inseam", description: "The inside-leg length from the crotch to the bottom of the leg.", how: "Measure from the crotch point straight down the inside of the leg to the preferred pant hem or the floor.", tip: "A well-fitting pair of pants can also be measured flat from crotch seam to hem.", guide: { kind: "body", mode: "line", x1: 106, y1: 190, x2: 106, y2: 278 } },
  shoulder_width: { title: "Shoulder Width", description: "The width across the back from one shoulder point to the other.", how: "Measure across the upper back from the outer edge of one shoulder to the outer edge of the other, following the natural shoulder line.", guide: { kind: "body", mode: "line", x1: 73, y1: 70, x2: 147, y2: 70 } },
  individual_shoulder_length: { title: "Individual Shoulder Length", description: "The length from the base of the neck to the outer shoulder point.", how: "Measure from where the neck meets the shoulder to the outer shoulder point where a sleeve seam would sit.", guide: { kind: "body", mode: "line", x1: 110, y1: 62, x2: 148, y2: 72 } },
  torso_body_length: { title: "Torso Length", description: "The vertical body length from the shoulder area to the natural waist.", how: "Measure from the high shoulder point near the neck down the front of the torso to the natural waist.", guide: { kind: "body", mode: "line", x1: 142, y1: 63, x2: 142, y2: 136 } },
  torso_girth: { title: "Torso Girth", description: "The full loop around the torso from shoulder through the crotch and back.", how: "Start at the shoulder, run the tape down the front through the crotch, then up the back to the same shoulder point.", tip: "Keep the tape close to the body without pulling it tight.", guide: { kind: "torsoGirth" } },
  bust_point_to_bust_point: { title: "Bust Point to Bust Point", description: "The horizontal distance between the fullest points of the bust.", how: "Measure straight across from the fullest point of one bust to the fullest point of the other while standing naturally.", guide: { kind: "body", mode: "line", x1: 94, y1: 104, x2: 126, y2: 104 } },
  shoulder_to_bust_point: { title: "Shoulder to Bust Point", description: "The distance from the middle of the shoulder to the fullest point of the bust.", how: "Start at the middle of the shoulder, where a bra strap naturally sits. Measure straight down to the fullest point of the bust.", guide: { kind: "body", mode: "line", x1: 126, y1: 64, x2: 126, y2: 104 } },
  front_waist_length: { title: "Front Waist Length", description: "The distance from the shoulder at the base of the neck to the natural waist along the front of the body.", how: "Start where the neck meets the shoulder. Measure down the front of the body, passing over the fullest part of the bust, to the natural waist.", guide: { kind: "body", mode: "polyline", points: "140,64 128,104 128,136" } },
  back_waist_length: { title: "Back Waist Length", description: "The distance from the base of the neck to the natural waist along the center back.", how: "Start at the prominent bone at the base of the neck. Measure straight down the center of the back to the natural waist.", guide: { kind: "body", mode: "line", x1: 110, y1: 58, x2: 110, y2: 136 } },
  shoulder_to_waist: { title: "Shoulder to Waist", description: "The distance from the outer shoulder point to the natural waist.", how: "Start at the outer shoulder point where a sleeve seam would sit. Measure down the side of the torso to the natural waist, following the body.", guide: { kind: "body", mode: "line", x1: 148, y1: 71, x2: 147, y2: 136 } },
  across_back_width: { title: "Across-Back Width", description: "The horizontal width across the upper back between the rear arm creases.", how: "Measure straight across the upper back from one rear arm crease to the other. Keep the tape level and do not wrap it around the body.", guide: { kind: "body", mode: "line", x1: 82, y1: 89, x2: 138, y2: 89 } },
  across_front_chest_width: { title: "Across-Front Chest Width", description: "The horizontal width across the upper front of the chest between the front arm creases.", how: "Measure straight across the upper chest from one front arm crease to the other, above the fullest part of the bust or chest. Keep the tape level and do not wrap it around the body.", guide: { kind: "body", mode: "line", x1: 83, y1: 91, x2: 137, y2: 91 } },
  arm_sleeve_length: { title: "Arm / Sleeve Length", description: "The distance from the outer shoulder point to the wrist along the outside of the arm.", how: "Start at the outer shoulder point where a sleeve seam would sit. With the arm slightly bent, measure down the outside of the arm, over the elbow, to the wrist.", guide: { kind: "body", mode: "polyline", points: "148,72 169,126 163,180" } },
  bicep_upper_arm: { title: "Upper Arm Circumference", description: "The circumference around the fullest part of the upper arm.", how: "Let your arm hang relaxed at your side. Wrap the tape around the fullest part of the upper arm, keeping it level and snug without pulling tight.", guide: { kind: "body", mode: "circumference", y: 107, cx: 162, rx: 15 } },
  elbow_circumference: { title: "Elbow Circumference", description: "The circumference around the fullest part of the elbow.", how: "Bend the elbow slightly. Wrap the tape around the fullest part of the elbow, keeping it snug without pulling tight.", guide: { kind: "body", mode: "circumference", y: 137, cx: 169, rx: 13 } },
  wrist_circumference: { title: "Wrist Circumference", description: "The circumference around the wrist at the wrist bone.", how: "Wrap the tape around the wrist at the wrist bone where a watch or cuff would naturally sit. Keep it snug without pulling tight.", guide: { kind: "body", mode: "circumference", y: 178, cx: 163, rx: 10 } },
  neck_collar_circumference: { title: "Neck / Collar Circumference", description: "The circumference around the base of the neck where a shirt collar naturally sits.", how: "Wrap the tape around the base of the neck at collar level. Keep the tape level and comfortably snug without pulling tight.", tip: "For shirt-collar fit, leave about one finger of space under the tape.", guide: { kind: "body", mode: "circumference", y: 58, cx: 110, rx: 18 } },
  thigh_circumference: { title: "Thigh Circumference", description: "The circumference around the fullest part of the upper thigh.", how: "Stand naturally with your weight evenly distributed. Wrap the tape around the fullest part of one upper thigh, keeping it level and snug without pulling tight.", guide: { kind: "body", mode: "circumference", y: 205, cx: 91, rx: 20 } },
  knee_circumference: { title: "Knee Circumference", description: "The circumference around the fullest part of the knee.", how: "Stand relaxed with the leg straight. Wrap the tape around the fullest part of the knee, keeping it level and snug without pulling tight.", guide: { kind: "body", mode: "circumference", y: 237, cx: 92, rx: 14 } },
  calf_circumference: { title: "Calf Circumference", description: "The circumference around the fullest part of the calf.", how: "Stand naturally and wrap the tape around the widest part of the calf. Keep it level and snug without pulling tight.", guide: { kind: "body", mode: "circumference", y: 258, cx: 92, rx: 15 } },
  outseam: { title: "Outseam", description: "The outside-leg length from the normal waistband position to the desired pant hem.", how: "Start at the side of the body where your pants waistband normally sits. Measure straight down the outside of the leg to the desired hem or the floor.", guide: { kind: "body", mode: "line", x1: 155, y1: 150, x2: 155, y2: 278 } },
  front_rise: { title: "Front Rise", description: "The distance from the center front waistband to the point between the legs where the front and back seams meet.", how: "Start at the center front where your pants waistband normally sits. Measure down along the front of the body to the point between the legs where the front and back seams meet.", guide: { kind: "body", mode: "line", x1: 110, y1: 150, x2: 110, y2: 190 } },
  back_rise: { title: "Back Rise", description: "The distance from the center back waistband to the point between the legs where the front and back seams meet.", how: "Start at the center back where your pants waistband normally sits. Measure down along the body to the point between the legs where the front and back seams meet.", guide: { kind: "body", mode: "polyline", points: "120,150 126,172 110,190" } },
  crotch_depth: { title: "Crotch Depth", description: "The vertical distance from the natural waist to the surface you are sitting on.", how: "Sit upright on a firm, flat chair. Measure straight down from the side of your natural waist to the chair surface.", guide: { kind: "crotchDepth" } },
  total_crotch_length: { title: "Total Crotch Length", description: "The full distance from the center front waist, through the legs, to the center back waist.", how: "Start at the center front of your natural waist. Run the tape down through the legs and up to the center back of your natural waist, following the body.", guide: { kind: "crotchLength" } },
  foot_length: { title: "Foot Length", description: "The distance from the back of the heel to the tip of the longest toe.", how: "Stand with your full weight on the foot. Measure straight from the back of the heel to the tip of the longest toe.", tip: "Measure both feet and use the larger measurement.", guide: { kind: "foot", axis: "length" } },
  foot_width: { title: "Foot Width", description: "The width across the widest part of the forefoot.", how: "Stand with your full weight on the foot. Measure straight across the widest part of the ball of the foot.", tip: "Measure both feet and use the larger measurement.", guide: { kind: "foot", axis: "width" } },
};

function ArrowDefs() {
  return <defs><marker id="measure-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" /></marker></defs>;
}

function BodyDiagram({ guide, label }: { guide: BodyGuide; label: string }) {
  return <svg className={`${styles.diagramSvg} ${styles.bodyDiagram}`} viewBox="0 0 220 300" role="img" aria-label={`${label} measurement diagram`}>
    <ArrowDefs />
    <image href={BODY_GUIDE_SRC} x="10" y="0" width="200" height="300" preserveAspectRatio="xMidYMid meet" />
    <g className={styles.measurementGuide}>
      {guide.mode === "circumference" ? <ellipse cx={guide.cx ?? 110} cy={guide.y} rx={guide.rx ?? 42} ry="7" /> : null}
      {guide.mode === "line" ? <line x1={guide.x1} y1={guide.y1} x2={guide.x2} y2={guide.y2} markerStart="url(#measure-arrow)" markerEnd="url(#measure-arrow)" /> : null}
      {guide.mode === "polyline" ? <polyline points={guide.points} markerStart="url(#measure-arrow)" markerEnd="url(#measure-arrow)" /> : null}
      {guide.mode === "loop" ? <path d="M126 64 C150 95 153 145 132 188 C122 211 98 211 88 188 C67 145 70 95 94 64" markerStart="url(#measure-arrow)" markerEnd="url(#measure-arrow)" /> : null}
    </g>
  </svg>;
}

function ApprovedGuideImage({ src, alt, variant }: { src: string; alt: string; variant: "waist" | "torso" | "crotch" }) {
  const variantClass = variant === "waist" ? styles.waistGuideImage : variant === "torso" ? styles.torsoGuideImage : styles.crotchGuideImage;
  return <img className={`${styles.approvedGuideImage} ${variantClass}`} src={src} alt={alt} />;
}

function FootDiagram({ axis, label }: { axis: "length" | "width"; label: string }) {
  return <svg className={styles.diagramSvg} viewBox="0 0 220 300" role="img" aria-label={`${label} measurement diagram`}>
    <ArrowDefs />
    <g className={styles.bodyFigure}><path d="M90 35 C68 70 67 118 74 165 C80 205 66 244 78 262 C91 282 139 273 153 251 C164 234 149 207 148 177 C147 143 156 110 145 77 C136 50 112 22 90 35 Z" /></g>
    <g className={styles.measurementGuide}>
      {axis === "length" ? <line x1="64" y1="36" x2="64" y2="267" markerStart="url(#measure-arrow)" markerEnd="url(#measure-arrow)" /> : <line x1="72" y1="182" x2="153" y2="182" markerStart="url(#measure-arrow)" markerEnd="url(#measure-arrow)" />}
    </g>
  </svg>;
}

function ScaleDiagram({ label }: { label: string }) {
  return <svg className={styles.diagramSvg} viewBox="0 0 220 300" role="img" aria-label={`${label} measurement diagram`}>
    <g className={styles.bodyFigure}><rect x="55" y="80" width="110" height="130" rx="24" /><path d="M82 112 Q110 91 138 112" /><line x1="110" y1="106" x2="125" y2="120" /><path d="M75 232 H145" /></g>
    <g className={styles.measurementGuide}><circle cx="110" cy="118" r="31" /></g>
  </svg>;
}

function MeasurementDiagram({ item }: { item: HelpItem }) {
  if (item.guide.kind === "waistHip") return <ApprovedGuideImage src={WAIST_HIP_GUIDE_SRC} alt="Natural Waist, High Hip, Full Hip / Seat, and Waist-to-Hip measurement guide" variant="waist" />;
  if (item.guide.kind === "torsoGirth") return <ApprovedGuideImage src={TORSO_GIRTH_GUIDE_SRC} alt="Front and back body diagram showing the torso-girth measurement path from shoulder, through the crotch, and back to the shoulder" variant="torso" />;
  if (item.guide.kind === "crotchDepth") return <ApprovedGuideImage src={CROTCH_DEPTH_GUIDE_SRC} alt="Side-view seated figure for measuring Crotch Depth" variant="crotch" />;
  if (item.guide.kind === "crotchLength") return <ApprovedGuideImage src={TOTAL_CROTCH_LENGTH_GUIDE_SRC} alt="Side-view standing figure for measuring Total Crotch Length" variant="crotch" />;
  if (item.guide.kind === "foot") return <FootDiagram axis={item.guide.axis} label={item.title} />;
  if (item.guide.kind === "scale") return <ScaleDiagram label={item.title} />;
  return <BodyDiagram guide={item.guide} label={item.title} />;
}

export function MeasurementHelpDialog({ measurementKey, onClose }: { measurementKey: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const item = HELP[measurementKey];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [measurementKey]);

  if (!item) return null;

  return <dialog
    ref={dialogRef}
    className={styles.helpDialog}
    aria-labelledby="measurement-help-title"
    onClose={onClose}
    onClick={(event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    }}
  >
    <div className={styles.helpDialogHeader}>
      <div>
        <span className={styles.helpEyebrow}>HOW TO MEASURE</span>
        <h2 id="measurement-help-title">{item.title}</h2>
      </div>
      <button type="button" className={styles.closeButton} onClick={() => dialogRef.current?.close()} aria-label="Close measurement help">×</button>
    </div>
    <div className={styles.helpDialogBody}>
      <div className={styles.diagramCard}><MeasurementDiagram item={item} /></div>
      <div className={styles.helpCopy}>
        <p className={styles.description}>{item.description}</p>
        <h3>How to measure</h3>
        <p>{item.how}</p>
        {item.why ? <><h3 className={styles.whyHeading}>Why it matters</h3><p>{item.why}</p></> : null}
        {item.tip ? <div className={styles.tip}><strong>Tip:</strong> {item.tip}</div> : null}
      </div>
    </div>
  </dialog>;
}