import { MarketingFooter, MarketingHeader } from "@/components/marketing-chrome";
import Link from "next/link";

export const metadata = { title: "Pricing — SellerStudio AI" };

export default function PricingPage() {
  return (
    <div>
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-4xl font-bold">Simple credits. No surprise fees.</h1>
        <p className="mt-3 text-[#64748B]">Credit values are enforced by the server, not the browser.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Plan name="Free" price="₹0" items={["4 credits after account creation", "1 product project", "Basic editing", "Limited AI generation"]} />
          <Plan name="Starter" price="₹99" items={["20 credits"]} />
          <Plan name="Creator" price="₹299" badge="Most Popular" items={["70 credits"]} />
          <Plan name="Business" price="₹499" items={["125 credits"]} />
        </div>
        <div className="mt-10 rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
          <p>Example usage</p>
          <pre className="mt-3 overflow-auto text-[#111827]">{`AI Product Image        1 credit
Marketing Creative      2 credits
Animated Photo Reel     3 credits
Marketplace Listing     8 credits`}</pre>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

function Plan({ name, price, items, badge }: { name: string; price: string; items: string[]; badge?: string }) {
  return (
    <article className="relative rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      {badge ? (
        <span className="absolute -top-3 right-4 rounded-full bg-[#4F46E5] px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      ) : null}
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="mt-2 text-3xl font-bold">{price}</p>
      <ul className="mt-4 space-y-2 text-sm text-[#64748B]">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <Link href="/signup" className="mt-6 inline-flex rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white">
        Start Free
      </Link>
    </article>
  );
}
