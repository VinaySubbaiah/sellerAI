"use client";
import { api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BillingPage() {
  const [wallet, setWallet] = useState<{ balance: number; costs: Record<string, number> } | null>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void api<{ balance: number; costs: Record<string, number> }>("/credits/wallet").then(setWallet);
    void api<any[]>("/credits/packages").then(setPacks);
    void api<{ items: any[] }>("/credits/ledger").then((r) => setLedger(r.items));
    void api<any[]>("/payments").then(setPayments);
  }, []);

  async function buy(packageId: string) {
    setError("");
    try {
      const order = await api<any>("/payments/orders", { method: "POST", body: JSON.stringify({ packageId }) });
      if (order.provider === "mock") {
        const done = await api<any>("/payments/mock/complete", { method: "POST", body: JSON.stringify({ orderId: order.orderId }) });
        window.location.href = `/app/billing/success?credits=${done.credits}&amount=${done.amount}&ref=${done.paymentId}`;
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const rz = new (window as any).Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          handler: async (response: any) => {
            await api("/payments/verify", { method: "POST", body: JSON.stringify(response) });
            window.location.href = `/app/billing/success?credits=${order.package.credits}&amount=${order.amount}&ref=${response.razorpay_payment_id}`;
          },
        });
        rz.on("payment.failed", () => {
          window.location.href = "/app/billing/failure";
        });
        rz.open();
      };
      document.body.appendChild(script);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Credits & Billing</h1>
      <p className="mt-2 text-4xl font-bold">{wallet?.balance ?? 0}</p>
      {error ? <p className="text-[#EF4444]">{error}</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {packs.map((p) => (
          <article key={p.id} className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">{p.name} {p.popular ? "· Most Popular" : ""}</h2>
            <p className="mt-1 text-2xl">₹{(p.amountPaise / 100).toFixed(0)}</p>
            <p className="text-sm text-[#64748B]">{p.credits} credits</p>
            <button className="mt-4 rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white" onClick={() => buy(p.id)}>Buy Credits</button>
          </article>
        ))}
      </div>
      <h2 className="mt-10 font-semibold">Ledger</h2>
      {ledger.length === 0 ? <p className="mt-2 text-sm text-[#64748B]">No purchases yet</p> : (
        <ul className="mt-2 space-y-1 text-sm">
          {ledger.map((l) => <li key={l.id}>{l.type} {l.amount} → {l.balanceAfter}</li>)}
        </ul>
      )}
      <h2 className="mt-8 font-semibold">Payments</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {payments.map((p) => <li key={p.id}>{p.status} ₹{(p.amountPaise / 100).toFixed(0)} {p.package?.name}</li>)}
      </ul>
      <Link href="/pricing" className="mt-6 inline-block text-sm text-[#4F46E5]">View pricing</Link>
    </div>
  );
}
