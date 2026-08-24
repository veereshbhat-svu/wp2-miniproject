import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Scan, FileText, ClipboardType } from 'lucide-react';
import { ReportProvider, ReportContext, useReports } from './context/ReportContext';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Report from './pages/Report';
import Patient from './pages/Patient';
import Triage from './pages/Triage';

export { ReportContext, useReports };

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyze', label: 'Analyze', icon: Scan },
  { path: '/triage', label: 'Triage', icon: ClipboardType },
  { path: '/reports', label: 'Reports', icon: FileText },
];

function Topnav() {
  const location = useLocation();
  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <Activity size={20} color="#4338ca" />
        <h1>UrineScan</h1>
      </div>
      <div className="topnav-links">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={`topnav-link ${isActive(item.path) ? 'active' : ''}`}>
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </div>
      <div className="topnav-right">
        <div className="dot" />
        <span>System Online</span>
      </div>
    </nav>
  );
}

function App() {
  return (
    <ReportProvider>
      <Router>
        <Topnav />
        <div className="page-wrap">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<Analysis />} />
            <Route path="/triage" element={<Triage />} />
            <Route path="/reports" element={<Report />} />
            <Route path="/reports/:id" element={<Report />} />
            <Route path="/patients/:id" element={<Patient />} />
          </Routes>
        </div>
      </Router>
    </ReportProvider>
  );
}

export default App;