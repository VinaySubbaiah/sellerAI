"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

const styles = ["MINIMAL", "PREMIUM", "NATURAL", "LUXURY", "BOLD", "PLAYFUL"] as const;
const langs = ["ENGLISH", "HINDI", "KANNADA"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    category: "",
    website: "",
    instagram: "",
    whatsapp: "",
    style: "MINIMAL",
    primaryColor: "#4F46E5",
    secondaryColor: "#2563EB",
    language: "ENGLISH",
    defaultCta: "Shop now",
  });
  const [error, setError] = useState("");

  async function save() {
    setError("");
    try {
      await api("/brands/me", { method: "PUT", body: JSON.stringify(form) });
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save brand kit");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Brand setup</h1>
      <p className="mt-1 text-sm text-[#64748B]">You can skip and complete this later.</p>
      {error ? <p className="mt-3 text-sm text-[#EF4444]">{error}</p> : null}
      {step === 1 ? (
        <div className="mt-6 space-y-3 rounded-2xl border bg-white p-6">
          <Field label="Brand Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Business Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="Website optional" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
          <Field label="Instagram optional" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
          <Field label="WhatsApp optional" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          <button className="h-11 w-full rounded-xl bg-[#4F46E5] font-semibold text-white" onClick={() => setStep(2)}>
            Continue
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3 rounded-2xl border bg-white p-6">
          <p className="text-sm font-medium">Brand Style</p>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <button key={s} className={`rounded-full px-3 py-1 text-sm ${form.style === s ? "bg-[#4F46E5] text-white" : "bg-slate-100"}`} onClick={() => setForm({ ...form, style: s })}>
                {s}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            Primary color
            <input type="color" className="ml-3" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
          </label>
          <label className="block text-sm">
            Secondary color
            <input type="color" className="ml-3" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} />
          </label>
          <p className="text-sm font-medium">Content language</p>
          <div className="flex gap-2">
            {langs.map((l) => (
              <button key={l} className={`rounded-full px-3 py-1 text-sm ${form.language === l ? "bg-[#4F46E5] text-white" : "bg-slate-100"}`} onClick={() => setForm({ ...form, language: l })}>
                {l}
              </button>
            ))}
          </div>
          <button className="h-11 w-full rounded-xl bg-[#4F46E5] font-semibold text-white" onClick={save}>
            Save Brand Kit
          </button>
        </div>
      )}
      <button className="mt-4 text-sm text-[#64748B]" onClick={() => router.push("/app")}>
        Skip for now
      </button>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-1 h-11 w-full rounded-xl border px-3" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
