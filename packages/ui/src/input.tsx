import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] placeholder:text-[#94A3B8]",
        className,
      )}
      {...props}
    />
  );
}
