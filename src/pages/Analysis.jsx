import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Scan,
  CheckCircle,
  Terminal,
  AlertCircle,
  Cpu,
  RefreshCw,
  Eye,
  Check,
  ClipboardType,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../context/ReportContext';

const padDefinitions = [
  { id: 'GLU', name: 'Glucose', color: '#65a30d', sampleHex: '#84cc16' },
  { id: 'PRO', name: 'Protein', color: '#ca8a04', sampleHex: '#eab308' },
  { id: 'BIL', name: 'Bilirubin', color: '#ea580c', sampleHex: '#f97316' },
  { id: 'URO', name: 'Urobilinogen', color: '#db2777', sampleHex: '#ec4899' },
  { id: 'pH',  name: 'pH Level', color: '#d97706', sampleHex: '#f59e0b' },
  { id: 'SG',  name: 'Specific Gravity', color: '#059669', sampleHex: '#10b981' },
  { id: 'BLD', name: 'Blood / Hemoglobin', color: '#dc2626', sampleHex: '#ef4444' },
  { id: 'KET', name: 'Ketones', color: '#9333ea', sampleHex: '#a855f7' },
  { id: 'NIT', name: 'Nitrite', color: '#e11d48', sampleHex: '#f43f5e' },
  { id: 'LEU', name: 'Leucocytes', color: '#4f46e5', sampleHex: '#6366f1' },
];

