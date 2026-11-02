import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchInitialReports, saveReport as apiSaveReport, clearAllReports as apiClearAllReports } from '../services/api';

export const ReportContext = createContext();

const STORAGE_KEY = 'urinescan_reports_data';
const TRIAGE_STORAGE_KEY = 'urinescan_active_triage';

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);

  const [activeTriage, setActiveTriage] = useState(() => {
    try {
      const saved = localStorage.getItem(TRIAGE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Sync directly with MongoDB database on mount: if DB is empty, nothing shows up
  useEffect(() => {
    async function syncWithBackend() {
      setIsLoading(true);
      try {
        const liveReports = await fetchInitialReports();
        setReports(liveReports || []);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(liveReports || []));
        setApiError(null);
      } catch (err) {
        console.warn('Could not sync with backend DB:', err);
        const saved = localStorage.getItem(STORAGE_KEY);
        setReports(saved ? JSON.parse(saved) : []);
      } finally {
        setIsLoading(false);
      }
    }

    syncWithBackend();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save reports to localStorage', e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      if (activeTriage) {
        localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(activeTriage));
      } else {
        localStorage.removeItem(TRIAGE_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save active triage to localStorage', e);
    }
  }, [activeTriage]);

  const addReport = async (newReport) => {
    let saved = null;
    try {
      saved = await apiSaveReport(newReport);
    } catch (err) {
      console.warn('API saveReport notice:', err);
    }
    const reportToAdd = saved || newReport;
    setReports((prev) => [reportToAdd, ...prev.filter((r) => r.id !== reportToAdd.id)]);
  };

  const getReportById = (id) => {
    if (!id || id === 'latest') return reports[0] || null;
    return reports.find((r) => r.id === id || r.reportId === id) || null;
  };

  const getReportsByPatient = (patientId) => {
    if (!patientId) return [];
    return reports.filter((r) => (r.patient || r.patientId)?.toLowerCase() === patientId.toLowerCase());
  };

  const clearAllReports = async () => {
    setReports([]);
    setActiveTriage(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TRIAGE_STORAGE_KEY);
      await apiClearAllReports();
    } catch (e) {
      console.error('Failed to clear localStorage / backend', e);
    }
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        setReports,
        activeTriage,
        setActiveTriage,
        addReport,
        getReportById,
        getReportsByPatient,
        clearAllReports,
        isLoading,
        apiError,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};
