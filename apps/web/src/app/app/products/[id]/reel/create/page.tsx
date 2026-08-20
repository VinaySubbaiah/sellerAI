"use client";
import { startJobAndGo } from "@/lib/jobs";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ReelCreate() {
  const { id } = useParams<{ id: string }>();
  const [durationSec, setDurationSec] = useState<5 | 10>(5);
  const [style, setStyle] = useState("PREMIUM");
  const [headline, setHeadline] = useState("");
  const [offer, setOffer] = useState("");
  const [cta, setCta] = useState("Shop now");
  const [error, setError] = useState("");
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="text-2xl font-bold">Animated photo ad</h1>
      <p className="text-sm text-[#64748B]">3 credits. 9:16 MP4 from your existing photos. Not generative video.</p>
      <ol className="text-sm text-[#64748B]">
        <li>Scene 1 Product</li>
        <li>Scene 2 Offer</li>
        <li>Scene 3 Feature/Benefit</li>
        <li>Scene 4 CTA</li>
      </ol>
      {error ? <p className="text-[#EF4444]">{error}</p> : null}
      <div className="flex gap-2">
        {[5, 10].map((d) => <button key={d} className={`rounded-xl px-4 py-2 ${durationSec === d ? "bg-[#4F46E5] text-white" : "bg-slate-100"}`} onClick={() => setDurationSec(d as 5 | 10)}>{d}s</button>)}
      </div>
      <select className="h-11 w-full rounded-xl border" value={style} onChange={(e) => setStyle(e.target.value)}>
        {["PREMIUM", "ENERGETIC", "MINIMAL", "CLEAN"].map((s) => <option key={s}>{s}</option>)}
      </select>
      <input className="h-11 w-full rounded-xl border px-3" placeholder="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      <input className="h-11 w-full rounded-xl border px-3" placeholder="Offer" value={offer} onChange={(e) => setOffer(e.target.value)} />
      <input className="h-11 w-full rounded-xl border px-3" placeholder="CTA" value={cta} onChange={(e) => setCta(e.target.value)} />
      <button className="h-12 w-full rounded-xl bg-[#4F46E5] font-semibold text-white" onClick={() => startJobAndGo({ type: "ANIMATED_REEL", productId: id, payload: { durationSec, style, headline, offer, cta, withText: true }, setError })}>
        Render reel — 3 credits
      </button>
    </div>
  );
}
