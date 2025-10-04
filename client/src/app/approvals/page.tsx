"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ApprovalItem = { id: string; expense: { id: string; userId: string; description: string; amountCompanyCents: number; currencyCompany: string } };

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ApprovalItem[]>("/approvals/pending")
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'));
  }, []);

  async function act(id: string, action: 'approve' | 'reject') {
    try {
      await api(`/approvals/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Approvals</h1>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="p-2 border">Owner</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td className="p-2 border">{a.expense.userId}</td>
              <td className="p-2 border">{a.expense.description}</td>
              <td className="p-2 border">{(a.expense.amountCompanyCents/100).toFixed(2)} {a.expense.currencyCompany}</td>
              <td className="p-2 border space-x-2">
                <button className="btn-primary" onClick={() => act(a.id, 'approve')}>Approve</button>
                <button className="input bg-red-600 text-white" onClick={() => act(a.id, 'reject')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
