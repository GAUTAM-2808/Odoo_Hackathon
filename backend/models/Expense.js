const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  originalCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  convertedAmount: {
    type: Number,
    required: true
  },
  companyCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required']
  },
  receipt: {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  },
  ocrData: {
    extractedAmount: Number,
    extractedDate: Date,
    extractedVendor: String,
    confidence: Number
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'partially_approved'],
    default: 'pending'
  },
  approvalFlow: [{
    level: Number,
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: String,
    approvedAt: Date,
    rejectedAt: Date
  }],
  currentApprovalLevel: {
    type: Number,
    default: 0
  },
  totalApprovalLevels: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String
}, {
  timestamps: true
});

// Index for efficient queries
expenseSchema.index({ employee: 1, status: 1 });
expenseSchema.index({ company: 1, status: 1 });
expenseSchema.index({ 'approvalFlow.approver': 1, 'approvalFlow.status': 1 });

module.exports = mongoose.model('Expense', expenseSchema);