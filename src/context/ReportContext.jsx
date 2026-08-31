import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchInitialReports, saveReport as apiSaveReport } from '../services/api';

export const ReportContext = createContext();

const STORAGE_KEY = 'urinescan_reports_data';
const TRIAGE_STORAGE_KEY = 'urinescan_active_triage';

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  // Initial load from JSON API if localStorage is empty
  useEffect(() => {
    async function loadSeedData() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved || JSON.parse(saved).length === 0) {
        setIsLoading(true);
        try {
          const initialReports = await fetchInitialReports();
          setReports(initialReports);
          setApiError(null);
        } catch (err) {
          console.error('Failed to load initial reports from API', err);
          setApiError('Failed to load reports from JSON API');
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadSeedData();
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
    try {
      await apiSaveReport(newReport);
    } catch (err) {
      console.warn('API saveReport notice:', err);
    }
    setReports((prev) => [newReport, ...prev]);
  };

  const getReportById = (id) => {
    if (!id || id === 'latest') return reports[0] || null;
    return reports.find((r) => r.id === id) || null;
  };

  const getReportsByPatient = (patientId) => {
    if (!patientId) return [];
    return reports.filter((r) => r.patient?.toLowerCase() === patientId.toLowerCase());
  };

  const clearAllReports = () => {
    setReports([]);
    setActiveTriage(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TRIAGE_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear localStorage', e);
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
