"use client";

import { startJobAndGo } from "@/lib/jobs";
import { useParams } from "next/navigation";
import { useState } from "react";

const assets = ["MAIN_IMAGE", "LIFESTYLE", "FEATURE", "BENEFITS", "DIMENSIONS", "COMPARISON", "BRAND_STORY"];

export default function ListingCreatePage() {
  const { id } = useParams<{ id: string }>();
  const [platform, setPlatform] = useState("AMAZON");
  const [language, setLanguage] = useState("ENGLISH");
  const [style, setStyle] = useState("CLEAN");
  const [selected, setSelected] = useState(assets);
  const [preserve, setPreserve] = useState(true);
  const [error, setError] = useState("");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Marketplace Listing Pack</h1>
      <p className="text-sm text-[#64748B]">Generate Listing Pack — 8 credits</p>
      {error ? <p className="text-[#EF4444]">{error}</p> : null}
      <select className="h-11 w-full rounded-xl border" value={platform} onChange={(e) => setPlatform(e.target.value)}>
        {["AMAZON", "FLIPKART", "MEESHO", "SHOPIFY"].map((p) => <option key={p}>{p}</option>)}
      </select>
      <select className="h-11 w-full rounded-xl border" value={language} onChange={(e) => setLanguage(e.target.value)}>
        {["ENGLISH", "HINDI", "KANNADA"].map((p) => <option key={p}>{p}</option>)}
      </select>
      <select className="h-11 w-full rounded-xl border" value={style} onChange={(e) => setStyle(e.target.value)}>
        {["CLEAN", "PREMIUM", "MINIMAL", "BOLD"].map((p) => <option key={p}>{p}</option>)}
      </select>
      <div className="flex flex-wrap gap-2">
        {assets.map((a) => (
          <label key={a} className="text-sm">
            <input type="checkbox" checked={selected.includes(a)} onChange={() => setSelected((s) => s.includes(a) ? s.filter((x) => x !== a) : [...s, a])} /> {a}
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={preserve} onChange={(e) => setPreserve(e.target.checked)} />
        Preserve Exact Product Appearance
      </label>
      {!preserve ? <p className="text-sm text-amber-700">This may substantially alter the product. Proceed with care.</p> : null}
      <button
        className="h-12 w-full rounded-xl bg-[#4F46E5] font-semibold text-white"
        onClick={() =>
          startJobAndGo({
            type: "LISTING_PACK",
            productId: id,
            payload: { platform, language, style, assets: selected, preserveProduct: preserve },
            setError,
          })
        }
      >
        Generate Listing Pack — 8 credits
      </button>
    </div>
  );
}
