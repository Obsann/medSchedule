const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['doctor', 'nurse'],
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  specialization: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'on-leave', 'inactive'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
