'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { Upload, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '../../../lib/auth';
import toast from 'react-hot-toast';

const categories = [
  'Travel',
  'Meals',
  'Office Supplies',
  'Transportation',
  'Accommodation',
  'Entertainment',
  'Training',
  'Software',
  'Hardware',
  'Other',
];

const currencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'KRW'
];

export default function SubmitExpense() {
  const [formData, setFormData] = useState({
    amount: '',
    originalCurrency: 'USD',
    category: '',
    description: '',
    expenseDate: '',
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setReceiptFile(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0].errors[0];
      if (error.code === 'file-too-large') {
        toast.error('File size must be less than 5MB');
      } else if (error.code === 'file-invalid-type') {
        toast.error('Only image files (JPEG, PNG) and PDF files are allowed');
      }
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || !formData.category || !formData.description || !formData.expenseDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('amount', formData.amount);
      submitData.append('originalCurrency', formData.originalCurrency);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      submitData.append('expenseDate', formData.expenseDate);
      
      if (receiptFile) {
        submitData.append('receipt', receiptFile);
      }

      const response = await api.post('/expenses', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Expense submitted successfully!');
      router.push('/employee/expenses');
    } catch (error) {
      console.error('Error submitting expense:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit expense';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Submit Expense">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Submit New Expense</h3>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details below to submit your expense for approval.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="label">
                  Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="amount"
                    name="amount"
                    required
                    className="input pl-10"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="originalCurrency" className="label">
                  Currency
                </label>
                <select
                  id="originalCurrency"
                  name="originalCurrency"
                  className="input"
                  value={formData.originalCurrency}
                  onChange={handleChange}
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="label">
                Category *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="category"
                  name="category"
                  required
                  className="input pl-10"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">
                Description *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  className="input pl-10"
                  placeholder="Describe the expense..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Expense Date */}
            <div>
              <label htmlFor="expenseDate" className="label">
                Expense Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="expenseDate"
                  name="expenseDate"
                  required
                  className="input pl-10"
                  value={formData.expenseDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="label">Receipt (Optional)</label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  {receiptFile ? (
                    <p className="text-sm text-gray-900">{receiptFile.name}</p>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">
                        {isDragActive
                          ? 'Drop the file here...'
                          : 'Drag & drop a file here, or click to select'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/employee/dashboard')}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Submit Expense'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}