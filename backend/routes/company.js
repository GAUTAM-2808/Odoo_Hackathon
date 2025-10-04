const express = require('express');
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const currencyService = require('../services/currencyService');

const router = express.Router();

// @route   GET /api/company
// @desc    Get company details
// @access  Private (Admin)
router.get('/', [
  auth,
  authorize('admin')
], async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/company
// @desc    Update company details
// @access  Private (Admin)
router.put('/', [
  auth,
  authorize('admin'),
  body('name').optional().trim().notEmpty(),
  body('country').optional().trim().notEmpty(),
  body('currency').optional().trim().isLength({ min: 3, max: 3 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { name, country, currency } = req.body;

    if (name) company.name = name;
    if (country) company.country = country;
    if (currency) company.currency = currency.toUpperCase();

    await company.save();

    res.json({
      message: 'Company updated successfully',
      company: {
        id: company._id,
        name: company.name,
        country: company.country,
        currency: company.currency
      }
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error during company update' });
  }
});

// @route   POST /api/company/approval-rules
// @desc    Add approval rule
// @access  Private (Admin)
router.post('/approval-rules', [
  auth,
  authorize('admin'),
  body('type').isIn(['percentage', 'specific_approver', 'hybrid']).withMessage('Valid rule type is required'),
  body('percentage').optional().isFloat({ min: 0, max: 100 }),
  body('specificApprovers').optional().isArray(),
  body('conditions').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { type, percentage, specificApprovers, conditions } = req.body;

    const newRule = {
      type,
      percentage: type === 'percentage' || type === 'hybrid' ? percentage : undefined,
      specificApprovers: type === 'specific_approver' || type === 'hybrid' ? specificApprovers : undefined,
      conditions: conditions || {}
    };

    company.settings.approvalRules.push(newRule);
    await company.save();

    res.status(201).json({
      message: 'Approval rule added successfully',
      rule: newRule
    });
  } catch (error) {
    console.error('Add approval rule error:', error);
    res.status(500).json({ message: 'Server error during rule creation' });
  }
});

// @route   PUT /api/company/approval-rules/:ruleId
// @desc    Update approval rule
// @access  Private (Admin)
router.put('/approval-rules/:ruleId', [
  auth,
  authorize('admin'),
  body('type').optional().isIn(['percentage', 'specific_approver', 'hybrid']),
  body('percentage').optional().isFloat({ min: 0, max: 100 }),
  body('specificApprovers').optional().isArray(),
  body('conditions').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const ruleIndex = company.settings.approvalRules.findIndex(
      rule => rule._id.toString() === req.params.ruleId
    );

    if (ruleIndex === -1) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    const { type, percentage, specificApprovers, conditions } = req.body;
    const rule = company.settings.approvalRules[ruleIndex];

    if (type) rule.type = type;
    if (percentage !== undefined) rule.percentage = percentage;
    if (specificApprovers !== undefined) rule.specificApprovers = specificApprovers;
    if (conditions !== undefined) rule.conditions = conditions;

    await company.save();

    res.json({
      message: 'Approval rule updated successfully',
      rule: rule
    });
  } catch (error) {
    console.error('Update approval rule error:', error);
    res.status(500).json({ message: 'Server error during rule update' });
  }
});

// @route   DELETE /api/company/approval-rules/:ruleId
// @desc    Delete approval rule
// @access  Private (Admin)
router.delete('/approval-rules/:ruleId', [
  auth,
  authorize('admin')
], async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const ruleIndex = company.settings.approvalRules.findIndex(
      rule => rule._id.toString() === req.params.ruleId
    );

    if (ruleIndex === -1) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    company.settings.approvalRules.splice(ruleIndex, 1);
    await company.save();

    res.json({ message: 'Approval rule deleted successfully' });
  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({ message: 'Server error during rule deletion' });
  }
});

// @route   POST /api/company/approval-flow
// @desc    Set default approval flow
// @access  Private (Admin)
router.post('/approval-flow', [
  auth,
  authorize('admin'),
  body('approvalFlow').isArray().withMessage('Approval flow must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { approvalFlow } = req.body;

    // Validate approval flow structure
    for (const level of approvalFlow) {
      if (!level.level || !level.approvers || !Array.isArray(level.approvers)) {
        return res.status(400).json({ 
          message: 'Invalid approval flow structure. Each level must have level number and approvers array.' 
        });
      }
    }

    company.settings.defaultApprovalFlow = approvalFlow;
    await company.save();

    res.json({
      message: 'Approval flow updated successfully',
      approvalFlow: company.settings.defaultApprovalFlow
    });
  } catch (error) {
    console.error('Update approval flow error:', error);
    res.status(500).json({ message: 'Server error during approval flow update' });
  }
});

// @route   GET /api/company/countries
// @desc    Get available countries with currencies
// @access  Private (Admin)
router.get('/countries', [
  auth,
  authorize('admin')
], async (req, res) => {
  try {
    const countries = await currencyService.getCountriesWithCurrencies();
    res.json({ countries });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ message: 'Server error fetching countries' });
  }
});

module.exports = router;