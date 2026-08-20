"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const types = ["", "LISTING", "PRODUCT_PHOTOS", "MARKETING", "PHOTO_EDIT", "ANIMATED_REEL"];
const statuses = ["", "PROCESSING", "COMPLETED", "FAILED"];

export default function ProjectsPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    const qs = new URLSearchParams();
    if (type) qs.set("type", type);
    if (status) qs.set("status", status);
    void api<any[]>(`/projects?${qs}`).then(setItems).catch(() => setItems([]));
  }, [type, status]);
  return (
    <div>
      <h1 className="text-2xl font-bold">Projects</h1>
      <div className="mt-4 flex gap-2">
        <select className="rounded-xl border px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>{types.map((t) => <option key={t} value={t}>{t || "All"}</option>)}</select>
        <select className="rounded-xl border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((t) => <option key={t} value={t}>{t || "Status"}</option>)}</select>
      </div>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed p-12 text-center">
          <h2 className="font-semibold">Nothing generated yet</h2>
          <Link href="/app/products/new" className="mt-4 inline-flex rounded-xl bg-[#4F46E5] px-4 py-2 font-semibold text-white">Create Your First Asset</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((p) => (
            <li key={p.id} className="rounded-2xl border bg-white p-4">
              <Link href={`/app/projects/${p.id}`} className="flex justify-between">
                <span>{p.title}</span>
                <span className="text-sm text-[#64748B]">{p.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
