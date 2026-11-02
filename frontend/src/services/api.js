/**
 * UrineScan Asynchronous API Client Service Layer
 * Connects directly to Node.js + Express + MongoDB Backend at http://localhost:5000/api
 * Falls back to local /data/diagnostic_data.json if backend is offline.
 */

const BACKEND_URL = 'http://localhost:5000/api';
const DATA_URL = '/data/diagnostic_data.json';
let cachedData = null;

/**
 * Fetch the master diagnostic JSON dataset (fallback)
 * @returns {Promise<Object>} Diagnostic data payload
 */
export async function fetchDiagnosticData() {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    cachedData = data;
    return data;
  } catch (error) {
    console.warn('Fallback diagnostic data notice:', error);
    return {
      initialReports: [],
      padDefinitions: [],
      sampleProfiles: [],
      triagePresets: [],
      symptoms: [],
    };
  }
}

/**
 * Fetch all reports directly from MongoDB backend
 * @returns {Promise<Array>} List of reports from MongoDB
 */
export async function fetchReports() {
  try {
    const res = await fetch(`${BACKEND_URL}/reports`);
    if (res.ok) {
      const data = await res.json();
      if (data.reports && data.reports.length > 0) {
        return data.reports.map((r) => ({
          ...r,
          id: r.reportId || r.id,
          patient: r.patientId || r.patient,
        }));
      }
    }
  } catch (err) {
    console.warn('[API] Could not connect to MongoDB backend for reports:', err);
  }
  return [];
}

/**
 * Fetch initial patient reports (MongoDB first, JSON fallback)
 * @returns {Promise<Array>} List of initial reports
 */
export async function fetchInitialReports() {
  // Query exclusively from MongoDB backend. If database is empty, return []
  return await fetchReports();
}

/**
 * Fetch 10-pad test strip colorimetric definitions
 * @returns {Promise<Array>} List of pad definitions
 */
export async function fetchPadDefinitions() {
  const data = await fetchDiagnosticData();
  return data.padDefinitions || [];
}

/**
 * Fetch clinical test simulation profiles (Normal, UTI, Diabetes, Renal)
 * @returns {Promise<Array>} List of sample profiles
 */
export async function fetchSampleProfiles() {
  const data = await fetchDiagnosticData();
  return data.sampleProfiles || [];
}

/**
 * Fetch clinical triage presets and symptom checklist
 * @returns {Promise<{triagePresets: Array, symptoms: Array}>}
 */
export async function fetchTriagePresets() {
  try {
    const res = await fetch(`${BACKEND_URL}/triage/presets`);
    if (res.ok) {
      const bData = await res.json();
      if (bData.triagePresets && bData.triagePresets.length > 0) {
        return {
          triagePresets: bData.triagePresets,
          symptoms: bData.symptoms || [],
        };
      }
    }
  } catch {
    // Fall back to diagnostic_data.json
  }

  const data = await fetchDiagnosticData();
  return {
    triagePresets: data.triagePresets || [],
    symptoms: data.symptoms || [],
  };
}

/**
 * Fetch system and facility metadata
 * @returns {Promise<Object>}
 */
export async function fetchSystemInfo() {
  const data = await fetchDiagnosticData();
  return data.system || {};
}

/**
 * Persist a newly created urinalysis report to MongoDB via POST /api/reports
 * @param {Object} report
 * @returns {Promise<Object>} Saved report from MongoDB
 */
export async function saveReport(report) {
  try {
    console.log('[API] Sending report to MongoDB backend:', report);
    const payload = {
      ...report,
      reportId: report.id || report.reportId,
      patientId: report.patient || report.patientId,
      patientName: report.patientName,
      patientAge: report.patientAge,
      patientGender: report.patientGender,
      facility: report.facility,
      requestedBy: report.requestedBy,
      date: report.date,
      time: report.time,
      status: report.status,
      clinicalNote: report.clinicalNote,
      analytes: report.analytes,
      deviceModel: report.deviceModel,
    };

    const res = await fetch(`${BACKEND_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[API] Report successfully saved to MongoDB:', data.report);
      const saved = data.report;
      return {
        ...saved,
        id: saved.reportId || saved.id || report.id,
        patient: saved.patientId || saved.patient || report.patient,
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('[API] MongoDB save failed with HTTP status:', res.status, errData);
    }
  } catch (err) {
    console.error('[API] Error saving report to MongoDB backend:', err);
  }
  return report;
}

/**
 * Transmit report to Hospital HIS via POST /api/reports/:id/send-his
 * @param {string} reportId
 * @returns {Promise<Object>}
 */
export async function sendReportToHIS(reportId) {
  try {
    const res = await fetch(`${BACKEND_URL}/reports/${reportId}/send-his`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[API] Failed to transmit report to HIS:', err);
  }
  return { success: false };
}

/**
 * Submit clinical triage assessment to MongoDB via POST /api/triage
 * @param {Object} triageData
 * @returns {Promise<Object>}
 */
export async function submitTriage(triageData) {
  try {
    const res = await fetch(`${BACKEND_URL}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(triageData),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API] Triage submission notice:', err);
  }
  return null;
}

/**
 * Clear all reports from MongoDB
 */
export async function clearAllReports() {
  try {
    await fetch(`${BACKEND_URL}/reports/clear-all`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[API] Could not clear reports from backend:', err);
  }
}

/**
 * Send an image or sample key to backend computer vision colorimetry engine
 * @param {File|Blob|string|null} imageFileOrBase64
 * @param {Object|null} triageData
 * @param {string|null} sampleKey
 * @returns {Promise<Object>}
 */
export async function analyzeStripImageAPI(imageFileOrBase64, triageData = null, sampleKey = null) {
  try {
    let body;
    let headers = {};

    if (sampleKey) {
      body = JSON.stringify({ sampleKey, triageData });
      headers['Content-Type'] = 'application/json';
    } else if (typeof imageFileOrBase64 === 'string') {
      body = JSON.stringify({ imageBase64: imageFileOrBase64, triageData });
      headers['Content-Type'] = 'application/json';
    } else if (imageFileOrBase64 instanceof Blob || imageFileOrBase64 instanceof File) {
      const formData = new FormData();
      formData.append('stripImage', imageFileOrBase64);
      if (triageData) {
        formData.append('triageData', JSON.stringify(triageData));
      }
      body = formData;
    } else {
      throw new Error('Please select or upload a urine test strip image.');
    }

    const res = await fetch(`${BACKEND_URL}/reports/analyze-strip`, {
      method: 'POST',
      headers,
      body,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Analysis failed with HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('[API] analyzeStripImageAPI error:', err);
    throw err;
  }
}

export default {
  fetchDiagnosticData,
  fetchReports,
  fetchInitialReports,
  fetchPadDefinitions,
  fetchSampleProfiles,
  fetchTriagePresets,
  fetchSystemInfo,
  saveReport,
  sendReportToHIS,
  submitTriage,
  clearAllReports,
  analyzeStripImageAPI,
};

