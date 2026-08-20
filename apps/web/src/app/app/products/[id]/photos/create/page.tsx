"use client";
import { startJobAndGo } from "@/lib/jobs";
import { useParams } from "next/navigation";
import { useState } from "react";

const styles = ["PURE_WHITE", "STUDIO", "LIFESTYLE", "LUXURY", "NATURAL", "MINIMAL", "CUSTOM"];

export default function PhotosCreate() {
  const { id } = useParams<{ id: string }>();
  const [selected, setSelected] = useState(["PURE_WHITE"]);
  const [preserve, setPreserve] = useState(true);
  const [error, setError] = useState("");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Product photography</h1>
      <p className="text-sm text-[#64748B]">1 credit per image. Preserve Exact Product Appearance = ON</p>
      {error ? <p className="text-[#EF4444]">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {styles.map((s) => (
          <button key={s} className={`rounded-full px-3 py-1 text-sm ${selected.includes(s) ? "bg-[#4F46E5] text-white" : "bg-slate-100"}`} onClick={() => setSelected((x) => x.includes(s) ? x.filter((i) => i !== s) : [...x, s])}>{s}</button>
        ))}
      </div>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={preserve} onChange={(e) => setPreserve(e.target.checked)} /> Preserve Exact Product Appearance</label>
      <button className="h-12 w-full rounded-xl bg-[#4F46E5] font-semibold text-white" onClick={() => startJobAndGo({ type: "PRODUCT_PHOTOS", productId: id, payload: { styles: selected, count: selected.length, preserveProduct: preserve }, setError })}>
        Generate {selected.length} image{selected.length === 1 ? "" : "s"} — {selected.length} credit{selected.length === 1 ? "" : "s"}
      </button>
    </div>
  );
}
