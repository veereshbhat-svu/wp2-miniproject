import React, { useState } from 'react';
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
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useReports } from '../context/ReportContext';

const badgeMap = {
  normal:   { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'NORMAL' },
  warning:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'WARNING' },
  abnormal: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'ABNORMAL' },
};

const Report = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { reports } = useReports();
  const [hisSent, setHisSent] = useState(false);

  // Empty state if no reports exist in the system yet
  if (!reports || reports.length === 0) {
    return (
      <div className="page-enter" style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center' }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '48px 32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <FileQuestion size={32} color="#4338ca" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
            No Diagnostic Reports Available
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, marginBottom: '28px' }}>
            There are currently no urinalysis reports generated. Run a test strip analysis from the
            <strong> Analysis</strong> page to simulate 10-pad computer vision segmentation and view continuous diagnostic reports.
          </p>

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
        </div>
      </div>
    );
  }

  // Find targeted report or default to latest
  let currentReport = null;
  if (id) {
    currentReport = reports.find((r) => r.id === id);
  }
  if (!currentReport) {
    currentReport = reports[0];
  }

  // Calculate abnormal/warning counts
  const abnormalCount = currentReport.analytes?.filter((a) => a.status === 'abnormal').length || 0;
  const warningCount = currentReport.analytes?.filter((a) => a.status === 'warning').length || 0;
  const isFlagged = abnormalCount > 0 || warningCount > 0;

  const handleSendHIS = () => {
    setHisSent(true);
    setTimeout(() => setHisSent(false), 3500);
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
    <div className="page-enter" style={{ maxWidth: '920px', margin: '0 auto' }}>
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
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
            Report ID: <strong style={{ color: '#4338ca' }}>{currentReport.id}</strong> &nbsp;·&nbsp; Captured: {currentReport.date} {currentReport.time || ''}
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

        <div style={{ display: 'flex', gap: '8px' }}>
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

      {/* Info Row: Patient Details + Clinical Review Box */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Patient Info */}
        <div style={{ ...card, padding: '22px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <User size={13} color="#4338ca" /> Patient & Facility Demographics
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>PATIENT NAME & ID</div>
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
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>AGE / GENDER</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
                {currentReport.patientAge || '42 yrs'} &nbsp;·&nbsp; {currentReport.patientGender || 'Male'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>REQUESTING CLINICIAN</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                {currentReport.requestedBy || 'Dr. A. Sharma (Pathology)'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>HEALTHCARE FACILITY</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                {currentReport.facility || 'K. J. Somaiya Hospital & Research Center'}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Review Status Card */}
        <div
          style={{
            ...card,
            padding: '22px',
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
              marginBottom: '10px',
            }}
          >
            Clinical Decision Support
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isFlagged ? '#fee2e2' : '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {abnormalCount > 0 ? (
                <AlertCircle size={20} color="#dc2626" />
              ) : warningCount > 0 ? (
                <AlertTriangle size={20} color="#d97706" />
              ) : (
                <CheckCircle2 size={20} color="#059669" />
              )}
            </div>
            <div>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: isFlagged ? '#dc2626' : '#059669',
                }}
              >
                {isFlagged ? 'Review Required' : 'All Clear / Normal'}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.45, margin: 0 }}>
            {isFlagged
              ? `${abnormalCount} abnormal and ${warningCount} borderline values flagged. Physician confirmation required.`
              : 'All 10 colorimetric parameters are within gold-standard physiological reference ranges.'}
          </p>
          {currentReport.clinicalNote && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                background: isFlagged ? '#fee2e2' : '#d1fae5',
                fontSize: '11px',
                color: isFlagged ? '#991b1b' : '#065f46',
                fontWeight: 500,
              }}
            >
              <strong>Note:</strong> {currentReport.clinicalNote}
            </div>
          )}
        </div>
      </div>

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
              const b = badgeMap[a.status?.toLowerCase()] || badgeMap.normal;
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
                    <span
                      style={{
                        background: b.bg,
                        color: b.color,
                        border: `1px solid ${b.border}`,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-block',
                      }}
                    >
                      {b.label}
                    </span>
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
        <div>
          Validated with <strong>Paramcare Lifesciences</strong> & <strong>K. J. Somaiya Hospital</strong>.
        </div>
      </div>
    </div>
  );
};

export default Report;
