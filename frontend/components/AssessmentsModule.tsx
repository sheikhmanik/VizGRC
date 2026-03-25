
import React, { useState } from 'react';
import { MOCK_FRAMEWORKS, MOCK_ASSESSMENTS } from '../constants';
import GlassCard from './GlassCard';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { ClipboardList, Plus, ExternalLink, Calendar, User, Briefcase, Hash, AlignLeft } from 'lucide-react';
import { Assessment } from '../types';

const ASSESSMENT_STATUS_OPTIONS = [
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Overdue', label: 'Overdue' },
];

const FRAMEWORK_OPTIONS = MOCK_FRAMEWORKS.map(f => ({
  value: f.id,
  label: f.name
}));

const AssessmentsModule: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>(MOCK_ASSESSMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Assessment>>({
    name: '',
    description: '',
    project: '',
    version: '1.0.0',
    status: 'In Progress',
    frameworkId: MOCK_FRAMEWORKS[0].id,
    author: 'Alex Rivera',
    reviewer: '',
    startTime: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const getStatusColor = (status: Assessment['status']) => {
    switch (status) {
      case 'Completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Overdue': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: Assessment = {
      ...formData as Assessment,
      id: `AS-${Math.floor(Math.random() * 9000) + 1000}`,
      progress: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      status: formData.status as any
    };
    setAssessments([newEntry, ...assessments]);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      description: '',
      project: '',
      version: '1.0.0',
      status: 'In Progress',
      frameworkId: MOCK_FRAMEWORKS[0].id,
      author: 'Alex Rivera',
      reviewer: '',
      startTime: new Date().toISOString().split('T')[0],
      endDate: ''
    });
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Compliance Assessments</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[11px] font-bold uppercase tracking-widest pb-1 text-blue-600 border-b-2 border-blue-600">
              Active Runs
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-100"
        >
          <Plus size={16} /> New Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {assessments.map((as) => {
          const framework = MOCK_FRAMEWORKS.find(f => f.id === as.frameworkId);
          return (
            <GlassCard key={as.id} className="bg-white border-slate-200/40 hover:border-blue-200 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-5 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                    <ClipboardList size={24} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-[15px] font-semibold text-slate-900 tracking-tight">{as.name}</h4>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusColor(as.status)}`}>
                        {as.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                      {framework?.name} {as.version ? `v${as.version}` : ''} • {as.project ? `${as.project} • ` : ''}Updated: {as.lastUpdated}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Compliance Progress</span>
                    <span className="text-slate-900">{as.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className={`h-full transition-all duration-1000 ${as.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                      style={{ width: `${as.progress}%` }}
                    ></div>
                  </div>
                </div>

                <button className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0">
                  <ExternalLink size={18} />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Assessment Run">
        <form onSubmit={handleCreateAssessment} className="space-y-6 max-w-lg mx-auto">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assessment Name</label>
            <div className="relative">
              <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                required 
                type="text" 
                placeholder="e.g. ISO 27001 Internal Audit"
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-light"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-slate-300" size={14} />
              <textarea 
                placeholder="Scope and objectives of this assessment..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 h-28 resize-none transition-all font-light"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Project Identifier</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                type="text" 
                placeholder="e.g. Security Compliance 2024"
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-light"
                value={formData.project}
                onChange={(e) => setFormData({...formData, project: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Version</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="text" 
                  placeholder="1.0.0"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                />
              </div>
            </div>
            <CustomSelect 
              label="Status"
              options={ASSESSMENT_STATUS_OPTIONS}
              value={formData.status || 'In Progress'}
              onChange={(val) => setFormData({...formData, status: val as any})}
            />
          </div>

          <CustomSelect 
            label="Compliance Framework"
            options={FRAMEWORK_OPTIONS}
            value={formData.frameworkId || ''}
            onChange={(val) => setFormData({...formData, frameworkId: val})}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Author</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="text" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Reviewer</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="text" 
                  placeholder="Reviewer name"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={formData.reviewer}
                  onChange={(e) => setFormData({...formData, reviewer: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-4 border border-slate-200 text-slate-500 font-bold rounded-xl text-[11px] tracking-widest uppercase hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] tracking-widest uppercase shadow-xl shadow-blue-500/20 transition-all"
            >
              Initialize Assessment Run
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssessmentsModule;
