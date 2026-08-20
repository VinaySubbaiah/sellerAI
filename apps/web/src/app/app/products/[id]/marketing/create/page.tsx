"use client";
import { startJobAndGo } from "@/lib/jobs";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function MarketingCreate() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({ purpose: "SALE", headline: "", offer: "", cta: "Shop now", price: "", format: "INSTAGRAM_POST", language: "ENGLISH" });
  const [error, setError] = useState("");
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="text-2xl font-bold">Marketing creative</h1>
      <p className="text-sm text-[#64748B]">2 credits per generated creative set. Text is rendered with templates, not guessed by an image model.</p>
      {error ? <p className="text-[#EF4444]">{error}</p> : null}
      {(["purpose", "headline", "offer", "cta", "price"] as const).map((k) => (
        <label key={k} className="block text-sm capitalize">{k}<input className="mt-1 h-11 w-full rounded-xl border px-3" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
      ))}
      <select className="h-11 w-full rounded-xl border" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
        {["INSTAGRAM_POST", "INSTAGRAM_STORY", "WHATSAPP_STATUS", "FACEBOOK_POST", "WEBSITE_BANNER"].map((f) => <option key={f}>{f}</option>)}
      </select>
      <button className="h-12 w-full rounded-xl bg-[#4F46E5] font-semibold text-white" onClick={() => startJobAndGo({ type: "MARKETING", productId: id, payload: form, setError })}>
        Generate creatives — 2 credits
      </button>
    </div>
  );
}
