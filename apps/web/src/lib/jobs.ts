export async function startJobAndGo(opts: {
  type: string;
  productId: string;
  payload: Record<string, unknown>;
  setError: (s: string) => void;
}) {
  try {
    const { api } = await import("./api");
    const res = await api<{ project: { id: string } | null; job: { id: string } }>("/generation/jobs", {
      method: "POST",
      body: JSON.stringify({ type: opts.type, productId: opts.productId, payload: opts.payload }),
    });
    const dest = res.project?.id ? `/app/projects/${res.project.id}` : `/app/products/${opts.productId}`;
    window.location.href = dest;
  } catch (e) {
    const err = e as Error & { code?: string };
    if (err.code === "INSUFFICIENT_CREDITS") opts.setError("Insufficient credits");
    else opts.setError(err.message);
  }
}
