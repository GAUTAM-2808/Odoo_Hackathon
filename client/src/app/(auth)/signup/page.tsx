"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function SignupPage() {
  const [form, setForm] = useState({
    companyName: "",
    countryCode: "US",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await api<{ token: string }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create your company</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" placeholder="Company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        <input className="input" placeholder="Country code (US)" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} />
        <input className="input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="btn-primary" type="submit">Sign up</button>
      </form>
    </div>
  );
}
