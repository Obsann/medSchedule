const express = require('express');
const Staff = require('../models/Staff');
const Shift = require('../models/Shift');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ─── GET /api/staff ──────────────────────────────────────────────────────────
// Supports filters: departmentId, role, status, search
router.get('/', async (req, res) => {
  try {
    const { departmentId, role, status, search } = req.query;
    const filter = {};

    if (departmentId) filter.departmentId = departmentId;
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      const q = search.trim();
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { specialization: { $regex: q, $options: 'i' } },
      ];
    }

    const items = await Staff.find(filter).sort({ firstName: 1 });

    // Map _id to id for frontend compatibility
    const data = items.map(s => ({
      id: s._id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      role: s.role,
      departmentId: s.departmentId,
      specialization: s.specialization,
      status: s.status,
    }));

    res.json({ status: 200, data });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ status: 500, message: 'Failed to fetch staff' });
  }
});

// ─── GET /api/staff/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const item = await Staff.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ status: 404, message: 'Staff not found' });
    }

    res.json({
      status: 200,
      data: {
        id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        phone: item.phone,
        role: item.role,
        departmentId: item.departmentId,
        specialization: item.specialization,
        status: item.status,
      },
    });
  } catch (error) {
    console.error('Get staff by id error:', error);
    res.status(500).json({ status: 500, message: 'Failed to fetch staff member' });
  }
});

// ─── POST /api/staff ─────────────────────────────────────────────────────────
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, departmentId, specialization, status, password } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(422).json({
        status: 422,
        message: 'Validation: firstName, lastName, email are required',
      });
    }

    if (!password || password.length < 6) {
      return res.status(422).json({
        status: 422,
        message: 'Password is required and must be at least 6 characters',
      });
    }

    // Check unique email in Staff collection
    const existing = await Staff.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        status: 409,
        message: 'Conflict: A staff member with this email already exists',
      });
    }

    // Also check User collection for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: 'Conflict: An account with this email already exists',
      });
    }

    // Create the Staff record
    const item = await Staff.create({
      firstName, lastName, email, phone, role, departmentId, specialization,
      status: status || 'active',
    });

    // Create a User account so the staff member can log in
    const username = email.toLowerCase().trim();
    await User.create({
      username,
      email: email.toLowerCase().trim(),
      password,
      name: `${firstName} ${lastName}`,
      role: 'staff',
      staffId: item._id,
      authProvider: 'local',
      isEmailVerified: true, // Admin-created accounts don't need OTP verification
    });

    res.status(201).json({
      status: 201,
      data: {
        id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        phone: item.phone,
        role: item.role,
        departmentId: item.departmentId,
        specialization: item.specialization,
        status: item.status,
      },
      message: `${role === 'doctor' ? 'Dr.' : 'Nurse'} ${firstName} ${lastName} created with login access`,
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ status: 500, message: 'Failed to create staff member' });
  }
});

// ─── PUT /api/staff/:id ──────────────────────────────────────────────────────
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const item = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ status: 404, message: 'Staff not found' });
    }

    // Keep the linked User record in sync with Staff name/email
    const userUpdates = {};
    if (req.body.firstName || req.body.lastName) {
      userUpdates.name = `${item.firstName} ${item.lastName}`;
    }
    if (req.body.email) {
      userUpdates.email = item.email;
      userUpdates.username = item.email; // username IS the email for staff
    }
    if (Object.keys(userUpdates).length > 0) {
      await User.findOneAndUpdate({ staffId: item._id }, { $set: userUpdates });
    }

    res.json({
      status: 200,
      data: {
        id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        phone: item.phone,
        role: item.role,
        departmentId: item.departmentId,
        specialization: item.specialization,
        status: item.status,
      },
      message: `Staff "${item.firstName} ${item.lastName}" updated`,
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ status: 500, message: 'Failed to update staff member' });
  }
});

// ─── DELETE /api/staff/:id ───────────────────────────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const item = await Staff.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ status: 404, message: 'Staff not found' });
    }

    // Cascade: remove all shifts for this staff member
    await Shift.deleteMany({ staffId: item._id });
    // Cascade: remove the linked User account
    await User.deleteMany({ staffId: item._id });
    await Staff.findByIdAndDelete(req.params.id);

    res.json({
      status: 200,
      data: null,
      message: `${item.firstName} ${item.lastName} removed`,
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ status: 500, message: 'Failed to delete staff member' });
  }
});

module.exports = router;
