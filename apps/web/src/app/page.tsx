import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-chrome";

const features = [
  { title: "Marketplace Listing Pack", body: "Titles, bullets, descriptions, keywords and marketplace images in one job." },
  { title: "AI Product Photography", body: "White, studio and lifestyle looks while keeping the original product intact." },
  { title: "Marketing Creatives", body: "Instagram, WhatsApp, Facebook and banner layouts with readable text." },
  { title: "Photo Editing", body: "Background, crop, center, lighting and marketplace size presets." },
  { title: "Animated Product Ads", body: "Simple 5s or 10s photo reels with pan, zoom and CTA — not a full video editor." },
  { title: "Listing Readiness", body: "A practical score with warnings. Policies change; always verify before you publish." },
];

export default function HomePage() {
  return (
    <div>
      <MarketingHeader />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold text-[#4F46E5]">Upload Once. Sell Everywhere.</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Upload Once. Sell Everywhere.</h1>
            <p className="mt-4 text-lg text-[#64748B]">
              Turn ordinary product photos into marketplace-ready listings, professional product images and marketing
              creatives in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-xl bg-[#4F46E5] px-5 py-3 font-semibold text-white hover:bg-[#4338CA]">
                Create Your First Listing Free
              </Link>
              <Link href="#examples" className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 font-semibold">
                View Examples
              </Link>
            </div>
            <p className="mt-3 text-sm text-[#94A3B8]">No credit card required</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Amazon", "Flipkart", "Meesho", "Shopify", "Instagram"].map((b) => (
                <span key={b} className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4F46E5]">
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Original product photo</p>
            <div className="mt-3 aspect-square rounded-2xl bg-slate-100" data-example="original" />
            <p className="my-4 text-center text-sm text-[#64748B]">↓ AI processing</p>
            <div className="grid grid-cols-2 gap-3">
              {["marketplace main image", "lifestyle photo", "features graphic", "social creative"].map((label) => (
                <div key={label} className="rounded-xl bg-[#EEF2FF] p-4 text-center text-xs font-medium text-[#4F46E5]">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold">Everything you need to sell online</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {features.map((f) => (
                <article key={f.title} className="rounded-2xl border border-[#E2E8F0] p-6">
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-[#64748B]">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {["Upload product", "Choose platform", "Generate and download"].map((step, i) => (
              <li key={step} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="text-sm font-semibold text-[#4F46E5]">0{i + 1}</span>
                <p className="mt-2 text-lg font-semibold">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="examples" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold">Before & After</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {["headphones", "coffee", "skincare", "kitchen accessory"].map((item) => (
                <figure key={item} className="overflow-hidden rounded-2xl border border-[#E2E8F0]">
                  <div className="grid grid-cols-2">
                    <div className="aspect-square bg-slate-200" />
                    <div className="aspect-square bg-[#EEF2FF]" />
                  </div>
                  <figcaption className="p-3 text-sm capitalize text-[#64748B]">{item}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold">One Product. Multiple Platforms.</h2>
          <p className="mt-3 max-w-2xl text-[#64748B]">
            Generate Amazon, Flipkart, Meesho, Shopify and Instagram-ready assets from the same product library.
          </p>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-bold">Built for seller control</h2>
            <ul className="mt-6 space-y-3 text-[#64748B]">
              <li>You control product information. Confirmed facts are stored separately from AI suggestions.</li>
              <li>AI-generated suggestions must be verified before publishing.</li>
              <li>Important specifications are never intentionally invented.</li>
              <li>Uploads are private to your account and accessed through signed URLs.</li>
            </ul>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] p-10 text-white">
            <h2 className="text-3xl font-bold">Ready to improve your product listing?</h2>
            <Link href="/signup" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-[#4F46E5]">
              Start Free
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
