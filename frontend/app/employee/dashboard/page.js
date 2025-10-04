'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { FileText, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
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

export default function EmployeeDashboard() {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    totalAmount: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch expenses with different statuses
        const [pendingRes, approvedRes, rejectedRes, allRes] = await Promise.all([
          api.get('/expenses?status=pending'),
          api.get('/expenses?status=approved'),
          api.get('/expenses?status=rejected'),
          api.get('/expenses?limit=5'),
        ]);

        const pending = pendingRes.data.expenses.length;
        const approved = approvedRes.data.expenses.length;
        const rejected = rejectedRes.data.expenses.length;
        const total = pending + approved + rejected;

        // Calculate total amount
        const totalAmount = approvedRes.data.expenses.reduce(
          (sum, expense) => sum + expense.convertedAmount, 0
        );

        setStats({
          totalExpenses: total,
          pendingExpenses: pending,
          approvedExpenses: approved,
          rejectedExpenses: rejected,
          totalAmount: totalAmount.toFixed(2),
        });

        setRecentExpenses(allRes.data.expenses);
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
      <DashboardLayout title="Employee Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Employee Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses}
            icon={FileText}
            color="text-blue-600"
          />
          <StatCard
            title="Pending"
            value={stats.pendingExpenses}
            icon={Clock}
            color="text-yellow-600"
          />
          <StatCard
            title="Approved"
            value={stats.approvedExpenses}
            icon={CheckCircle}
            color="text-green-600"
          />
          <StatCard
            title="Rejected"
            value={stats.rejectedExpenses}
            icon={XCircle}
            color="text-red-600"
          />
        </div>

        {/* Total Amount Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Approved Amount
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ${stats.totalAmount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Expenses
            </h3>
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
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
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
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${expense.convertedAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expense.category}
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