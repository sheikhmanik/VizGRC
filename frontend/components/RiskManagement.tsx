
import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from './GlassCard';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { 
  Plus, BrainCircuit, ShieldAlert, 
  Users, Calendar, 
  Activity, 
  X, Trash2,
  Shield, Search,
  ChevronLeft, FileSearch, Download, ChevronRight,
  AlertTriangle, Edit, Tag, HardDrive, CornerDownRight,
  Zap, Settings2, Check, Layout, AlignLeft, Lock,
  ShieldCheck
} from 'lucide-react';
import { Risk, Control, Asset, NavigationTab, RiskAssessment } from '../types';
import { getRiskRecommendation } from '../services/gemini';
import { MOCK_RISK_ASSESSMENTS, MOCK_ASSETS, MOCK_CONTROLS } from '../constants';
import { version } from 'os';
import api from './api/AxiosInstance';

// --- Shared Internal Component: DotGridSelector ---
const DotGridSelector = ({ value, onChange, label, colorClass, max = 5 }: { value: number; onChange: (val: number) => void; label: string, colorClass: string, max?: number }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center px-1">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Value:</span>
        <span className="text-[11px] font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded min-w-[24px] text-center">{value || '--'}</span>
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => {
        const num = i + 1;
        const isActive = value === num;
        return (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`flex-1 h-11 rounded-xl border-2 transition-all duration-300 flex items-center justify-center font-bold text-[13px] ${
              isActive 
                ? `${colorClass} border-transparent text-white shadow-lg scale-110 z-10`
                : 'bg-white border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-500'
            }`}
          >
            {num}
          </button>
        );
      })}
    </div>
  </div>
);

// --- Shared Helper: getScoreColor ---
// Fix: Added missing getScoreColor helper function
const getScoreColor = (score: number) => {
  if (score >= 16) return 'bg-rose-50 text-rose-600 border-rose-100';
  if (score >= 9) return 'bg-amber-50 text-amber-600 border-amber-100';
  if (score > 0) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  return 'bg-slate-50 text-slate-400 border-slate-100';
};

// --- Risk Matrix Visualization Component ---
interface RiskMatrixViewProps {
  risks: Risk[];
  matrixSize: 3 | 5;
  onRiskClick?: (risk: Risk) => void;
}

