"use client";

import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function upload() {
    setError("");
    if (files.length < 1 || files.length > 5) {
      setError("Upload 1–5 JPEG, PNG or WebP images");
      return;
    }
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const signed = await api<{ url: string; method: string; headers: Record<string, string>; key: string }>(
          `/products/${id}/images/presign`,
          { method: "POST", body: JSON.stringify({ filename: file.name, mime: file.type, bytes: file.size }) },
        );
        const put = await fetch(signed.url, { method: signed.method, headers: signed.headers, body: file });
        if (!put.ok) throw new Error("Upload failed");
        await api(`/products/${id}/images/complete`, {
          method: "POST",
          body: JSON.stringify({ key: signed.key, mime: file.type }),
        });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      router.push(`/app/products/${id}/analyze`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Upload product photos</h1>
      <p className="mt-2 text-sm text-[#64748B]">JPEG, PNG or WebP. 1–5 images. Metadata is stripped on the server.</p>
      {error ? <p className="mt-3 text-sm text-[#EF4444]" role="alert">{error}</p> : null}
      <input
        className="mt-6 block w-full"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
      />
      {progress > 0 ? <div className="mt-4 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-[#4F46E5]" style={{ width: `${progress}%` }} /></div> : null}
      <button onClick={upload} className="mt-6 h-12 w-full rounded-xl bg-[#4F46E5] font-semibold text-white">
        Upload & Analyse Product
      </button>
    </div>
  );
}
