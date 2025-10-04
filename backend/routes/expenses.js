const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const currencyService = require('../services/currencyService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// @route   POST /api/expenses
// @desc    Submit new expense
// @access  Private (Employee)
router.post('/', [
  auth,
  authorize('employee', 'admin'),
  upload.single('receipt'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('originalCurrency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('expenseDate').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, originalCurrency, category, description, expenseDate } = req.body;
    const user = await User.findById(req.user.id).populate('company');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert currency
    const conversion = await currencyService.convertCurrency(
      parseFloat(amount),
      originalCurrency,
      user.company.currency
    );

    // Create expense
    const expense = new Expense({
      employee: user._id,
      company: user.company._id,
      amount: parseFloat(amount),
      originalCurrency: originalCurrency.toUpperCase(),
      convertedAmount: conversion.convertedAmount,
      companyCurrency: user.company.currency,
      exchangeRate: conversion.exchangeRate,
      category,
      description,
      expenseDate: new Date(expenseDate),
      receipt: req.file ? {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    // Set up approval flow based on company settings
    const company = await Company.findById(user.company._id);
    if (company.settings.defaultApprovalFlow.length > 0) {
      expense.approvalFlow = company.settings.defaultApprovalFlow.map(level => ({
        level: level.level,
        approver: level.approvers[0], // For now, take first approver
        status: 'pending'
      }));
      expense.totalApprovalLevels = company.settings.defaultApprovalFlow.length;
    }

    await expense.save();

    res.status(201).json({
      message: 'Expense submitted successfully',
      expense: {
        id: expense._id,
        amount: expense.amount,
        originalCurrency: expense.originalCurrency,
        convertedAmount: expense.convertedAmount,
        companyCurrency: expense.companyCurrency,
        category: expense.category,
        description: expense.description,
        expenseDate: expense.expenseDate,
        status: expense.status,
        submittedAt: expense.submittedAt
      }
    });
  } catch (error) {
    console.error('Expense submission error:', error);
    res.status(500).json({ message: 'Server error during expense submission' });
  }
});

// @route   GET /api/expenses
// @desc    Get expenses for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { employee: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const expenses = await Expense.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('approvalFlow.approver', 'firstName lastName email');

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/pending-approval
// @desc    Get expenses pending approval for manager/admin
// @access  Private (Manager, Admin)
router.get('/pending-approval', [
  auth,
  authorize('manager', 'admin')
], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const query = {
      company: req.user.company,
      'approvalFlow.approver': req.user.id,
      'approvalFlow.status': 'pending'
    };

    const expenses = await Expense.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('employee', 'firstName lastName email')
      .populate('approvalFlow.approver', 'firstName lastName email');

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get pending expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id/approve
// @desc    Approve expense
// @access  Private (Manager, Admin)
router.put('/:id/approve', [
  auth,
  authorize('manager', 'admin'),
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const { comments } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user is authorized to approve this expense
    const approvalLevel = expense.approvalFlow.find(
      level => level.approver.toString() === req.user.id && level.status === 'pending'
    );

    if (!approvalLevel) {
      return res.status(403).json({ message: 'Not authorized to approve this expense' });
    }

    // Update approval status
    approvalLevel.status = 'approved';
    approvalLevel.comments = comments;
    approvalLevel.approvedAt = new Date();

    // Check if this was the last required approval
    const remainingApprovals = expense.approvalFlow.filter(
      level => level.status === 'pending' && level.isRequired
    );

    if (remainingApprovals.length === 0) {
      expense.status = 'approved';
      expense.approvedAt = new Date();
    } else {
      expense.status = 'partially_approved';
    }

    await expense.save();

    res.json({
      message: 'Expense approved successfully',
      expense: {
        id: expense._id,
        status: expense.status,
        approvalLevel: approvalLevel.level
      }
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id/reject
// @desc    Reject expense
// @access  Private (Manager, Admin)
router.put('/:id/reject', [
  auth,
  authorize('manager', 'admin'),
  body('comments').trim().notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { comments } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user is authorized to reject this expense
    const approvalLevel = expense.approvalFlow.find(
      level => level.approver.toString() === req.user.id && level.status === 'pending'
    );

    if (!approvalLevel) {
      return res.status(403).json({ message: 'Not authorized to reject this expense' });
    }

    // Update approval status
    approvalLevel.status = 'rejected';
    approvalLevel.comments = comments;
    approvalLevel.rejectedAt = new Date();

    // Reject the entire expense
    expense.status = 'rejected';
    expense.rejectedAt = new Date();
    expense.rejectionReason = comments;

    await expense.save();

    res.json({
      message: 'Expense rejected successfully',
      expense: {
        id: expense._id,
        status: expense.status,
        rejectionReason: expense.rejectionReason
      }
    });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('employee', 'firstName lastName email')
      .populate('approvalFlow.approver', 'firstName lastName email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user has access to this expense
    if (expense.employee._id.toString() !== req.user.id && 
        !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;