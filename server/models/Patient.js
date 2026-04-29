const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mrn: {
    type: String,
    required: true,
    unique: true,
  },
  dob: {
    type: String, // Stored as YYYY-MM-DD for simplicity
    default: '',
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Unknown'],
    default: 'Unknown',
  },
  phone: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(09\d{8}|07\d{8}|\+251(9|7)\d{8})$/.test(v.replace(/\s+/g, ''));
      },
      message: props => `${props.value} is not a valid Ethiopian phone number!`
    }
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { 
      type: String, 
      default: '',
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(09\d{8}|07\d{8}|\+251(9|7)\d{8})$/.test(v.replace(/\s+/g, ''));
        },
        message: props => `${props.value} is not a valid Ethiopian phone number!`
      }
    },
    relation: { type: String, default: '' },
  },
  photoUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['In-patient', 'Out-patient', 'Discharged'],
    default: 'Out-patient',
  },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
