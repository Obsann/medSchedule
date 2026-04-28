const express = require('express');
const Staff = require('../models/Staff');
const Shift = require('../models/Shift');
const Department = require('../models/Department');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// ─── GET /api/stats/dashboard ────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalStaff,
      activeStaff,
      doctors,
      nurses,
      onLeave,
      inactive,
      departments,
      totalShifts,
      scheduledShifts,
      completedShifts,
      cancelledShifts,
    ] = await Promise.all([
      Staff.countDocuments(),
      Staff.countDocuments({ status: 'active' }),
      Staff.countDocuments({ role: 'doctor', status: 'active' }),
      Staff.countDocuments({ role: 'nurse', status: 'active' }),
      Staff.countDocuments({ status: 'on-leave' }),
      Staff.countDocuments({ status: 'inactive' }),
      Department.countDocuments(),
      Shift.countDocuments(),
      Shift.countDocuments({ status: 'scheduled' }),
      Shift.countDocuments({ status: 'completed' }),
      Shift.countDocuments({ status: 'cancelled' }),
    ]);

    res.json({
      status: 200,
      data: {
        totalStaff,
        activeStaff,
        doctors,
        nurses,
        onLeave,
        inactive,
        departments,
        totalShifts,
        scheduledShifts,
        completedShifts,
        cancelledShifts,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ status: 500, message: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
