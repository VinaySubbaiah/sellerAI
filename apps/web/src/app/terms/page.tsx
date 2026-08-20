import { MarketingFooter, MarketingHeader } from "@/components/marketing-chrome";

export const metadata = { title: "Terms of Service — SellerStudio AI" };

export default function TermsPage() {
  return (
    <div>
      <MarketingHeader />
      <main className="prose mx-auto max-w-3xl px-4 py-16">
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Placeholder for legal review before production launch.</p>
        <h1>Terms of Service</h1>
        <p>SellerStudio AI provides content-creation tools. You remain responsible for listing accuracy and marketplace policy compliance.</p>
        <p>AI output is assistive. Never publish unverified specifications, medical claims or performance claims.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
