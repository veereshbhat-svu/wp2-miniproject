/**
 * UrineScan Asynchronous API Client Service Layer
 * Fetches diagnostic benchmarks, clinical profiles, pad definitions, and pre-seeded patient reports
 * from /data/diagnostic_data.json via modern Fetch API.
 */

const DATA_URL = '/data/diagnostic_data.json';
let cachedData = null;

/**
 * Fetch the master diagnostic JSON dataset
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
    console.error('API Error: Failed to fetch diagnostic data from JSON source', error);
    throw error;
  }
}

/**
 * Fetch initial pre-seeded patient reports
 * @returns {Promise<Array>} List of initial reports
 */
export async function fetchInitialReports() {
  const data = await fetchDiagnosticData();
  return data.initialReports || [];
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
 * Persist a newly created urinalysis report
 * @param {Object} report
 * @returns {Promise<Object>}
 */
export async function saveReport(report) {
  // Simulates an async API call to save a report
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, report });
    }, 150);
  });
}

export default {
  fetchDiagnosticData,
  fetchInitialReports,
  fetchPadDefinitions,
  fetchSampleProfiles,
  fetchTriagePresets,
  fetchSystemInfo,
  saveReport,
};