const sampleProfiles = [
  {
    key: 'normal',
    name: 'Normal Screening Profile',
    desc: 'Healthy physiological baseline across all 10 analytes.',
    status: 'Normal',
    clinicalNote: 'Routine urinalysis: all parameters within normal physiological reference intervals.',
    analytes: [
      { name: 'Glucose', exact: '18.4', unit: 'mg/dL', ref: '< 30 mg/dL', status: 'normal' },
      { name: 'Protein', exact: '8.2', unit: 'mg/dL', ref: '< 15 mg/dL', status: 'normal' },
      { name: 'Bilirubin', exact: '0.12', unit: 'mg/dL', ref: 'Negative (< 0.2)', status: 'normal' },
      { name: 'Urobilinogen', exact: '0.45', unit: 'mg/dL', ref: '< 1.0 mg/dL', status: 'normal' },
      { name: 'pH', exact: '6.20', unit: 'pH', ref: '5.0 – 8.0', status: 'normal' },
      { name: 'Specific Gravity', exact: '1.018', unit: '', ref: '1.005 – 1.030', status: 'normal' },
      { name: 'Blood', exact: '0.0', unit: 'Ery/μL', ref: 'Negative (< 5)', status: 'normal' },
      { name: 'Ketones', exact: '1.2', unit: 'mg/dL', ref: 'Negative (< 5)', status: 'normal' },
      { name: 'Nitrite', exact: 'Negative', unit: '', ref: 'Negative', status: 'normal' },
      { name: 'Leucocytes', exact: '8.5', unit: 'Leu/μL', ref: 'Negative (< 25)', status: 'normal' },
    ],
  },
  {
    key: 'uti',
    name: 'Infection / UTI Profile',
    desc: 'Positive Nitrite with elevated Leucocytes and Hematuria.',
    status: 'Abnormal',
    clinicalNote: 'Suspected acute Urinary Tract Infection with pyuria, bacteriuria, and microscopic hematuria.',
    analytes: [
      { name: 'Glucose', exact: '22.1', unit: 'mg/dL', ref: '< 30 mg/dL', status: 'normal' },
      { name: 'Protein', exact: '34.8', unit: 'mg/dL', ref: '< 15 mg/dL', status: 'warning' },
      { name: 'Bilirubin', exact: '0.18', unit: 'mg/dL', ref: 'Negative (< 0.2)', status: 'normal' },
      { name: 'Urobilinogen', exact: '0.65', unit: 'mg/dL', ref: '< 1.0 mg/dL', status: 'normal' },
      { name: 'pH', exact: '7.85', unit: 'pH', ref: '5.0 – 8.0', status: 'normal' },
      { name: 'Specific Gravity', exact: '1.015', unit: '', ref: '1.005 – 1.030', status: 'normal' },
      { name: 'Blood', exact: '54.2', unit: 'Ery/μL', ref: 'Negative (< 5)', status: 'abnormal' },
      { name: 'Ketones', exact: '2.4', unit: 'mg/dL', ref: 'Negative (< 5)', status: 'normal' },
      { name: 'Nitrite', exact: 'Positive', unit: '', ref: 'Negative', status: 'abnormal' },
      { name: 'Leucocytes', exact: '128.4', unit: 'Leu/μL', ref: 'Negative (< 25)', status: 'abnormal' },
    ],
  },
  {
    key: 'diabetes',
    name: 'Diabetic / Glycosuria Profile',
    desc: 'High continuous Glucose reading and elevated Ketones.',
    status: 'Warning',
    clinicalNote: 'Marked glycosuria and moderate ketonuria detected. Glycemic and metabolic review recommended.',
    analytes: [
      { name: 'Glucose', exact: '185.4', unit: 'mg/dL', ref: '< 30 mg/dL', status: 'abnormal' },
      { name: 'Protein', exact: '14.2', unit: 'mg/dL', ref: '< 15 mg/dL', status: 'normal' },
      { name: 'Bilirubin', exact: '0.15', unit: 'mg/dL', ref: 'Negative (< 0.2)', status: 'normal' },
      { name: 'Urobilinogen', exact: '0.52', unit: 'mg/dL', ref: '< 1.0 mg/dL', status: 'normal' },
      { name: 'pH', exact: '5.60', unit: 'pH', ref: '5.0 – 8.0', status: 'normal' },
      { name: 'Specific Gravity', exact: '1.028', unit: '', ref: '1.005 – 1.030', status: 'normal' },
      { name: 'Blood', exact: '1.5', unit: 'Ery/μL', ref: 'Negative (< 5)', status: 'normal' },
      { name: 'Ketones', exact: '16.8', unit: 'mg/dL', ref: 'Negative (< 5)', status: 'warning' },
      { name: 'Nitrite', exact: 'Negative', unit: '', ref: 'Negative', status: 'normal' },
      { name: 'Leucocytes', exact: '12.0', unit: 'Leu/μL', ref: 'Negative (< 25)', status: 'normal' },
    ],
  },
  {
    key: 'renal',
    name: 'Renal / Proteinuria Profile',
    desc: 'Elevated Protein concentration with high Specific Gravity.',
    status: 'Abnormal',
    clinicalNote: 'Significant proteinuria and microhematuria. Renal function panel advised.',
    analytes: [
      { name: 'Glucose', exact: '24.0', unit: 'mg/dL', ref: '< 30 mg/dL', status: 'normal' },
      { name: 'Protein', exact: '88.5', unit: 'mg/dL', ref: '< 15 mg/dL', status: 'abnormal' },
      { name: 'Bilirubin', exact: '0.10', unit: 'mg/dL', ref: 'Negative (< 0.2)', status: 'normal' },
      { name: 'Urobilinogen', exact: '0.40', unit: 'mg/dL', ref: '< 1.0 mg/dL', status: 'normal' },
      { name: 'pH', exact: '6.10', unit: 'pH', ref: '5.0 – 8.0', status: 'normal' },
      { name: 'Specific Gravity', exact: '1.032', unit: '', ref: '1.005 – 1.030', status: 'warning' },
      { name: 'Blood', exact: '28.4', unit: 'Ery/μL', ref: 'Negative (< 5)', status: 'abnormal' },
      { name: 'Ketones', exact: '1.8', unit: 'mg/dL', ref: 'Negative (< 5)', status: 'normal' },
      { name: 'Nitrite', exact: 'Negative', unit: '', ref: 'Negative', status: 'normal' },
      { name: 'Leucocytes', exact: '16.0', unit: 'Leu/μL', ref: 'Negative (< 25)', status: 'normal' },
    ],
  },
];

const steps = ['Patient & Strip Setup', 'CV & ML Pipeline', 'Report Generation'];

