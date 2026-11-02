import Patient from '../models/Patient.js';
import Report from '../models/Report.js';
import Triage from '../models/Triage.js';

/**
 * List all registered patients with their report counts
 */
export async function getAllPatients(req, res) {
  try {
    const patients = await Patient.find().sort({ name: 1 });
    const reports = await Report.find({}, 'patientId date status');

    const result = patients.map((pat) => {
      const patReports = reports.filter(
        (r) => r.patientId?.toUpperCase() === pat.patientId.toUpperCase()
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
 * Get single patient details, complete history, triage intakes, and time-series trend data
 * Relational join using patientId foreign key across patients, reports, and triages
 */
export async function getPatientHistory(req, res) {
  try {
    const { id } = req.params;
    const patId = id.trim().toUpperCase();

    let patient = await Patient.findOne({ patientId: new RegExp(`^${patId}$`, 'i') });
    const reports = await Report.find({ patientId: new RegExp(`^${patId}$`, 'i') }).sort({ createdAt: -1 });
    const triages = await Triage.find({ patientId: new RegExp(`^${patId}$`, 'i') }).sort({ createdAt: -1 });

    if (!patient && reports.length === 0 && triages.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (!patient) {
      patient = {
        patientId: patId,
        name: 'Anonymous Patient',
        age: 40,
        gender: 'Male',
        phone: '',
        bloodGroup: 'O+',
      };
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

    const formattedReports = reports.map((r) => ({
      ...r.toJSON(),
      id: r.reportId,
      patient: r.patientId,
      patientName: patient.name,
      patientAge: `${patient.age} yrs`,
      patientGender: patient.gender,
    }));

    res.status(200).json({
      success: true,
      patient,
      reports: formattedReports,
      triages,
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
    const patId = patientId.trim().toUpperCase();

    const patient = await Patient.findOneAndUpdate(
      { patientId: patId },
      { patientId: patId, name, age, gender, phone, bloodGroup, medicalHistory },
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
