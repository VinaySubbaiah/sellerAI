"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    void api(`/products/${id}`).then(setProduct);
  }, [id]);

  if (!product) return <p>Loading…</p>;
  const check = product.readinessChecks?.[0];

  return (
    <div>
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Overview", "Images", "Marketing", "Listing", "Projects", "History"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-sm ${tab === t ? "bg-[#4F46E5] text-white" : "bg-slate-100"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {[
          ["Marketplace Listing Pack", "listing/create"],
          ["Product Photography", "photos/create"],
          ["Marketing Creative", "marketing/create"],
          ["Edit Product Photo", "edit"],
          ["Animated Photo Ad", "reel/create"],
        ].map(([label, path]) => (
          <Link key={label} href={`/app/products/${id}/${path}`} className="rounded-2xl border bg-white p-5 font-semibold">
            {label}
          </Link>
        ))}
      </div>
      {check ? (
        <div className="mt-6 rounded-2xl border bg-white p-5">
          <p className="text-3xl font-bold">{check.score} / 100</p>
          <p className="text-[#64748B]">{check.label}</p>
          <p className="mt-2 text-xs text-[#94A3B8]">Marketplace policies can change. Verify the latest requirements before publishing.</p>
        </div>
      ) : null}
      <button className="mt-6 text-sm text-[#EF4444]" onClick={async () => { await api(`/products/${id}`, { method: "DELETE" }); router.push("/app/products"); }}>
        Archive / Delete
      </button>
    </div>
  );
}
