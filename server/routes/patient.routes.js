const express = require('express');
const Patient = require('../models/Patient');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ─── GET /api/patient/me ─────────────────────────────────────────────────────
router.get('/me', requireRole('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ status: 404, message: 'Patient profile not found' });
    }
    res.json({ status: 200, data: patient });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

// ─── PUT /api/patient/me ─────────────────────────────────────────────────────
router.put('/me', requireRole('patient'), async (req, res) => {
  try {
    // Prevent updating status, mrn, userId
    const { status, mrn, userId, _id, ...updateData } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ status: 404, message: 'Patient profile not found' });
    }

    res.json({ status: 200, data: patient });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

module.exports = router;
