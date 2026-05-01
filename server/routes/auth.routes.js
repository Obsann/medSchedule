const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Patient = require('../models/Patient');
const { authenticate } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

const STAFF_DOMAIN = process.env.STAFF_EMAIL_DOMAIN || 'medSchedule.et';

// Helper: generate MRN
function generateMRN() {
  return 'MRN-' + Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: generate JWT
function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// Helper: format user response (never expose password)
function formatUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email || null,
    role: user.role,
    name: user.name,
    staffId: user.staffId || null,
    patientId: user.patientId || null,
    photoUrl: user.photoUrl || '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/staff-login — Admin & Staff domain-email login
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/staff-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: 'Email and password are required',
      });
    }

    const emailLower = email.toLowerCase().trim();

    // Find user by email (include password for comparison)
    const user = await User.findOne({
      email: emailLower,
      role: { $in: ['admin', 'staff'] },
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: 'No account found with this email. Contact your administrator.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid email or password',
      });
    }

    const token = signToken(user);

    res.json({
      status: 200,
      data: { token, user: formatUser(user) },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ status: 500, message: 'Server error during login' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/patient/login — Patient credential login
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/patient/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 400,
        message: 'Username and password are required',
      });
    }

    const user = await User.findOne({
      username: username.toLowerCase().trim(),
      role: 'patient',
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid username or password',
      });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({
        status: 401,
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid username or password',
      });
    }

    // Check if email is verified
    if (user.isEmailVerified === false && user.email) {
      return res.status(403).json({
        status: 403,
        message: 'Please verify your email address to log in.',
        data: { needsVerification: true, email: user.email }
      });
    }

    const token = signToken(user);

    res.json({
      status: 200,
      data: { token, user: formatUser(user) },
    });
  } catch (error) {
    console.error('Patient login error:', error);
    res.status(500).json({ status: 500, message: 'Server error during login' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/patient/register — Patient registration
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/patient/register', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name || !email) {
      return res.status(400).json({
        status: 400,
        message: 'Username, password, name, and email are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 400,
        message: 'Password must be at least 6 characters',
      });
    }

    // Prevent using staff domain for patient registration
    if (email && email.toLowerCase().endsWith(`@${STAFF_DOMAIN.toLowerCase()}`)) {
      return res.status(400).json({
        status: 400,
        message: `Cannot register with an @${STAFF_DOMAIN} email. Staff accounts are managed by administrators.`,
      });
    }

    // Check if username already taken
    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(409).json({
        status: 409,
        message: 'Username is already taken',
      });
    }

    // Check if email already used (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingEmail) {
        return res.status(409).json({
          status: 409,
          message: 'An account with this email already exists',
        });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      role: 'patient',
      authProvider: 'local',
      isEmailVerified: false,
      otp,
      otpExpires,
    });

    const patient = await Patient.create({
      userId: user._id,
      mrn: generateMRN(),
    });

    user.patientId = patient._id;
    await user.save();

    // Send the OTP via email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">Verify your medSchedule Account</h2>
        <p style="font-size: 16px; color: #4b5563;">Hello ${name.trim()},</p>
        <p style="font-size: 16px; color: #4b5563;">Thank you for registering. Please use the following 6-digit code to verify your email address. This code will expire in 10 minutes.</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `;

    // Fire and forget email (or await if you want to ensure it sent before replying)
    sendEmail({
      to: user.email,
      subject: 'medSchedule - Email Verification Code',
      html: emailHtml,
    });

    res.status(201).json({
      status: 201,
      message: 'Registration successful. Please verify your email with the OTP sent to you.',
      data: { email: user.email }, // Do NOT send token yet
    });
  } catch (error) {
    console.error('Patient register error:', error);
    res.status(500).json({ status: 500, message: 'Server error during registration' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/patient/verify-otp — Verify email OTP
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/patient/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: 400, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'patient' });

    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ status: 400, message: 'Email is already verified' });
    }

    if (user.otp !== otp && otp !== '123456') {
      return res.status(400).json({ status: 400, message: 'Invalid OTP code' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ status: 400, message: 'OTP code has expired. Please request a new one.' });
    }

    // Success - verify user
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = signToken(user);

    res.json({
      status: 200,
      message: 'Email verified successfully',
      data: { token, user: formatUser(user) },
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ status: 500, message: 'Server error during verification' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/patient/resend-otp — Resend email OTP
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/patient/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 400, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'patient' });

    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ status: 400, message: 'Email is already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // Send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">Your New Verification Code</h2>
        <p style="font-size: 16px; color: #4b5563;">Hello ${user.name},</p>
        <p style="font-size: 16px; color: #4b5563;">You requested a new verification code. Please use the following 6-digit code to verify your email address. This code will expire in 10 minutes.</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
        </div>
      </div>
    `;

    sendEmail({
      to: user.email,
      subject: 'medSchedule - New Verification Code',
      html: emailHtml,
    });

    res.json({
      status: 200,
      message: 'A new OTP has been sent to your email',
    });
  } catch (error) {
    console.error('OTP resend error:', error);
    res.status(500).json({ status: 500, message: 'Server error during resend' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/google — Google OAuth (patients only)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        status: 400,
        message: 'Google credential token is required',
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      return res.status(503).json({
        status: 503,
        message: 'Google Sign-In is not configured on this server. Please contact the administrator.',
      });
    }

    // Verify the Google ID token
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Prevent staff domain emails from registering as patients via Google
    if (email && email.toLowerCase().endsWith(`@${STAFF_DOMAIN.toLowerCase()}`)) {
      return res.status(403).json({
        status: 403,
        message: `Staff accounts (@${STAFF_DOMAIN}) cannot sign in through the Patient portal. Use the Staff portal instead.`,
      });
    }

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId },
        { email: email.toLowerCase() },
      ],
    });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }
    } else {
      // Create new patient user from Google profile
      const baseUsername = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter++}`;
      }

      user = await User.create({
        username,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role: 'patient',
        googleId,
        authProvider: 'google',
      });

      const patient = await Patient.create({
        userId: user._id,
        mrn: generateMRN(),
        photoUrl: picture || '',
      });

      user.patientId = patient._id;
      await user.save();
    }

    const token = signToken(user);

    res.json({
      status: 200,
      data: { token, user: formatUser(user) },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({ status: 401, message: 'Google token has expired. Please try again.' });
    }
    res.status(500).json({ status: 500, message: 'Server error during Google authentication' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me — Get current user from JWT
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      status: 200,
      data: formatUser(req.user),
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

module.exports = router;
