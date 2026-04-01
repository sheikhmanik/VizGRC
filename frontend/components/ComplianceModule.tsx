
import React, { useState, useEffect, useMemo } from 'react';
import GlassCard from './GlassCard';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  Plus, Shield, Activity, ChevronLeft, ChevronDown, 
  ArrowLeft, AlignLeft, ShieldCheck, Search, ListCheck, 
  FileText, Layout, MessageSquare, XCircle, FileStack, 
  FileUp, Info, Download, Edit2, InfoIcon, ExternalLink,
  PlusCircle, User, Calendar, Briefcase, Zap, ClipboardList,
  Trash2, Terminal, ShieldAlert,
  Upload
} from 'lucide-react';
import { Assessment, NavigationTab, Control, Framework } from '../types';
import api from './api/AxiosInstance';
import { Link } from 'react-router-dom';

type ComplianceViewMode = 'assessment' | 'audit';

interface ComplianceModuleProps {
  activeTab?: NavigationTab;
  frameworks: Framework[];
  controls: Control[];
  assessments: Assessment[];
  audit: Assessment[];
  setAudit: React.Dispatch<React.SetStateAction<Assessment[]>>;
  setAssessments: React.Dispatch<React.SetStateAction<Assessment[]>>;
  addAuditEntry: (action: string, details: string) => void;
}

const VERIFICATION_STATUS_OPTIONS = [
  { value: 'To do', label: 'To do', color: '#cbd5e1' },
  { value: 'In progress', label: 'In progress', color: '#3b82f6' },
  { value: 'Non compliant', label: 'Non compliant', color: '#f43f5e' },
  { value: 'Partially compliant', label: 'Partially compliant', color: '#fbbf24' },
  { value: 'Compliant', label: 'Compliant', color: '#10b981' },
  { value: 'Not applicable', label: 'Not applicable', color: '#1e293b' },
];

interface NodeAssessmentState {
  status: string;
  mitigations: string[]; // IDs of linked system controls
  manualMitigations: string[]; // Self-defined text mitigations
  observation: string;
  evidenceCount: number;
}

