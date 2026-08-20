"use client";
import { startJobAndGo } from "@/lib/jobs";
import { useParams } from "next/navigation";
import { useState } from "react";

const tools = ["REMOVE_BACKGROUND", "WHITE_BACKGROUND", "TRANSPARENT_BACKGROUND", "AI_BACKGROUND", "CROP", "RESIZE", "CENTER", "LIGHTING", "SHADOW", "ENHANCE"];
const presets = ["AMAZON", "FLIPKART", "MEESHO", "INSTAGRAM_POST", "INSTAGRAM_STORY", "WHATSAPP_STATUS"];

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const [tool, setTool] = useState("WHITE_BACKGROUND");
  const [preset, setPreset] = useState("AMAZON");
  const [error, setError] = useState("");
  const credits = tool === "AI_BACKGROUND" ? 1 : 0;
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="text-2xl font-bold">Photo editor</h1>
      <p className="text-sm text-[#64748B]">Simple tools only. Deterministic edits do not consume AI credits.</p>
      {error ? <p className="text-[#EF4444]">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {tools.map((t) => <button key={t} className={`rounded-full px-3 py-1 text-xs ${tool === t ? "bg-[#4F46E5] text-white" : "bg-slate-100"}`} onClick={() => setTool(t)}>{t}</button>)}
      </div>
      <select className="h-11 w-full rounded-xl border" value={preset} onChange={(e) => setPreset(e.target.value)}>
        {presets.map((p) => <option key={p}>{p}</option>)}
      </select>
      <button className="h-12 w-full rounded-xl bg-[#4F46E5] font-semibold text-white" onClick={() => startJobAndGo({ type: "PHOTO_EDIT", productId: id, payload: { tool, preset }, setError })}>
        Apply {credits ? `— ${credits} credit` : "(free)"}
      </button>
    </div>
  );
}
