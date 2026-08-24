import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Scan,
  ArrowRight,
  User,
  Activity,
  FileText,
  Thermometer,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../context/ReportContext';

const symptomPresets = [
  'Dysuria / Burning Micturition',
  'Frequent Urgency',
  'Cloudy / Turbid Urine',
  'Fever & Chills',
  'Flank / Lower Back Pain',
  'Excessive Thirst & Polyuria',
  'Microscopic / Gross Hematuria',
  'Pelvic Discomfort',
];

const sampleCases = [
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

const Triage = () => {
  const navigate = useNavigate();
  const { setActiveTriage } = useReports();

  const [formData, setFormData] = useState({
    name: '',
    patientId: '',
    age: '',
    gender: 'Male',
    phone: '',
    bloodGroup: 'O+',
    duration: '1-3 days',
    temp: '98.6',
    symptoms: [],
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nlpResult, setNlpResult] = useState(null);

  const toggleSymptom = (s) => {
    setFormData((prev) => {
      const exists = prev.symptoms.includes(s);
      return {
        ...prev,
        symptoms: exists ? prev.symptoms.filter((x) => x !== s) : [...prev.symptoms, s],
      };
    });
  };

  const loadPreset = (preset) => {
    setFormData({
      name: preset.name,
      patientId: preset.patientId,
      age: preset.age,
      gender: preset.gender,
      phone: preset.phone,
      bloodGroup: preset.bloodGroup,
      duration: preset.duration,
      temp: preset.temp,
      symptoms: preset.symptoms,
      notes: preset.notes,
    });
    setErrors({});
    setNlpResult(null);
  };

  const validate = () => {
    const errs = {};

    // Name Validation
    if (!formData.name.trim()) {
      errs.name = 'Patient full name is required.';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'Name must be at least 3 characters long.';
    } else if (!/^[a-zA-Z\s.]+$/.test(formData.name.trim())) {
      errs.name = 'Name should only contain alphabetic characters.';
    }

    // Patient ID Validation
    if (!formData.patientId.trim()) {
      errs.patientId = 'Patient ID is required (e.g. P-8219).';
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.patientId.trim())) {
      errs.patientId = 'Patient ID must only contain letters, numbers, or hyphens.';
    }

    // Age Validation
    if (!formData.age || isNaN(formData.age)) {
      errs.age = 'Age is required.';
    } else {
      const numAge = Number(formData.age);
      if (numAge < 1 || numAge > 120) {
        errs.age = 'Please enter a valid clinical age between 1 and 120.';
      }
    }

    // Phone Validation (Optional check or 10-digit format)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[\s+-]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit contact number.';
    }

    // Clinical Notes Validation
    if (!formData.notes.trim()) {
      errs.notes = 'Clinical presentation and symptom notes are mandatory.';
    } else if (formData.notes.trim().length < 15) {
      errs.notes = `Clinical notes require at least 15 characters for NLP text analytics (currently: ${formData.notes.trim().length}).`;
    }

    return errs;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validationErrors = validate();
    setErrors(validationErrors);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      patientId: true,
      age: true,
      gender: true,
      phone: true,
      notes: true,
    });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setNlpResult(null);

    // Simulate Asynchronous AI / NLP Text Analytics Pipeline
    setTimeout(() => {
      setIsSubmitting(false);
      const text = `${formData.notes} ${formData.symptoms.join(' ')}`.toLowerCase();

      const isUTI =
        text.includes('burn') ||
        text.includes('dysuria') ||
        text.includes('cloudy') ||
        text.includes('fever') ||
        text.includes('uti') ||
        text.includes('urgency');

      const isDiabetes =
        text.includes('thirst') ||
        text.includes('diabet') ||
        text.includes('glucose') ||
        text.includes('sugar') ||
        text.includes('nocturia') ||
        text.includes('polyuria');

      const isRenal =
        text.includes('flank') ||
        text.includes('protein') ||
        text.includes('kidney') ||
        text.includes('edema') ||
        text.includes('blood');

      let condition = 'Normal Routine Baseline';
      let targetProfile = 'normal';
      let urgency = 'Low Urgency / Routine';
      let riskLevel = 'Low';
      let keywords = ['asymptomatic', 'routine check', 'baseline established'];
      let recommendation = 'Standard baseline 10-pad urinalysis screening protocol.';

      if (isUTI) {
        condition = 'Suspected Acute Urinary Tract Infection (UTI)';
        targetProfile = 'uti';
        urgency = 'High Urgency / Acute Infection';
        riskLevel = 'High';
        keywords = ['dysuria', 'pyuria', 'bacteriuria', 'fever', 'leukocytes'];
        recommendation = 'Immediate 10-pad dipstick test for Nitrite, Leucocytes, and Hematuria confirmation.';
      } else if (isDiabetes) {
        condition = 'Suspected Diabetic Glycosuria / Metabolic Disturbance';
        targetProfile = 'diabetes';
        urgency = 'Moderate Urgency / Glycemic Review';
        riskLevel = 'Moderate';
        keywords = ['polyuria', 'polydipsia', 'hyperglycemia', 'ketonuria'];
        recommendation = '10-pad dipstick test for continuous Glucose & Ketones quantification.';
      } else if (isRenal) {
        condition = 'Suspected Proteinuria / Glomerular Stress';
        targetProfile = 'renal';
        urgency = 'Elevated Risk / Nephrology Triage';
        riskLevel = 'High';
        keywords = ['proteinuria', 'hematuria', 'flank discomfort'];
        recommendation = '10-pad dipstick test for Protein & Specific Gravity evaluation.';
      }

      const triageRecord = {
        name: formData.name.trim(),
        patientId: formData.patientId.trim().toUpperCase(),
        age: formData.age,
        gender: formData.gender,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        duration: formData.duration,
        temp: formData.temp,
        symptoms: formData.symptoms,
        notes: formData.notes.trim(),
        condition,
        targetProfile,
        urgency,
        riskLevel,
        confidence: '96.4%',
        keywords,
        recommendation,
        triageDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        triageTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      // Store in global context as the active triaged patient
      setActiveTriage(triageRecord);
      setNlpResult(triageRecord);
    }, 1400);
  };

  const handleProceedToAnalysis = () => {
    if (nlpResult) {
      navigate('/analyze');
    }
  };

  const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' };
  const inputStyle = (hasErr) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${hasErr ? '#dc2626' : '#d1d5db'}`,
    background: hasErr ? '#fff5f5' : '#fff',
    fontSize: '14px',
    marginTop: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  });
  const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#374151' };
  const errorStyle = { color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 };

  return (
    <div className="page-enter" style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
            Clinical Intake & NLP Triage Assessment
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Mandatory patient intake stage: Symptoms logging, vitals capture, and AI NLP clinical risk quantification.
          </p>
        </div>

        {/* Quick Presets for easy demonstration */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sampleCases.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => loadPreset(c)}
              style={{
                background: '#eef2ff',
                color: '#4338ca',
                border: '1px solid #c7d2fe',
                borderRadius: '7px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Zap size={13} /> {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: '32px' }}>
        <form onSubmit={handleSubmit} noValidate>
          {/* SECTION 1: PATIENT DEMOGRAPHICS */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <User size={18} color="#4338ca" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                1. Patient Identification & Demographics
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Patient Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => handleBlur('name')}
                  style={inputStyle(touched.name && errors.name)}
                />
                {touched.name && errors.name && (
                  <div style={errorStyle}><AlertCircle size={13} /> {errors.name}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Patient ID (Hospital MRN) *</label>
                <input
                  type="text"
                  placeholder="e.g. P-8219"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  onBlur={() => handleBlur('patientId')}
                  style={inputStyle(touched.patientId && errors.patientId)}
                />
                {touched.patientId && errors.patientId && (
                  <div style={errorStyle}><AlertCircle size={13} /> {errors.patientId}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Age (Years) *</label>
                <input
                  type="number"
                  placeholder="42"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  onBlur={() => handleBlur('age')}
                  style={inputStyle(touched.age && errors.age)}
                />
                {touched.age && errors.age && (
                  <div style={errorStyle}><AlertCircle size={13} /> {errors.age}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{ ...inputStyle(false), background: '#fff', cursor: 'pointer' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Contact / Phone</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onBlur={() => handleBlur('phone')}
                  style={inputStyle(touched.phone && errors.phone)}
                />
                {touched.phone && errors.phone && (
                  <div style={errorStyle}><AlertCircle size={13} /> {errors.phone}</div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  style={{ ...inputStyle(false), background: '#fff', cursor: 'pointer' }}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: CLINICAL PRESENTATION & SYMPTOMS */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <Activity size={18} color="#4338ca" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                2. Clinical Presentation & Vitals
              </h3>
            </div>

            {/* Symptoms Tag Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Primary Symptoms (Click to Select)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {symptomPresets.map((symp) => {
                  const isChecked = formData.symptoms.includes(symp);
                  return (
                    <button
                      key={symp}
                      type="button"
                      onClick={() => toggleSymptom(symp)}
                      style={{
                        background: isChecked ? '#4338ca' : '#f8fafc',
                        color: isChecked ? '#fff' : '#334155',
                        border: `1px solid ${isChecked ? '#4338ca' : '#cbd5e1'}`,
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isChecked ? '✓ ' : '+ '} {symp}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Symptom Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  style={{ ...inputStyle(false), background: '#fff', cursor: 'pointer' }}
                >
                  <option value="< 24 hours">&lt; 24 Hours</option>
                  <option value="1-3 days">1 - 3 Days</option>
                  <option value="4-7 days">4 - 7 Days</option>
                  <option value="> 1 week">&gt; 1 Week</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Body Temperature (°F)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={formData.temp}
                    onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                    style={inputStyle(false)}
                  />
                  <Thermometer size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '16px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: CLINICAL NOTES FOR NLP */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#4338ca" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  3. Clinical Presentation Notes (NLP Engine) *
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: formData.notes.length < 15 ? '#dc2626' : '#059669', fontWeight: 600 }}>
                {formData.notes.length} characters (Min 15 required)
              </span>
            </div>

            <textarea
              rows={4}
              placeholder="Describe patient complaints, onset of symptoms, hydration state, or previous medical history for NLP sentiment and entity extraction..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onBlur={() => handleBlur('notes')}
              style={{
                ...inputStyle(touched.notes && errors.notes),
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
            {touched.notes && errors.notes && (
              <div style={errorStyle}><AlertCircle size={13} /> {errors.notes}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: '#4338ca',
              color: '#fff',
              border: 'none',
              borderRadius: '9px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              opacity: isSubmitting ? 0.75 : 1,
              boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? <BrainCircuit size={20} className="spin" /> : <Sparkles size={20} />}
            {isSubmitting ? 'Executing Natural Language Processing (NLP) Engine...' : 'Run NLP Triage Assessment & Authorize Test'}
          </button>
        </form>

        {/* NLP ASSESSMENT RESULT & UNLOCK CARD */}
        {nlpResult && (
          <div
            className="page-enter"
            style={{
              marginTop: '32px',
              padding: '24px',
              background: nlpResult.riskLevel === 'High' ? '#fef2f2' : nlpResult.riskLevel === 'Moderate' ? '#fffbeb' : '#f0fdf4',
              borderRadius: '12px',
              border: `2px solid ${nlpResult.riskLevel === 'High' ? '#f87171' : nlpResult.riskLevel === 'Moderate' ? '#fcd34d' : '#86efac'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: nlpResult.riskLevel === 'High' ? '#dc2626' : nlpResult.riskLevel === 'Moderate' ? '#b45309' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                }}
              >
                {nlpResult.riskLevel === 'High' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                NLP Triage Assessment Complete: {nlpResult.urgency}
              </h4>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4338ca', background: '#fff', padding: '3px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                Confidence: {nlpResult.confidence}
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, marginBottom: '18px' }}>
              <div><strong>Patient Triaged:</strong> {nlpResult.name} (ID: {nlpResult.patientId}, {nlpResult.age} yrs, {nlpResult.gender})</div>
              <div><strong>Clinical Indication:</strong> {nlpResult.condition}</div>
              <div><strong>Extracted Medical Entities:</strong> {nlpResult.keywords.join(', ')}</div>
              <div><strong>Recommended Protocol:</strong> {nlpResult.recommendation}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Status: <strong>Triage Completed & Authorized for Urinalysis</strong>
              </span>
              <button
                onClick={handleProceedToAnalysis}
                style={{
                  background: '#4338ca',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(67, 56, 202, 0.25)',
                }}
              >
                <Scan size={16} /> Proceed to 10-Pad Analysis for {nlpResult.name} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Triage;