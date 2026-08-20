"use client";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [msg, setMsg] = useState("");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Account</h2>
        <p className="text-sm text-[#64748B]">{user?.email}</p>
      </section>
      {["Business", "Brand Kit", "Language", "Notifications", "Billing", "Privacy", "Password"].map((s) => (
        <a key={s} href={s === "Brand Kit" ? "/app/brand" : s === "Billing" ? "/app/billing" : s === "Privacy" ? "/privacy" : "#"} className="block rounded-2xl border bg-white p-4">{s}</a>
      ))}
      <button className="rounded-xl border px-4 py-2" onClick={logout}>Logout</button>
      <form className="rounded-2xl border bg-white p-5" onSubmit={async (e) => {
        e.preventDefault();
        await api("/users/me", { method: "DELETE", body: JSON.stringify({ confirm: "DELETE" }) });
        setMsg("Account deleted");
        logout();
      }}>
        <h2 className="font-semibold">Delete Account</h2>
        <p className="text-sm text-[#64748B]">Type DELETE in the next prompt via the confirm field.</p>
        <button className="mt-3 rounded-xl bg-[#EF4444] px-4 py-2 text-white">Delete Account</button>
        {msg ? <p>{msg}</p> : null}
      </form>
    </div>
  );
}
