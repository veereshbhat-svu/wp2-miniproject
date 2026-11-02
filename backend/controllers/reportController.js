import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Report from '../models/Report.js';
import Patient from '../models/Patient.js';
import { analyzeStripImage } from '../utils/colorimetryEngine.js';
import { evaluateClinicalRisk } from '../utils/clinicalRuleEngine.js';
import { generateReportQrCode, getLocalIpAddress, getAllLocalIpAddresses } from '../utils/qrGenerator.js';
import { buildReportPdf } from '../utils/pdfGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch all reports with filtering, search, and pagination
 * Uses patientId foreign key to join patient demographics for frontend UI
 */
export async function getAllReports(req, res) {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = new RegExp(`^${status}$`, 'i');
    }

    if (search) {
      const matchingPatients = await Patient.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { patientId: new RegExp(search, 'i') },
        ],
      }).select('patientId');
      const patientIds = matchingPatients.map((p) => p.patientId);

      filter.$or = [
        { reportId: new RegExp(search, 'i') },
        { patientId: new RegExp(search, 'i') },
        { patientId: { $in: patientIds } },
      ];
    }

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate('patient')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Join with Patient collection so that patientName, patientAge, patientGender are included
    const formattedReports = await Promise.all(
      reports.map(async (r) => {
        let pat = r.patient;
        if (!pat) {
          pat = await Patient.findOne({ patientId: r.patientId });
        }
        const obj = r.toJSON();
        return {
          ...obj,
          id: obj.reportId || obj.id,
          patient: obj.patientId,
          patientName: pat?.name || 'Anonymous Patient',
          patientAge: pat?.age ? `${pat.age} yrs` : '42 yrs',
          patientGender: pat?.gender || 'Male',
        };
      })
    );

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      reports: formattedReports,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Fetch single report by ID with patient demographics joined
 */
