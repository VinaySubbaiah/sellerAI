import { MarketingFooter, MarketingHeader } from "@/components/marketing-chrome";
import Link from "next/link";

export const metadata = { title: "About Us — SellerStudio AI" };

export default function AboutPage() {
  return (
    <div>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold">Making Professional Product Content Accessible to Every Seller</h1>
        <p className="mt-6 text-lg text-[#64748B]">
          Help online sellers create professional product content without needing a photographer, designer or complicated
          editing application.
        </p>
        <h2 className="mt-10 text-xl font-semibold">Values</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Simple", "Seller First", "Transparent", "Responsible AI"].map((v) => (
            <li key={v} className="rounded-xl border border-[#E2E8F0] bg-white p-4 font-medium">
              {v}
            </li>
          ))}
        </ul>
        <Link href="/signup" className="mt-10 inline-flex rounded-xl bg-[#4F46E5] px-5 py-3 font-semibold text-white">
          Start Creating
        </Link>
      </main>
      <MarketingFooter />
    </div>
  );
}
