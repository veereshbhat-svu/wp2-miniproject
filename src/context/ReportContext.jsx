import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const addReport = (newReport) => {
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
