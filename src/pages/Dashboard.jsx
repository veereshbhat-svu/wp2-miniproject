import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker, CheckCircle, AlertTriangle, ArrowRight, Activity, Inbox, Trash2, Scan } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReports } from '../context/ReportContext';

const badge = (s) => {
  const map = {
    Normal:   { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    Abnormal: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    Warning:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  };
  const c = map[s] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
  return {
    background: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'inline-block',
  };
};

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' };
const thStyle = {
  padding: '12px 20px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1a2e', padding: '10px 14px', borderRadius: '8px', border: '1px solid #374151', color: '#fff' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>{label}</p>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>{payload[0].value} Tests Completed</span>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const nav = useNavigate();
  const { reports, clearAllReports } = useReports();

  // Dynamic Statistics
  const totalScans = reports.length;
  const normalScans = reports.filter((r) => r.status === 'Normal').length;
  const flaggedScans = reports.filter((r) => r.status !== 'Normal').length;

  // Chart data from reports
  const chartData =
    reports.length > 0
      ? [
          { time: '08:00', tests: 0 },
          { time: '10:00', tests: Math.max(1, Math.floor(reports.length * 0.3)) },
          { time: '12:00', tests: Math.max(1, Math.floor(reports.length * 0.7)) },
          { time: '14:00', tests: reports.length },
        ]
      : [];

  return (
    <div className="page-enter">
      {/* Hero Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
            Urinalysis POC Dashboard
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280' }}>
            K. J. Somaiya Hospital & Paramcare Lifesciences · Continuous Colorimetry Telemetry
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {reports.length > 0 && (
            <button
              onClick={clearAllReports}
              title="Reset dashboard and clear all reports"
              style={{
                background: '#fff',
                color: '#dc2626',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={15} /> Clear All Data
            </button>
          )}
          <button
            onClick={() => nav('/analyze')}
            style={{
              background: '#4338ca',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '11px 22px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 12px rgba(67, 56, 202, 0.25)',
            }}
          >
            <Scan size={16} /> Run New Analysis <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Analyses Run', value: totalScans, icon: Beaker, iconColor: '#4338ca', iconBg: '#eef2ff' },
          { label: 'Normal Screening', value: normalScans, icon: CheckCircle, iconColor: '#059669', iconBg: '#ecfdf5' },
          { label: 'Flagged for Review', value: flaggedScans, icon: AlertTriangle, iconColor: '#dc2626', iconBg: '#fef2f2' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }}>{c.label}</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.value}</div>
                </div>
                <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={c.iconColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Testing Volume Chart + Recent Analyses Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '24px' }}>
        {/* Chart Card */}
        <div style={{ ...card, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Activity size={18} color="#4338ca" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>Testing Volume Telemetry</h3>
          </div>
          <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                <Inbox size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ fontSize: '14px', fontWeight: 500 }}>No telemetry data yet</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Run an analysis from the Analyze tab to view volume tracking.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="tests" stroke="#4338ca" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#4338ca' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Table Card */}
        <div style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>Recent Urinalysis Scans</h3>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{reports.length} Recorded</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
            {reports.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9ca3af' }}>
                <Beaker size={32} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>No tests recorded yet</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
                  Execute a 10-pad computer vision simulation to populate patient records.
                </p>
                <button
                  onClick={() => nav('/analyze')}
                  style={{
                    background: '#4338ca',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Go to Analyze Page
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', position: 'sticky', top: 0, zIndex: 5 }}>
                    <th style={thStyle}>Test ID</th>
                    <th style={thStyle}>Patient</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((t, i) => {
                    const last = i === reports.length - 1;
                    const td = { padding: '12px 20px', fontSize: '13px', color: '#374151', borderBottom: last ? 'none' : '1px solid #f3f4f6' };
                    return (
                      <tr
                        key={t.id}
                        style={{ transition: 'background 0.1s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ ...td, fontWeight: 700, color: '#1a1a2e' }}>{t.id}</td>
                        <td style={td}>
                          <div>
                            <span
                              onClick={() => nav(`/patients/${t.patient}`)}
                              style={{ color: '#1a1a2e', fontWeight: 600, cursor: 'pointer', display: 'block' }}
                              onMouseEnter={(e) => (e.target.style.color = '#4338ca')}
                              onMouseLeave={(e) => (e.target.style.color = '#1a1a2e')}
                            >
                              {t.patientName || 'Anonymous Patient'}
                            </span>
                            <span
                              onClick={() => nav(`/patients/${t.patient}`)}
                              style={{ color: '#4338ca', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {t.patient}
                            </span>
                          </div>
                        </td>
                        <td style={td}>
                          <span style={badge(t.status)}>{t.status}</span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <button
                            onClick={() => nav(`/reports/${t.id}`)}
                            style={{
                              background: '#fff',
                              border: '1px solid #d1d5db',
                              color: '#4338ca',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;