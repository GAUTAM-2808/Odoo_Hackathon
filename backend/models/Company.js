const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    trim: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    approvalRules: [{
      type: {
        type: String,
        enum: ['percentage', 'specific_approver', 'hybrid'],
        required: true
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      specificApprovers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      conditions: {
        minAmount: Number,
        maxAmount: Number,
        categories: [String]
      }
    }],
    defaultApprovalFlow: [{
      level: Number,
      approvers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      isRequired: {
        type: Boolean,
        default: true
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);