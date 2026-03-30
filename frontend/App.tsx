
import React, { useState, useEffect, useCallback } from 'react';
import { NavigationTab, Framework, Control, Risk, Asset, Project, Assessment, PipelineTask, AuditEntry } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import RiskManagement from './components/RiskManagement';
import ControlsModule from './components/ControlsModule';
import FrameworksModule from './components/FrameworksModule';
import EvidenceModule from './components/EvidenceModule';
import SettingsModule from './components/SettingsModule';
import PipelineModule from './components/PipelineModule';
import ComplianceModule from './components/ComplianceModule';
import AuditLogModule from './components/AuditLogModule';
import Login from './components/Login';
import { Info } from 'lucide-react';
import { jwtDecode } from "jwt-decode";
import api from './components/api/AxiosInstance';
import AcceptInvite from './components/AcceptInvite';
import Profile from './components/Profile';

interface DecodedToken {
  exp: number;
  iat?: number;
  [key: string]: any;
}

const PlaceholderView = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-500 mb-6 shadow-sm">
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title} Module</h3>
    <p className="text-slate-400 max-w-sm text-sm">
      This module tracks {title.toLowerCase()} workflows. Data ingestion is currently functional in this demo preview.
    </p>
  </div>
);

const App: React.FC = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    const savedTab = localStorage.getItem("activeTab") as NavigationTab;
    return savedTab || NavigationTab.Dashboard;
  });

  // Global State
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [audits, setAudits] = useState<Assessment[]>([]);
  const [pipelineTasks, setPipelineTasks] = useState<PipelineTask[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);

  const addAuditEntry = useCallback(async (action: string, details: string) => {
    if (!isAuthenticated || !user) return;
    const entry: AuditEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      name: user?.name || 'Anonymous',
      action,
      details,
    };
    const payload = {
      id: entry.id,
      name: entry.name,
      action: entry.action,
      details: entry.details,
      timestamp: entry.timestamp,
    };
    try {
      await api.post("/audit/create-log", payload);
      setAuditLogs(prev => [entry, ...prev]);
    } catch (error) {
      console.error("Failed to log audit entry:", error);
      return null;
    }
  }, [user, isAuthenticated]);

  const handleLogin = async (userData: any) => {
    setLoginError(null);
    const { email, password } = userData;

    try {
      const response = await api.post("/auth/login", { email, password })
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
    } catch (error) {
      if (error.response?.data?.code === "PASSWORD_EXPIRED") {
        alert("Your password has been expired. Please check your email to reset it.");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setLoginError("Password expired. Please check your mail and reset password.");
        return;
      }
      if (error.response?.data?.code === "EMAIL_ALREADY_SENT") {
        alert("A password reset email has already been sent to your address. If somehow your mail is deleted then please try after some time.");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setLoginError("Password expired. Please check your mail and reset password.");
        return;
      };
      const err = error.response?.data?.error || 'Login failed. Please try again.';
      setLoginError(err);
      setIsAuthenticated(false);
      return;
    }
    
    const currentUser = await api.get("/settings/get-user");

    // Log login
    const entry: AuditEntry = {
      id: 'L-' + Date.now(),
      timestamp: new Date().toISOString(),
      name: currentUser.data.name,
      action: 'Authentication',
      details: `User session established from ${userData.email}`
    };
    const payload = {
      id: entry.id,
      name: entry.name,
      action: entry.action,
      details: entry.details,
      timestamp: entry.timestamp,
    };
    try {
      await api.post("/audit/create-log", payload);
      setAuditLogs(prev => [entry, ...prev]);
    } catch (error) {
      console.error("Failed to log audit entry:", error);
      return null;
    }
    setActiveTab(NavigationTab.Dashboard);
  };

  const handleLogout = async () => {
    await addAuditEntry('Authentication', 'User session terminated manually');
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("token");
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      try {
        const decoded: DecodedToken = jwtDecode(storedToken);

        const currentTime = Date.now() / 1000;
        if (decoded.exp > currentTime) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Invalid token");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      }
    }

    setAuthChecked(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get("/frameworks/get-frameworks")
      .then((res) => setFrameworks(res.data))
      .catch((err) => console.error(err));
    api
      .get("/frameworks/get-requirements")
      .then((res) => setControls(res.data))
      .catch((err) => console.error(err));
    api
      .get("/assets/get-assets")
      .then((res) => setAssets(res.data))
      .catch((err) => console.error(err));
    api
      .get("/settings/get-user")
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err?.response?.data?.message || err));
    api
      .get("/audit/get-logs")
      .then((res) => setAuditLogs(res.data))
      .catch((err) => console.error(err));
    api.get('/compliance/get-assessments')
      .then(response => setAssessments(response.data))
      .catch(error => { console.error('Failed to fetch assessments:', error) });
    api.get('/compliance/get-audits')
      .then(response => setAudits(response.data))
      .catch(error => { console.error('Failed to fetch assessments:', error) });
  }, [isAuthenticated]);

  const renderContent = () => {
    switch (activeTab) {
      case NavigationTab.Dashboard:
        return <Dashboard risks={risks} assets={assets} frameworks={frameworks} />;
      case NavigationTab.Assets:
        return <AssetList assets={assets} setAssets={setAssets} addAuditEntry={addAuditEntry} />;
      case NavigationTab.Risks:
      case NavigationTab.RiskAssessment:
        return (
          <RiskManagement 
            activeTab={activeTab}
            risks={risks} 
            setRisks={setRisks} 
            controls={controls} 
            assets={assets}
            addAuditEntry={addAuditEntry}
          />
        );
      case NavigationTab.Frameworks:
        return (
          <FrameworksModule 
            frameworks={frameworks} 
            setFrameworks={setFrameworks} 
            controls={controls} 
            setControls={setControls}
            addAuditEntry={addAuditEntry}
          />
        );
      case NavigationTab.Controls:
        return (
          <ControlsModule 
            controls={controls} 
            setControls={setControls}
            addAuditEntry={addAuditEntry}
          />
        );
      case NavigationTab.Evidence:
        return <EvidenceModule addAuditEntry={addAuditEntry} />;
      case NavigationTab.Settings:
        return <SettingsModule addAuditEntry={addAuditEntry} />;
      case NavigationTab.Pipeline:
        return (
          <PipelineModule 
            projects={projects} 
            setProjects={setProjects}
            tasks={pipelineTasks}
            setTasks={setPipelineTasks}
            addAuditEntry={addAuditEntry}
          />
        );
      case NavigationTab.Compliance:
      case NavigationTab.ComplianceAssessment:
      case NavigationTab.ComplianceAudit:
        return (
          <ComplianceModule 
            activeTab={activeTab} 
            frameworks={frameworks}
            setFrameworks={setFrameworks}
            controls={controls}
            assessments={assessments}
            setAssessments={setAssessments}
            audits={audits}
            setAudits={setAudits}
            addAuditEntry={addAuditEntry}
          />
        );
      case NavigationTab.AuditLog:
        return <AuditLogModule logs={auditLogs} />;
      case NavigationTab.Profile:
        return <Profile addAuditEntry={addAuditEntry} />;
      default:
        return <PlaceholderView title={(activeTab as string).replace('-', ' ')} icon={Info} />;
    }
  };

  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInviteToken(params.get("token"));
  }, []);

  if (inviteToken) return <AcceptInvite />;

  if (!authChecked) return null;

  if (!isAuthenticated) return <Login onLogin={handleLogin} loginError={loginError} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
