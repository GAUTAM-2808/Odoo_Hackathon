'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { Users, FileText, DollarSign, Building, Settings } from 'lucide-react';
import api from '../../../lib/auth';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
      {change && (
        <div className="mt-2">
          <span className={`text-sm ${change > 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last month
          </span>
        </div>
      )}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    totalAmount: 0,
    pendingExpenses: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch users and expenses
        const [usersRes, expensesRes, pendingRes] = await Promise.all([
          api.get('/users'),
          api.get('/expenses?limit=10'),
          api.get('/expenses?status=pending'),
        ]);

        const users = usersRes.data.users;
        const expenses = expensesRes.data.expenses;
        const pending = pendingRes.data.expenses;

        // Calculate total amount
        const totalAmount = expenses
          .filter(expense => expense.status === 'approved')
          .reduce((sum, expense) => sum + expense.convertedAmount, 0);

        setStats({
          totalUsers: users.length,
          totalExpenses: expenses.length,
          totalAmount: totalAmount.toFixed(2),
          pendingExpenses: pending.length,
        });

        setRecentExpenses(expenses.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses}
            icon={FileText}
            color="text-green-600"
          />
          <StatCard
            title="Total Amount"
            value={`$${stats.totalAmount}`}
            icon={DollarSign}
            color="text-purple-600"
          />
          <StatCard
            title="Pending Expenses"
            value={stats.pendingExpenses}
            icon={FileText}
            color="text-yellow-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <a
                href="/admin/users"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                    <Users className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Manage Users
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Add, edit, and manage company users.
                  </p>
                </div>
              </a>

              <a
                href="/admin/expenses"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <FileText className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    All Expenses
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    View and manage all company expenses.
                  </p>
                </div>
              </a>

              <a
                href="/admin/settings"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                    <Building className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Company Settings
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Configure company and approval settings.
                  </p>
                </div>
              </a>

              <a
                href="/admin/approval-rules"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                    <Settings className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Approval Rules
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Set up approval workflows and rules.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Expenses
              </h3>
              <a
                href="/admin/expenses"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </a>
            </div>
            
            {recentExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No expenses submitted yet.
              </p>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentExpenses.map((expense) => (
                      <tr key={expense._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.employee.firstName} {expense.employee.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            {expense.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${expense.convertedAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${
                            expense.status === 'approved' ? 'badge-success' :
                            expense.status === 'rejected' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}