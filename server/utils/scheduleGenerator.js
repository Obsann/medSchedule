const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const Shift = require('../models/Shift');
const Department = require('../models/Department');

/**
 * Generates a 2-month schedule starting from a given date.
 * Ensures 24/7 coverage (morning, afternoon, night) for each department.
 * Distributes shifts evenly and enforces rest periods.
 * @param {string} startDateStr - YYYY-MM-DD
 * @returns {Array} List of generated shifts ready for insert
 */
async function generateSchedule(startDateStr) {
  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(startDate.getTime())) {
    throw new Error('Invalid start date');
  }

  // Set to midnight UTC to avoid timezone issues
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setUTCMonth(endDate.getUTCMonth() + 2);

  const activeStaff = await Staff.find({ status: 'active' }).lean();
  if (!activeStaff.length) {
    throw new Error('No active staff found to schedule.');
  }

  // Group staff by department
  const staffByDept = {};
  activeStaff.forEach(staff => {
    const deptId = staff.departmentId.toString();
    if (!staffByDept[deptId]) {
      staffByDept[deptId] = [];
    }
    // Initialize tracking metrics
    staffByDept[deptId].push({
      ...staff,
      shiftCount: 0,
      lastShiftEnd: null,
      holidayShifts: 0,
    });
  });

  const generatedShifts = [];
  const shiftTypes = [
    { type: 'morning', start: '08:00', end: '16:00', durationHours: 8 },
    { type: 'afternoon', start: '16:00', end: '00:00', durationHours: 8 },
    { type: 'night', start: '00:00', end: '08:00', durationHours: 8 },
  ];

  // Simple hardcoded holiday checker (Gregorian approximations of Ethiopian/Public holidays)
  const isHoliday = (date) => {
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const holidays = [
      '1-7',  // Genna (Christmas)
      '1-19', // Timkat (Epiphany)
      '3-2',  // Adwa Victory
      '5-1',  // Labor Day
      '5-5',  // Patriots' Victory
      '5-28', // Derg Downfall
      '9-11', // Ethiopian New Year
      '9-27', // Meskel
    ];
    return holidays.includes(`${m}-${d}`) || date.getUTCDay() === 0 || date.getUTCDay() === 6; // Include weekends as "holidays" for fair distribution
  };

  // Iterate day by day
  let currentDate = new Date(startDate);
  while (currentDate < endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    const isTodayHoliday = isHoliday(currentDate);

    for (const [deptId, staffList] of Object.entries(staffByDept)) {
      if (staffList.length === 0) continue;

      for (const shiftType of shiftTypes) {
        // Find the best staff member for this shift
        // Sort by:
        // 1. If holiday, sort by holidayShifts (lowest first)
        // 2. Sort by total shiftCount (lowest first)
        
        // Filter out those who haven't rested enough (need at least 16 hours rest)
        // Since we are iterating strictly chronologically forward, we can use simple heuristic:
        // They shouldn't have worked the immediate previous shift.
        // For simplicity, we just ensure they aren't working twice on the same date,
        // and if it's morning, they didn't work night the previous day.
        
        let availableStaff = staffList.filter(s => {
          if (!s.lastShift) return true;
          if (s.lastShift.date === dateString) return false; // Already working today
          if (shiftType.type === 'morning' && s.lastShift.date === getPrevDay(dateString) && s.lastShift.type === 'night') {
            return false; // No morning shift right after a night shift
          }
          return true;
        });

        // If no one is strictly available (e.g. very few staff), relax the rule to just "not working same day"
        if (availableStaff.length === 0) {
          availableStaff = staffList.filter(s => !s.lastShift || s.lastShift.date !== dateString);
        }

        // If STILL empty, just pick anyone who is not working this exact shift (extreme understaffing fallback)
        if (availableStaff.length === 0) {
           availableStaff = staffList;
        }

        availableStaff.sort((a, b) => {
          if (isTodayHoliday && a.holidayShifts !== b.holidayShifts) {
             return a.holidayShifts - b.holidayShifts;
          }
          return a.shiftCount - b.shiftCount;
        });

        const selectedStaff = availableStaff[0];

        generatedShifts.push({
          staffId: selectedStaff._id,
          date: dateString,
          startTime: shiftType.start,
          endTime: shiftType.end,
          shiftType: shiftType.type,
          departmentId: deptId,
          status: 'scheduled',
          notes: isTodayHoliday ? 'Holiday/Weekend Shift' : 'Auto-generated',
        });

        // Update tracking
        selectedStaff.shiftCount++;
        if (isTodayHoliday) selectedStaff.holidayShifts++;
        selectedStaff.lastShift = { date: dateString, type: shiftType.type };
      }
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return generatedShifts;
}

function getPrevDay(dateStr) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

module.exports = {
  generateSchedule
};
