import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn("rounded-2xl border border-[#E2E8F0] bg-white shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}
