"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/products/new", label: "Create" },
  { href: "/app/products", label: "Products" },
  { href: "/app/projects", label: "Projects" },
  { href: "/app/billing", label: "Profile" },
];

const side = [
  { group: "Create", items: [
    { href: "/app/products/new", label: "Marketplace Listing" },
    { href: "/app/products", label: "Product Photos" },
    { href: "/app/products", label: "Marketing Creative" },
    { href: "/app/products", label: "Photo Editing" },
    { href: "/app/products", label: "Animated Reel" },
  ]},
  { group: "Manage", items: [
    { href: "/app/products", label: "Products" },
    { href: "/app/projects", label: "Projects" },
    { href: "/app/brand", label: "Brand Kit" },
  ]},
  { group: "Account", items: [
    { href: "/app/billing", label: "Credits & Billing" },
    { href: "/app/settings", label: "Settings" },
    { href: "/help", label: "Help" },
  ]},
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    void api<{ balance: number }>("/credits/wallet").then((w) => setCredits(w.balance)).catch(() => undefined);
  }, [user, pathname]);

  if (loading || !user) {
    return <div className="p-8 text-sm text-[#64748B]">Loading…</div>;
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-[#E2E8F0] bg-white md:block">
        <div className="p-5 text-base font-bold">SellerStudio AI</div>
        {side.map((g) => (
          <div key={g.group} className="px-4 pb-4">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{g.group}</p>
            {g.items.map((item) => (
              <Link key={item.label} href={item.href} className="mt-1 block rounded-lg px-2 py-2 text-sm text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#4F46E5]">
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </aside>
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#E2E8F0] bg-white px-4 py-3">
          <input
            aria-label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push(`/app/products?q=${encodeURIComponent(q)}`);
            }}
            placeholder="Search products"
            className="h-10 flex-1 rounded-xl border px-3 text-sm"
          />
          <Link href="/app/billing" className="rounded-full bg-[#EEF2FF] px-3 py-1 text-sm font-semibold text-[#4F46E5]">
            {credits ?? "—"} credits
          </Link>
          <Link href="/app/settings" aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-full border">
            bell
          </Link>
          <button onClick={logout} className="text-sm text-[#64748B]">
            {user.name}
          </button>
        </header>
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-white md:hidden" aria-label="Mobile">
        {nav.map((n) => (
          <Link key={n.href} href={n.label === "Profile" ? "/app/settings" : n.href} className={`py-3 text-center text-xs ${pathname === n.href ? "font-semibold text-[#4F46E5]" : "text-[#64748B]"}`}>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
