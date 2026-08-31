import React from 'react';
import { ArrowLeft, History, FileText, Scan, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useReports } from '../context/ReportContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ChartTooltip from '../components/ChartTooltip';

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' };

const Patient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getReportsByPatient } = useReports();

  const patientId = id || 'P-8219';
  const patientReports = getReportsByPatient(patientId);

  const hasRecords = patientReports.length > 0;

  // Extract chart data from patient's actual reports (in chronological order)
  const chartData = [...patientReports].reverse().map((r) => {
    const glu = r.analytes?.find((a) => a.name === 'Glucose')?.exact;
    const pro = r.analytes?.find((a) => a.name === 'Protein')?.exact;
    const ph = r.analytes?.find((a) => a.name === 'pH')?.exact;
    return {
      date: `${r.date} ${r.time || ''}`,
      glucose: typeof glu === 'string' ? parseFloat(glu) || 0 : glu || 0,
      protein: typeof pro === 'string' ? parseFloat(pro) || 0 : pro || 0,
      ph: typeof ph === 'string' ? parseFloat(ph) || 0 : ph || 0,
      testId: r.id,
    };
  });

  return (
    <div className="page-enter" style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
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
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a2e', marginBottom: '2px' }}>
            {patientReports[0]?.patientName ? `${patientReports[0].patientName}` : 'Patient Analytics'}
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            Patient ID: <strong style={{ color: '#4338ca' }}>{patientId}</strong> &nbsp;·&nbsp; {patientReports[0]?.patientAge || '42 yrs'} &nbsp;·&nbsp; Facility: K. J. Somaiya Hospital & Research Center
          </p>
        </div>
        <button
          onClick={() => navigate('/analyze')}
          style={{
            background: '#4338ca',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Scan size={15} /> Run New Test for Patient
        </button>
      </div>

      {!hasRecords ? (
        <EmptyState
          icon={AlertCircle}
          iconColor="#dc2626"
          iconBg="#fef2f2"
          title={`No Test Records Found for ${patientId}`}
          description="This patient does not have any recorded colorimetric urinalysis tests in the local database yet."
          actions={
            <button
              onClick={() => navigate('/analyze')}
              style={{
                background: '#4338ca',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Start Analysis for {patientId}
            </button>
          }
        />
      ) : (
        <>
          {/* Chart Section */}
          <div style={{ ...card, padding: '24px 28px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <History size={18} color="#4338ca" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>
                Longitudinal Analyte Trends (Time-Series Monitoring)
              </h3>
            </div>

            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} iconType="circle" />
                  <Line yAxisId="left" type="monotone" dataKey="glucose" name="Glucose (mg/dL)" stroke="#4338ca" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="left" type="monotone" dataKey="protein" name="Protein (mg/dL)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Test History Table */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#6b7280" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                Urinalysis Test History ({patientReports.length} Tests)
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Date & Time</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Test ID</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Clinical Note</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Classification</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {patientReports.map((test, i) => {
                  const last = i === patientReports.length - 1;
                  return (
                    <tr
                      key={test.id}
                      style={{ borderBottom: last ? 'none' : '1px solid #f3f4f6', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 20px', fontSize: '13px', color: '#374151' }}>
                        {test.date} {test.time || ''}
                      </td>
                      <td
                        style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 700, color: '#4338ca', cursor: 'pointer' }}
                        onClick={() => navigate(`/reports/${test.id}`)}
                      >
                        {test.id}
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: '13px', color: '#6b7280' }}>
                        {test.clinicalNote || 'Routine Screening'}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <StatusBadge status={test.status} />
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/reports/${test.id}`)}
                          style={{
                            background: '#fff',
                            border: '1px solid #d1d5db',
                            color: '#4338ca',
                            padding: '4px 10px',
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
          </div>
        </>
      )}
    </div>
  );
};

export default Patient;
