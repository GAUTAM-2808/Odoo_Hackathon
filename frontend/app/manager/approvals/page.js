'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { Clock, CheckCircle, XCircle, User, DollarSign, Calendar } from 'lucide-react';
import api from '../../../lib/auth';
import toast from 'react-hot-toast';

export default function ManagerApprovals() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  const fetchPendingExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/expenses/pending-approval');
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
      toast.error('Failed to load pending expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (expenseId) => {
    try {
      setIsProcessing(true);
      await api.put(`/expenses/${expenseId}/approve`, {
        comments: comments || 'Approved'
      });
      
      toast.success('Expense approved successfully');
      setSelectedExpense(null);
      setComments('');
      fetchPendingExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (expenseId) => {
    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      await api.put(`/expenses/${expenseId}/reject`, {
        comments: comments
      });
      
      toast.success('Expense rejected');
      setSelectedExpense(null);
      setComments('');
      fetchPendingExpenses();
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast.error('Failed to reject expense');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout title="Pending Approvals">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Approvals
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {expenses.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Amount
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${expenses.reduce((sum, expense) => sum + expense.convertedAmount, 0).toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Unique Employees
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Set(expenses.map(e => e.employee._id)).size}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Expenses Awaiting Approval</h3>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
              <p className="mt-1 text-sm text-gray-500">
                No expenses are currently pending your approval.
              </p>
            </div>
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
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {expense.employee.firstName} {expense.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {expense.employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {expense.description}
                        </div>
                        {expense.receipt && (
                          <div className="text-sm text-gray-500">
                            📎 Receipt attached
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${expense.convertedAmount.toFixed(2)}
                        </div>
                        {expense.originalCurrency !== expense.companyCurrency && (
                          <div className="text-sm text-gray-500">
                            {expense.amount} {expense.originalCurrency}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedExpense(expense)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approval Modal */}
        {selectedExpense && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Review Expense
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Employee
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedExpense.employee.firstName} {selectedExpense.employee.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedExpense.description}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <p className="text-sm text-gray-900">
                      ${selectedExpense.convertedAmount.toFixed(2)} 
                      {selectedExpense.originalCurrency !== selectedExpense.companyCurrency && 
                        ` (${selectedExpense.amount} ${selectedExpense.originalCurrency})`
                      }
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedExpense.category}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expense Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedExpense.expenseDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                      Comments
                    </label>
                    <textarea
                      id="comments"
                      rows={3}
                      className="input mt-1"
                      placeholder="Add your comments..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedExpense(null);
                      setComments('');
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedExpense._id)}
                    disabled={isProcessing}
                    className="btn-danger"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedExpense._id)}
                    disabled={isProcessing}
                    className="btn-success"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}