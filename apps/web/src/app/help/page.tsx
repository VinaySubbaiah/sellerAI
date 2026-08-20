"use client";

import { MarketingFooter, MarketingHeader } from "@/components/marketing-chrome";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

export default function HelpPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<{ id: string; category: string; question: string; answer: string }[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      void api<typeof items>(`/help/faqs${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setItems).catch(() => setItems([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const cats = ["Getting Started", "Product Upload", "AI Product Photos", "Marketplace Listing", "Marketing", "Credits", "Razorpay Payments", "Account"];

  return (
    <div>
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Help</h1>
        <input
          aria-label="Search help"
          className="mt-6 h-12 w-full rounded-xl border px-4"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4F46E5]" onClick={() => setQ(c)}>
              {c}
            </button>
          ))}
        </div>
        <ul className="mt-8 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border bg-white p-5">
              <p className="text-xs font-semibold text-[#4F46E5]">{item.category}</p>
              <h2 className="mt-1 font-semibold">{item.question}</h2>
              <p className="mt-2 text-sm text-[#64748B]">{item.answer}</p>
            </li>
          ))}
        </ul>
        <form
          className="mt-10 space-y-3 rounded-2xl border bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/support", { method: "POST", body: JSON.stringify({ category: "Account", subject, message }) });
            setDone(true);
          }}
        >
          <h2 className="font-semibold">Contact support</h2>
          {done ? <p className="text-sm text-emerald-700">Request stored. We will follow up by email.</p> : null}
          <input className="h-11 w-full rounded-xl border px-3" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className="min-h-24 w-full rounded-xl border px-3 py-2" placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} />
          <button className="rounded-xl bg-[#4F46E5] px-4 py-2 font-semibold text-white">Send</button>
        </form>
      </main>
      <MarketingFooter />
    </div>
  );
}
