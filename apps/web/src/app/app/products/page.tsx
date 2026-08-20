"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

function ProductsInner() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [items, setItems] = useState<Array<{
    id: string;
    name: string;
    platforms: string[];
    updatedAt: string;
    _count: { images: number };
  }>>([]);

  useEffect(() => {
    void api<typeof items>(`/products${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setItems).catch(() => setItems([]));
  }, [q]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/app/products/new" className="sticky bottom-24 rounded-xl bg-[#4F46E5] px-4 py-2 font-semibold text-white md:static">
          Create Product
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed bg-white p-12 text-center">
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="mt-2 text-sm text-[#64748B]">Upload your first product and generate your first listing.</p>
          <Link href="/app/products/new" className="mt-6 inline-flex rounded-xl bg-[#4F46E5] px-4 py-2 font-semibold text-white">
            Create Product
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <li key={p.id} className="rounded-2xl border bg-white p-5">
              <h2 className="font-semibold">{p.name}</h2>
              <p className="mt-1 text-sm text-[#64748B]">{p.platforms.join(", ")} · {p._count.images} images</p>
              <div className="mt-4 flex gap-3 text-sm font-semibold text-[#4F46E5]">
                <Link href={`/app/products/${p.id}`}>Open</Link>
                <Link href={`/app/products/${p.id}/listing/create`}>Generate Asset</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsInner />
    </Suspense>
  );
}