const ComplianceModule: React.FC<ComplianceModuleProps> = ({ 
  activeTab, 
  frameworks = [],
  controls = [], 
  assessments = [], 
  setAssessments,
  audits = [],
  setAudits,
  addAuditEntry
}) => {
  const [viewMode, setViewMode] = useState<ComplianceViewMode>('assessment');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [activeDrillNode, setActiveDrillNode] = useState<{ controlId: string, nodeId: string, index: string } | null>(null);
  const [findings, setFindings] = useState<Record<string, NodeAssessmentState>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [editingAuditId, setEditingAuditId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFindingDetails, setCurrentFindingDetails] = useState<any>(null);

  // Form State for New Assessment
  const [newAssessmentForm, setNewAssessmentForm] = useState({
    name: '',
    frameworkId: frameworks[0]?.id || '',
    project: '',
    author: 'Alex Rivera'
  });

  const activeAssessment = useMemo(() => 
    (assessments || []).find(a => a.id === selectedAssessmentId),
  [selectedAssessmentId, assessments]);
  
  const activeAudit = useMemo(() => 
    (audits || []).find(a => a.id === selectedAuditId),
  [selectedAuditId, audits]);

  const engagementControls = useMemo(() => {
    if (viewMode === 'assessment') {
      if (!activeAssessment || !controls) return [];
      return (controls || []).filter(c => c.frameworks.includes(activeAssessment.frameworkId));
    } else {
      if (!activeAudit || !controls) return [];
      return (controls || []).filter(c => c.frameworks.includes(activeAudit.frameworkId));
    }
  }, [activeAssessment, activeAudit, controls]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    VERIFICATION_STATUS_OPTIONS.forEach(opt => counts[opt.value] = 0);
    
    Object.values(findings).forEach((f: NodeAssessmentState) => {
      if (counts[f.status] !== undefined) counts[f.status]++;
    });

    const totalNodes = engagementControls.reduce((acc, c) => acc + (c.controlSchema?.length || 1), 0);
    const assessedCount = Object.keys(findings).length;
    counts['To do'] += Math.max(0, totalNodes - assessedCount);

    return VERIFICATION_STATUS_OPTIONS.map(opt => ({
      name: opt.label,
      value: counts[opt.value],
      color: opt.color
    })).filter(d => d.value > 0);
  }, [findings, engagementControls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: Assessment = {
      id: isEditing ? editingAssessmentId : `AS-${Math.floor(Math.random() * 9000) + 1000}`,
      name: newAssessmentForm.name,
      frameworkId: newAssessmentForm.frameworkId,
      project: newAssessmentForm.project,
      author: newAssessmentForm.author,
      status: 'In Progress',
      progress: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    const payload = {
      id: newEntry.id,
      name: newEntry.name,
      frameworkId: newEntry.frameworkId,
      project: newEntry.project,
      author: newEntry.author,
      status: newEntry.status,
      progress: newEntry.progress,
      lastUpdated: newEntry.lastUpdated,
    }
    
    try {
      if (!isEditing) {
        if (viewMode === 'assessment') {
          api.post('/compliance/create-assessment', payload);
        } else {
          api.post('/compliance/create-audit', payload);
        }
      } else {
        if (viewMode === 'assessment') {
          api.put(`/compliance/update-assessment/${newEntry.id}`, payload);
        } else {
          api.put(`/compliance/update-audit/${newEntry.id}`, payload);
        }
      }
    } catch {
      console.error('Failed to create assessment on backend');
      return null;
    }

    if (!isEditing) {
      if (viewMode === 'assessment') {
        setAssessments([newEntry, ...assessments]);
      } else {
        setAudits([newEntry, ...audits]);
      }
    } else {
      if (viewMode === 'assessment') {
        setAssessments(assessments.map(a => a.id === newEntry.id ? newEntry : a));
      } else {
        setAudits(audits.map(a => a.id === newEntry.id ? newEntry : a));
      }
    }
    addAuditEntry('Initialize Engagement', `Started new ${viewMode}: ${newEntry.id} - ${newEntry.name}`);
    setIsModalOpen(false);
    if (viewMode === 'assessment') {
      setSelectedAssessmentId(newEntry.id);
    } else {
      setSelectedAuditId(newEntry.id);
    }
    setIsEditing(false);
    setEditingAssessmentId(null);
    setEditingAuditId(null);

    // clearing the form
    setNewAssessmentForm({
      name: '',
      frameworkId: frameworks[0]?.id || '',
      project: '',
      author: 'Alex Rivera'
    })
  };

  const createDefaultFinding = (nodeId: string, controlId: string) => ({
    nodeId,
    controlId,
    status: 'To do',
    mitigations: [],
    manualMitigations: [],
    observation: '',
    evidenceCount: 0,
    evidence: '',
    assessmentId: activeAssessment?.id || null,
    auditId: activeAudit?.id || null,
  });

  const updateFinding = (
    nodeId: string,
    field: keyof NodeAssessmentState,
    value: any
  ) => {
    setFindings(prev => {
      const index = prev.findIndex(f => f.nodeId === nodeId);
  
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
        return updated;
      }

      const newFinding = {
        ...createDefaultFinding(nodeId, activeDrillNode.controlId),
        [field]: value,
      };
  
      return [...prev, newFinding];
    });
  };

  const addMitigation = (nodeId: string, internalId: string) => {
    if (internalId === 'none') return;
    const existing = findings.find(f => f.nodeId === nodeId);
    const current = existing?.mitigations || [];
    
    if (!current.includes(internalId)) {
      updateFinding(nodeId, 'mitigations', [...current, internalId]);
    }
  };

  const addManualMitigation = (nodeId: string) => {
    if (!manualInput.trim()) return;
  
    const existing = findings.find(f => f.nodeId === nodeId);
  
    const current = existing?.manualMitigations || [];
  
    updateFinding(nodeId, 'manualMitigations', [
      ...current,
      manualInput.trim()
    ]);
  
    setManualInput('');
  };

  const removeMitigation = (nodeId: string, internalId: string) => {    
    const existing = findings.find(f => f.nodeId === nodeId);
    const current = existing?.mitigations || [];
    updateFinding(nodeId, 'mitigations', current.filter(id => id !== internalId));
  };

  const removeManualMitigation = (nodeId: string, text: string) => {
    const existing = findings.find(f => f.nodeId === nodeId);
    const current = existing?.manualMitigations || [];
    updateFinding(nodeId, 'manualMitigations', current.filter(t => t !== text));
  };

  function editAssessment(id: string) {
    setIsModalOpen(true);
    
    const assessment = viewMode === "assessment"
      ? assessments.find(a => a.id === id)
      : audits.find(a => a.id === id)
    ;
    
    setNewAssessmentForm({
      name: assessment?.name || '',
      frameworkId: assessment?.frameworkId || '',
      project: assessment?.project || '',
    });
    setIsEditing(true);
  }

  // Sync viewMode
  useEffect(() => {
    if (activeTab === NavigationTab.ComplianceAssessment) {
      setViewMode('assessment');
      setSelectedAssessmentId(null);
      setSelectedAuditId(null);
    } else if (activeTab === NavigationTab.ComplianceAudit) {
      setViewMode('audit');
      setSelectedAssessmentId(null);
      setSelectedAuditId(null);
    }
    setActiveDrillNode(null);
    setCurrentFindingDetails(null);
  }, [activeTab]);

  useEffect(() => {
    api
      .get('/compliance/get-findings')
      .then(res => {
        setFindings(res.data);
        console.log('Fetched findings:', res.data);
      })
      .catch(err => console.error('Failed to fetch findings:', err));
  }, []);

  // DRILL-DOWN: THE NEXT PAGE
  if (activeDrillNode && (activeAssessment || activeAudit)) {
    const { controlId, nodeId, index } = activeDrillNode;
    const control = controls.find(c => c.id === controlId);
    const nodeState = findings.map(f => f.nodeId === nodeId ? f : null).filter(f => 
      ((f !== null) && (activeAssessment ? activeAssessment.id === f.assessmentId : activeAudit.id === f.auditId)))[0]
      || { status: 'To do', mitigations: [], manualMitigations: [], observation: '', evidenceCount: 0 }
    ;

    const requirementText = control?.customValues?.[nodeId] || control?.description;

    async function handleCommitFindings() {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await api.post("/upload/evidence", formData);
      const fileUrl = uploadRes.data.url;

      const payload = {
        nodeId,
        controlId,
        status: nodeState.status,
        observation: nodeState.observation,
        mitigations: nodeState.mitigations,
        manualMitigations: nodeState.manualMitigations,
        evidenceCount: nodeState.evidenceCount,
        evidence: fileUrl,
        assessmentId: activeAssessment?.id || null,
        auditId: activeAudit?.id || null,
      };
    
      try {
        await api.post("/compliance/save-findings", payload);
        await api.get("/compliance/get-findings").then(res => setFindings(res.data));
    
        addAuditEntry(
          'Update Finding',
          `Committed compliance results for ${index} in engagement ${activeAssessment ? activeAssessment.id : activeAudit.id}. Status: ${nodeState.status}`
        );
    
        setActiveDrillNode(null);
        setSelectedFile(null);
      } catch (err) {
        console.error(err);
        alert("Failed to save finding");
      }
    }

    return (
      <div className="space-y-12 animate-in slide-in-from-right-8 duration-500 pb-32">
        <div className="flex flex-col gap-6 pb-8 border-b border-slate-200 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-xl z-[100]">
          <div className="flex items-center gap-6 max-w-7xl mx-auto w-full px-6">
            <button 
              onClick={() => {
                setActiveDrillNode(null);
                setCurrentFindingDetails(null);
              }}
              className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1">
                <ShieldCheck size={12} /> Finding Detail Workspace
              </div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                <span className="text-slate-400 font-mono text-2xl mr-4">{index}</span>
                {control?.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-12">
            <section className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <AlignLeft size={14} /> Requirement Definition
              </h4>
              <GlassCard className="bg-white border-slate-200 p-8 rounded-[2rem] shadow-xl shadow-slate-200/40">
                <p className="text-[15px] text-slate-700 font-medium leading-relaxed">
                  {requirementText}
                </p>
              </GlassCard>
            </section>

            <section className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Shield size={14} className="text-blue-500" /> Operational Mitigations
              </h4>
              <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] space-y-10 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Link System Control</p>
                    <CustomSelect 
                      options={[{ value: 'none', label: 'Select Internal Control...' }, ...controls.map(c => ({ value: c.id, label: `${c.id}: ${c.name}` }))]}
                      value="none"
                      onChange={(val) => addMitigation(nodeId, val)}
                      placeholder="Pick from catalog..."
                    />
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Self-Defined Mitigation</p>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 transition-all font-light"
                        placeholder="Define manual strategy..."
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addManualMitigation(nodeId)}
                      />
                      <button 
                        onClick={() => addManualMitigation(nodeId)}
                        className="px-6 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Mitigation Registry</p>
                  
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50/30">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-40">Type</th>
                          <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identity / Mitigation Strategy</th>
                          <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-20 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* System Mitigations */}
                        {nodeState.mitigations.map(id => {
                          const sysControl = controls.find(c => c.id === id);
                          return (
                            <tr key={id} className="group/row hover:bg-white transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-tighter">
                                  <Shield size={12} strokeWidth={2.5} /> System Control
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-[13px] text-slate-700 font-medium">{sysControl?.name || id}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{id}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button 
                                  onClick={() => removeMitigation(nodeId, id)}
                                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Manual Mitigations */}
                        {nodeState.manualMitigations.map(text => (
                          <tr key={text} className="group/row hover:bg-white transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-tighter">
                                <Zap size={12} strokeWidth={2.5} /> Operational
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-[13px] text-slate-700 font-light italic leading-relaxed">{text}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => removeManualMitigation(nodeId, text)}
                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {nodeState.mitigations.length === 0 && nodeState.manualMitigations.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center">
                              <ShieldAlert size={24} className="mx-auto text-slate-200 mb-3" />
                              <p className="text-[11px] text-slate-400 italic">No mitigations currently registered for this requirement.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-12">
            <section className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Activity size={14} className="text-emerald-500" /> Engagement Findings
              </h4>
              <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                <CustomSelect 
                  options={VERIFICATION_STATUS_OPTIONS}
                  value={nodeState.status}
                  onChange={(val) => updateFinding(nodeId, 'status', val)}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <MessageSquare size={14} className="text-indigo-500" /> Observations
              </h4>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-[2.5rem] p-8 text-[14px] text-slate-900 font-light h-48 focus:outline-none focus:border-indigo-300 transition-all resize-none shadow-sm"
                placeholder="Narrative findings..."
                value={nodeState.observation}
                onChange={(e) => updateFinding(nodeId, 'observation', e.target.value)}
              />
            </section>

            <section className="space-y-4">
               <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <FileStack size={14} className="text-amber-500" /> Evidence Option
              </h4>
              {/* <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-all cursor-pointer border-dashed border-2">
                  <FileUp size={32} className="text-slate-300 group-hover:text-blue-500 transition-colors mb-3" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload/Link Evidence</p>
              </div> */}
              <label className="border-2 border-dashed border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors mb-4">
                  <Upload size={24} />
                </div>
                {selectedFile ? (
                  <p className="text-sm text-slate-500 font-medium">{selectedFile.name}</p>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Drop artifacts here</p>
                    <p className="text-[10px] text-slate-400 mt-2">Maximum file size 50MB</p>
                  </div>
                )}
              </label>
              {currentFindingDetails?.evidence && (
                <a
                  href={currentFindingDetails.evidence}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-500"
                >
                  Click here to see the evidence
                </a>
              )}
            </section>

            <button 
              onClick={handleCommitFindings}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] text-[12px] font-bold uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
            >
              Commit Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN WORKSPACE (REQUIREMENT TREE VIEW)
  if (selectedAssessmentId && activeAssessment) {
    const framework = frameworks.find(f => f.id === activeAssessment.frameworkId);
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-32 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2 text-[11px] text-blue-600 font-medium tracking-wide">
              <button onClick={() => setSelectedAssessmentId(null)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                 <ChevronLeft size={14} />
              </button>
              <Layout size={14} /> <span className="uppercase font-bold tracking-widest">Engagement Workspace</span>
           </div>
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                 <Download size={14} /> Export
              </button>
           </div>
        </div>

        <div className="glass p-12 rounded-[2rem] bg-white border-slate-200 shadow-xl shadow-slate-200/50">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-4">
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Project</span>
                    <span className="text-[13px] text-indigo-600 font-semibold">{activeAssessment.project || 'ISMS'}</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Authors</span>
                    <span className="text-[13px] text-indigo-600 font-semibold">{activeAssessment.author}</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Reviewers</span>
                    <span className="text-[13px] text-slate-400 font-medium">--</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Framework</span>
                    <span className="text-[13px] text-indigo-600 font-semibold leading-relaxed">
                       {framework?.name} v{framework?.version}
                    </span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Name</span>
                    <span className="text-[13px] text-slate-700 font-medium">{activeAssessment.name}</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4 pt-2">
                    <span className="text-[13px] font-bold text-slate-800">Status</span>
                    <span className="text-[13px] text-slate-700 font-medium">{activeAssessment.status}</span>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="w-48 h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={chartData.length > 0 ? chartData : [{ name: 'To do', value: 1, color: '#cbd5e1' }]}
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                          >
                             {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-2 flex-1">
                    {VERIFICATION_STATUS_OPTIONS.map(opt => (
                       <div key={opt.value} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded" style={{ backgroundColor: opt.color }}></div>
                          <span className="text-[12px] text-slate-500 font-medium">{opt.label}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-12 pt-8">
           <h3 className="text-xl font-bold text-slate-900 tracking-tight">Associated requirements</h3>
           
           <div className="space-y-10 pl-4 border-l-2 border-slate-100 ml-2">
              {engagementControls.map((control) => (
                 <div key={control.id} className="space-y-6 relative">
                    <div className="flex items-center gap-3 -ml-6 bg-[#f8fafc] pr-4">
                       <div className="p-1 bg-white border border-slate-200 rounded text-slate-400">
                          <ChevronDown size={14} />
                       </div>
                       <h4 className="text-[16px] font-bold text-slate-900">{control.name}</h4>
                    </div>

                    <div className="space-y-8 pl-8 border-l-2 border-slate-100 ml-1">
                       {(control.controlSchema || []).map((node) => {
                          const level = control.customValues?.[`_level_${node.id}`] || 1;
                          const idxLabel = control.customValues?.[`_idx_${node.id}`] || '';
                          const nodeText = control.customValues?.[node.id] || '';
                          const nodeState = findings.map(f => {
                            if (f.nodeId === node.id && f.assessmentId === activeAssessment.id && !f.auditId) {
                              return f;
                            } else {
                              return null;
                            }
                          }).filter(f => f !== null)[0] || { status: 'To do' };
                          
                          async function handleActiveDrillNode({ controlId, nodeId, index }: { controlId: string; nodeId: string; index: string }) {
                            setActiveDrillNode({ controlId, nodeId, index });
                            await api.get(`/compliance/get-findings/${nodeId}/${controlId}`)
                            .then(res => {
                              const response = res.data;
                              if (response) {
                                if (activeAssessment && response.assessmentId === activeAssessment.id) {
                                  setCurrentFindingDetails(response);
                                } else {
                                  setCurrentFindingDetails(null);
                                }
                              }
                            })
                            .catch(err => {
                              console.error("Failed to fetch finding details:", err);
                            });
                          }

                          return (
                             <div 
                                key={node.id} 
                                className="relative flex items-center justify-between group"
                                style={{ marginLeft: `${(level - 1) * 32}px` }}
                             >
                                <div className="absolute -left-10 w-4 h-0.5 bg-slate-100"></div>
                                <div className="flex items-center gap-4 flex-1">
                                   <div className="flex items-center gap-3 flex-1">
                                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded border border-slate-200 uppercase tracking-widest min-w-[70px] text-center">
                                         {nodeState.status}
                                      </span>
                                      <div className="flex flex-col">
                                         <button 
                                            onClick={() => handleActiveDrillNode({ controlId: control.id, nodeId: node.id, index: idxLabel })}
                                            className="text-[14px] text-indigo-600 font-semibold text-left hover:underline transition-all leading-relaxed"
                                         >
                                            {idxLabel} - {nodeText}
                                         </button>
                                         <button className="flex items-center gap-1.5 text-[11px] text-slate-900 font-bold mt-1 hover:text-blue-600 transition-colors">
                                            <InfoIcon size={12} /> Learn more
                                         </button>
                                      </div>
                                   </div>
                                </div>
                                <div className="hidden lg:flex items-center gap-4">
                                   <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-slate-200/50 w-full"></div>
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    );
  }
  if (selectedAuditId && activeAudit) {
    const framework = frameworks.find(f => f.id === activeAudit.frameworkId);
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-32 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2 text-[11px] text-blue-600 font-medium tracking-wide">
              <button
                onClick={() => {
                  setSelectedAuditId(null);
                }}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <ChevronLeft size={14} />
              </button>
              <Layout size={14} /> <span className="uppercase font-bold tracking-widest">Engagement Workspace</span>
           </div>
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                 <Download size={14} /> Export
              </button>
           </div>
        </div>

        <div className="glass p-12 rounded-[2rem] bg-white border-slate-200 shadow-xl shadow-slate-200/50">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-4">
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Project</span>
                    <span className="text-[13px] text-indigo-600 font-semibold">{activeAudit.project || 'ISMS'}</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Authors</span>
                    <span className="text-[13px] text-indigo-600 font-semibold">{activeAudit.author}</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Reviewers</span>
                    <span className="text-[13px] text-slate-400 font-medium">--</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Framework</span>
                    <span className="text-[13px] text-indigo-600 font-semibold leading-relaxed">
                       {framework?.name} v{framework?.version}
                    </span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4">
                    <span className="text-[13px] font-bold text-slate-800">Name</span>
                    <span className="text-[13px] text-slate-700 font-medium">{activeAudit.name}</span>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] gap-4 pt-2">
                    <span className="text-[13px] font-bold text-slate-800">Status</span>
                    <span className="text-[13px] text-slate-700 font-medium">{activeAudit.status}</span>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="w-48 h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={chartData.length > 0 ? chartData : [{ name: 'To do', value: 1, color: '#cbd5e1' }]}
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                          >
                             {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                          </Pie>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-2 flex-1">
                    {VERIFICATION_STATUS_OPTIONS.map(opt => (
                       <div key={opt.value} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded" style={{ backgroundColor: opt.color }}></div>
                          <span className="text-[12px] text-slate-500 font-medium">{opt.label}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-12 pt-8">
           <h3 className="text-xl font-bold text-slate-900 tracking-tight">Associated requirements</h3>
           
           <div className="space-y-10 pl-4 border-l-2 border-slate-100 ml-2">
              {engagementControls.map((control) => (
                 <div key={control.id} className="space-y-6 relative">
                    <div className="flex items-center gap-3 -ml-6 bg-[#f8fafc] pr-4">
                       <div className="p-1 bg-white border border-slate-200 rounded text-slate-400">
                          <ChevronDown size={14} />
                       </div>
                       <h4 className="text-[16px] font-bold text-slate-900">{control.name}</h4>
                    </div>

                    <div className="space-y-8 pl-8 border-l-2 border-slate-100 ml-1">
                       {(control.controlSchema || []).map((node) => {
                          const level = control.customValues?.[`_level_${node.id}`] || 1;
                          const idxLabel = control.customValues?.[`_idx_${node.id}`] || '';
                          const nodeText = control.customValues?.[node.id] || '';
                          const nodeState = findings.map(f => {
                            if (f.nodeId === node.id && f.auditId === activeAudit.id && !f.assessmentId) {
                              return f;
                            } else {
                              return null;
                            }
                          }).filter(f => f !== null)[0] || { status: 'To do' };

                          async function handleActiveDrillNode({ controlId, nodeId, index }: { controlId: string; nodeId: string; index: string }) {
                            setActiveDrillNode({ controlId, nodeId, index });
                            await api.get(`/compliance/get-findings/${nodeId}/${controlId}`)
                            .then(res => {
                              const response = res.data;
                              if (response) {
                                if (activeAudit && response.auditId === activeAudit.id) {
                                  setCurrentFindingDetails(response);
                                } else {
                                  setCurrentFindingDetails(null);
                                }
                              }
                            })
                            .catch(err => {
                              console.error("Failed to fetch finding details:", err);
                            });
                          }

                          return (
                             <div 
                                key={node.id} 
                                className="relative flex items-center justify-between group"
                                style={{ marginLeft: `${(level - 1) * 32}px` }}
                             >
                                <div className="absolute -left-10 w-4 h-0.5 bg-slate-100"></div>
                                <div className="flex items-center gap-4 flex-1">
                                   <div className="flex items-center gap-3 flex-1">
                                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded border border-slate-200 uppercase tracking-widest min-w-[70px] text-center">
                                        {nodeState.status}
                                      </span>
                                      <div className="flex flex-col">
                                         <button 
                                            onClick={() => handleActiveDrillNode({ controlId: control.id, nodeId: node.id, index: idxLabel })}
                                            className="text-[14px] text-indigo-600 font-semibold text-left hover:underline transition-all leading-relaxed"
                                         >
                                            {idxLabel} - {nodeText}
                                         </button>
                                         <button className="flex items-center gap-1.5 text-[11px] text-slate-900 font-bold mt-1 hover:text-blue-600 transition-colors">
                                            <InfoIcon size={12} /> Learn more
                                         </button>
                                      </div>
                                   </div>
                                </div>
                                <div className="hidden lg:flex items-center gap-4">
                                   <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-slate-200/50 w-full"></div>
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  // DEFAULT DASHBOARD VIEW
  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col gap-8 pb-6 border-b border-slate-100 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-xl z-[40]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-[11px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
              Compliance Hub
            </div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
               {viewMode === 'assessment' ? 'Internal Assessments' : 'Third-party Audit Engagements'}
            </h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} /> {viewMode === 'assessment' ? 'New Assessment' : 'New Audit Engagement'}
          </button>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white/50 border border-slate-200 rounded-[2rem] shadow-sm">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
             <input 
               type="text"
               placeholder={`Search ${viewMode} engagements...`}
               className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[12px] focus:outline-none focus:border-blue-400 shadow-sm font-light transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {viewMode === "assessment" && assessments.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
          const framework = (frameworks || []).find(f => f.id === item.frameworkId);
          return (
            <GlassCard key={item.id} noOverflow className="bg-white/80 border-slate-200/50 hover:border-blue-300 transition-all p-8 rounded-[2rem] group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex gap-6 flex-1">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <ClipboardList size={28} strokeWidth={1.2} />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-[18px] font-semibold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{item.name}</h4>
                    <div className="flex items-center gap-4 text-[12px] text-slate-400 font-medium">
                       <div className="flex items-center gap-1.5"><Briefcase size={12} /> {framework?.name}</div>
                       <span className="opacity-20">|</span> 
                       <div className="flex items-center gap-1.5"><Calendar size={12} /> {item.lastUpdated.split('T')[0]}</div>
                       <span className="opacity-20">|</span>
                       <div className="flex items-center gap-1.5"><Activity size={12} className="text-blue-400" /> <span className="text-blue-600/70 font-bold uppercase text-[10px]">{item.status}</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <button onClick={() => { setEditingAssessmentId(item.id); editAssessment(item.id)}} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => {
                      if (viewMode === "assessment") {
                        setSelectedAssessmentId(item.id)
                      } else {
                        setSelectedAuditId(item.id);
                      }
                    }}
                    className="w-full px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200/50"
                  >
                    Enter Workspace
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
        {viewMode === "audit" && audits.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
          const framework = (frameworks || []).find(f => f.id === item.frameworkId);
          return (
            <GlassCard key={item.id} noOverflow className="bg-white/80 border-slate-200/50 hover:border-blue-300 transition-all p-8 rounded-[2rem] group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex gap-6 flex-1">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <ClipboardList size={28} strokeWidth={1.2} />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-[18px] font-semibold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{item.name}</h4>
                    <div className="flex items-center gap-4 text-[12px] text-slate-400 font-medium">
                       <div className="flex items-center gap-1.5"><Briefcase size={12} /> {framework?.name}</div>
                       <span className="opacity-20">|</span> 
                       <div className="flex items-center gap-1.5"><Calendar size={12} /> {item.lastUpdated.split('T')[0]}</div>
                       <span className="opacity-20">|</span>
                       <div className="flex items-center gap-1.5"><Activity size={12} className="text-blue-400" /> <span className="text-blue-600/70 font-bold uppercase text-[10px]">{item.status}</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <button onClick={() => { setEditingAssessmentId(item.id); editAssessment(item.id)}} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => {
                      if (viewMode === "assessment") {
                        setSelectedAssessmentId(item.id)
                      } else {
                        setSelectedAuditId(item.id);
                      }
                    }}
                    className="w-full px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200/50"
                  >
                    Enter Workspace
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewAssessmentForm({
            name: '',
            frameworkId: frameworks[0]?.id || '',
            project: '',
            author: 'Alex Rivera'
          });
        }}
        title="Initialize Workflow"
      >
        <form onSubmit={handleCreateAssessment} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Engagement Name</label>
            <input 
              required 
              type="text" 
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 transition-all shadow-sm"
              value={newAssessmentForm.name}
              onChange={(e) => setNewAssessmentForm({...newAssessmentForm, name: e.target.value})}
              placeholder="e.g. Q1 ISMS Surveillance"
            />
          </div>

          <CustomSelect 
            label="Source Framework"
            options={frameworks.map(f => ({ value: f.id, label: `${f.name} v${f.version}` }))}
            value={newAssessmentForm.frameworkId}
            onChange={(val) => setNewAssessmentForm({...newAssessmentForm, frameworkId: val})}
          />

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Project</label>
            <input 
              type="text" 
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 transition-all shadow-sm"
              value={newAssessmentForm.project}
              onChange={(e) => setNewAssessmentForm({...newAssessmentForm, project: e.target.value})}
              placeholder="Project Context"
            />
          </div>

          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/10 active:scale-95 transition-all">Initialize Engagement</button>
        </form>
      </Modal>
    </div>
  );
};

export default ComplianceModule;
