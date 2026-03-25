
import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { 
  Plus, ShieldCheck, Link as LinkIcon, 
  Trash2, ExternalLink, X, Tag
} from 'lucide-react';
import { Control } from '../types';
import api from './api/AxiosInstance';

interface ControlsModuleProps {
  controls: Control[];
  setControls: React.Dispatch<React.SetStateAction<Control[]>>;
  addAuditEntry: (action: string, details: string) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Administrative', label: 'Administrative' },
  { value: 'Physical', label: 'Physical' },
];

const TYPE_OPTIONS = [
  { value: 'Preventive', label: 'Preventive' },
  { value: 'Detective', label: 'Detective' },
  { value: 'Corrective', label: 'Corrective' },
];

const ControlsModule: React.FC<ControlsModuleProps> = ({ controls, setControls, addAuditEntry }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [newControl, setNewControl] = useState<Partial<Control>>({
    name: '',
    description: '',
    type: 'Preventive',
    category: 'Technical',
    frequency: 'Monthly',
    link: '',
    tags: []
  });

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !newControl.tags?.includes(trimmed)) {
      setNewControl(prev => ({
        ...prev,
        tags: [...(prev.tags || []), trimmed]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewControl(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove)
    }));
  };

  const handleAddControl = (e: React.FormEvent) => {
    e.preventDefault();
    const control: Control = {
      ...newControl as Control,
      id: `C-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'Active', 
      frameworks: ['Custom'],
      owner: 'Alex Rivera',
      tags: newControl.tags || []
    };
    setControls([control, ...controls]);
    addAuditEntry('Register Control', `Deployed new internal guard: ${control.id} - ${control.name}`);

    // building API integration here to persist new control to backend
    const payload = {
      id: control.id,
      name: control.name,
      description: control.description,
      type: control.type,
      category: control.category,
      frequency: control.frequency,
      link: control.link,
      tags: control.tags,
      owner: control.owner
    };

    try {
      api.post('/controls/create-control', payload);
    } catch (error) {
      console.error('Failed to persist new control:', error);
    }


    setIsModalOpen(false);
    setNewControl({
      name: '',
      description: '',
      type: 'Preventive',
      category: 'Technical',
      frequency: 'Monthly',
      link: '',
      tags: []
    });
    setTagInput('');
  };

  useEffect(() => {
    const fetchControls = async () => {
      try {
        const res = await api.get('/controls/get-controls');
        setControls(res.data ?? []);
      } catch (err) {
        console.error('Failed to fetch controls:', err);
      }
    };
  
    fetchControls();
  }, []);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-xl z-[40]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1">
            <ShieldCheck size={12} /> Guard Registry
          </div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Internal Controls</h1>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Systematic safeguards and threat mitigations</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[11px] tracking-widest uppercase shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={16} /> Register Control
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {controls.map((c) => (
          <GlassCard key={c.id} title={c.name} subtitle={c.id} className="flex flex-col h-full bg-white group hover:border-blue-300 transition-all duration-500 rounded-[2rem] p-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {c.category || 'Technical'}
                </span>
                {c.tags && c.tags.length > 0 && (
                   <div className="flex items-center gap-1.5 overflow-hidden">
                      {c.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[8px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md border border-slate-100 font-bold uppercase truncate max-w-[60px]">{t}</span>
                      ))}
                      {c.tags.length > 2 && <span className="text-[8px] text-slate-300 font-bold">+{c.tags.length - 2}</span>}
                   </div>
                )}
              </div>
              
              <p className="text-[13px] text-slate-500 mb-8 line-clamp-3 leading-relaxed font-light">
                {c.description}
              </p>

              <div className="grid grid-cols-1 gap-4 mb-8">
                 <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Control Type</p>
                    <p className="text-[11px] text-slate-700 font-semibold">{c.type}</p>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-50">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    <img src={`https://picsum.photos/seed/${c.owner}/32/32`} alt="" />
                 </div>
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.owner}</span>
              </div>
              {c.link && (
                 <a href={c.link} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <ExternalLink size={16} />
                 </a>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Internal Guard">
        <div className="max-w-xl mx-auto py-2">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em]">
                <ShieldCheck size={12} /> Registry Architecture
             </div>
          </div>

          <form onSubmit={handleAddControl} className="space-y-8">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest ml-1">Name <span className="text-rose-500">*</span></label>
              <input 
                required 
                type="text" 
                placeholder="e.g. EDR Implementation"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 transition-all font-light" 
                value={newControl.name} 
                onChange={(e) => setNewControl({...newControl, name: e.target.value})} 
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
              <textarea 
                placeholder="Detailed control objective..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] text-slate-900 h-32 focus:outline-none focus:border-blue-400 resize-none transition-all font-light" 
                value={newControl.description} 
                onChange={(e) => setNewControl({...newControl, description: e.target.value})} 
              />
            </div>

            {/* Category and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <CustomSelect 
                  label="Category"
                  options={CATEGORY_OPTIONS}
                  value={newControl.category || 'Technical'}
                  onChange={(val) => setNewControl({...newControl, category: val as any})}
               />
               <CustomSelect 
                  label="Control Type"
                  options={TYPE_OPTIONS}
                  value={newControl.type || 'Preventive'}
                  onChange={(val) => setNewControl({...newControl, type: val as any})}
               />
            </div>

            {/* Multi-Tagging Section */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Tag size={12} /> Strategic Labels / Tags
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type tag and press Add..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 transition-all font-light"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[32px] mt-2">
                {newControl.tags?.map((tag) => (
                  <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-[11px] font-medium text-slate-700 animate-in zoom-in-95 duration-200">
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {(newControl.tags?.length === 0) && (
                  <p className="text-[10px] text-slate-300 italic">No tags associated.</p>
                )}
              </div>
            </div>

            {/* Link */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Documentation Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="url" 
                  placeholder="https://jira.company.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 font-light" 
                  value={newControl.link} 
                  onChange={(e) => setNewControl({...newControl, link: e.target.value})} 
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">External URL for reference or follow-up</p>
            </div>

            <button 
              type="submit" 
              className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition-all tracking-[0.25em] uppercase text-[11px] active:scale-95 mt-6"
            >
              DEPLOY INTERNAL GUARD
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default ControlsModule;
