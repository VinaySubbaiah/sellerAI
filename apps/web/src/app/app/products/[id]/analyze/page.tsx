"use client";

import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AnalyzePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ productName: "", category: "", colors: "", possibleFeatures: "", possibleMaterial: "" });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ jobId: string; analysis?: typeof form; inline?: boolean }>(`/products/${id}/analyze`, { method: "POST", body: JSON.stringify({}) });
        let analysis = res.analysis;
        if (!analysis) {
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 1000));
            const product = await api<{ specification?: { aiSuggestion?: Record<string, unknown> } }>(`/products/${id}`);
            if (product.specification?.aiSuggestion) {
              analysis = product.specification.aiSuggestion as typeof form;
              break;
            }
          }
        }
        if (analysis) {
          setForm({
            productName: String((analysis as { productName?: string }).productName ?? ""),
            category: String((analysis as { category?: string }).category ?? ""),
            colors: Array.isArray((analysis as { colors?: string[] }).colors) ? (analysis as { colors: string[] }).colors.join(", ") : "",
            possibleFeatures: Array.isArray((analysis as { possibleFeatures?: string[] }).possibleFeatures)
              ? (analysis as { possibleFeatures: string[] }).possibleFeatures.join(", ")
              : "",
            possibleMaterial: String((analysis as { possibleMaterial?: string }).possibleMaterial ?? ""),
          });
          setWarnings(((analysis as { warnings?: string[] }).warnings ?? []) as string[]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "AI unavailable");
      }
    })();
  }, [id]);

  async function confirm() {
    await api(`/products/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({
        confirmed: {
          productName: form.productName,
          category: form.category,
          colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
          features: form.possibleFeatures.split(",").map((s) => s.trim()).filter(Boolean),
          material: form.possibleMaterial || null,
        },
      }),
    });
    router.push(`/app/products/${id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Verify Product Information</h1>
      <p className="mt-2 text-sm text-[#64748B]">Never treat AI-detected specifications as confirmed facts.</p>
      {error ? <p className="mt-3 text-[#EF4444]">{error}</p> : null}
      <div className="mt-6 space-y-3 rounded-2xl border bg-white p-6">
        {warnings.map((w) => (
          <p key={w} className="text-sm text-amber-700">{w}</p>
        ))}
        <label className="block text-sm">Product name<input className="mt-1 h-11 w-full rounded-xl border px-3" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} /></label>
        <label className="block text-sm">Category<input className="mt-1 h-11 w-full rounded-xl border px-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
        <label className="block text-sm">Colors<input className="mt-1 h-11 w-full rounded-xl border px-3" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} /></label>
        <label className="block text-sm">Possible features<input className="mt-1 h-11 w-full rounded-xl border px-3" value={form.possibleFeatures} onChange={(e) => setForm({ ...form, possibleFeatures: e.target.value })} /></label>
        <label className="block text-sm">Material (unconfirmed)<input className="mt-1 h-11 w-full rounded-xl border px-3" value={form.possibleMaterial} onChange={(e) => setForm({ ...form, possibleMaterial: e.target.value })} /></label>
        <button onClick={confirm} className="h-12 w-full rounded-xl bg-[#4F46E5] font-semibold text-white">Confirm & Continue</button>
      </div>
    </div>
  );
}
