const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Staff member is required'],
  },
  date: {
    type: String, // YYYY-MM-DD format for easy filtering
    required: [true, 'Date is required'],
    index: true,
  },
  startTime: {
    type: String, // HH:mm format
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: String, // HH:mm format
    required: [true, 'End time is required'],
  },
  shiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'night'],
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Compound index for efficient overlap queries
shiftSchema.index({ staffId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Shift', shiftSchema);
