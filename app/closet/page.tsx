import Link from "next/link";
import { closet } from "@/lib/mock-data";

export default function ClosetPage() {
  return (
    <main className="pageShell">
      <div className="pageTitle rowTitle">
        <div><span className="eyebrow">MY CLOSET</span><h1>Teach LikeSized what fits you.</h1></div>
        <button className="primaryButton">+ Add garment</button>
      </div>
      <div className="profileStrength">
        <div><strong>Fit Profile strength</strong><span>3 garments logged · Add 7 more for stronger recommendations</span></div>
        <div className="meter"><span style={{ width: "42%" }} /></div>
        <b>42%</b>
      </div>
      <div className="tableLike">
        {closet.map((g) => (
          <div className="closetRow" key={g.item}>
            <div className="garmentThumb">{g.brand.slice(0,1)}</div>
            <div className="closetMain"><span className="muted">{g.brand}</span><strong>{g.item}</strong><span>{g.category}</span></div>
            <div><span className="muted">SIZE</span><strong>{g.size}</strong></div>
            <div><span className="muted">FIT</span><strong>{g.fit}</strong></div>
            <div><span className="muted">WORN</span><strong>{g.wears}×</strong></div>
            <Link className="textLink" href="/item/levi-541">View →</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
