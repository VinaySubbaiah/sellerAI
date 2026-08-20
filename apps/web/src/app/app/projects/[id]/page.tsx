"use client";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    const p = await api<any>(`/projects/${id}`);
    setProject(p);
  }
  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 2500);
    return () => clearInterval(t);
  }, [id]);

  if (!project) return <p>Loading…</p>;
  const job = project.jobs?.[0];
  const listing = project.listingContent;
  const check = project.product?.readinessChecks?.[0];

  return (
    <div>
      <h1 className="text-2xl font-bold">{project.title}</h1>
      <p className="mt-2 text-sm text-[#64748B]">{project.status} {job ? `· ${job.progress}%` : ""}</p>
      {project.status === "PROCESSING" || project.status === "QUEUED" ? (
        <p className="mt-2 rounded-xl bg-[#EEF2FF] p-3 text-sm">You can leave this page. Your project will continue processing.</p>
      ) : null}
      {project.status === "FAILED" ? (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm">
          <p>Generation failed. Reserved credits were returned if the job fully failed.</p>
          <p className="mt-1">{job?.error}</p>
          <button className="mt-3 rounded-xl bg-[#4F46E5] px-3 py-2 text-white" onClick={() => api(`/generation/jobs/${job.id}/retry`, { method: "POST" })}>Retry</button>
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {project.assets?.map((a: any) => (
          <figure key={a.id} className="rounded-2xl border bg-white p-3">
            {a.mime?.includes("mp4") ? (
              <video src={a.url} controls className="w-full rounded-xl" />
            ) : (
              <img src={a.url} alt={a.type} className="w-full rounded-xl" />
            )}
            <figcaption className="mt-2 flex justify-between text-xs">
              <span>{a.type}</span>
              <a href={a.url} download className="font-semibold text-[#4F46E5]">Download</a>
            </figcaption>
          </figure>
        ))}
      </div>
      {listing ? (
        <section className="mt-8 rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Listing copy</h2>
          <textarea className="mt-3 min-h-20 w-full rounded-xl border p-3" defaultValue={listing.title} onBlur={(e) => api(`/projects/${id}/listing`, { method: "PATCH", body: JSON.stringify({ title: e.target.value }) })} />
          <textarea className="mt-3 min-h-32 w-full rounded-xl border p-3" defaultValue={listing.description} onBlur={(e) => api(`/projects/${id}/listing`, { method: "PATCH", body: JSON.stringify({ description: e.target.value }) })} />
          <pre className="mt-3 overflow-auto text-sm">{JSON.stringify(listing.bulletPoints, null, 2)}</pre>
          <button className="mt-3 text-sm font-semibold text-[#4F46E5]" onClick={() => { navigator.clipboard.writeText(`${listing.title}\n${(listing.bulletPoints || []).join("\n")}\n${listing.description}`); setCopied(true); }}>Copy All</button>
          {copied ? <span className="ml-2 text-sm">Copied</span> : null}
        </section>
      ) : null}
      {check ? (
        <section className="mt-6 rounded-2xl border bg-white p-5">
          <p className="text-3xl font-bold">{check.score} / 100</p>
          <p>{check.label}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {(check.checks || []).map((c: any) => (
              <li key={c.id}>{c.status === "pass" ? "✓" : "⚠"} {c.message}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#94A3B8]">Marketplace policies can change. Verify the latest requirements before publishing.</p>
        </section>
      ) : null}
      <button className="mt-6 rounded-xl border px-4 py-2" onClick={() => api(`/projects/${id}/zip`, { method: "POST" })}>Download Complete ZIP</button>
    </div>
  );
}