const Analysis = () => {
  const navigate = useNavigate();
  const { addReport, activeTriage, setActiveTriage } = useReports();

  const [step, setStep] = useState('upload'); // 'upload' | 'scanning' | 'complete'
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [selectedProfileKey, setSelectedProfileKey] = useState('uti');
  const [imageUploaded, setImageUploaded] = useState(true);
  const [operatorConfirmed, setOperatorConfirmed] = useState(true);
  const [errors, setErrors] = useState({});

  const [logs, setLogs] = useState([]);
  const [activePad, setActivePad] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [createdReport, setCreatedReport] = useState(null);

  const logsEndRef = useRef(null);

  const currentStep = step === 'upload' ? 0 : step === 'complete' ? 2 : 1;

  // Sync state with activeTriage whenever available
  useEffect(() => {
    if (activeTriage) {
      setPatientName(activeTriage.name || '');
      setPatientId(activeTriage.patientId || '');
      setPatientAge(activeTriage.age || '42');
      setPatientGender(activeTriage.gender || 'Male');
      if (activeTriage.targetProfile) {
        setSelectedProfileKey(activeTriage.targetProfile);
      }
    }
  }, [activeTriage]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const quickFillTriage = () => {
    const mockTriage = {
      name: 'Rahul Sharma',
      patientId: 'P-8219',
      age: '42',
      gender: 'Male',
      targetProfile: 'uti',
      condition: 'Suspected Acute UTI (Quick Demo)',
      notes: 'Quick demo triage authorized.',
    };
    setActiveTriage(mockTriage);
    setPatientName(mockTriage.name);
    setPatientId(mockTriage.patientId);
    setPatientAge(mockTriage.age);
    setPatientGender(mockTriage.gender);
    setSelectedProfileKey('uti');
  };

  const validateAnalysisForm = () => {
    const errs = {};
    if (!patientName.trim()) errs.patientName = 'Patient Full Name is required.';
    if (!patientId.trim()) errs.patientId = 'Patient ID is required.';
    if (!imageUploaded) errs.image = 'Urine test strip image must be confirmed.';
    if (!operatorConfirmed) errs.operator = 'Technician must confirm strip alignment.';
    return errs;
  };

  const handleStartScan = () => {
    const validationErrors = validateAnalysisForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setStep('scanning');
    setLogs([]);
    setActivePad(-1);
    setProgress(0);

    const activeProfile = sampleProfiles.find((p) => p.key === selectedProfileKey) || sampleProfiles[0];
    const generatedId = `KJS-${Math.floor(1000 + Math.random() * 9000)}`;

    const sequence = [
      { time: 400, log: '[SOFTWARE_ENGINE] Initializing browser-based Computer Vision Colorimetry Engine...', prog: 10 },
      { time: 900, log: '[IMAGE_INGEST] Urine test strip image loaded (Resolution: 1920x1080). Auto-cropping strip geometry...', prog: 20 },
      { time: 1400, log: '[OPENCV_FILTER] Performing Gaussian filtering, white-point normalization & horizontal alignment...', prog: 30 },
    ];

    padDefinitions.forEach((pad, idx) => {
      sequence.push({
        time: 1900 + idx * 350,
        log: `[CV_SEGMENT] Pad ${idx + 1}/10 (${pad.name}) isolated -> Extracted CIELAB/RGB colorimetric vector: [${Math.floor(
          Math.random() * 150 + 50
        )}, ${Math.floor(Math.random() * 150 + 50)}, ${Math.floor(Math.random() * 150 + 50)}]`,
        padIndex: idx,
        prog: 30 + Math.round(((idx + 1) / 10) * 45),
      });
    });

    sequence.push({
      time: 5600,
      log: '[ML_REGRESSION] Mapping extracted 30-D RGB color vectors to continuous numerical analyte concentrations...',
      prog: 85,
    });
    sequence.push({
      time: 6300,
      log: '[AI_QUANTIFY] Continuous analyte concentrations calculated for all 10 diagnostic pads.',
      prog: 95,
    });
    sequence.push({
      time: 7000,
      log: `[DATABASE] Urinalysis record ${generatedId} generated for ${patientName.trim()} (${patientId.trim().toUpperCase()}).`,
      prog: 100,
      complete: true,
    });

    const timeouts = sequence.map((item) => {
      return setTimeout(() => {
        setLogs((prev) => [...prev, item.log]);
        if (item.prog !== undefined) setProgress(item.prog);
        if (item.padIndex !== undefined) setActivePad(item.padIndex);

        if (item.complete) {
          const newReportObj = {
            id: generatedId,
            patientName: patientName.trim(),
            patient: patientId.trim().toUpperCase(),
            patientAge: patientAge ? `${patientAge} yrs` : '42 yrs',
            patientGender: patientGender || 'Male',
            facility: 'K. J. Somaiya Hospital & Research Center',
            requestedBy: 'Dr. A. Sharma (Pathology)',
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            status: activeProfile.status,
            clinicalNote: activeTriage?.condition ? `${activeTriage.condition}: ${activeProfile.clinicalNote}` : activeProfile.clinicalNote,
            analytes: activeProfile.analytes,
            deviceModel: 'UrineScan Software Colorimetry Engine v2.4',
          };

          addReport(newReportObj);
          setCreatedReport(newReportObj);
          setTimeout(() => setStep('complete'), 800);
        }
      }, item.time);
    });

    return () => timeouts.forEach(clearTimeout);
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
  });
  const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#374151' };
  const errorStyle = { color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 };

  // GATE: Check if Triage is completed first
  if (!activeTriage && step === 'upload') {
    return (
      <div className="page-enter" style={{ maxWidth: '680px', margin: '40px auto' }}>
        <div style={{ ...cardStyle, padding: '48px 36px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <ClipboardType size={32} color="#d97706" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
            Clinical Triage Intake Required
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px' }}>
            Hospital protocol mandates that every patient must complete the <strong>Clinical Intake & NLP Triage Assessment</strong> before performing automated urine test strip analysis.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/triage')}
              style={{
                background: '#4338ca',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(67, 56, 202, 0.25)',
              }}
            >
              <ClipboardType size={16} /> Complete Clinical Triage First <ArrowRight size={16} />
            </button>

            <button
              onClick={quickFillTriage}
              style={{
                background: '#fff',
                color: '#4338ca',
                border: '1px solid #c7d2fe',
                borderRadius: '8px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={14} /> Quick Demo Triage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
          Simulate Test Strip Analysis
        </h2>
        <p style={{ fontSize: '15px', color: '#6b7280' }}>
          Pure software-based colorimetry platform: 10-pad computer vision segmentation & continuous regression inference.
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: i <= currentStep ? '#4338ca' : '#e5e7eb',
                  color: i <= currentStep ? '#fff' : '#9ca3af',
                  transition: 'all 0.2s',
                }}
              >
                {i < currentStep ? <Check size={14} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: i <= currentStep ? '#1a1a2e' : '#9ca3af',
                }}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  background: i < currentStep ? '#4338ca' : '#e5e7eb',
                  margin: '0 12px',
                  transition: 'all 0.2s',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={cardStyle}>
        {/* STEP 1: UPLOAD & SETUP */}
        {step === 'upload' && (
          <div style={{ padding: '32px' }}>
            {/* Active Triage Verification Banner */}
            {activeTriage && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#16a34a" />
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>
                    Patient Triaged & Authorized: {activeTriage.name} ({activeTriage.patientId})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/triage')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#15803d',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Edit Triage
                </button>
              </div>
            )}

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px' }}>
              1. Verified Patient Demographics
            </h3>

            {/* Patient Name & Patient ID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Patient Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  style={inputStyle(errors.patientName)}
                />
                {errors.patientName && <div style={errorStyle}><AlertCircle size={12} /> {errors.patientName}</div>}
              </div>
              <div>
                <label style={labelStyle}>Patient ID *</label>
                <input
                  type="text"
                  placeholder="e.g. P-8219"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  style={inputStyle(errors.patientId)}
                />
                {errors.patientId && <div style={errorStyle}><AlertCircle size={12} /> {errors.patientId}</div>}
              </div>
            </div>

            {/* Age & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Patient Age</label>
                <input
                  type="number"
                  placeholder="42"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  style={{ ...inputStyle(false), background: '#fff', cursor: 'pointer' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Diagnostic Profile Selector */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Select Clinical Test Scenario (AI Colorimetry Simulation)</label>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 8px' }}>
                Simulates real-world reagent color changes for different medical conditions:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {sampleProfiles.map((prof) => {
                  const isSelected = selectedProfileKey === prof.key;
                  return (
                    <div
                      key={prof.key}
                      onClick={() => setSelectedProfileKey(prof.key)}
                      style={{
                        border: `2px solid ${isSelected ? '#4338ca' : '#e5e7eb'}`,
                        background: isSelected ? '#eef2ff' : '#fafafa',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#3730a3' : '#1f2937' }}>
                          {prof.name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: prof.status === 'Normal' ? '#ecfdf5' : '#fef2f2',
                            color: prof.status === 'Normal' ? '#059669' : '#dc2626',
                          }}
                        >
                          {prof.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{prof.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Strip Image */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>10-Pad Urine Test Strip (Paramcare Diagnostics Standard)</label>
              <div
                onClick={() => setImageUploaded(true)}
                style={{
                  marginTop: '8px',
                  border: `2px dashed ${imageUploaded ? '#10b981' : '#d1d5db'}`,
                  borderRadius: '12px',
                  padding: '22px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: imageUploaded ? '#f0fdf4' : '#fff',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: imageUploaded ? '#d1fae5' : '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {imageUploaded ? <CheckCircle size={20} color="#10b981" /> : <Upload size={20} color="#4338ca" />}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
                      {imageUploaded ? 'Paramcare 10-Pad Strip Image Loaded' : 'Upload Urine Strip Image'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Software Vision Engine calibrated for standard 10-analyte diagnostic dipsticks
                    </div>
                  </div>
                </div>

                {/* Strip visual mockup */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginRight: '6px' }}>
                    PADS:
                  </span>
                  {padDefinitions.map((pad, idx) => (
                    <div
                      key={pad.id}
                      title={`Pad ${idx + 1}: ${pad.name}`}
                      style={{
                        width: '18px',
                        height: '28px',
                        borderRadius: '3px',
                        backgroundColor: pad.sampleHex,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                  ))}
                </div>
              </div>
              {errors.image && <div style={errorStyle}><AlertCircle size={12} /> {errors.image}</div>}
            </div>

            {/* Technician confirmation checkbox */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="opConfirm"
                checked={operatorConfirmed}
                onChange={(e) => setOperatorConfirmed(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#4338ca', cursor: 'pointer' }}
              />
              <label htmlFor="opConfirm" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                I confirm the urine strip is aligned horizontally and ready for computer vision quantification.
              </label>
            </div>
            {errors.operator && <div style={{ ...errorStyle, marginBottom: '16px' }}><AlertCircle size={12} /> {errors.operator}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '13px' }}>
                <Cpu size={16} color="#4338ca" />
                <span>AI Colorimetry Regression Engine</span>
              </div>
              <button
                onClick={handleStartScan}
                style={{
                  background: '#4338ca',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(67, 56, 202, 0.25)',
                }}
              >
                <Scan size={17} /> Run 10-Pad CV Pipeline
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CV PIPELINE ANIMATION & REAGENT SEGMENTATION */}
        {step === 'scanning' && (
          <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            {/* Visual Header */}
            <div style={{ padding: '24px 32px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Real-Time OpenCV Pad Segmentation & Colorimetry Extraction
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
                    Segmenting horizontally aligned test strip into 10 discrete reagent regions for {patientName} ({patientId}).
                  </p>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#4338ca' }}>{progress}% Complete</div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #4338ca, #3b82f6)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* 10-Pad Visual Tracker */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: '8px',
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                }}
              >
                {padDefinitions.map((pad, index) => {
                  const isDone = activePad >= index;
                  const isCurrent = activePad === index;
                  return (
                    <div
                      key={pad.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '52px',
                          backgroundColor: pad.sampleHex,
                          borderRadius: '6px',
                          position: 'relative',
                          border: isCurrent
                            ? '3px solid #22c55e'
                            : isDone
                            ? '2px solid #10b981'
                            : '1px solid #cbd5e1',
                          boxShadow: isCurrent ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isDone && (
                          <div
                            style={{
                              background: 'rgba(0,0,0,0.5)',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isDone ? '#1e293b' : '#94a3b8',
                        }}
                      >
                        {pad.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Console Log Terminal */}
            <div
              style={{
                background: '#0f172a',
                height: '240px',
                padding: '16px 20px',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
                overflowY: 'auto',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '12px',
                color: '#4ade80',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#94a3b8',
                  marginBottom: '12px',
                  borderBottom: '1px solid #1e293b',
                  paddingBottom: '8px',
                }}
              >
                <Terminal size={14} /> <span>Software Vision Engine Console</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '5px', lineHeight: 1.45 }}>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* STEP 3: ANALYSIS COMPLETE */}
        {step === 'complete' && createdReport && (
          <div style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={36} color="#059669" />
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
              Analysis Completed Successfully!
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '540px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              All 10 reagent pads segmented and mapped to continuous analyte concentrations for Patient{' '}
              <strong>{createdReport.patientName}</strong> ({createdReport.patient}).
            </p>

            {/* Quick Result Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 24px',
                marginBottom: '28px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Test ID: </span>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>{createdReport.id}</strong>
              </div>
              <div style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Classification: </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: createdReport.status === 'Normal' ? '#ecfdf5' : '#fef2f2',
                    color: createdReport.status === 'Normal' ? '#059669' : '#dc2626',
                  }}
                >
                  {createdReport.status}
                </span>
              </div>
              <div style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Analytes: </span>
                <strong style={{ fontSize: '14px', color: '#4338ca' }}>10/10 Quantified</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate(`/reports/${createdReport.id}`)}
                style={{
                  background: '#4338ca',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(67, 56, 202, 0.25)',
                }}
              >
                <Eye size={16} /> View Digital Diagnostic Report
              </button>

              <button
                onClick={() => navigate('/')}
                style={{
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '9px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                View in Dashboard
              </button>

              <button
                onClick={() => {
                  setStep('upload');
                  setLogs([]);
                  setActivePad(-1);
                  setCreatedReport(null);
                }}
                style={{
                  background: '#fff',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '9px',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={15} /> Run Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;