const RiskMatrixView: React.FC<RiskMatrixViewProps> = ({ risks, matrixSize, onRiskClick }) => {
  const getCellColor = (row: number, col: number) => {
    const score = (matrixSize - row) * (col + 1);
    const maxScore = matrixSize * matrixSize;
    
    if (score >= maxScore * 0.7) return 'bg-rose-100 border-rose-300';
    if (score >= maxScore * 0.5) return 'bg-orange-100 border-orange-300';
    if (score >= maxScore * 0.3) return 'bg-amber-100 border-amber-300';
    if (score >= maxScore * 0.1) return 'bg-yellow-100 border-yellow-300';
    return 'bg-emerald-100 border-emerald-300';
  };

  const getProbabilityLabel = (index: number) => {
    if (matrixSize === 3) {
      const labels = ['Low', 'Medium', 'High'];
      return labels[matrixSize - 1 - index];
    } else {
      const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
      return labels[matrixSize - 1 - index];
    }
  };

  const getImpactLabel = (index: number) => {
    if (matrixSize === 3) {
      const labels = ['Low', 'Medium', 'High'];
      return labels[index];
    } else {
      const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
      return labels[index];
    }
  };

  const getRisksInCell = (row: number, col: number, useResidual: boolean) => {
    return risks.filter(risk => {
      const likelihood = useResidual ? risk.residualLikelihood : risk.inherentLikelihood;
      const impact = useResidual ? risk.residualImpact : risk.inherentImpact;
      // Convert to 0-based index: row is inverted (top = high probability)
      const riskRow = matrixSize - likelihood;
      const riskCol = impact - 1;
      return riskRow === row && riskCol === col;
    });
  };

  const renderMatrix = (title: string, useResidual: boolean) => {
    return (
      <div className="space-y-4 w-full overflow-visible">
        <h4 className="text-sm font-bold text-slate-900 text-center">{title}</h4>
        <div className="relative w-full min-w-0">
          {/* Header row with Probability label */}
          <div className="flex gap-2 mb-1">
            <div className="w-24 flex items-center justify-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Probability</div>
            </div>
            <div className="flex-1"></div>
          </div>
          
          {/* Matrix rows with probability labels */}
          <div className="flex flex-col gap-1">
            {Array.from({ length: matrixSize }).map((_, rowIdx) => (
              <div key={`row-${rowIdx}`} className="flex items-stretch gap-2">
                {/* Probability label for this row */}
                <div className="w-24 flex items-center justify-center shrink-0">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">
                    {getProbabilityLabel(rowIdx)}
                  </div>
                </div>
                
                {/* Matrix cells for this row */}
                <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 1fr))` }}>
                  {Array.from({ length: matrixSize }).map((_, colIdx) => {
                    const cellRisks = getRisksInCell(rowIdx, colIdx, useResidual);
                    const riskCount = cellRisks.length;
                    const riskIds = cellRisks.map(r => r.id).join(', ');
                    const riskTitles = cellRisks.map(r => `${r.id}: ${r.title}`).join('\n');
                    
                    return (
                      <div
                        key={`cell-${rowIdx}-${colIdx}`}
                        className={`relative border-2 rounded-lg flex items-center justify-center overflow-visible ${getCellColor(rowIdx, colIdx)}`}
                        style={{ 
                          aspectRatio: '1',
                          width: '100%',
                          minWidth: 0
                        }}
                      >
                        {riskCount > 0 && (
                          <div
                            className="group relative cursor-pointer z-10"
                            onClick={() => riskCount === 1 && onRiskClick?.(cellRisks[0])}
                          >
                            {riskCount === 1 ? (
                              <div className="px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md hover:bg-slate-700 transition-colors shadow-md whitespace-nowrap">
                                {cellRisks[0].id}
                              </div>
                            ) : (
                              <div className="px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-md hover:bg-slate-700 transition-colors shadow-md whitespace-nowrap">
                                {riskCount}x
                              </div>
                            )}
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none whitespace-normal">
                              <div className="bg-slate-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl whitespace-pre-line max-w-xs">
                                <div className="font-bold mb-1">RIDs: {riskIds}</div>
                                <div className="text-slate-300 text-[9px] border-t border-slate-700 pt-1 mt-1">
                                  {riskTitles}
                                </div>
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                <div className="border-4 border-transparent border-t-slate-900"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Impact labels at bottom center */}
          <div className="mt-2 flex gap-2">
            <div className="w-24"></div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Impact</div>
              <div className="grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 1fr))` }}>
                {Array.from({ length: matrixSize }).map((_, colIdx) => (
                  <div key={`impact-${colIdx}`} className="text-center py-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                      {getImpactLabel(colIdx)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {renderMatrix('Current Risk', false)}
      {renderMatrix('Residual Risk', true)}
    </div>
  );
};

// --- Sub-Component: RiskAssessmentWorkspace ---
// Fix: Added missing RiskAssessmentWorkspace component for detailed risk review
const RiskAssessmentWorkspace = ({ risk, onUpdate, onClose, controls, assets, maxVal }: any) => {
  const [formData, setFormData] = useState<Risk>(risk);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState('');

  const handleGetRecommendation = async () => {
    setIsGenerating(true);
    const rec = await getRiskRecommendation(formData.title, formData.category);
    setRecommendation(rec || "Unable to generate recommendation.");
    setIsGenerating(false);
  };

  const inherentScore = (formData.inherentLikelihood || 0) * (formData.inherentImpact || 0);
  const residualScore = (formData.residualLikelihood || 0) * (formData.residualImpact || 0);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-light text-slate-900 tracking-tight">{formData.id} - {formData.title}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Risk Assessment Detail</p>
          </div>
        </div>
        <button 
          onClick={() => onUpdate({ ...formData, inherentScore, residualScore })}
          className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <GlassCard title="General Information" subtitle="Risk Identity & Context">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Title</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all font-light"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:border-blue-400 transition-all resize-none font-light"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard title="AI Insights" subtitle="Gemini-Powered Mitigation Suggestions">
            <div className="space-y-4">
              <button 
                onClick={handleGetRecommendation}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <BrainCircuit size={14} className={isGenerating ? 'animate-pulse' : ''} />
                {isGenerating ? 'Analyzing...' : 'Generate Recommendation'}
              </button>
              {recommendation && (
                <div className="p-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-[13px] text-slate-700 leading-relaxed animate-in fade-in duration-500 italic font-light">
                  {recommendation}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-8">
          <GlassCard title="Assessment" subtitle="Scores & Thresholds">
            <div className="space-y-8">
              <DotGridSelector 
                label="Inherent Likelihood"
                value={formData.inherentLikelihood}
                onChange={(v) => setFormData({ ...formData, inherentLikelihood: v })}
                colorClass="bg-rose-500"
                max={maxVal}
              />
              <DotGridSelector 
                label="Inherent Impact"
                value={formData.inherentImpact}
                onChange={(v) => setFormData({ ...formData, inherentImpact: v })}
                colorClass="bg-rose-500"
                max={maxVal}
              />
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inherent Score</span>
                <span className={`text-[18px] font-mono font-bold px-4 py-1 rounded-xl shadow-sm ${getScoreColor(inherentScore)}`}>
                  {inherentScore}
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Governance" subtitle="Ownership & Frequency">
            <div className="space-y-6">
              <CustomSelect 
                label="Review Frequency"
                options={[
                  { value: 'Quarterly', label: 'Quarterly' },
                  { value: 'Semi-Annual', label: 'Semi-Annual' },
                  { value: 'Annual', label: 'Annual' }
                ]}
                value={formData.reviewFrequency}
                onChange={(v) => setFormData({ ...formData, reviewFrequency: v as any })}
              />
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Business Unit</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-light"
                  value={formData.businessUnit}
                  onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })}
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Component: RiskScenarioWorkspace ---
interface RiskScenarioWorkspaceProps {
  assessment: RiskAssessment;
  risk?: Partial<Risk>;
  onSave: (risk: Risk) => void;
  onClose: () => void;
  assets: Asset[];
  controls: Control[];
}

const RiskScenarioWorkspace: React.FC<RiskScenarioWorkspaceProps> = ({ assessment, risk, onSave, onClose, assets, controls }) => {
  const is3x3 = assessment.riskMatrix?.includes('3x3');
  const maxVal = is3x3 ? 3 : 5;

  const [formData, setFormData] = useState<Partial<Risk>>({
    id: risk?.id || '',
    title: risk?.title || '',
    description: risk?.description || '',
    category: risk?.category || 'Cyber',
    inherentLikelihood: risk?.inherentLikelihood || 0,
    inherentImpact: risk?.inherentImpact || 0,
    residualLikelihood: risk?.residualLikelihood || 0,
    residualImpact: risk?.residualImpact || 0,
    status: risk?.status || 'Draft',
    owner: risk?.owner || 'Alex Rivera',
    linkedAssets: risk?.linkedAssets || [],
    customAssets: risk?.customAssets || [],
    linkedControls: risk?.linkedControls || [],
    customControls: risk?.customControls || []
  });

  const [treatmentStatus, setTreatmentStatus] = useState('Opened');
  const [threatName, setThreatName] = useState<string>(risk?.title || '');
  const [manualAssetInput, setManualAssetInput] = useState('');
  const [manualControlInput, setManualControlInput] = useState('');
  
  const inherentScore = (formData.inherentLikelihood || 0) * (formData.inherentImpact || 0);
  const residualScore = (formData.residualLikelihood || 0) * (formData.residualImpact || 0);

  const handleToggleInventoryAsset = (id: string) => {
    const current = formData.linkedAssets || [];
    if (current.includes(id)) {
      setFormData({ ...formData, linkedAssets: current.filter(x => x !== id) });
    } else {
      setFormData({ ...formData, linkedAssets: [...current, id] });
    }
  };

  const handleAddManualAsset = () => {
    if (manualAssetInput.trim()) {
      setFormData({ ...formData, customAssets: [...(formData.customAssets || []), manualAssetInput.trim()] });
      setManualAssetInput('');
    }
  };

  const handleToggleCatalogControl = (id: string) => {
    const current = formData.linkedControls || [];
    if (current.includes(id)) {
      setFormData({ ...formData, linkedControls: current.filter(x => x !== id) });
    } else {
      setFormData({ ...formData, linkedControls: [...current, id] });
    }
  };

  const handleAddManualControl = () => {
    if (manualControlInput.trim()) {
      setFormData({ ...formData, customControls: [...(formData.customControls || []), manualControlInput.trim()] });
      setManualControlInput('');
    }
  };

  const selectedInventoryAssets = assets.filter(a => formData.linkedAssets?.includes(a.id));

  // if ()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-40 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-50">
        <div className="lg:col-span-3 glass p-8 rounded-[2rem] bg-white border-slate-200 shadow-xl shadow-slate-200/20 flex flex-wrap items-center gap-12">
          <div className="space-y-1 flex-1 min-w-[240px]">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Risk assessment campaign</p>
             <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[14px] text-slate-900 font-bold tracking-tight">{assessment.name}</div>
          </div>
          <div className="space-y-1 pr-6 border-r border-slate-100">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Revision</p>
             <p className="text-[15px] text-indigo-600 font-mono font-bold tracking-widest">{assessment.version || '1.0'}</p>
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Owner</p>
             <p className="text-[13px] text-slate-700 font-semibold">{assessment.owner || 'Alex Rivera'}</p>
          </div>
        </div>

        <div className="glass p-8 rounded-[2rem] bg-white border-slate-200 shadow-xl shadow-slate-200/20 space-y-5 relative">
           <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Workflow status</p>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
           </div>
           <div className="space-y-1">
              <CustomSelect 
                options={[
                  { value: 'Opened', label: 'Opened' }, 
                  { value: 'In Progress', label: 'Analysis Active' },
                  { value: 'Mitigated', label: 'Under Mitigation' },
                  { value: 'Risk Accepted', label: 'Risk Accepted' },
                  { value: 'Closed', label: 'Review Closed' }
                ]}
                value={treatmentStatus}
                onChange={setTreatmentStatus}
                placeholder="Workflow state..."
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 items-stretch">
        <div className="h-full">
          <div className="glass p-10 rounded-[2.5rem] bg-white border-slate-200 shadow-sm space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Tag size={16} className="text-indigo-500" /> Scenario Foundations
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Threat Name *</label>
              <input 
                type="text" 
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-[14px] text-slate-900 focus:outline-none focus:border-indigo-500 transition-all shadow-sm font-medium"
                value={threatName}
                onChange={(e) => {
                  setThreatName(e.target.value);
                  setFormData({...formData, title: e.target.value});
                }}
                placeholder="Enter threat name..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Description</label>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-5 text-[14px] text-slate-900 h-40 resize-none focus:outline-none focus:border-indigo-500 transition-all font-light shadow-sm leading-relaxed"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter description..."
              />
            </div>
          </div>
        </div>

        <div className="h-full">
          <div className="glass p-10 rounded-[2.5rem] bg-white border-slate-200 shadow-sm space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <HardDrive size={16} className="text-blue-500" /> Resource Mapping
              </h3>
            </div>
            
            <div className="space-y-6">
               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-1">Asset Inventory Lookup</p>
                     <CustomSelect 
                       options={assets.map(a => ({ value: a.id, label: `${a.id}: ${a.name}` }))}
                       value=""
                       onChange={handleToggleInventoryAsset}
                       placeholder="Select enterprise assets..."
                     />
                  </div>
                  <div className="space-y-3">
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-1">Manual Asset Definition</p>
                     <div className="flex gap-3">
                        <input 
                          type="text" 
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3 text-[13px] focus:outline-none focus:border-blue-400 shadow-sm" 
                          placeholder="Node name..."
                          value={manualAssetInput}
                          onChange={(e) => setManualAssetInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddManualAsset()}
                        />
                        <button onClick={handleAddManualAsset} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase transition-all active:scale-95">Add</button>
                     </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4 ml-1">Registered Scope</p>
                  <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left text-[11px]">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3.5 font-bold uppercase tracking-widest text-slate-400">Identity</th>
                            <th className="px-6 py-3.5 font-bold uppercase tracking-widest text-slate-400">Origin</th>
                            <th className="px-6 py-3.5 w-12 text-center"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 bg-white">
                          {selectedInventoryAssets.map(a => (
                             <tr key={a.id} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">{a.name}</td>
                                <td className="px-6 py-4"><span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">System</span></td>
                                <td className="px-6 py-4">
                                   <button onClick={() => handleToggleInventoryAsset(a.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={14} /></button>
                                </td>
                             </tr>
                          ))}
                          {formData.customAssets?.map((a, i) => (
                             <tr key={`manual-${i}`} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-600 italic">{a}</td>
                                <td className="px-6 py-4"><span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">Manual</span></td>
                                <td className="px-6 py-4">
                                   <button onClick={() => setFormData({...formData, customAssets: formData.customAssets?.filter(x => x !== a)})} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={14} /></button>
                                </td>
                             </tr>
                          ))}
                          {selectedInventoryAssets.length === 0 && (!formData.customAssets || formData.customAssets.length === 0) && (
                            <tr>
                               <td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-light italic">No assets mapped to this scenario.</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass p-10 rounded-[2.5rem] bg-white border-slate-200 shadow-xl shadow-slate-200/10 space-y-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle size={20} /></div>
             <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Inherent Risk Assessment</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Current Control State</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-[14px] text-slate-700 h-40 resize-none focus:outline-none focus:border-rose-400 transition-all font-light leading-relaxed"
                placeholder="Narrative of existing technical and organizational measures..."
              />
            </div>
            <div className="lg:col-span-5 space-y-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
               <div className="grid grid-cols-1 gap-10">
                  <DotGridSelector 
                    label="Probability"
                    value={formData.inherentLikelihood || 0}
                    onChange={(v) => setFormData({...formData, inherentLikelihood: v})}
                    colorClass="bg-rose-500"
                    max={maxVal}
                  />
                  <DotGridSelector 
                    label="Impact"
                    value={formData.inherentImpact || 0}
                    onChange={(v) => setFormData({...formData, inherentImpact: v})}
                    colorClass="bg-rose-500"
                    max={maxVal}
                  />
               </div>
               <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inherent Score</span>
                 <div className="flex items-center gap-3">
                   <span className={`text-[18px] font-mono font-bold px-4 py-1 rounded-xl shadow-sm ${inherentScore > 0 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                     {inherentScore || '--'}
                   </span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="glass p-10 rounded-[2.5rem] bg-white border-slate-200 shadow-xl shadow-slate-200/10 space-y-10">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={20} /></div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Residual Mitigation Strategy</h3>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-6">
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-1">Target Control Integration</p>
                    <CustomSelect 
                      options={controls.map(c => ({ value: c.id, label: `${c.id}: ${c.name}` }))}
                      value=""
                      onChange={handleToggleCatalogControl}
                      placeholder="Link remediation from catalog..."
                    />
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-1">Specific Treatment Step</p>
                    <div className="flex gap-3">
                       <input 
                         type="text" 
                         className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-emerald-500 transition-all shadow-sm" 
                         placeholder="Technical requirement..."
                         value={manualControlInput}
                         onChange={(e) => setManualControlInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddManualControl()}
                       />
                       <button onClick={handleAddManualControl} className="px-6 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Add</button>
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-4">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-1">Mitigation Plan</p>
                 <div className="space-y-3">
                    {formData.linkedControls?.map(id => {
                       const c = controls.find(x => x.id === id);
                       return (
                          <div key={id} className="flex items-center justify-between px-5 py-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl group transition-all hover:bg-blue-50">
                             <div className="flex items-center gap-4">
                                <div className="p-1.5 bg-blue-600 text-white rounded-lg"><Shield size={12} strokeWidth={2.5} /></div>
                                <span className="text-[13px] text-slate-700 font-bold tracking-tight">{c?.name || id}</span>
                             </div>
                             <button onClick={() => handleToggleCatalogControl(id)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={18} /></button>
                          </div>
                       );
                    })}
                    {formData.customControls?.map((c, i) => (
                       <div key={`manual-c-${i}`} className="flex items-center justify-between px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl group transition-all hover:bg-white">
                          <div className="flex items-center gap-4">
                             <div className="p-1.5 bg-emerald-500 text-white rounded-lg"><Zap size={12} strokeWidth={2.5} /></div>
                             <span className="text-[13px] text-slate-600 font-medium italic">{c}</span>
                          </div>
                          <button onClick={() => setFormData({...formData, customControls: formData.customControls?.filter(x => x !== c)})} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={18} /></button>
                       </div>
                    ))}
                    {formData.linkedControls?.length === 0 && (!formData.customControls || formData.customControls.length === 0) && (
                       <div className="py-6 text-center text-slate-400 italic text-[11px]">No active mitigations defined.</div>
                    )}
                 </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8 bg-emerald-50/30 p-8 rounded-3xl border border-emerald-100">
               <div className="grid grid-cols-1 gap-10">
                  <DotGridSelector 
                    label="Target Probability"
                    value={formData.residualLikelihood || 0}
                    onChange={(v) => setFormData({...formData, residualLikelihood: v})}
                    colorClass="bg-emerald-600"
                    max={maxVal}
                  />
                  <DotGridSelector 
                    label="Target Impact"
                    value={formData.residualImpact || 0}
                    onChange={(v) => setFormData({...formData, residualImpact: v})}
                    colorClass="bg-emerald-600"
                    max={maxVal}
                  />
               </div>
               <div className="pt-6 border-t border-emerald-100 flex items-center justify-between">
                 <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Residual Score</span>
                 <div className="flex items-center gap-3">
                    <span className={`text-[18px] font-mono font-bold px-4 py-1 rounded-xl shadow-lg transition-all ${residualScore > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {residualScore || '--'}
                    </span>
                 </div>
               </div>
            </div>
            {residualScore > inherentScore && (
              <div className="lg:col-span-12 bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={16} className="text-rose-500" />
                <p className="text-[11px] text-rose-600 font-bold uppercase tracking-widest">Residual risk cannot exceed inherent risk. Please adjust the scores accordingly.</p>
              </div>
            )}
          </div>
        </div>
      </div>

       <div className="flex justify-end gap-5 mt-12 border-t border-slate-200 bg-[#f8fafc]/95 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl shadow-slate-900/5">
         <button onClick={onClose} className="px-10 py-4 border border-slate-200 text-slate-500 rounded-2xl text-[12px] font-bold uppercase tracking-[0.25em] active:scale-95 transition-all hover:bg-white hover:text-slate-800">Discard Entry</button>
         <button 
          //  onClick={() => onSave({...formData as Risk, inherentScore, residualScore})}
          onClick={() => {
            if (residualScore >inherentScore) {
              alert("Residual risk cannot be higher than inherent risk. Please adjust the scores.");
              return;
            }
            onSave({...formData as Risk, inherentScore, residualScore});
          }}
           className="px-14 py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-bold uppercase tracking-[0.25em] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3"
         >
           <Check size={18} strokeWidth={2.5} /> Commit Analysis
         </button>
      </div>
    </div>
  );
};

// --- Main Module: RiskManagement ---
interface RiskManagementProps {
  activeTab?: NavigationTab;
  risks: Risk[];
  setRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
  controls: Control[];
  assets: Asset[];
  addAuditEntry: (action: string, details: string) => void;
}

const RiskManagement: React.FC<RiskManagementProps> = ({ activeTab, risks, setRisks, controls, assets, addAuditEntry }) => {
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isAddingScenario, setIsAddingScenario] = useState(false);
  const [isEditCampaignModalOpen, setIsEditCampaignModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allRisks, setAllRisks] = useState<Risk[]>([]);
  
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [raCounter, setRaCounter] = useState(() => {
    const ids = MOCK_RISK_ASSESSMENTS.map(a => parseInt(a.id.split('-').pop() || '0')).filter(n => !isNaN(n));
    return (ids.length > 0 ? Math.max(...ids) : 0) + 1;
  });
  const [riskIdCounter, setRiskIdCounter] = useState(() => {
    const ids = risks.map(r => parseInt(r.id.split('-').pop() || '0')).filter(n => !isNaN(n));
    return (ids.length > 0 ? Math.max(...ids) : 0) + 1;
  });

  const selectedRisk = useMemo(() => risks.find(r => r.id === selectedRiskId), [risks, selectedRiskId]);
  const activeCycle = useMemo(() => riskAssessments.find(ra => ra.id === selectedCycleId), [riskAssessments, selectedCycleId]);
  const activeScenario = useMemo(() => risks.find(r => r.id === selectedScenarioId), [risks, selectedScenarioId]);
  const maxVal = activeCycle?.riskMatrix?.includes('3x3') ? 3 : 5;

  useEffect(() => {
    if (!selectedCycleId) return;
    api
      .get(`/assessments/get-risks/${selectedCycleId}`)
      .then((res) => setRisks(res.data))
      .catch(err => console.error("Failed to fetch assessments:", err));
    api
      .get("assessments/get-risks")
      .then((res) => {
        const allRisks: Risk[] = res.data;
        setAllRisks(allRisks);
      })
      .catch(err => console.error("Failed to fetch all risks:", err));
  }, [selectedCycleId]);

  const filteredCycles = useMemo(() => 
    riskAssessments.filter(ra => ra.name.toLowerCase().includes(searchQuery.toLowerCase()) || ra.id.toLowerCase().includes(searchQuery.toLowerCase())),
  [riskAssessments, searchQuery]);

  const handleUpdateRisk = (updatedRisk: Risk) => {
    setRisks(prev => prev.map(r => r.id === updatedRisk.id ? updatedRisk : r));
    addAuditEntry('Update Risk', `Committed updates to risk scenario ${updatedRisk.id}: ${updatedRisk.title}`);
    setSelectedRiskId(null);
    setSelectedScenarioId(null);
    setIsAddingScenario(false);
  };

  const handleUpdateCampaign = (updatedCampaign: RiskAssessment) => {
    setRiskAssessments(prev => prev.map(a => a.id === updatedCampaign.id ? updatedCampaign : a));
    addAuditEntry('Update Campaign', `Modified metadata for assessment campaign ${updatedCampaign.id}`);
    setIsEditCampaignModalOpen(false);
  };

  const [riskEditing, setRiskEditing] = useState<boolean>(false);
  const [globalStats, setGlobalStats] = useState<any>(null);

  const handleAddRiskToAssessment = (newRisk: Risk) => {
    if (!riskEditing) {
      setRisks(prev => [newRisk, ...prev]);
      setAllRisks(prev => [newRisk, ...prev]);
    } else {
      setRisks(prev => prev.map(r => r.id === newRisk.id ? newRisk : r));
    }
    addAuditEntry('Create Risk', `Initialized new risk scenario ${newRisk.id} in campaign ${activeCycle?.id}`);
    if (activeCycle) {
      const updatedCycle = { ...activeCycle, risksInScope: [...(activeCycle.risksInScope ?? []), newRisk.id] };
      setRiskAssessments(prev => prev.map(a => a.id === activeCycle.id ? updatedCycle : a));
    }
    
    // Working on API integration
    const payload = {
      category: newRisk.category,
      customAssets: newRisk.customAssets || [],
      customControls: newRisk.customControls || [],
      description: newRisk.description,
      id: newRisk.id,
      inherentImpact: newRisk.inherentImpact,
      inherentLikelihood: newRisk.inherentLikelihood,
      inherentScore: newRisk.inherentScore,
      linkedAssets: newRisk.linkedAssets || [],
      linkedControls: newRisk.linkedControls || [],
      owner: newRisk.owner,
      residualImpact: newRisk.residualImpact,
      residualLikelihood: newRisk.residualLikelihood,
      residualScore: newRisk.residualScore,
      status: newRisk.status,
      title: newRisk.title,
      assessmentId: activeCycle?.id || `RA-${String(raCounter).padStart(2, '0')}`
    }
    
    if (!riskEditing) {
      api.post('/assessments/create-risk', payload);
    } else {
      try {
        api.put('/assessments/update-risk', payload, {params: {id: newRisk.id}});
        console.log('Updated risk via API:');
      } catch (err) {
        console.error('Failed to update risk:', err);
      }
    }
    setSelectedScenarioId(null);
    setIsAddingScenario(false);
  };

  async function delteAssessment(id: string) {
    if (!confirm("Are you sure you want to delete this assessment campaign? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/assessments/delete-assessment/${id}`);
      setRiskAssessments(prev => prev.filter(a => a.id !== id));
      addAuditEntry('Delete Assessment', `Deleted assessment campaign ${id}`);
      setSelectedCycleId(null);
    } catch (error) {
      console.error("Failed to delete assessment:", error);
    }
  }

  useEffect(() => {
    api.get("global-stats/get")
      .then((res) => {
        setGlobalStats(res.data);
      })
      .catch(err => console.error("Failed to fetch global stats:", err));
  }, [])

  useEffect(() => {
    api.get("/assessments/get-assessments").then((res) => {
      setRiskAssessments(res.data);
    }).catch(err => console.error("Failed to fetch assessments:", err));
  }, []);

  if (selectedRiskId && selectedRisk) {
    return <RiskAssessmentWorkspace risk={selectedRisk} onUpdate={handleUpdateRisk} onClose={() => setSelectedRiskId(null)} controls={controls} assets={assets} maxVal={maxVal} />;
  }

  if (activeCycle && (isAddingScenario || selectedScenarioId)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
           <button onClick={() => { setSelectedScenarioId(null); setIsAddingScenario(false); }} className="hover:text-blue-600 transition-colors">Home</button>
           <ChevronRight size={10} />
           <button onClick={() => { setSelectedScenarioId(null); setIsAddingScenario(false); }} className="hover:text-blue-600 transition-colors">Assessments</button>
           <ChevronRight size={10} />
           <span className="text-slate-900 font-bold">{isAddingScenario ? 'New Risk' : activeScenario?.title}</span>
        </div>
        <RiskScenarioWorkspace 
          assessment={activeCycle}
          risk={activeScenario || { id: `R-${allRisks.length + 1}` }}
          onSave={(r) => { if (isAddingScenario) setRiskIdCounter(prev => prev + 1); handleAddRiskToAssessment(r); }}
          onClose={() => { setSelectedScenarioId(null); setIsAddingScenario(false); }}
          assets={assets}
          controls={controls}
        />
      </div>
    );
  }

  if (selectedCycleId && activeCycle) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-32 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
           <button onClick={() => setSelectedCycleId(null)} className="hover:text-blue-600 transition-colors">Home</button>
           <ChevronRight size={10} />
           <span className="text-slate-900 font-bold">{activeCycle.name}</span>
        </div>
        <div className="glass p-10 rounded-2xl bg-white border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="flex flex-col lg:flex-row justify-between gap-10 items-start">
            <div className="space-y-6 flex-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{activeCycle.id} - {activeCycle.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                <div><span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Status</span> <span className="text-slate-700 font-medium bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{activeCycle.status}</span></div>
                <div><span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Matrix Model</span> <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{activeCycle.riskMatrix}</span></div>
                <div><span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Target Date</span> <span className="text-slate-700 font-medium">{activeCycle.targetDate.split("T")[0]}</span></div>
                {activeCycle.description && <div className="sm:col-span-2"><span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Scope Narrative</span> <p className="text-slate-500 font-light italic leading-relaxed">{activeCycle.description}</p></div>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => delteAssessment(selectedCycleId || activeCycle.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-red-100 shadow-sm transition-all active:scale-95"
              >
                <Trash2 size={14} />
              </button>
              <button onClick={() => setIsEditCampaignModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                <Settings2 size={14} /> Edit Campaign
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
                <Download size={14} /> Export
              </button>
            </div>
          </div>
        </div>

        <Modal isOpen={isEditCampaignModalOpen} onClose={() => setIsEditCampaignModalOpen(false)} title="Update Campaign Metadata">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as any;
              handleUpdateCampaign({
                ...activeCycle,
                name: target.name.value,
                status: target.status.value,
                riskMatrix: target.riskMatrix.value,
                description: target.description.value,
                targetDate: target.targetDate.value
              });
              api.put("/assessments/update-assessment", {
                id: activeCycle.id,
                name: target.name.value,
                status: target.status.value,
                riskMatrix: target.riskMatrix.value,
                description: target.description.value,
                targetDate: target.targetDate.value
              });
            }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1 flex items-center gap-2">Campaign Name <Lock size={10} className="text-slate-300" /></label>
              <input name="name" readOnly required defaultValue={activeCycle.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none cursor-not-allowed text-slate-500 transition-all font-light" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Current Status</label>
                <select name="status" defaultValue={activeCycle.status} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none font-light">
                   <option value="Draft">Draft</option>
                   <option value="In Progress">In Progress</option>
                   <option value="Completed">Completed</option>
                </select>
              </div>
               <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Risk Matrix</label>
                <select name="riskMatrix" defaultValue={activeCycle.riskMatrix} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none font-light">
                   <option value="Standard 3x3">Standard 3x3</option>
                   <option value="critical 5x5">critical 5x5</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Scope Narrative</label>
              <textarea name="description" defaultValue={activeCycle.description} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:border-indigo-400 resize-none font-light" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Target Deadline</label>
              <input name="targetDate" type="date" defaultValue={activeCycle.targetDate} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none font-light" />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-[11px] uppercase tracking-widest shadow-xl mt-4 active:scale-95 flex items-center justify-center gap-2">
               <Check size={16} /> Commit Updates
            </button>
          </form>
        </Modal>

        {risks.length > 0 && (
          <div className="glass p-8 rounded-2xl bg-white border-slate-200 space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Risk Matrix View</h3>
            <RiskMatrixView 
              risks={risks} 
              matrixSize={maxVal as 3 | 5}
              onRiskClick={(risk) => setSelectedScenarioId(risk.id)}
            />
          </div>
        )}

        <div className="glass p-8 rounded-2xl bg-white border-slate-200 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Campaign Risks</h3>
              <button onClick={() => setIsAddingScenario(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                <Plus size={14} /> New Risk
              </button>
           </div>
           <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">RID</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Inherent</th>
                      <th className="px-4 py-3">Residual</th>
                      <th></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {risks.map(r => (
                       <tr key={r.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => {setSelectedScenarioId(r.id); setRiskEditing(true)}}>
                          <td className="px-4 py-4 font-mono font-bold text-slate-500 text-[11px]">{r.id}</td>
                          <td className="px-4 py-4 font-semibold text-slate-900 text-[12px]">{r.title}</td>
                          <td className="px-4 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getScoreColor(r.inherentScore)}`}>{r.inherentScore}</span></td>
                          <td className="px-4 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getScoreColor(r.residualScore)}`}>{r.residualScore}</span></td>
                          <td>
                            <Trash2 
                              size={14} 
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await api.delete(`/assessments/delete-risk/${r.id}`)
                                  .then(() => {
                                    setRisks(prev => prev.filter(x => x.id !== r.id));
                                    addAuditEntry('Delete Risk', `Removed risk scenario ${r.id} from campaign ${activeCycle.id}`);
                                  })
                                  .catch(err => console.error("Failed to delete risk:", err));
                              }}
                            />
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-xl z-[40]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1"><FileSearch size={12} /> Compliance Campaigns</div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Risk Assessments</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[11px] tracking-widest uppercase shadow-lg active:scale-95"><Plus size={16} /> New Assessment</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCycles.map((cycle) => (
          <GlassCard key={cycle.id} noOverflow className="bg-white group hover:border-blue-300 rounded-[2rem] p-8 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex gap-6 flex-1 items-center">
                {/* <div className={`w-36 h-12 rounded-xl flex items-center justify-center border-2 shrink-0 font-bold text-[10px] uppercase tracking-widest ${
                   cycle.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                   cycle.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                   'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                   {cycle.status}
                </div> */}
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm shrink-0 ml-2"><FileSearch size={24} /></div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-mono text-slate-400 font-bold">{cycle.id}</span>
                     <h4 className="text-[18px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{cycle.name}</h4>
                  </div>
                  <p className="text-[12px] text-slate-400 font-medium">Due: {cycle.dueDate.split("T")[0] || cycle.targetDate.split("T")[0]} • {cycle.risksInScope?.length} Risks • {cycle.riskMatrix}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCycleId(cycle.id)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black shadow-xl active:scale-95 transition-all">Enter Workspace</button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Risk Assessment Campaign">
         <form 
           onSubmit={(e) => {
             e.preventDefault();
             const target = e.target as any;
             const matrixValue = target.riskMatrix.value;
             const totalAssessments = globalStats?.totalAssessments || 0;
             const newRaId = `RA-${Number(totalAssessments) +  1}`;
             const newAss: RiskAssessment = {
               id: newRaId,
               name: target.name.value,
               description: target.description?.value || '',
               version: '1.0',
               status: target.status.value,
               riskMatrix: matrixValue,
               authors: 'Alex Rivera',
               reviewers: '',
               dueDate: target.dueDate?.value || '',
               targetDate: target.dueDate?.value || new Date().toISOString().split('T')[0],
               owner: 'Alex Rivera',
               risksInScope: [],
               progress: 0,
               lastUpdated: new Date().toISOString().split('T')[0]
             };
             setRiskAssessments([newAss, ...riskAssessments]);
             setRaCounter(prev => prev + 1);
             addAuditEntry('Create Campaign', `Initialized new assessment campaign ${newRaId}: ${newAss.name}`);

             // Let's build the API
             const payload = {
              id: newAss.id,
              name: newAss.name,
              description: newAss.description,
              version: newAss.version,
              status: newAss.status,
              riskMatrix: newAss.riskMatrix,
              authors: newAss.authors,
              reviewers: newAss.reviewers,
              dueDate: newAss.dueDate,
              targetDate: newAss.targetDate,
              owner: newAss.owner,
              risksInScope: newAss.risksInScope,
              progress: newAss.progress,
              lastUpdated: newAss.lastUpdated
             };
             api.post('/assessments/create-assessment', payload)

             setIsModalOpen(false);
             setSelectedCycleId(newRaId);
           }}
           className="space-y-6"
         >
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Calculated ID</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-mono font-bold text-indigo-600">
                RA-{Number(globalStats?.totalAssessments) ? globalStats?.totalAssessments + 1 : 1}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Campaign Name *</label>
              <input name="name" required className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-indigo-400 transition-all font-light" placeholder="e.g. FY25 Cyber Risk Audit" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Current Status *</label>
              <select name="status" required defaultValue="Draft" className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-indigo-400 transition-all font-light">
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Risk matrix scale *</label>
              <div className="flex gap-4">
                 {['Standard 3x3', 'critical 5x5'].map(m => (
                    <label key={m} className="flex-1 flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                       <input type="radio" name="riskMatrix" value={m} required defaultChecked={m === 'critical 5x5'} className="hidden" />
                       <span className="text-[12px] font-semibold text-slate-700">{m}</span>
                    </label>
                 ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Scope Narrative</label>
              <textarea name="description" className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm h-32 focus:outline-none focus:border-indigo-400 transition-all resize-none font-light" placeholder="Describe the scope and objectives of this risk assessment campaign..." />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest ml-1">Target Deadline *</label>
              <input name="dueDate" type="date" required className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-indigo-400 transition-all font-light" />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-[11px] uppercase tracking-widest shadow-xl mt-4 active:scale-95 transition-all">Initialize Campaign</button>
         </form>
      </Modal>
    </div>
  );
};

export default RiskManagement;
