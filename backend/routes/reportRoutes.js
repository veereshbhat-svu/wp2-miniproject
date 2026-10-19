import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllReports,
  getReportById,
  createReport,
  analyzeStrip,
  streamAnalysisTelemetry,
  sendToHIS,
  downloadReportPdf,
  deleteReport,
  clearAllReports,
} from '../controllers/reportController.js';

const router = express.Router();

// Configure Multer for test strip photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `strip-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

router.get('/', getAllReports);
router.post('/', createReport);
router.post('/analyze-strip', upload.single('stripImage'), analyzeStrip);
router.get('/stream-telemetry', streamAnalysisTelemetry);
router.delete('/clear-all', clearAllReports);

router.get('/:id', getReportById);
router.delete('/:id', deleteReport);
router.post('/:id/send-his', sendToHIS);
router.get('/:id/pdf', downloadReportPdf);

export default router;
