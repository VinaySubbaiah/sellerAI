"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Array<{ id: string; title: string; status: string; type: string }>>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);

  useEffect(() => {
    void api<typeof projects>("/projects").then(setProjects).catch(() => setProjects([]));
    void api<{ balance: number }>("/credits/wallet").then(setWallet).catch(() => undefined);
  }, []);

  const cards = [
    { href: "/app/products/new", title: "Marketplace Listing", body: "Pack images + copy for Amazon, Flipkart, Meesho or Shopify." },
    { href: "/app/products", title: "Product Photos", body: "White, studio and lifestyle composites that keep the product exact." },
    { href: "/app/products", title: "Marketing Creative", body: "Sale and festival layouts with brand colors and readable type." },
    { href: "/app/products", title: "Photo Editing", body: "Background, crop, center, lighting — no credits for simple edits." },
    { href: "/app/products", title: "Animated Reel", body: "5 or 10 second photo ads with pan, zoom and CTA." },
  ];

  return (
    <div>
      <div className="rounded-3xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] p-8 text-white">
        <h1 className="text-3xl font-bold">Create. Optimize. Sell Everywhere.</h1>
        <p className="mt-2 text-white/85">AI-powered content creation for Amazon, Flipkart, Meesho and more.</p>
        <Link href="/app/products/new" className="mt-6 inline-flex rounded-xl bg-white px-4 py-2 font-semibold text-[#4F46E5]">
          Create Listing Pack
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.title} href={c.href} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{c.title}</h2>
            <p className="mt-2 text-sm text-[#64748B]">{c.body}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold">Recent Projects</h2>
          {projects.length === 0 ? (
            <p className="mt-4 text-sm text-[#64748B]">Nothing generated yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {projects.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/app/projects/${p.id}`} className="flex justify-between text-sm">
                    <span>{p.title}</span>
                    <span className="text-[#64748B]">{p.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Credits</h2>
            <p className="mt-2 text-3xl font-bold">{wallet?.balance ?? "—"}</p>
            <Link href="/app/billing" className="mt-3 inline-block text-sm font-semibold text-[#4F46E5]">
              Upgrade
            </Link>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Listing Readiness</h2>
            <p className="mt-2 text-sm text-[#64748B]">Open a product to run checks. Marketplace policies can change. Verify before publishing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
