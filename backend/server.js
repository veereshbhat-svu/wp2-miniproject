import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import reportRoutes from './routes/reportRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import triageRoutes from './routes/triageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { verifyReportPublic } from './controllers/verifyController.js';
import { getLocalIpAddress } from './utils/qrGenerator.js';
import { seedInitialData } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/urinescan_db';

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Information Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to UrineScan POC Urinalysis Engine Backend API',
    facility: 'K. J. Somaiya Hospital & Research Center',
    endpoints: {
      health: 'GET /api/health',
      reports: 'GET /api/reports',
      patients: 'GET /api/patients',
      analytics: 'GET /api/analytics/dashboard',
      verification: 'GET /verify/:reportId',
    },
    documentation: 'See BACKEND_REPORT.md / BACKEND_REPORT.html',
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'UrineScan Backend Engine v2.4',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Direct Public Mobile QR Verification View
app.get('/verify/:id', verifyReportPublic);

// API Routes
app.use('/api/reports', reportRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and Launch Server
async function startServer() {
  try {
    console.log('[DATABASE] Connecting to MongoDB at', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('[DATABASE] Connected to MongoDB successfully!');

    // Auto-seed initial hospital records
    await seedInitialData();

    const localIp = getLocalIpAddress();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('====================================================');
      console.log(`🚀 UrineScan Clinical Diagnostic Server is RUNNING!`);
      console.log(`📡 Local API:          http://localhost:${PORT}`);
      console.log(`📱 LAN Verification:   http://${localIp}:${PORT}/verify/:id`);
      console.log(`💻 Frontend Client:    http://localhost:5173`);
      console.log(`🏥 Facility:           K. J. Somaiya Hospital Diagnostic Core`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