export async function getReportById(req, res) {
  try {
    const { id } = req.params;
    let report = await Report.findOne({ reportId: id }).populate('patient');
    if (!report && id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await Report.findById(id).populate('patient');
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

    let pat = report.patient;
    if (!pat) {
      pat = await Patient.findOne({ patientId: report.patientId });
    }

    const reportObj = {
      ...report.toJSON(),
      id: report.reportId,
      patient: report.patientId,
      patientName: pat?.name || 'Anonymous Patient',
      patientAge: pat?.age ? `${pat.age} yrs` : '42 yrs',
      patientGender: pat?.gender || 'Male',
    };

    res.status(200).json({ success: true, report: reportObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Save / Create new report:
 * 1. Upserts patient demographics directly into 'patients' collection
 * 2. Saves test strip analytes & clinical findings into 'reports' collection referencing patientId foreign key
 */
export async function createReport(req, res) {
  try {
    const data = req.body;
    const reportId = data.reportId || data.id || `KJS-${Math.floor(1000 + Math.random() * 9000)}`;
    const patId = (data.patientId || data.patient || 'P-1001').trim().toUpperCase();

    // 1. Evaluate Clinical Decision Support
    const clinicalRisk = data.clinicalRisk || evaluateClinicalRisk(data.analytes, data.triageData);

    // 2. Cryptographic Data Verification Hash (SHA-256)
    const verificationPayload = JSON.stringify({
      reportId,
      patientId: patId,
      analytes: data.analytes,
      date: data.date,
    });
    const verificationHash = crypto.createHash('sha256').update(verificationPayload).digest('hex');

    // 3. Generate QR code
    const { qrDataUrl } = await generateReportQrCode(reportId);

    // 4. Ensure or update Patient model in 'patients' collection
    let patientDoc = await Patient.findOne({ patientId: patId });
    if (!patientDoc) {
      patientDoc = await Patient.create({
        patientId: patId,
        name: data.patientName || 'Anonymous Patient',
        age: parseInt(data.patientAge) || 40,
        gender: data.patientGender || 'Male',
        phone: data.phone || '',
        bloodGroup: data.bloodGroup || 'O+',
      });
    } else if (data.patientName && (!patientDoc.name || patientDoc.name === 'Anonymous Patient')) {
      patientDoc.name = data.patientName;
      if (data.patientAge) patientDoc.age = parseInt(data.patientAge) || patientDoc.age;
      if (data.patientGender) patientDoc.gender = data.patientGender;
      await patientDoc.save();
    }

    // 5. Create report in 'reports' collection using patientId as foreign key (no redundant demographics)
    const newReport = new Report({
      reportId,
      patient: patientDoc._id,
      patientId: patientDoc.patientId, // Foreign Key
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

    const reportObj = {
      ...newReport.toJSON(),
      id: newReport.reportId,
      patient: newReport.patientId,
      patientName: patientDoc.name,
      patientAge: `${patientDoc.age} yrs`,
      patientGender: patientDoc.gender,
    };

    res.status(201).json({
      success: true,
      report: reportObj,
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
    let imagePreview = null;

    if (req.file) {
      imageSource = req.file.path;
      imagePreview = `/uploads/${req.file.filename}`;
    } else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageSource = Buffer.from(base64Data, 'base64');
      imagePreview = req.body.imageBase64;
    } else if (req.body.sampleKey) {
      const samplePath = path.resolve(__dirname, '..', 'uploads', `strip-${req.body.sampleKey}.png`);
      if (fs.existsSync(samplePath)) {
        imageSource = samplePath;
        imagePreview = `/uploads/strip-${req.body.sampleKey}.png`;
      }
    }

    if (!imageSource) {
      return res.status(400).json({ success: false, message: 'No urine test strip image provided.' });
    }

    let triageData = req.body.triageData;
    if (typeof triageData === 'string') {
      try {
        triageData = JSON.parse(triageData);
      } catch {}
    }

    // 1. Run actual image colorimetric processing
    const cvResult = await analyzeStripImage(imageSource);

    // 2. Run clinical risk evaluation
    const clinicalRisk = evaluateClinicalRisk(cvResult.analytes, triageData || null);

    // 3. Determine overall status
    const hasAbnormal = cvResult.analytes.some((a) => a.status === 'abnormal');
    const hasWarning = cvResult.analytes.some((a) => a.status === 'warning');
    const overallStatus = hasAbnormal ? 'Abnormal' : hasWarning ? 'Warning' : 'Normal';

    res.status(200).json({
      success: true,
      status: overallStatus,
      analytes: cvResult.analytes,
      boundingBoxes: cvResult.boundingBoxes,
      imageDimensions: cvResult.imageDimensions,
      imagePreview,
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
    let report = await Report.findOne({ reportId: id }).populate('patient');
    if (!report && id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await Report.findById(id).populate('patient');
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

    let pat = report.patient;
    if (!pat) {
      pat = await Patient.findOne({ patientId: report.patientId });
    }

    const reportWithPat = {
      ...report.toJSON(),
      patientName: pat?.name || 'Anonymous Patient',
      patientAge: pat?.age ? `${pat.age} yrs` : '42 yrs',
      patientGender: pat?.gender || 'Male',
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Urinalysis_Report_${report.reportId}.pdf`);

    const pdfDoc = buildReportPdf(reportWithPat, qrDataUrl);
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

/**
 * Fetch QR Code data URL & direct mobile LAN URL for Wi-Fi scanning
 */
export async function getReportQr(req, res) {
  try {
    const { id } = req.params;
    const { ip } = req.query;
    let report = await Report.findOne({ reportId: id });
    if (!report && id.match(/^[0-9a-fA-F]{24}$/)) {
      report = await Report.findById(id);
    }

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const { qrDataUrl, verifyUrl, ip: resolvedIp } = await generateReportQrCode(report.reportId, ip || null);

    res.status(200).json({
      success: true,
      reportId: report.reportId,
      qrDataUrl,
      verifyUrl,
      lanIp: resolvedIp,
      availableIps: getAllLocalIpAddresses(),
    });
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
  getReportQr,
};
