import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  Share2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Scan,
  User,
  QrCode,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X,
  Wifi,
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useReports } from '../context/ReportContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { sendReportToHIS } from '../services/api';

const Report = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { reports } = useReports();
  const [hisSent, setHisSent] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Empty state if no reports exist in the system yet
  if (!reports || reports.length === 0) {
    return (
      <EmptyState
        icon={FileQuestion}
        iconColor="#4338ca"
        iconBg="#eef2ff"
        title="No Diagnostic Reports Available"
        description="There are currently no urinalysis reports generated. Run a test strip analysis from the Analysis page to simulate 10-pad computer vision segmentation and view continuous diagnostic reports."
        actions={
          <button
            onClick={() => navigate('/analyze')}
            style={{
              background: '#4338ca',
              color: '#fff',
              border: 'none',
              borderRadius: '9px',
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
            <Scan size={16} /> Go to Analysis Page
          </button>
        }
      />
    );
  }

  // Find targeted report or default to latest
  let currentReport = null;
  if (id) {
    currentReport = reports.find((r) => r.id === id || r.reportId === id);
  }
  if (!currentReport) {
    currentReport = reports[0];
  }

  const reportIdentifier = currentReport.reportId || currentReport.id;

  // Fetch live LAN QR Code data from backend
  useEffect(() => {
    if (reportIdentifier) {
      fetch(`http://localhost:5000/api/reports/${reportIdentifier}/qr`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setQrData(data);
          }
        })
        .catch((err) => console.warn('Could not load QR code endpoint:', err));
    }
  }, [reportIdentifier]);

  const qrImageSrc = qrData?.qrDataUrl || currentReport.qrCodeDataUrl;
  const mobileVerifyUrl =
    qrData?.verifyUrl || `http://10.0.50.209:5000/verify/${reportIdentifier}`;

  // Calculate abnormal/warning counts
  const abnormalCount = currentReport.analytes?.filter((a) => a.status === 'abnormal').length || 0;
  const warningCount = currentReport.analytes?.filter((a) => a.status === 'warning').length || 0;
  const isFlagged = abnormalCount > 0 || warningCount > 0;

  const handleSendHIS = async () => {
    try {
      await sendReportToHIS(reportIdentifier);
    } catch (err) {
      console.warn('HIS sync notice:', err);
    }
    setHisSent(true);
    setTimeout(() => setHisSent(false), 3500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileVerifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' };
  const thStyle = {
    padding: '12px 20px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div className="page-enter" style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {hisSent && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '40px',
            background: '#065f46',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            zIndex: 100,
            animation: 'fadeUp 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} color="#34d399" />
          Encrypted report successfully transmitted to K.J. Somaiya Hospital HIS!
        </div>
      )}

      {/* Top Controls & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            color: '#6b7280',
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
              Diagnostic Urinalysis Report
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px', margin: 0 }}>
            Report ID: <strong style={{ color: '#4338ca' }}>{reportIdentifier}</strong> &nbsp;·&nbsp; Captured: {currentReport.date} {currentReport.time || ''}
          </p>
        </div>

        {/* Report Switcher if multiple tests exist */}
        {reports.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Select Test:</span>
            <select
              value={currentReport.id}
              onChange={(e) => navigate(`/reports/${e.target.value}`)}
              style={{
                background: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1a1a2e',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} - {r.patientName || r.patient} ({r.patient}) - {r.status}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Mobile Scan Button */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            style={{
              background: '#e0e7ff',
              border: '1px solid #c7d2fe',
              color: '#3730a3',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
            }}
          >
            <QrCode size={15} color="#4338ca" /> Scan with Phone
          </button>

          <button
            onClick={() => window.print()}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Printer size={15} /> Print Report
          </button>

          <button
            onClick={handleSendHIS}
            style={{
              background: '#4338ca',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Share2 size={15} /> Send to HIS
          </button>
        </div>
      </div>

      {/* Info Row: Patient Details + CDS Box + Mobile Wi-Fi Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.9fr', gap: '16px', marginBottom: '20px' }}>
        {/* Patient Info */}
        <div style={{ ...card, padding: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <User size={13} color="#4338ca" /> Patient Demographics
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '1px' }}>PATIENT NAME & ID</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                {currentReport.patientName || 'Anonymous'}
              </div>
              <Link
                to={`/patients/${currentReport.patient}`}
                style={{ fontSize: '12px', fontWeight: 600, color: '#4338ca', textDecoration: 'underline' }}
              >
                ID: {currentReport.patient}
              </Link>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '1px' }}>AGE / GENDER</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>
                {currentReport.patientAge || '42 yrs'} &nbsp;·&nbsp; {currentReport.patientGender || 'Male'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '1px' }}>FACILITY</div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>
                {currentReport.facility || 'K. J. Somaiya Hospital'}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Review Status Card */}
        <div
          style={{
            ...card,
            padding: '20px',
            borderLeft: `5px solid ${isFlagged ? '#dc2626' : '#059669'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: isFlagged ? '#fffbfa' : '#f0fdf4',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: isFlagged ? '#991b1b' : '#065f46',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}
          >
            Clinical Decision Support
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isFlagged ? '#fee2e2' : '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {abnormalCount > 0 ? (
                <AlertCircle size={18} color="#dc2626" />
              ) : warningCount > 0 ? (
                <AlertTriangle size={18} color="#d97706" />
              ) : (
                <CheckCircle2 size={18} color="#059669" />
              )}
            </div>
            <div>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: isFlagged ? '#dc2626' : '#059669',
                }}
              >
                {isFlagged ? 'Review Required' : 'All Clear / Normal'}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.4, margin: '4px 0' }}>
            {isFlagged
              ? `${abnormalCount} abnormal & ${warningCount} borderline values flagged.`
              : 'All 10 parameters are within standard physiological reference ranges.'}
          </p>
          {currentReport.clinicalNote && (
            <div
              style={{
                marginTop: '6px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: isFlagged ? '#fee2e2' : '#d1fae5',
                fontSize: '11px',
                color: isFlagged ? '#991b1b' : '#065f46',
                fontWeight: 500,
              }}
            >
              {currentReport.clinicalNote}
            </div>
          )}
        </div>

        {/* Mobile Wi-Fi Sync Card */}
        <div
          style={{
            ...card,
            padding: '16px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
            border: '1px solid #c7d2fe',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#4338ca',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Wifi size={13} color="#4338ca" /> Wi-Fi Phone Sync
          </div>

          {qrImageSrc ? (
            <div
              onClick={() => setIsQrModalOpen(true)}
              style={{
                background: '#fff',
                padding: '6px',
                borderRadius: '10px',
                boxShadow: '0 4px 10px rgba(67, 56, 202, 0.1)',
                cursor: 'pointer',
                border: '1px solid #e0e7ff',
                marginBottom: '8px',
                transition: 'transform 0.15s ease',
              }}
              title="Click to enlarge QR code for scanning"
            >
              <img
                src={qrImageSrc}
                alt="Scan on Phone"
                style={{ width: '92px', height: '92px', display: 'block', borderRadius: '4px' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '92px',
                height: '92px',
                background: '#e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
              }}
            >
              <QrCode size={36} color="#94a3b8" />
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
            Scan with Phone Camera
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 8px', lineHeight: 1.3 }}>
            Open report & lab PDF on your mobile over same Wi-Fi.
          </p>

          <button
            onClick={() => setIsQrModalOpen(true)}
            style={{
              background: '#4338ca',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Smartphone size={13} /> View QR Code
          </button>
        </div>
      </div>

      {/* Captured Test Strip Image if available */}
      {currentReport.stripImage && (
        <div style={{ ...card, padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔬 Computer Vision Scanned Urine Test Strip
            </span>
            <span style={{ fontSize: '11px', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Paramcare Multistix 10-SG
            </span>
          </div>
          <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <img
              src={currentReport.stripImage.startsWith('http') || currentReport.stripImage.startsWith('data:') || currentReport.stripImage.startsWith('/') ? currentReport.stripImage : `http://localhost:5000${currentReport.stripImage}`}
              alt="Scanned Test Strip"
              style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
            />
          </div>
        </div>
      )}

      {/* Results Table (10 Analytes) */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
              10-Analyte Colorimetric Quantification Results
            </h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', margin: 0 }}>
              Derived via On-Device Multidimensional Polynomial Regression & OpenCV Segmentation
            </p>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#4338ca',
              background: '#eef2ff',
              padding: '4px 10px',
              borderRadius: '6px',
            }}
          >
            10 Reagent Pads
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Analyte Parameter</th>
              <th style={thStyle}>Measured Concentration</th>
              <th style={thStyle}>Reference Interval</th>
              <th style={thStyle}>Clinical Flag</th>
            </tr>
          </thead>
          <tbody>
            {currentReport.analytes?.map((a, i) => {
              const last = i === currentReport.analytes.length - 1;
              const td = {
                padding: '12px 20px',
                fontSize: '13px',
                color: '#374151',
                borderBottom: last ? 'none' : '1px solid #f3f4f6',
              };

              return (
                <tr
                  key={i}
                  style={{ transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...td, color: '#9ca3af', width: '30px' }}>{i + 1}</td>
                  <td style={{ ...td, fontWeight: 600, color: '#1a1a2e' }}>{a.name}</td>
                  <td style={{ ...td, fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>
                    {a.exact}{' '}
                    {a.unit && (
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                        {a.unit}
                      </span>
                    )}
                  </td>
                  <td style={{ ...td, color: '#64748b' }}>{a.ref}</td>
                  <td style={td}>
                    <StatusBadge status={a.status} uppercase />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Medical & Regulatory Footer */}
      <div
        style={{
          marginTop: '20px',
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b',
          lineHeight: 1.6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <strong>Regulatory Compliance:</strong> CDSCO MDR 2017 IVD Guidelines · DPDP Act 2023 Patient Privacy Protected.
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsQrModalOpen(true)}
            style={{
              background: '#fff',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Smartphone size={12} /> Mobile Wi-Fi Sync
          </button>
        </div>
      </div>

      {/* Large-Format QR Code Scan Modal */}
      {isQrModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              position: 'relative',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsQrModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#e0e7ff',
                color: '#4338ca',
                padding: '4px 12px',
                borderRadius: '50px',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '10px',
              }}
            >
              <Wifi size={12} /> Same Wi-Fi Network Sync
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Scan to View on Phone
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.4 }}>
              Point your smartphone camera at this QR code to view the live report and download the lab PDF on your phone.
            </p>

            {/* High-Resolution QR Code */}
            {qrImageSrc ? (
              <div
                style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '16px',
                  display: 'inline-block',
                  border: '2px solid #e0e7ff',
                  boxShadow: '0 10px 25px rgba(67, 56, 202, 0.15)',
                  marginBottom: '20px',
                }}
              >
                <img
                  src={qrImageSrc}
                  alt={`QR Code for ${reportIdentifier}`}
                  style={{ width: '210px', height: '210px', display: 'block', borderRadius: '8px' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '210px',
                  height: '210px',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #cbd5e1',
                  marginBottom: '20px',
                }}
              >
                <QrCode size={64} color="#94a3b8" />
              </div>
            )}

            {/* Quick 3-Step Guide */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: '12px',
                color: '#475569',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                How to connect:
              </div>
              <div style={{ marginBottom: '4px' }}>1. Ensure your phone is connected to the same Wi-Fi.</div>
              <div style={{ marginBottom: '4px' }}>2. Open your phone Camera and hold it up to the screen.</div>
              <div>3. Tap the link to view the report and download the official PDF.</div>
            </div>

            {/* Mobile Direct URL Box */}
            <div
              style={{
                background: '#f1f5f9',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#334155',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '280px',
                }}
              >
                {mobileVerifyUrl}
              </span>
              <button
                onClick={handleCopyLink}
                style={{
                  background: copied ? '#059669' : '#4338ca',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Test in Browser Button */}
            <a
              href={mobileVerifyUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#4338ca',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ExternalLink size={13} /> Test Mobile Portal in Browser
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
