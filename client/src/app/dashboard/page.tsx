"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Expense = { id: string; expenseDate: string; description: string; category: string; amountCompanyCents: number; currencyCompany: string; status: string };

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Expense[]>("/expenses")
      .then(setExpenses)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">My Expenses</h1>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td className="p-2 border">{new Date(e.expenseDate).toLocaleDateString()}</td>
              <td className="p-2 border">{e.description}</td>
              <td className="p-2 border">{e.category}</td>
              <td className="p-2 border">{(e.amountCompanyCents/100).toFixed(2)} {e.currencyCompany}</td>
              <td className="p-2 border">{e.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
