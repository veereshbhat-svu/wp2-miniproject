import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Patient from './models/Patient.js';
import Report from './models/Report.js';
import { evaluateClinicalRisk } from './utils/clinicalRuleEngine.js';
import { generateReportQrCode } from './utils/qrGenerator.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedInitialData() {
  try {
    const reportCount = await Report.countDocuments();
    if (reportCount > 0) {
      console.log(`[DATABASE] MongoDB already contains ${reportCount} urinalysis records. Skipping auto-seed.`);
      return;
    }

    const dataPath = path.resolve(__dirname, '../frontend/public/data/diagnostic_data.json');
    if (!fs.existsSync(dataPath)) {
      console.warn(`[SEED] diagnostic_data.json not found at ${dataPath}.`);
      return;
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const diagnosticData = JSON.parse(raw);
    const initialReports = diagnosticData.initialReports || [];

    console.log(`[SEED] Seeding ${initialReports.length} authentic hospital reports into MongoDB...`);

    for (const r of initialReports) {
      const patId = r.patient || r.patientId || 'P-1001';
      let patientDoc = await Patient.findOne({ patientId: patId });

      if (!patientDoc) {
        patientDoc = await Patient.create({
          patientId: patId,
          name: r.patientName,
          age: parseInt(r.patientAge) || 42,
          gender: r.patientGender || 'Male',
        });
      }

      const clinicalRisk = evaluateClinicalRisk(r.analytes);

      const verificationPayload = JSON.stringify({
        reportId: r.id,
        patientId: patId,
        analytes: r.analytes,
        date: r.date,
      });
      const verificationHash = crypto.createHash('sha256').update(verificationPayload).digest('hex');

      const { qrDataUrl } = await generateReportQrCode(r.id);

      await Report.create({
        reportId: r.id,
        patient: patientDoc._id,
        patientId: patId,
        patientName: r.patientName,
        patientAge: r.patientAge,
        patientGender: r.patientGender,
        facility: r.facility || 'K. J. Somaiya Hospital & Research Center',
        requestedBy: r.requestedBy || 'Dr. A. Sharma (Pathology)',
        date: r.date,
        time: r.time,
        status: r.status,
        clinicalNote: r.clinicalNote,
        analytes: r.analytes,
        clinicalRisk,
        verificationHash,
        qrCodeDataUrl: qrDataUrl,
        deviceModel: r.deviceModel || 'UrineScan Software Colorimetry Engine v2.4',
      });
    }

    console.log('[SEED] Initial database records seeded successfully with verified QR codes!');
  } catch (err) {
    console.error('[SEED_ERROR] Failed to seed initial data:', err);
  }
}

export default seedInitialData;
