import { MarketingFooter, MarketingHeader } from "@/components/marketing-chrome";

export const metadata = { title: "Refund Policy — SellerStudio AI" };

export default function RefundPage() {
  return (
    <div>
      <MarketingHeader />
      <main className="prose mx-auto max-w-3xl px-4 py-16">
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Placeholder for legal review before production launch.</p>
        <h1>Refund Policy</h1>
        <p>Unused purchased credits may be eligible for a refund request via Help. Consumed credits for completed generations are generally not refundable.</p>
        <p>Failed generations automatically return reserved credits to your wallet.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
