"use client";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    void api("/admin/overview").then(setData).catch(() => setData({ error: "forbidden" }));
  }, [user]);
  if (user && user.role !== "ADMIN") return <p>Admin only</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin</h1>
      <pre className="mt-4 rounded-2xl bg-slate-900 p-4 text-xs text-white">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
