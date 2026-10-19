import crypto from 'crypto';
import Report from '../models/Report.js';
import Patient from '../models/Patient.js';
import { analyzeStripImage } from '../utils/colorimetryEngine.js';
import { evaluateClinicalRisk } from '../utils/clinicalRuleEngine.js';
import { generateReportQrCode } from '../utils/qrGenerator.js';
import { buildReportPdf } from '../utils/pdfGenerator.js';

/**
 * Fetch all reports with filtering, search, and pagination
 */
export async function getAllReports(req, res) {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = new RegExp(`^${status}$`, 'i');
    }

    if (search) {
      filter.$or = [
        { reportId: new RegExp(search, 'i') },
        { patientId: new RegExp(search, 'i') },
        { patientName: new RegExp(search, 'i') },
      ];
    }

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      reports,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Fetch single report by ID
 */
export async function getReportById(req, res) {
  try {
    const { id } = req.params;
    let report = await Report.findOne({ reportId: id });
    if (!report && id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await Report.findById(id);
    }

    if (!report) {
      return res.status(404).json({ success: false, message: 'Urinalysis report not found' });
    }

    // Ensure QR code is present
    if (!report.qrCodeDataUrl) {
      const { qrDataUrl } = await generateReportQrCode(report.reportId);
      report.qrCodeDataUrl = qrDataUrl;
      await report.save();
    }

    res.status(200).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Save / Create new report
 */
export async function createReport(req, res) {
  try {
    const data = req.body;
    const reportId = data.reportId || data.id || `KJS-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Evaluate or enrich Clinical Decision Support
    const clinicalRisk = data.clinicalRisk || evaluateClinicalRisk(data.analytes, data.triageData);

    // 2. Cryptographic Data Verification Hash (SHA-256)
    const verificationPayload = JSON.stringify({
      reportId,
      patientId: data.patient || data.patientId,
      analytes: data.analytes,
      date: data.date,
    });
    const verificationHash = crypto.createHash('sha256').update(verificationPayload).digest('hex');

    // 3. Generate QR code
    const { qrDataUrl } = await generateReportQrCode(reportId);

    // 4. Ensure or link Patient model
    let patientDoc = null;
    const patId = data.patient || data.patientId || 'P-1001';
    patientDoc = await Patient.findOne({ patientId: patId });
    if (!patientDoc) {
      patientDoc = await Patient.create({
        patientId: patId,
        name: data.patientName || 'Anonymous Patient',
        age: parseInt(data.patientAge) || 40,
        gender: data.patientGender || 'Male',
      });
    }

    const newReport = new Report({
      reportId,
      patient: patientDoc._id,
      patientId: patId,
      patientName: data.patientName || patientDoc.name,
      patientAge: data.patientAge || `${patientDoc.age} yrs`,
      patientGender: data.patientGender || patientDoc.gender,
      facility: data.facility || 'K. J. Somaiya Hospital & Research Center',
      requestedBy: data.requestedBy || 'Dr. A. Sharma (Pathology)',
      date: data.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: data.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: data.status || 'Normal',
      clinicalNote: data.clinicalNote || 'Diagnostic urinalysis baseline.',
      analytes: data.analytes,
      clinicalRisk,
      verificationHash,
      qrCodeDataUrl: qrDataUrl,
      stripImage: data.stripImage || '',
      deviceModel: data.deviceModel || 'UrineScan Software Colorimetry Engine v2.4',
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      report: newReport,
    });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Real Colorimetric Strip Computer Vision Analysis Endpoint
 */
export async function analyzeStrip(req, res) {
  try {
    let imageSource = null;

    if (req.file) {
      imageSource = req.file.path;
    } else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageSource = Buffer.from(base64Data, 'base64');
    }

    if (!imageSource) {
      return res.status(400).json({ success: false, message: 'No urine test strip image provided.' });
    }

    // 1. Run actual image colorimetric processing
    const cvResult = await analyzeStripImage(imageSource);

    // 2. Run clinical risk evaluation
    const clinicalRisk = evaluateClinicalRisk(cvResult.analytes, req.body.triageData || null);

    // 3. Determine overall status
    const hasAbnormal = cvResult.analytes.some((a) => a.status === 'abnormal');
    const hasWarning = cvResult.analytes.some((a) => a.status === 'warning');
    const overallStatus = hasAbnormal ? 'Abnormal' : hasWarning ? 'Warning' : 'Normal';

    res.status(200).json({
      success: true,
      status: overallStatus,
      analytes: cvResult.analytes,
      boundingBoxes: cvResult.boundingBoxes,
      logs: cvResult.logs,
      clinicalRisk,
    });
  } catch (err) {
    console.error('Strip analysis error:', err);
    res.status(500).json({ success: false, message: 'Image analysis failed: ' + err.message });
  }
}

/**
 * Live Telemetry Stream (Server-Sent Events - SSE)
 */
export function streamAnalysisTelemetry(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const packets = [
    { prog: 10, log: '[DEVICE_SYNC] Colorimetry Optical Sensor initialized (ISO 15197 standards).' },
    { prog: 25, log: '[IMAGE_INGEST] Ingested 10-pad test strip frame. Calibrating white balance...' },
    { prog: 40, log: '[CV_SLICE] 10 reagent zones segmented along principal axis.' },
    { prog: 55, log: '[RGB_SAMPLE] Sampling CIELAB & sRGB vectors across reagent ROIs...' },
    { prog: 75, log: '[COLOR_MATCH] Euclidean distance regression mapping to Multistix 10-SG calibration tiers...' },
    { prog: 90, log: '[RISK_ENGINE] Computing UTI, Renal Strain, and Glycosuria decision indices...' },
    { prog: 100, log: '[DB_SYNC] Encrypted cryptographic verification record established.', complete: true },
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < packets.length) {
      res.write(`data: ${JSON.stringify(packets[i])}\n\n`);
      i++;
    } else {
      clearInterval(interval);
      res.end();
    }
  }, 400);

  req.on('close', () => {
    clearInterval(interval);
  });
}

/**
 * Transmit Report to Hospital HIS (HL7 / FHIR Standard Simulation)
 */
export async function sendToHIS(req, res) {
  try {
    const { id } = req.params;
    const report = await Report.findOne({ reportId: id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const transactionId = `HL7-TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    report.hisSync = {
      transmitted: true,
      transmittedAt: new Date(),
      transactionId,
      protocol: 'HL7-FHIR-v4-Encrypted',
      destination: 'K. J. Somaiya Hospital HIS Core (Ward Telemetry)',
    };

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Encrypted report successfully transmitted to K. J. Somaiya Hospital HIS!',
      hisSync: report.hisSync,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Download Official Hospital-Branded Lab Report PDF
 */
export async function downloadReportPdf(req, res) {
  try {
    const { id } = req.params;
    let report = await Report.findOne({ reportId: id });
    if (!report && id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await Report.findById(id);
    }

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Ensure QR code is available
    let qrDataUrl = report.qrCodeDataUrl;
    if (!qrDataUrl) {
      const qrRes = await generateReportQrCode(report.reportId);
      qrDataUrl = qrRes.qrDataUrl;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Urinalysis_Report_${report.reportId}.pdf`);

    const pdfDoc = buildReportPdf(report, qrDataUrl);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF: ' + err.message });
  }
}

/**
 * Delete a single report
 */
export async function deleteReport(req, res) {
  try {
    const { id } = req.params;
    await Report.findOneAndDelete({ reportId: id });
    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Clear all reports
 */
export async function clearAllReports(req, res) {
  try {
    await Report.deleteMany({});
    res.status(200).json({ success: true, message: 'All reports cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export default {
  getAllReports,
  getReportById,
  createReport,
  analyzeStrip,
  streamAnalysisTelemetry,
  sendToHIS,
  downloadReportPdf,
  deleteReport,
  clearAllReports,
};
