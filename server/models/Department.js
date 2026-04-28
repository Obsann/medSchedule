const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  headDoctor: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#3B82F6',
  },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
