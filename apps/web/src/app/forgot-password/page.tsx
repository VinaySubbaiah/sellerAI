"use client";

import { MarketingHeader } from "@/components/marketing-chrome";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  return (
    <div>
      <MarketingHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-bold">Reset password</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          When Firebase auth is enabled, this sends a password-reset email. In mock mode we confirm the request locally.
        </p>
        {sent ? (
          <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">If an account exists, a reset email was sent.</p>
        ) : (
          <form
            className="mt-8 space-y-4 rounded-2xl border bg-white p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <label className="block text-sm font-medium">
              Email
              <input required type="email" className="mt-1 h-11 w-full rounded-xl border px-3" />
            </label>
            <button className="h-11 w-full rounded-xl bg-[#4F46E5] font-semibold text-white">Send reset link</button>
          </form>
        )}
      </main>
    </div>
  );
}
