import { MarketingFooter, MarketingHeader } from "@/components/marketing-chrome";

export const metadata = { title: "Privacy Policy — SellerStudio AI" };

export default function PrivacyPage() {
  return (
    <div>
      <MarketingHeader />
      <main className="prose mx-auto max-w-3xl px-4 py-16">
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Placeholder for legal review before production launch.</p>
        <h1>Privacy Policy</h1>
        <p>Uploaded product assets are private to your account. We use signed URLs rather than guessable public links.</p>
        <p>We send only the product details required for a generation request to AI providers. We do not sell your catalog.</p>
        <p>You may delete your account from Settings. Residual backups may remain for a limited operations window.</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
