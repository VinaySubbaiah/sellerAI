import Link from "next/link";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How It Works" },
  { href: "/#examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About Us" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-base font-bold tracking-tight text-[#111827]">
          SellerStudio AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[#64748B] md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[#111827]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[#64748B] hover:text-[#111827]">
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white py-10 text-sm text-[#64748B]">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4">
        <p>© {new Date().getFullYear()} SellerStudio AI</p>
        <div className="flex gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-policy">Refunds</Link>
          <Link href="/help">Help</Link>
        </div>
      </div>
    </footer>
  );
}
