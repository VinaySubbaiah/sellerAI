"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Inner() {
  const q = useSearchParams();
  return (
    <div className="mx-auto max-w-lg rounded-3xl border bg-white p-8 text-center">
      <h1 className="text-3xl font-bold">Payment Successful 🎉</h1>
      <p className="mt-4">Credits added: {q.get("credits")}</p>
      <p>Amount: ₹{((Number(q.get("amount") ?? 0)) / 100).toFixed(0)}</p>
      <p>Reference: {q.get("ref")}</p>
      <p>Date: {new Date().toLocaleString()}</p>
      <Link href="/app" className="mt-6 inline-flex rounded-xl bg-[#4F46E5] px-4 py-2 font-semibold text-white">Start Creating</Link>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><Inner /></Suspense>;
}
