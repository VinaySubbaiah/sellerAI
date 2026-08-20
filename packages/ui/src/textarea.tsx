import type { TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#94A3B8]",
        className,
      )}
      {...props}
    />
  );
}
