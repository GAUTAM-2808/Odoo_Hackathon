'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { Clock, CheckCircle, XCircle, DollarSign, Users } from 'lucide-react';
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

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalAmountPending: 0,
  });
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch pending approvals
        const pendingRes = await api.get('/expenses/pending-approval');
        const pending = pendingRes.data.expenses;

        // Calculate total amount pending
        const totalAmountPending = pending.reduce(
          (sum, expense) => sum + expense.convertedAmount, 0
        );

        setStats({
          pendingApprovals: pending.length,
          approvedToday: 0, // TODO: Implement this
          rejectedToday: 0, // TODO: Implement this
          totalAmountPending: totalAmountPending.toFixed(2),
        });

        setPendingExpenses(pending.slice(0, 5)); // Show only first 5
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
      <DashboardLayout title="Manager Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={Clock}
            color="text-yellow-600"
          />
          <StatCard
            title="Approved Today"
            value={stats.approvedToday}
            icon={CheckCircle}
            color="text-green-600"
          />
          <StatCard
            title="Rejected Today"
            value={stats.rejectedToday}
            icon={XCircle}
            color="text-red-600"
          />
          <StatCard
            title="Total Pending Amount"
            value={`$${stats.totalAmountPending}`}
            icon={DollarSign}
            color="text-blue-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <a
                href="/manager/approvals"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                    <Clock className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Review Pending
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Review and approve pending expense requests.
                  </p>
                </div>
              </a>

              <a
                href="/manager/approved"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <CheckCircle className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Approved Expenses
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    View all approved expense requests.
                  </p>
                </div>
              </a>

              <a
                href="/manager/rejected"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-red-50 text-red-700 ring-4 ring-white">
                    <XCircle className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Rejected Expenses
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    View all rejected expense requests.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Pending Expenses */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Pending Approvals
              </h3>
              <a
                href="/manager/approvals"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </a>
            </div>
            
            {pendingExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No pending approvals at the moment.
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
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingExpenses.map((expense) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expense.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`/manager/approvals/${expense._id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Review
                          </a>
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