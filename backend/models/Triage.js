import mongoose from 'mongoose';

/**
 * Triage Schema
 * Stores vitals (temperature), symptoms, symptom duration, clinical notes, and NLP triage predictions.
 * patientId is the foreign key referencing the Patient collection.
 * Patient demographics (name, age, gender, phone, bloodGroup) are stored exclusively in the Patient collection.
 */
const triageSchema = new mongoose.Schema(
  {
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
    // Vitals
    temp: {
      type: String,
      default: '98.6',
    },
    // Symptoms & Duration
    duration: {
      type: String,
      default: '1-3 days',
    },
    symptoms: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      required: true,
      trim: true,
    },
    // Clinical NLP / Heuristic Prediction
    predictedCondition: {
      type: String,
      default: 'Normal Routine Baseline',
    },
    suggestedProfile: {
      type: String,
      enum: ['normal', 'uti', 'diabetes', 'renal'],
      default: 'normal',
    },
    urgency: {
      type: String,
      default: 'Low Urgency / Routine',
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    confidence: {
      type: String,
      default: '96.4%',
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to populate patient details from Patient model using foreign key patientId
triageSchema.virtual('patientDetails', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: 'patientId',
  justOne: true,
});

triageSchema.set('toJSON', { virtuals: true });
triageSchema.set('toObject', { virtuals: true });

export default mongoose.model('Triage', triageSchema);
