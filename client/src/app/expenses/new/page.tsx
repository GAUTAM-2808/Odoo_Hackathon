"use client";
import { useState } from "react";
import { API_BASE } from "@/lib/api";

export default function NewExpense() {
  const [form, setForm] = useState({
    description: "",
    category: "Misc",
    expenseDate: new Date().toISOString().slice(0,10),
    amount: 0,
    currency: "USD",
    submit: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem("token") || "";
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, String(v)));
      if (file) fd.append("receipt", file);
      const res = await fetch(`${API_BASE}/expenses`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">New Expense</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})}/>
        <input className="input" placeholder="Category" value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})}/>
        <input className="input" type="date" value={form.expenseDate} onChange={(e)=>setForm({...form, expenseDate: e.target.value})}/>
        <input className="input" type="number" value={form.amount} onChange={(e)=>setForm({...form, amount: Number(e.target.value)})}/>
        <input className="input" placeholder="Currency (USD)" value={form.currency} onChange={(e)=>setForm({...form, currency: e.target.value})}/>
        <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
        <label className="block"><input type="checkbox" checked={form.submit} onChange={(e)=>setForm({...form, submit: e.target.checked})}/> Submit now</label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="btn-primary" type="submit">Create</button>
      </form>
    </div>
  );
}
