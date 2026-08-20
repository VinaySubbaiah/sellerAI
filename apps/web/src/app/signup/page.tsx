"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MarketingHeader } from "@/components/marketing-chrome";

export default function SignupPage() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!accepted) {
      setError("Please accept the terms");
      return;
    }
    setPending(true);
    try {
      const res = await api<{ token: string }>("/auth/mock/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, acceptedTerms: true }),
      });
      await login(res.token);
      window.location.href = "/app/onboarding";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setPending(false);
    }
  }

  async function google() {
    const res = await api<{ token: string }>("/auth/mock/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Google Seller",
        email: `google.${Date.now()}@sellerstudio.test`,
        password: "google-auth-placeholder",
        acceptedTerms: true,
      }),
    });
    await login(res.token);
    window.location.href = "/app/onboarding";
  }

  return (
    <div>
      <MarketingHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-sm text-[#64748B]">New accounts receive 4 credits, once.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6">
          {error ? <p className="text-sm text-[#EF4444]" role="alert">{error}</p> : null}
          <label className="block text-sm font-medium">
            Name
            <input required className="mt-1 h-11 w-full rounded-xl border px-3" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input required type="email" className="mt-1 h-11 w-full rounded-xl border px-3" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input required type="password" minLength={8} className="mt-1 h-11 w-full rounded-xl border px-3" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>
              I agree to the <Link href="/terms" className="text-[#4F46E5]">Terms</Link> and{" "}
              <Link href="/privacy" className="text-[#4F46E5]">Privacy Policy</Link>
            </span>
          </label>
          <button disabled={pending} className="h-11 w-full rounded-xl bg-[#4F46E5] font-semibold text-white">
            {pending ? "Creating…" : "Create account"}
          </button>
          <button type="button" onClick={google} className="h-11 w-full rounded-xl border font-semibold">
            Continue with Google
          </button>
        </form>
        <p className="mt-4 text-sm text-[#64748B]">
          Already have an account? <Link href="/login" className="text-[#4F46E5]">Login</Link>
        </p>
      </main>
    </div>
  );
}
