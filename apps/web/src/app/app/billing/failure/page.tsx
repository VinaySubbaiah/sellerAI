import Link from "next/link";

export default function FailurePage() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border bg-white p-8 text-center">
      <h1 className="text-3xl font-bold">Payment Failed</h1>
      <p className="mt-3 text-[#64748B]">No credits were added.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/app/billing" className="rounded-xl bg-[#4F46E5] px-4 py-2 font-semibold text-white">Try Again</Link>
        <Link href="/pricing" className="rounded-xl border px-4 py-2 font-semibold">Choose Another Package</Link>
      </div>
    </div>
  );
}
