"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MarketingHeader } from "@/components/marketing-chrome";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api<{ token: string }>("/auth/mock/login", {
        method: "POST",
        body: JSON.stringify({ email, password, name: email.split("@")[0] }),
      });
      await login(res.token);
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div>
      <MarketingHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6">
          {error ? <p className="text-sm text-[#EF4444]" role="alert">{error}</p> : null}
          <label className="block text-sm font-medium">
            Email
            <input required type="email" className="mt-1 h-11 w-full rounded-xl border px-3" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input required type="password" className="mt-1 h-11 w-full rounded-xl border px-3" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="h-11 w-full rounded-xl bg-[#4F46E5] font-semibold text-white">Login</button>
        </form>
        <p className="mt-4 text-sm">
          <Link href="/forgot-password" className="text-[#4F46E5]">Forgot password</Link>
        </p>
        <p className="mt-2 text-sm text-[#64748B]">
          New here? <Link href="/signup" className="text-[#4F46E5]">Create an account</Link>
        </p>
      </main>
    </div>
  );
}
