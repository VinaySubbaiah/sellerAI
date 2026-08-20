"use client";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function BrandPage() {
  const [brand, setBrand] = useState<any>(null);
  useEffect(() => { void api("/brands/me").then(setBrand); }, []);
  if (!brand) return <p>No brand kit yet. Complete onboarding.</p>;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form className="space-y-3 rounded-2xl border bg-white p-6" onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await api("/brands/me", { method: "PUT", body: JSON.stringify({
          name: fd.get("name"), category: fd.get("category"), website: fd.get("website"), instagram: fd.get("instagram"),
          whatsapp: fd.get("whatsapp"), style: fd.get("style"), primaryColor: fd.get("primaryColor"),
          secondaryColor: fd.get("secondaryColor"), defaultCta: fd.get("defaultCta"), language: fd.get("language"),
        }) });
      }}>
        <h1 className="text-2xl font-bold">Brand Kit</h1>
        {["name","category","website","instagram","whatsapp","defaultCta"].map((k) => (
          <label key={k} className="block text-sm capitalize">{k}<input name={k} defaultValue={brand[k] ?? ""} className="mt-1 h-11 w-full rounded-xl border px-3" /></label>
        ))}
        <input name="style" defaultValue={brand.style} className="h-11 w-full rounded-xl border px-3" />
        <input name="language" defaultValue={brand.language} className="h-11 w-full rounded-xl border px-3" />
        <label className="text-sm">Primary <input name="primaryColor" type="color" defaultValue={brand.primaryColor} /></label>
        <label className="text-sm">Secondary <input name="secondaryColor" type="color" defaultValue={brand.secondaryColor} /></label>
        <button className="h-11 w-full rounded-xl bg-[#4F46E5] font-semibold text-white">Save</button>
      </form>
      <div className="rounded-2xl border p-6" style={{ background: brand.primaryColor }}>
        <p className="text-white/80">Live preview</p>
        <p className="mt-6 text-2xl font-bold text-white">{brand.name}</p>
        <p className="mt-2 text-white">{brand.defaultCta}</p>
        <div className="mt-8 h-16 rounded-xl" style={{ background: brand.secondaryColor }} />
      </div>
    </div>
  );
}
