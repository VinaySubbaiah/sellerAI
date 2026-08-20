import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  primary:
    "bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm",
  secondary:
    "bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF]",
  outline:
    "border border-[#E2E8F0] bg-white text-[#111827] hover:bg-slate-50",
  ghost: "text-[#64748B] hover:bg-slate-100",
  danger: "bg-[#EF4444] text-white hover:bg-red-600",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
