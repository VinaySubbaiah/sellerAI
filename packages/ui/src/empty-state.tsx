import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
