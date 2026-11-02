import mongoose from 'mongoose';

const analyteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    exact: { type: String, required: true },
    unit: { type: String, default: '' },
    ref: { type: String, default: '' },
    status: {
      type: String,
      enum: ['normal', 'warning', 'abnormal'],
      default: 'normal',
    },
    hexColor: { type: String, default: '#84cc16' },
    padIndex: { type: Number, default: 0 },
  },
  { _id: false }
);

const clinicalRiskSchema = new mongoose.Schema(
  {
    utiScore: { type: Number, min: 0, max: 100, default: 0 },
    utiRiskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
    renalRiskScore: { type: Number, min: 0, max: 100, default: 0 },
    renalRiskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
    dkaScore: { type: Number, min: 0, max: 100, default: 0 },
    dkaRiskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
    findings: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
  },
  { _id: false }
);

const hisSyncSchema = new mongoose.Schema(
  {
    transmitted: { type: Boolean, default: false },
    transmittedAt: { type: Date, default: null },
    transactionId: { type: String, default: '' },
    protocol: { type: String, default: 'HL7-FHIR-v4-Encrypted' },
    destination: { type: String, default: 'K. J. Somaiya Hospital HIS Core' },
  },
  { _id: false }
);

/**
 * Report Schema
 * Urinalysis test strip quantification results and colorimetry output.
 * patientId is the foreign key referencing the Patient collection.
 * Patient demographics (name, age, gender) are stored exclusively in the Patient collection.
 */
const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
      ref: 'Patient',
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      default: '12:00 PM',
    },
    status: {
      type: String,
      enum: ['Normal', 'Warning', 'Abnormal'],
      default: 'Normal',
      index: true,
    },
    clinicalNote: {
      type: String,
      default: 'Routine baseline screening within physiological bounds.',
    },
    analytes: {
      type: [analyteSchema],
      required: true,
      validate: [(val) => val.length === 10, 'Report must contain exactly 10 analyte pads'],
    },
    clinicalRisk: {
      type: clinicalRiskSchema,
      default: () => ({}),
    },
    verificationHash: {
      type: String,
      default: '',
    },
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    hisSync: {
      type: hisSyncSchema,
      default: () => ({}),
    },
    stripImage: {
      type: String,
      default: '',
    },
    facility: {
      type: String,
      default: 'K. J. Somaiya Hospital & Research Center',
    },
    requestedBy: {
      type: String,
      default: 'Dr. A. Sharma (Pathology)',
    },
    deviceModel: {
      type: String,
      default: 'UrineScan Software Colorimetry Engine v2.4',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to alias id with reportId
reportSchema.virtual('id').get(function () {
  return this.reportId;
});

// Virtual to populate patient details from Patient model using foreign key patientId
reportSchema.virtual('patientDetails', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: 'patientId',
  justOne: true,
});

reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

export default mongoose.model('Report', reportSchema);
