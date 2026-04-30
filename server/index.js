require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth.routes');
const staffRoutes = require('./routes/staff.routes');
const departmentRoutes = require('./routes/departments.routes');
const shiftRoutes = require('./routes/shifts.routes');
const statsRoutes = require('./routes/stats.routes');
const patientRoutes = require('./routes/patient.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/profile', profileRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 404, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 500, message: 'Internal server error' });
});

// ─── Start Server ───────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API base: http://localhost:${PORT}/api`);
  });
});
