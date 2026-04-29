const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Patient = require('../models/Patient');
const { authenticate } = require('../middleware/auth');

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

    // Validate domain
    const emailLower = email.toLowerCase().trim();
    if (!emailLower.endsWith(`@${STAFF_DOMAIN.toLowerCase()}`)) {
      return res.status(401).json({
        status: 401,
        message: `Invalid credentials. Staff must use an @${STAFF_DOMAIN} email.`,
      });
    }

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

    if (!username || !password || !name) {
      return res.status(400).json({
        status: 400,
        message: 'Username, password, and name are required',
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

    const user = await User.create({
      username: username.toLowerCase().trim(),
      email: email ? email.toLowerCase().trim() : null,
      password,
      name: name.trim(),
      role: 'patient',
      authProvider: 'local',
    });

    const patient = await Patient.create({
      userId: user._id,
      mrn: generateMRN(),
    });

    user.patientId = patient._id;
    await user.save();

    const token = signToken(user);

    res.status(201).json({
      status: 201,
      data: { token, user: formatUser(user) },
    });
  } catch (error) {
    console.error('Patient register error:', error);
    res.status(500).json({ status: 500, message: 'Server error during registration' });
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
