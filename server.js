require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const blockchain = require('./utils/blockchain');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/records', require('./routes/records'));
app.use('/api/consent', require('./routes/consent'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    blockchain: blockchain.isConnected() ? 'connected' : 'demo mode',
    security: 'helmet+rate-limit',
    timestamp: new Date().toISOString(),
  });
});

// ─── Database + Blockchain Init ───────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blockchain-ehr')
  .then(async () => {
    console.log('MongoDB connected');
    // Seed default admin
    try {
      const Admin = require('./models/Admin');
      const bcrypt = require('bcryptjs');
      const existingAdmin = await Admin.findOne({ email: 'admin@medvault.com' });
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        await Admin.create({ name: 'System Admin', email: 'admin@medvault.com', passwordHash });
        console.log('✅ Seeded default admin account: admin@medvault.com / admin123');
      }
    } catch (err) {
      console.error('Failed to seed admin', err);
    }

    blockchain.init();

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`[Server] Blockchain EHR API running on http://localhost:${PORT}`);
      console.log('[Server] Routes:');
      console.log('  POST /api/auth/register');
      console.log('  POST /api/auth/login');
      console.log('  POST /api/records/upload');
      console.log('  GET  /api/records/:patientId');
      console.log('  POST /api/consent/grant/:doctorId');
      console.log('  POST /api/consent/revoke/:doctorId');
      console.log('  GET  /api/consent/doctors');
      console.log('  POST /api/emergency');
      console.log('  GET  /api/emergency/status/:patientId');
      console.log('  GET  /api/audit');
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
