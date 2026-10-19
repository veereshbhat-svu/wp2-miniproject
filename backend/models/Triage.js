import mongoose from 'mongoose';

const triageSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      default: 'Male',
    },
    phone: {
      type: String,
      default: '',
    },
    bloodGroup: {
      type: String,
      default: 'O+',
    },
    duration: {
      type: String,
      default: '1-3 days',
    },
    temp: {
      type: String,
      default: '98.6',
    },
    symptoms: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      required: true,
    },
    predictedCondition: {
      type: String,
      default: 'Normal Routine Baseline',
    },
    suggestedProfile: {
      type: String,
      enum: ['normal', 'uti', 'diabetes', 'renal'],
      default: 'normal',
    },
    riskScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Triage', triageSchema);
