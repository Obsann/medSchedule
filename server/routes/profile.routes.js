const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');
const Department = require('../models/Department');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Multer config with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'medschedule/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    public_id: (req, file) => `${req.user._id}-${Date.now()}`,
  },
});

// Keep the fileFilter to prevent invalid formats early, although Cloudinary also rejects them
const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp, gif) are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }); // 5 MB max

// All routes require authentication
router.use(authenticate);

// ─── POST /api/profile/upload-photo ──────────────────────────────────────────
router.post('/upload-photo', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ status: 413, message: 'File too large. Maximum size is 5 MB.' });
      }
      return res.status(400).json({ status: 400, message: err.message || 'Upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 400, message: 'No image file provided' });
    }

    const photoUrl = req.file.path; // Cloudinary returns the full URL in path

    // Update user record
    await User.findByIdAndUpdate(req.user._id, { photoUrl });

    // Also update Patient record if patient
    if (req.user.role === 'patient') {
      await Patient.findOneAndUpdate({ userId: req.user._id }, { photoUrl });
    }

    res.json({ status: 200, data: { photoUrl } });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ status: 500, message: 'Failed to upload photo' });
  }
});

// ─── GET /api/profile/me ─────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const user = req.user;
    const baseProfile = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      photoUrl: user.photoUrl || '',
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    };

    if (user.role === 'patient' && user.patientId) {
      const patient = await Patient.findById(user.patientId);
      if (patient) {
        baseProfile.patient = {
          mrn: patient.mrn,
          dob: patient.dob,
          gender: patient.gender,
          phone: patient.phone,
          emergencyContact: patient.emergencyContact,
          status: patient.status,
        };
      }
    }

    if ((user.role === 'staff' || user.role === 'admin') && user.staffId) {
      const staffDoc = await Staff.findById(user.staffId);
      if (staffDoc) {
        baseProfile.staff = {
          firstName: staffDoc.firstName,
          lastName: staffDoc.lastName,
          email: staffDoc.email,
          phone: staffDoc.phone,
          role: staffDoc.role,
          specialization: staffDoc.specialization,
          departmentId: staffDoc.departmentId,
          status: staffDoc.status,
        };
      }
    }

    res.json({ status: 200, data: baseProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

// ─── PUT /api/profile/me ─────────────────────────────────────────────────────
router.put('/me', async (req, res) => {
  try {
    const { name, email, patient: patientData, staff: staffData } = req.body;

    // Update basic user fields
    const userUpdates = {};
    if (name) userUpdates.name = name.trim();
    if (email !== undefined) userUpdates.email = email ? email.toLowerCase().trim() : req.user.email;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates);
    }

    // Update patient-specific fields
    if (req.user.role === 'patient' && patientData) {
      const { mrn, status, userId, _id, ...allowedPatientData } = patientData;
      await Patient.findOneAndUpdate(
        { userId: req.user._id },
        { $set: allowedPatientData },
        { runValidators: true }
      );
    }

    // Update staff-specific fields
    if ((req.user.role === 'staff' || req.user.role === 'admin') && staffData) {
      if (req.user.staffId) {
        const { _id, ...allowedStaffData } = staffData;
        await Staff.findByIdAndUpdate(
          req.user.staffId,
          { $set: allowedStaffData },
          { runValidators: true }
        );
      } else {
        // Admin without a linked Staff record — create one
        const newStaff = await Staff.create({
          firstName: (name || req.user.name || 'Admin').split(' ')[0],
          lastName: (name || req.user.name || 'User').split(' ').slice(1).join(' ') || 'User',
          email: req.user.email || `admin-${req.user._id}@medschedule.et`,
          phone: staffData.phone || '',
          role: 'doctor',
          departmentId: staffData.departmentId || (await Department.findOne())?._id,
          specialization: staffData.specialization || 'Administration',
          status: 'active',
        });
        await User.findByIdAndUpdate(req.user._id, { staffId: newStaff._id });
        req.user.staffId = newStaff._id;
      }
    }

    // Re-fetch and return updated profile
    const updatedUser = await User.findById(req.user._id);
    const baseProfile = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      photoUrl: updatedUser.photoUrl || '',
      authProvider: updatedUser.authProvider,
      createdAt: updatedUser.createdAt,
    };

    if (updatedUser.role === 'patient' && updatedUser.patientId) {
      const patient = await Patient.findById(updatedUser.patientId);
      if (patient) {
        baseProfile.patient = {
          mrn: patient.mrn,
          dob: patient.dob,
          gender: patient.gender,
          phone: patient.phone,
          emergencyContact: patient.emergencyContact,
          status: patient.status,
        };
      }
    }

    if ((updatedUser.role === 'staff' || updatedUser.role === 'admin') && updatedUser.staffId) {
      const staffDoc = await Staff.findById(updatedUser.staffId);
      if (staffDoc) {
        baseProfile.staff = {
          firstName: staffDoc.firstName,
          lastName: staffDoc.lastName,
          email: staffDoc.email,
          phone: staffDoc.phone,
          role: staffDoc.role,
          specialization: staffDoc.specialization,
          departmentId: staffDoc.departmentId,
          status: staffDoc.status,
        };
      }
    }

    res.json({ status: 200, data: baseProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

module.exports = router;
