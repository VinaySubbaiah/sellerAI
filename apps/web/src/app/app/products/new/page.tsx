"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

const platforms = ["AMAZON", "FLIPKART", "MEESHO", "SHOPIFY", "INSTAGRAM"] as const;

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>(["AMAZON"]);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const product = await api<{ id: string }>("/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          brandName: brandName || undefined,
          category,
          sellingPrice: sellingPrice ? Math.round(Number(sellingPrice) * 100) : undefined,
          description: description || undefined,
          platforms: selected,
        }),
      });
      router.push(`/app/products/${product.id}/upload`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">New product</h1>
      {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
      <label className="block text-sm font-medium">Product Name<input required className="mt-1 h-11 w-full rounded-xl border px-3" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="block text-sm font-medium">Brand<input className="mt-1 h-11 w-full rounded-xl border px-3" value={brandName} onChange={(e) => setBrandName(e.target.value)} /></label>
      <label className="block text-sm font-medium">Category<input required className="mt-1 h-11 w-full rounded-xl border px-3" value={category} onChange={(e) => setCategory(e.target.value)} /></label>
      <label className="block text-sm font-medium">Selling Price optional<input type="number" className="mt-1 h-11 w-full rounded-xl border px-3" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} /></label>
      <label className="block text-sm font-medium">Description optional<textarea className="mt-1 min-h-24 w-full rounded-xl border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <fieldset>
        <legend className="text-sm font-medium">Platforms</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {platforms.map((p) => (
            <label key={p} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(p)}
                onChange={() => setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]))}
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>
      <button className="h-12 w-full rounded-xl bg-[#4F46E5] font-semibold text-white">Create Product</button>
    </form>
  );
}
