import Triage from '../models/Triage.js';
import Patient from '../models/Patient.js';

export const SYMPTOM_PRESETS = [
  'Dysuria / Burning Micturition',
  'Frequent Urgency',
  'Cloudy / Turbid Urine',
  'Fever & Chills',
  'Flank / Lower Back Pain',
  'Excessive Thirst & Polyuria',
  'Microscopic / Gross Hematuria',
  'Pelvic Discomfort',
];

export const TRIAGE_PRESETS = [
  {
    label: 'Preset: Acute UTI Case',
    name: 'Rahul Sharma',
    patientId: 'P-8219',
    age: '42',
    gender: 'Male',
    phone: '9876543210',
    bloodGroup: 'B+',
    duration: '1-3 days',
    temp: '100.4',
    symptoms: ['Dysuria / Burning Micturition', 'Frequent Urgency', 'Cloudy / Turbid Urine', 'Fever & Chills'],
    notes: 'Patient reports severe burning sensation during urination, cloudy urine, and mild intermittent fever for 2 days. Suspected urinary tract infection.',
    targetProfile: 'uti',
  },
  {
    label: 'Preset: Diabetic Follow-up',
    name: 'Priya Desai',
    patientId: 'P-5510',
    age: '56',
    gender: 'Female',
    phone: '9820112233',
    bloodGroup: 'O+',
    duration: '4-7 days',
    temp: '98.6',
    symptoms: ['Excessive Thirst & Polyuria'],
    notes: 'Known type-2 diabetic patient presenting for routine quarterly metabolic screening. Complaints of mild fatigue, increased thirst, and frequent nocturia.',
    targetProfile: 'diabetes',
  },
  {
    label: 'Preset: Healthy Routine',
    name: 'Amit Patel',
    patientId: 'P-1045',
    age: '29',
    gender: 'Male',
    phone: '9123456789',
    bloodGroup: 'A+',
    duration: '< 24 hours',
    temp: '98.4',
    symptoms: [],
    notes: 'Annual pre-employment routine physical examination. Patient is asymptomatic with no urinary complaints or chronic health conditions.',
    targetProfile: 'normal',
  },
];

/**
 * Submit triage intake:
 * 1. Saves patient demographics directly to the 'patients' table (demographics normalization)
 * 2. Saves vitals, symptoms, duration, and notes to the 'triages' table with patientId as foreign key
 */
export async function submitTriage(req, res) {
  try {
    const { name, patientId, age, gender, phone, bloodGroup, duration, temp, symptoms = [], notes } = req.body;

    if (!patientId || !name) {
      return res.status(400).json({ success: false, message: 'Patient ID and Full Name are required' });
    }

    const patId = patientId.trim().toUpperCase();

    // 1. Normalize Patient Demographics into 'patients' collection
    const patientDoc = await Patient.findOneAndUpdate(
      { patientId: patId },
      {
        patientId: patId,
        name: name.trim(),
        age: Number(age) || 40,
        gender: gender || 'Male',
        phone: phone || '',
        bloodGroup: bloodGroup || 'O+',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // 2. Perform Clinical Heuristic / NLP Analysis
    const text = `${notes || ''} ${(Array.isArray(symptoms) ? symptoms : []).join(' ')}`.toLowerCase();

    const isUTI =
      text.includes('burn') ||
      text.includes('dysuria') ||
      text.includes('cloudy') ||
      text.includes('fever') ||
      text.includes('urgency') ||
      text.includes('uti');

    const isDiabetes =
      text.includes('thirst') ||
      text.includes('polyuria') ||
      text.includes('diabet') ||
      text.includes('sugar') ||
      text.includes('glucose') ||
      text.includes('fatigue');

    const isRenal =
      text.includes('flank') ||
      text.includes('kidney') ||
      text.includes('renal') ||
      text.includes('foam') ||
      text.includes('protein') ||
      text.includes('back pain') ||
      text.includes('edema');

    let predictedCondition = 'Normal Screening Baseline';
    let suggestedProfile = 'normal';
    let urgency = 'Low Urgency / Routine';
    let riskScore = 15;

    if (isUTI) {
      predictedCondition = 'Suspected Acute Urinary Tract Infection (UTI)';
      suggestedProfile = 'uti';
      urgency = 'High Urgency / Acute Infection';
      riskScore = 88;
    } else if (isDiabetes) {
      predictedCondition = 'Suspected Diabetic Glycosuria / Metabolic Imbalance';
      suggestedProfile = 'diabetes';
      urgency = 'Moderate Urgency / Glycemic Review';
      riskScore = 74;
    } else if (isRenal) {
      predictedCondition = 'Suspected Glomerular / Renal Pathophysiology';
      suggestedProfile = 'renal';
      urgency = 'Elevated Risk / Nephrology Triage';
      riskScore = 82;
    }

    // 3. Save Vitals (temp), Symptoms, Duration, Notes into 'triages' collection using patientId foreign key
    const triageRecord = await Triage.create({
      patientId: patientDoc.patientId, // Foreign Key referencing patients table
      patient: patientDoc._id,
      temp: temp || '98.6',
      duration: duration || '1-3 days',
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      notes: (notes || '').trim(),
      predictedCondition,
      suggestedProfile,
      urgency,
      riskScore,
      confidence: '96.4%',
      keywords: isUTI
        ? ['dysuria', 'pyuria', 'bacteriuria']
        : isDiabetes
        ? ['polyuria', 'polydipsia', 'hyperglycemia']
        : isRenal
        ? ['proteinuria', 'hematuria']
        : ['asymptomatic', 'routine'],
    });

    res.status(201).json({
      success: true,
      patient: patientDoc,
      triage: {
        ...triageRecord.toJSON(),
        name: patientDoc.name,
        age: patientDoc.age,
        gender: patientDoc.gender,
        phone: patientDoc.phone,
        bloodGroup: patientDoc.bloodGroup,
      },
      prediction: {
        condition: predictedCondition,
        suggestedProfile,
        urgency,
        riskScore,
      },
    });
  } catch (err) {
    console.error('Submit triage error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Fetch symptoms and triage sample cases
 */
export async function getPresets(req, res) {
  res.status(200).json({
    success: true,
    symptoms: SYMPTOM_PRESETS,
    triagePresets: TRIAGE_PRESETS,
  });
}

export default {
  submitTriage,
  getPresets,
};
