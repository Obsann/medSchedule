const express = require('express');
const Department = require('../models/Department');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ─── GET /api/departments ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const items = await Department.find().sort({ name: 1 });

    const data = items.map(d => ({
      id: d._id,
      name: d.name,
      description: d.description,
      headDoctor: d.headDoctor,
      color: d.color,
    }));

    res.json({ status: 200, data });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ status: 500, message: 'Failed to fetch departments' });
  }
});

// ─── POST /api/departments ───────────────────────────────────────────────────
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, description, headDoctor, color } = req.body;

    if (!name) {
      return res.status(422).json({
        status: 422,
        message: 'Validation: name is required',
      });
    }

    const item = await Department.create({ name, description, headDoctor, color });

    res.status(201).json({
      status: 201,
      data: {
        id: item._id,
        name: item.name,
        description: item.description,
        headDoctor: item.headDoctor,
        color: item.color,
      },
      message: `Department "${name}" created`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: 'A department with this name already exists',
      });
    }
    console.error('Create department error:', error);
    res.status(500).json({ status: 500, message: 'Failed to create department' });
  }
});

// ─── PUT /api/departments/:id ────────────────────────────────────────────────
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const item = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ status: 404, message: 'Department not found' });
    }

    res.json({
      status: 200,
      data: {
        id: item._id,
        name: item.name,
        description: item.description,
        headDoctor: item.headDoctor,
        color: item.color,
      },
      message: `Department "${item.name}" updated`,
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ status: 500, message: 'Failed to update department' });
  }
});

// ─── DELETE /api/departments/:id ─────────────────────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const item = await Department.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ status: 404, message: 'Department not found' });
    }

    res.json({
      status: 200,
      data: null,
      message: 'Department deleted',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ status: 500, message: 'Failed to delete department' });
  }
});

module.exports = router;
