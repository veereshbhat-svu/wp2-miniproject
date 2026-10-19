import Patient from '../models/Patient.js';
import Report from '../models/Report.js';

/**
 * List all registered patients with their report counts
 */
export async function getAllPatients(req, res) {
  try {
    const patients = await Patient.find().sort({ name: 1 });
    const reports = await Report.find({}, 'patientId date status');

    const result = patients.map((pat) => {
      const patReports = reports.filter(
        (r) => r.patientId?.toLowerCase() === pat.patientId.toLowerCase()
      );
      return {
        ...pat.toObject(),
        reportCount: patReports.length,
        latestStatus: patReports[0]?.status || 'Normal',
        latestDate: patReports[0]?.date || 'N/A',
      };
    });

    res.status(200).json({ success: true, patients: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get single patient details, complete history, and time-series trend data
 */
export async function getPatientHistory(req, res) {
  try {
    const { id } = req.params;

    let patient = await Patient.findOne({ patientId: new RegExp(`^${id}$`, 'i') });
    const reports = await Report.find({ patientId: new RegExp(`^${id}$`, 'i') }).sort({ createdAt: -1 });

    if (!patient && reports.length > 0) {
      patient = {
        patientId: reports[0].patientId,
        name: reports[0].patientName,
        age: parseInt(reports[0].patientAge) || 42,
        gender: reports[0].patientGender || 'Male',
      };
    }

    if (!patient && reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Format historical trend data for Recharts (chronological)
    const trendData = [...reports].reverse().map((r) => {
      const glu = r.analytes?.find((a) => a.name === 'Glucose')?.exact;
      const pro = r.analytes?.find((a) => a.name === 'Protein')?.exact;
      const ph = r.analytes?.find((a) => a.name === 'pH Level' || a.name === 'pH')?.exact;
      const leu = r.analytes?.find((a) => a.name === 'Leucocytes')?.exact;

      return {
        date: `${r.date} ${r.time || ''}`,
        glucose: typeof glu === 'string' ? parseFloat(glu) || 0 : glu || 0,
        protein: typeof pro === 'string' ? parseFloat(pro) || 0 : pro || 0,
        ph: typeof ph === 'string' ? parseFloat(ph) || 0 : ph || 0,
        leucocytes: typeof leu === 'string' ? parseFloat(leu) || 0 : leu || 0,
        testId: r.reportId || r.id,
        status: r.status,
      };
    });

    res.status(200).json({
      success: true,
      patient,
      reports,
      trendData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Create or update a patient
 */
export async function createOrUpdatePatient(req, res) {
  try {
    const { patientId, name, age, gender, phone, bloodGroup, medicalHistory } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { patientId },
      { name, age, gender, phone, bloodGroup, medicalHistory },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, patient });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export default {
  getAllPatients,
  getPatientHistory,
  createOrUpdatePatient,
};
