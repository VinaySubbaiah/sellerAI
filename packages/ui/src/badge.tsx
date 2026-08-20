import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Badge({
  className,
  tone = "indigo",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "indigo" | "blue" | "success" | "warning" | "error" | "muted" }) {
  const tones = {
    indigo: "bg-[#EEF2FF] text-[#4F46E5]",
    blue: "bg-[#EFF6FF] text-[#2563EB]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
    muted: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
