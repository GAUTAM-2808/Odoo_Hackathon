const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users in company (Admin only)
// @access  Private (Admin)
router.get('/', [
  auth,
  authorize('admin')
], async (req, res) => {
  try {
    const users = await User.find({ 
      company: req.user.company,
      isActive: true 
    })
    .populate('manager', 'firstName lastName')
    .select('-password');

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private (Admin)
router.post('/', [
  auth,
  authorize('admin'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'manager', 'employee']).withMessage('Valid role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role, manager } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate manager if provided
    if (manager) {
      const managerUser = await User.findOne({ 
        _id: manager, 
        company: req.user.company,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (!managerUser) {
        return res.status(400).json({ message: 'Invalid manager selected' });
      }
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      company: req.user.company,
      manager: manager || null
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        manager: user.manager
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error during user creation' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.put('/:id', [
  auth,
  authorize('admin'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'manager', 'employee']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({ 
      _id: req.params.id, 
      company: req.user.company 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id && req.body.isActive === false) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const { firstName, lastName, email, role, manager, isActive } = req.body;

    // Validate manager if provided
    if (manager) {
      const managerUser = await User.findOne({ 
        _id: manager, 
        company: req.user.company,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (!managerUser) {
        return res.status(400).json({ message: 'Invalid manager selected' });
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (manager !== undefined) user.manager = manager;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        manager: user.manager,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error during user update' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', [
  auth,
  authorize('admin')
], async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.params.id, 
      company: req.user.company 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error during user deletion' });
  }
});

// @route   GET /api/users/managers
// @desc    Get all managers in company (for dropdown)
// @access  Private (Admin)
router.get('/managers', [
  auth,
  authorize('admin')
], async (req, res) => {
  try {
    const managers = await User.find({ 
      company: req.user.company,
      role: { $in: ['admin', 'manager'] },
      isActive: true
    })
    .select('firstName lastName email role');

    res.json({ managers });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;