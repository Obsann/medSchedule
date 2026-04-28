const express = require('express');
const Shift = require('../models/Shift');
const Staff = require('../models/Staff');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ─── GET /api/shifts ─────────────────────────────────────────────────────────
// Supports filters: departmentId, staffId, date, status, shiftType
router.get('/', async (req, res) => {
  try {
    const { departmentId, staffId, date, status, shiftType } = req.query;
    const filter = {};

    if (departmentId) filter.departmentId = departmentId;
    if (staffId) filter.staffId = staffId;
    if (date) filter.date = date;
    if (status) filter.status = status;
    if (shiftType) filter.shiftType = shiftType;

    const items = await Shift.find(filter).sort({ date: 1, startTime: 1 });

    const data = items.map(s => ({
      id: s._id,
      staffId: s.staffId,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      shiftType: s.shiftType,
      departmentId: s.departmentId,
      status: s.status,
      notes: s.notes,
    }));

    res.json({ status: 200, data });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ status: 500, message: 'Failed to fetch shifts' });
  }
});

// ─── POST /api/shifts ────────────────────────────────────────────────────────
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { staffId, date, startTime, endTime, shiftType, departmentId, status, notes } = req.body;

    // Validate staff exists and is active
    const staffMember = await Staff.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({ status: 404, message: 'Staff member not found' });
    }
    if (staffMember.status !== 'active') {
      return res.status(422).json({
        status: 422,
        message: `Cannot assign shift: Staff status is "${staffMember.status}"`,
      });
    }

    // BR1: No overlapping shifts for the same staff member on the same date
    const existing = await Shift.find({
      staffId,
      date,
      status: { $ne: 'cancelled' },
    });

    const hasOverlap = existing.some(s =>
      startTime < s.endTime && endTime > s.startTime
    );

    if (hasOverlap) {
      return res.status(409).json({
        status: 409,
        message: 'Business Rule Violation (BR1): This staff member has an overlapping shift on this date',
      });
    }

    const item = await Shift.create({
      staffId, date, startTime, endTime, shiftType, departmentId,
      status: status || 'scheduled',
      notes: notes || '',
    });

    res.status(201).json({
      status: 201,
      data: {
        id: item._id,
        staffId: item.staffId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        shiftType: item.shiftType,
        departmentId: item.departmentId,
        status: item.status,
        notes: item.notes,
      },
      message: 'Shift assigned successfully',
    });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ status: 500, message: 'Failed to create shift' });
  }
});

// ─── PUT /api/shifts/:id ─────────────────────────────────────────────────────
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const item = await Shift.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ status: 404, message: 'Shift not found' });
    }

    res.json({
      status: 200,
      data: {
        id: item._id,
        staffId: item.staffId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        shiftType: item.shiftType,
        departmentId: item.departmentId,
        status: item.status,
        notes: item.notes,
      },
      message: 'Shift updated',
    });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ status: 500, message: 'Failed to update shift' });
  }
});

// ─── DELETE /api/shifts/:id ──────────────────────────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const item = await Shift.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ status: 404, message: 'Shift not found' });
    }

    res.json({
      status: 200,
      data: null,
      message: 'Shift removed',
    });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ status: 500, message: 'Failed to delete shift' });
  }
});

module.exports = router;
