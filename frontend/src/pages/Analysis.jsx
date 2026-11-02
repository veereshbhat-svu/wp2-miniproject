import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
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
  Image as ImageIcon,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../context/ReportContext';
import { fetchPadDefinitions, fetchSampleProfiles, analyzeStripImageAPI } from '../services/api';
import EmptyState from '../components/EmptyState';
import PadTracker from '../components/PadTracker';
import StatusBadge from '../components/StatusBadge';

const defaultPadDefinitions = [
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

const sampleStripPresets = [
  {
    key: 'uti',
    name: 'Infection / UTI Strip',
    desc: 'Nitrite Positive (Pink) · High Leucocytes (Purple) · Hematuria',
    badge: 'Abnormal',
    badgeColor: '#dc2626',
    badgeBg: '#fef2f2',
    imagePath: '/samples/strip-uti.png',
  },
  {
    key: 'diabetes',
    name: 'Diabetic / Glycosuria Strip',
    desc: 'Glucose 185 mg/dL (Dark Brown) · Ketonuria 16.8 mg/dL',
    badge: 'Warning',
    badgeColor: '#d97706',
    badgeBg: '#fffbeb',
    imagePath: '/samples/strip-diabetes.png',
  },
  {
    key: 'normal',
    name: 'Normal Routine Strip',
    desc: 'Healthy physiological baseline across all 10 diagnostic pads',
    badge: 'Normal',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
    imagePath: '/samples/strip-normal.png',
  },
  {
    key: 'renal',
    name: 'Renal / Proteinuria Strip',
    desc: 'Protein 88.5 mg/dL (Dark Green) · Specific Gravity 1.032',
    badge: 'Abnormal',
    badgeColor: '#dc2626',
    badgeBg: '#fef2f2',
    imagePath: '/samples/strip-renal.png',
  },
];

const steps = ['Patient & Strip Ingestion', 'Computer Vision Pipeline', 'Quantification & Report'];

const Analysis = () => {
  const navigate = useNavigate();
  const { addReport, activeTriage, setActiveTriage } = useReports();

  const [step, setStep] = useState('upload'); // 'upload' | 'scanning' | 'complete'
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [operatorConfirmed, setOperatorConfirmed] = useState(true);
  const [errors, setErrors] = useState({});

  // Image Source Mode: 'sample' | 'upload' | 'camera'
  const [inputMode, setInputMode] = useState('sample');
  const [selectedSampleKey, setSelectedSampleKey] = useState('uti');
  const [stripImagePreview, setStripImagePreview] = useState('/samples/strip-uti.png');
  const [stripFile, setStripFile] = useState(null);
  const [stripImageBase64, setStripImageBase64] = useState(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // CV Pipeline Output States
  const [logs, setLogs] = useState([]);
  const [activePad, setActivePad] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [createdReport, setCreatedReport] = useState(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 720, height: 110 });

  const [padDefinitions, setPadDefinitions] = useState(defaultPadDefinitions);
  const logsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentStep = step === 'upload' ? 0 : step === 'complete' ? 2 : 1;

  // Sync state with activeTriage whenever available
  useEffect(() => {
    if (activeTriage) {
      setPatientName(activeTriage.name || '');
      setPatientId(activeTriage.patientId || '');
      setPatientAge(activeTriage.age || '42');
      setPatientGender(activeTriage.gender || 'Male');
      if (activeTriage.targetProfile) {
        setSelectedSampleKey(activeTriage.targetProfile);
        setStripImagePreview(`/samples/strip-${activeTriage.targetProfile}.png`);
      }
    }
  }, [activeTriage]);

  // Load pad definitions
  useEffect(() => {
    async function loadApiData() {
      try {
        const pads = await fetchPadDefinitions();
        if (pads && pads.length > 0) setPadDefinitions(pads);
      } catch (err) {
        console.warn('Using default diagnostic pads', err);
      }
    }
    loadApiData();
  }, []);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Camera controls
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access device camera. Please grant camera permission or use file upload.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    setStripImagePreview(dataUrl);
    setStripImageBase64(dataUrl);
    setStripFile(null);
    setSelectedSampleKey(null);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please select a valid image file (PNG, JPG, WEBP).' }));
      return;
    }

    setStripFile(file);
    setSelectedSampleKey(null);
    setStripImageBase64(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setStripImagePreview(ev.target.result);
      setErrors((prev) => ({ ...prev, image: null }));
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset) => {
    setSelectedSampleKey(preset.key);
    setStripImagePreview(preset.imagePath);
    setStripFile(null);
    setStripImageBase64(null);
    setErrors((prev) => ({ ...prev, image: null }));
  };

  const handlePatientIdChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (/^P[A-Z0-9]/i.test(val)) {
      val = 'P-' + val.slice(1);
    }
    setPatientId(val);
    if (errors.patientId) {
      setErrors((prev) => ({ ...prev, patientId: null }));
    }
  };

  const validateAnalysisForm = () => {
    const errs = {};
    if (!patientName.trim()) errs.patientName = 'Patient Full Name is required.';
    const pid = patientId.trim();
    if (!pid) {
      errs.patientId = 'Patient ID is required (format: P-XXXX, e.g. P-8219).';
    } else if (!/^P-/i.test(pid)) {
      errs.patientId = "Patient ID must start with 'P-' followed by a hyphen (e.g. P-8219).";
    } else if (pid.length < 3 || !/^P-[A-Za-z0-9-]+$/i.test(pid)) {
      errs.patientId = "Patient ID must have an identifier after 'P-' (e.g. P-8219).";
    }
    if (!stripImagePreview && !stripFile && !selectedSampleKey) {
      errs.image = 'A urine test strip image or sample must be selected.';
    }
    if (!operatorConfirmed) errs.operator = 'Technician must confirm strip alignment.';
    return errs;
  };

  const handleStartScan = async () => {
    const validationErrors = validateAnalysisForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setStep('scanning');
    setLogs([]);
    setActivePad(-1);
    setProgress(5);

    const generatedId = `KJS-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // 1. Initial frontend animation
      setLogs((prev) => [
        ...prev,
        '[SOFTWARE_CV] Initializing UrineScan Computer Vision Colorimetry Engine v2.4...',
        `[INGEST] Preparing test strip payload for Patient ${patientName.trim()} (${patientId.trim().toUpperCase()})...`,
      ]);
      setProgress(15);

      // 2. Call backend Computer Vision endpoint
      let cvResponse;
      if (stripFile) {
        cvResponse = await analyzeStripImageAPI(stripFile, activeTriage);
      } else if (stripImageBase64) {
        cvResponse = await analyzeStripImageAPI(stripImageBase64, activeTriage);
      } else if (selectedSampleKey) {
        cvResponse = await analyzeStripImageAPI(null, activeTriage, selectedSampleKey);
      } else if (stripImagePreview) {
        cvResponse = await analyzeStripImageAPI(stripImagePreview, activeTriage);
      }

      if (!cvResponse || !cvResponse.success) {
        throw new Error(cvResponse?.message || 'Computer Vision analysis failed.');
      }

      // 3. Stagger the logs and pad animations for engaging visual telemetry
      const returnedLogs = cvResponse.logs || [];
      const totalPads = 10;

      for (let i = 0; i < totalPads; i++) {
        await new Promise((r) => setTimeout(r, 220));
        setActivePad(i);
        setProgress(20 + Math.round(((i + 1) / totalPads) * 60));
        if (returnedLogs[i + 2]) {
          setLogs((prev) => [...prev, returnedLogs[i + 2]]);
        }
      }

      setProgress(88);
      setLogs((prev) => [
        ...prev,
        '[ML_REGRESSION] Mapping extracted 30-D RGB color vectors to continuous numerical concentrations...',
        '[CLINICAL_CDS] Evaluating multi-analyte clinical risk index...',
      ]);

      await new Promise((r) => setTimeout(r, 400));
      setProgress(100);
      setLogs((prev) => [
        ...prev,
        `[DATABASE] Persisting verified urinalysis record ${generatedId} to MongoDB...`,
        '[SUCCESS] Diagnostic colorimetric analysis complete!',
      ]);

      // 4. Build report object and persist to MongoDB
      const newReportObj = {
        id: generatedId,
        reportId: generatedId,
        patientName: patientName.trim(),
        patient: patientId.trim().toUpperCase(),
        patientId: patientId.trim().toUpperCase(),
        patientAge: patientAge ? `${patientAge} yrs` : '42 yrs',
        patientGender: patientGender || 'Male',
        facility: 'K. J. Somaiya Hospital & Research Center',
        requestedBy: 'Dr. A. Sharma (Pathology)',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: cvResponse.status || 'Normal',
        clinicalNote: activeTriage?.condition
          ? `${activeTriage.condition}: Automated CV Strip Quantification.`
          : 'Diagnostic 10-pad computer vision urinalysis baseline.',
        analytes: cvResponse.analytes,
        clinicalRisk: cvResponse.clinicalRisk,
        stripImage: cvResponse.imagePreview || stripImagePreview,
        deviceModel: 'UrineScan Computer Vision Strip Reader v2.4',
      };

      await addReport(newReportObj);
      setAnalysisResult(cvResponse);
      setCreatedReport(newReportObj);

      setTimeout(() => setStep('complete'), 700);
    } catch (err) {
      console.error('CV Pipeline error:', err);
      setLogs((prev) => [...prev, `[ERROR] Pipeline aborted: ${err.message}`]);
      setErrors({ pipeline: err.message });
      setStep('upload');
    }
  };

  const proceedDirectly = () => {
    const directTriage = {
      name: '',
      patientId: '',
      age: '',
      gender: 'Male',
      targetProfile: 'normal',
      condition: 'Direct Urinalysis Protocol',
      notes: 'Direct urinalysis intake without preliminary triage.',
    };
    setActiveTriage(directTriage);
    setPatientName('');
    setPatientId('');
    setPatientAge('');
    setPatientGender('Male');
    setSelectedSampleKey('normal');
    setStripImagePreview('/samples/strip-normal.png');
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
      <EmptyState
        icon={ClipboardType}
        iconColor="#d97706"
        iconBg="#fef3c7"
        title="Clinical Triage Intake Required"
        description="Hospital protocol mandates that every patient must complete the Clinical Intake & NLP Triage Assessment before performing automated urine test strip analysis."
        actions={
          <>
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
              onClick={proceedDirectly}
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
              <Zap size={14} /> Direct Analysis (Blank Form)
            </button>
          </>
        }
      />
    );
  }

  return (
    <div className="page-enter" style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
          Computer Vision Urine Test Strip Reader
        </h2>
        <p style={{ fontSize: '15px', color: '#6b7280' }}>
          Real software-based colorimetry: 10-pad computer vision segmentation, RGB vector extraction & quantitative clinical reporting.
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

            {errors.pipeline && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  color: '#b91c1c',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errors.pipeline}</span>
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
                  onChange={handlePatientIdChange}
                  style={inputStyle(errors.patientId)}
                />
                {errors.patientId && <div style={errorStyle}><AlertCircle size={12} /> {errors.patientId}</div>}
              </div>
            </div>

            {/* Age & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
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

            {/* 2. Urine Strip Ingestion Mode Selector */}
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>
              2. Urine Test Strip Ingestion (Select Method)
            </h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <button
                type="button"
                onClick={() => { setInputMode('sample'); stopCamera(); }}
                style={{
                  background: inputMode === 'sample' ? '#eef2ff' : '#f9fafb',
                  color: inputMode === 'sample' ? '#4338ca' : '#4b5563',
                  border: `1px solid ${inputMode === 'sample' ? '#c7d2fe' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={15} /> 1-Click Preset Strips (Demo)
              </button>

              <button
                type="button"
                onClick={() => { setInputMode('upload'); stopCamera(); }}
                style={{
                  background: inputMode === 'upload' ? '#eef2ff' : '#f9fafb',
                  color: inputMode === 'upload' ? '#4338ca' : '#4b5563',
                  border: `1px solid ${inputMode === 'upload' ? '#c7d2fe' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Upload size={15} /> Upload Photo / File
              </button>

              <button
                type="button"
                onClick={() => { setInputMode('camera'); startCamera(); }}
                style={{
                  background: inputMode === 'camera' ? '#eef2ff' : '#f9fafb',
                  color: inputMode === 'camera' ? '#4338ca' : '#4b5563',
                  border: `1px solid ${inputMode === 'camera' ? '#c7d2fe' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Camera size={15} /> Live Camera Snapshot
              </button>
            </div>

            {/* TAB 1: 1-Click Calibrated Sample Strips */}
            {inputMode === 'sample' && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                  Select a standardized 10-pad strip image calibrated to real clinical conditions:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {sampleStripPresets.map((preset) => {
                    const isSelected = selectedSampleKey === preset.key;
                    return (
                      <div
                        key={preset.key}
                        onClick={() => handleSelectPreset(preset)}
                        style={{
                          border: `2px solid ${isSelected ? '#4338ca' : '#e5e7eb'}`,
                          background: isSelected ? '#eef2ff' : '#fafafa',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? '#3730a3' : '#1f2937' }}>
                            {preset.name}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: preset.badgeBg,
                              color: preset.badgeColor,
                            }}
                          >
                            {preset.badge}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px' }}>{preset.desc}</p>
                        <img
                          src={preset.imagePath}
                          alt={preset.name}
                          style={{
                            width: '100%',
                            height: '24px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: File Upload / Drag & Drop */}
            {inputMode === 'upload' && (
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #4338ca',
                    borderRadius: '12px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f8fafc',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <Upload size={24} color="#4338ca" />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                    {stripFile ? stripFile.name : 'Click to Browse or Drag & Drop Urine Strip Image'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Supports camera photos from smartphone or scanner (PNG, JPG, JPEG, WEBP · Max 10MB)
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Live Camera Viewfinder */}
            {inputMode === 'camera' && (
              <div style={{ marginBottom: '20px' }}>
                {cameraError ? (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '16px',
                      color: '#b91c1c',
                      fontSize: '13px',
                      textAlign: 'center',
                    }}
                  >
                    <AlertCircle size={24} style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      style={{
                        marginTop: '12px',
                        background: '#b91c1c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'relative',
                      background: '#0f172a',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      textAlign: 'center',
                    }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', maxHeight: '320px', objectFit: 'cover' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Camera alignment overlay guide */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        height: '24%',
                        border: '2px dashed #4ade80',
                        borderRadius: '6px',
                        pointerEvents: 'none',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#4ade80', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' }}>
                        Align 10-Pad Strip Inside Green Box
                      </span>
                    </div>

                    {/* Capture button bar */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '12px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={captureCameraFrame}
                        style={{
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <Camera size={16} /> Snap Strip Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Test Strip Active Preview Box */}
            {stripImagePreview && (
              <div
                style={{
                  marginBottom: '20px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={16} color="#4338ca" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                      Ready for Computer Vision Analysis
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Orientation: Horizontal
                  </span>
                </div>

                <div
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '8px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={stripImagePreview}
                    alt="Urine Strip Preview"
                    onLoad={(e) => {
                      setImgNaturalSize({
                        width: e.target.naturalWidth || 720,
                        height: e.target.naturalHeight || 110,
                      });
                    }}
                    style={{
                      width: '100%',
                      maxHeight: '120px',
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </div>
              </div>
            )}
            {errors.image && <div style={{ ...errorStyle, marginBottom: '12px' }}><AlertCircle size={12} /> {errors.image}</div>}

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

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '13px' }}>
                <Cpu size={16} color="#4338ca" />
                <span>Paramcare Multistix 10-SG Colorimetry Model</span>
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

        {/* STEP 2: CV PIPELINE STREAMING ANIMATION */}
        {step === 'scanning' && (
          <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            {/* Visual Header */}
            <div style={{ padding: '24px 32px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Real-Time Computer Vision Segmentation & Color Extraction
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
                    Extracting 10 reagent zones and mapping RGB color vectors for {patientName} ({patientId}).
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
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>

              {/* 10-Pad Visual Tracker */}
              <PadTracker pads={padDefinitions} activePad={activePad} mode="grid" />
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
                  paddingBottom: '8px',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                <Terminal size={14} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>COLORIMETRY PIPELINE EXECUTION STREAM</span>
              </div>
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '6px', lineHeight: 1.4 }}>
                  <span style={{ color: '#64748b', marginRight: '8px' }}>[{index + 1}]</span>
                  <span>{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* STEP 3: SCAN COMPLETE WITH INTERACTIVE BOUNDING BOXES & RESULTS */}
        {step === 'complete' && analysisResult && (
          <div style={{ padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <CheckCircle size={30} color="#059669" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
                Computer Vision Analysis Successful!
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                10 reagent pads segmented from image. Analyte concentrations quantified and saved to MongoDB.
              </p>
            </div>

            {/* Strip Image with Overlaid Bounding Boxes */}
            <div
              style={{
                marginBottom: '24px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={15} color="#4338ca" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    Segmented Test Strip & Colorimetric Regions of Interest (ROI)
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Hover over boxes to view sampled RGB values
                </span>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={stripImagePreview}
                  alt="Analyzed Strip"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '140px',
                    objectFit: 'contain',
                  }}
                />

                {/* Overlaid Bounding Boxes */}
                {analysisResult.boundingBoxes?.map((box, idx) => {
                  const leftPct = (box.x / (imgNaturalSize.width || 720)) * 100;
                  const topPct = (box.y / (imgNaturalSize.height || 110)) * 100;
                  const widthPct = (box.width / (imgNaturalSize.width || 720)) * 100;
                  const heightPct = (box.height / (imgNaturalSize.height || 110)) * 100;
                  const color = box.status === 'abnormal' ? '#ef4444' : box.status === 'warning' ? '#f59e0b' : '#10b981';

                  return (
                    <div
                      key={idx}
                      title={`${idx + 1}. ${box.name}: Extracted ${box.detectedHex} (${box.status.toUpperCase()})`}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        border: `2px solid ${color}`,
                        backgroundColor: `${color}25`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        boxSizing: 'border-box',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          background: color,
                          color: '#fff',
                          padding: '1px 3px',
                          borderRadius: '2px',
                          lineHeight: 1,
                        }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 10 Analytes Detection Table */}
            <div style={{ marginBottom: '24px', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  Quantified Diagnostic Results (10 Analytes)
                </span>
                <StatusBadge status={analysisResult.status} uppercase />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', padding: '12px' }}>
                {analysisResult.analytes?.map((analyte, idx) => {
                  const isAbnormal = analyte.status === 'abnormal';
                  const isWarning = analyte.status === 'warning';
                  const statusBg = isAbnormal ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4';
                  const statusBorder = isAbnormal ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0';

                  return (
                    <div
                      key={idx}
                      style={{
                        background: statusBg,
                        border: `1px solid ${statusBorder}`,
                        borderRadius: '8px',
                        padding: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                          #{idx + 1} {analyte.name}
                        </span>
                        {analyte.hexColor && (
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: analyte.hexColor,
                              border: '1px solid rgba(0,0,0,0.15)',
                            }}
                            title={`Extracted Color: ${analyte.hexColor}`}
                          />
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        {analyte.exact} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>{analyte.unit}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                        Ref: {analyte.ref}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate(`/reports/${createdReport?.id || 'latest'}`)}
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
                <Eye size={16} /> View Generated Diagnostic Report
              </button>

              <button
                onClick={() => {
                  setStep('upload');
                  setLogs([]);
                  setProgress(0);
                  setAnalysisResult(null);
                  setCreatedReport(null);
                }}
                style={{
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={15} /> Analyze Another Strip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;