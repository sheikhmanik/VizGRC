
import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from './GlassCard';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { 
  Library, Plus, FileText, Globe, Lock, Hash, 
  ChevronLeft, Search, Shield, Trash2, Edit2, 
  Component, Network, ListTree, PlusCircle, CornerDownRight, X, Type
} from 'lucide-react';
import { Framework, Control, ControlFieldDefinition, FieldType } from '../types';
import api from './api/AxiosInstance';

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
];

interface CustomDataEntry {
  id: string;
  type: FieldType;
  value: any;
  level: number; // 1 to 7
  options?: string[];
}

interface FrameworksModuleProps {
  frameworks: Framework[];
  setFrameworks: React.Dispatch<React.SetStateAction<Framework[]>>;
  controls: Control[];
  setControls: React.Dispatch<React.SetStateAction<Control[]>>;
  addAuditEntry: (action: string, details: string) => void;
}

// Optimized helper to calculate hierarchy strings based on list order and depth
const getHierarchyLabels = (entries: CustomDataEntry[]) => {
  const counts = Array(8).fill(0);
  return entries.map((entry) => {
    const level = Math.min(entry.level, 7);
    counts[level]++;
    // Reset all deeper level counters when we encounter a shallower or same-level node
    for (let i = level + 1; i <= 7; i++) counts[i] = 0;
    
    // Construct label (e.g., "1.2.1")
    return counts.slice(1, level + 1).join('.');
  });
};

const FrameworksModule: React.FC<FrameworksModuleProps> = ({ 
  frameworks, 
  setFrameworks, 
  controls, 
  setControls,
  addAuditEntry
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  
  const [isFrameworkModalOpen, setIsFrameworkModalOpen] = useState(false);
  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  
  const [editingControlId, setEditingControlId] = useState<string | null>(null);
  const [domainSearch, setDomainSearch] = useState('');

  // Form State for Custom Framework
  const [frameworkFormData, setFrameworkFormData] = useState<Partial<Framework>>({
    name: '',
    version: '1.0.0',
    description: ''
  });

  // Minimalist Form State for Control
  const [controlFormData, setControlFormData] = useState<Partial<Control>>({
    id: '',
    name: '',
    type: 'Preventive',
    status: 'Effective'
  });

  const [dynamicEntries, setDynamicEntries] = useState<CustomDataEntry[]>([]);

  const libraryFrameworks = frameworks.filter(f => !f.isCustom);
  const customFrameworks = frameworks.filter(f => f.isCustom);

  const handleCreateCustomFramework = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: Framework = {
      ...frameworkFormData as Framework,
      id: `FW-C-${Math.floor(Math.random() * 9000) + 1000}`,
      isCustom: true,
      totalControls: 0
    };
    setFrameworks([...frameworks, newEntry]);
    addAuditEntry('Create Framework', `Defined custom framework: ${newEntry.id} - ${newEntry.name}`);
    try {
      await api.post("/frameworks/create-framework", {
        id: newEntry.id,
        name: newEntry.name,
        description: newEntry.description,
        isCustom: newEntry.isCustom,
        totalControls: newEntry.totalControls,
        version: newEntry.version
      });
    } catch (error) {
      console.error("Error sending frameworks data to backend:", error);
    }
    setIsFrameworkModalOpen(false);
    setFrameworkFormData({ name: '', version: '1.0.0', description: '' });
    setActiveTab('custom');
  };

  const handleSaveControl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFrameworkId) return;

    const labels = getHierarchyLabels(dynamicEntries);

    const controlSchema: ControlFieldDefinition[] = dynamicEntries.map((entry, idx) => ({
      id: entry.id,
      label: `Node ${labels[idx]}`,
      type: entry.type,
      options: entry.options
    }));

    const customValues: Record<string, any> = {};
    dynamicEntries.forEach((entry, idx) => {
      customValues[entry.id] = entry.value;
      customValues[`_level_${entry.id}`] = entry.level;
      customValues[`_idx_${entry.id}`] = labels[idx];
    });

    const controlPayload: Control = {
      ...controlFormData as Control,
      name: controlFormData.name || 'Untitled Requirement',
      description: 'Hierarchical Governance Index',
      owner: 'Alex Rivera',
      frequency: 'Annual',
      frameworks: [selectedFrameworkId],
      frameworkId: selectedFrameworkId,
      controlSchema,
      customValues
    };

    if (editingControlId) {
      setControls(prev => prev.map(c => 
        c.id === editingControlId ? { ...c, ...controlPayload } : c
      ));
      addAuditEntry('Update Requirement', `Modified requirement architecture for ${controlPayload.id} in framework ${selectedFrameworkId}`);

      // Logic for editing DB entry would go here (e.g., API call to update requirement)
      api.put("/frameworks/update-requirement", { ...controlPayload });
    } else {
      // Append to end to preserve chronological order (Oldest -> Latest)
      setControls(prev => [...prev, controlPayload]);
      setFrameworks(prev => prev.map(f => 
        f.id === selectedFrameworkId ? { ...f, totalControls: (f.totalControls || 0) + 1 } : f
      ));
      addAuditEntry('Create Requirement', `Registered new requirement ${controlPayload.id} in framework ${selectedFrameworkId}`);

      // Logic for creating DB entry would go here (e.g., API call to create requirement)
      api.post("/frameworks/create-requirement", { ...controlPayload })
    }

    setIsControlModalOpen(false);
    setEditingControlId(null);
    setControlFormData({ id: '', name: '', type: 'Preventive', status: 'Effective' });
    setDynamicEntries([]);
  };

  useEffect(() => {
    api.get("/frameworks/get-requirements").then((response) => {
      const fetchedControls: Control[] = response.data;
      setControls(fetchedControls);
    }).catch(error => {
      console.error("Error fetching requirements for framework:", error);
    });
  }, [selectedFrameworkId]);

  const addRootNode = () => {
    setDynamicEntries(prev => [
      ...prev, 
      { id: `dyn-${Date.now()}-${Math.random()}`, type: 'text', value: '', level: 1 }
    ]);
  };

  const addChildNode = (index: number) => {
    const parent = dynamicEntries[index];
    if (parent.level >= 7) return; // Cap at L7
    
    const newNode: CustomDataEntry = {
      id: `dyn-${Date.now()}-${Math.random()}`,
      type: 'text',
      value: '',
      level: parent.level + 1
    };
    
    setDynamicEntries(prev => {
      const next = [...prev];
      // Insert after parent (and potentially after all existing children of that parent)
      let insertAt = index + 1;
      while (insertAt < next.length && next[insertAt].level > parent.level) {
        insertAt++;
      }
      next.splice(insertAt, 0, newNode);
      return next;
    });
  };

  const removeDataEntry = (id: string) => {
    setDynamicEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntryType = (id: string, type: FieldType) => {
    setDynamicEntries(prev => prev.map(e => e.id === id ? { ...e, type, value: '' } : e));
  };

  const updateEntryValue = (id: string, value: any) => {
    setDynamicEntries(prev => prev.map(e => e.id === id ? { ...e, value } : e));
  };

  const handleDeleteFramework = async (frameworkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const fw = frameworks.find(f => f.id === frameworkId);
    if (!confirm('Delete this custom framework?')) return;
    setFrameworks(prev => prev.filter(f => f.id !== frameworkId));
    addAuditEntry('Delete Framework', `Removed custom framework: ${frameworkId} - ${fw?.name}`);
    try {
      await api.delete(`/frameworks/delete-framework/${frameworkId}`);
    } catch (error) {
      console.error("Error deleting framework from backend:", error);
    }
  };

  const handleDeleteControl = (controlId: string) => {
    const c = controls.find(x => x.id === controlId);
    if (!confirm('Delete this requirement?')) return;
    setControls(prev => prev.filter(c => c.id !== controlId));
    addAuditEntry('Delete Requirement', `Removed requirement ${controlId} from framework ${selectedFrameworkId}`);
    if (selectedFrameworkId) {
      setFrameworks(prev => prev.map(f => f.id === selectedFrameworkId ? { ...f, totalControls: Math.max(0, (f.totalControls || 0) - 1) } : f));
    }
    api.delete("/frameworks/delete-requirement", { params: { id: controlId, frameworkId: selectedFrameworkId} });
  };

  const selectedFramework = frameworks.find(f => f.id === selectedFrameworkId);
  const frameworkControls = useMemo(() => {
    return (controls || []).filter(c => 
      c?.frameworks?.includes(selectedFrameworkId || '') &&
      (c.id.toLowerCase().includes(domainSearch.toLowerCase()) || 
       c.name.toLowerCase().includes(domainSearch.toLowerCase()))
    );
  }, [controls, selectedFrameworkId, domainSearch]);

  const hierarchyLabels = useMemo(() => getHierarchyLabels(dynamicEntries), [dynamicEntries]);

  const openNewControlModal = () => {
    setEditingControlId(null);
    setControlFormData({
      id: `${selectedFramework?.id.split('-').pop()}-${Math.floor(Math.random() * 900) + 100}`,
      name: '',
      type: 'Preventive', status: 'Effective'
    });
    // Default to exactly one root node
    setDynamicEntries([{ id: `dyn-${Date.now()}`, type: 'text', value: '', level: 1 }]);
    setIsControlModalOpen(true);
  };

  if (selectedFrameworkId && selectedFramework) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-32">
        <div className="flex flex-col gap-6 pb-8 border-b border-slate-100 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-xl z-[40]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setSelectedFrameworkId(null); setDomainSearch(''); }}
              className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1">
                <Shield size={12} /> Domain Explorer
              </div>
              <h1 className="text-2xl font-light text-slate-900 tracking-tight">
                {selectedFramework.name} <span className="text-slate-400 font-normal ml-2">v{selectedFramework.version}</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                <input 
                  type="text"
                  placeholder="Filter by Name or ID..."
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-400 w-64 shadow-sm font-light transition-all"
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                />
              </div>

              {selectedFramework.isCustom && (
                <button 
                  onClick={openNewControlModal}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  <Plus size={16} /> Add Requirement
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {frameworkControls.length > 0 ? frameworkControls.map((control) => {
            const schema = control.controlSchema || [];
            
            return (
              <GlassCard key={control.id} noOverflow className="bg-white/80 border-slate-200/50 hover:border-blue-300 transition-all p-8 rounded-[2rem]">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                  <div className="flex gap-6 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-xl mt-1 text-white">
                      <span className="text-[8px] font-bold opacity-50 uppercase tracking-tighter leading-none mb-1">REF</span>
                      <span className="text-[12px] font-bold leading-none truncate max-w-full px-1">{control.id}</span>
                    </div>
                    
                    <div className="space-y-4 flex-1 min-w-0">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Network size={14} />
                           </div>
                           <h4 className="text-[17px] font-semibold text-slate-900 tracking-tight">{control.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            control.status === 'Effective' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'
                          }`}>
                            {control.status}
                          </span>
                        </div>
                      </div>
                      
                      {schema.length > 0 && (
                        <div className="space-y-6 mt-10 pt-10 border-t border-slate-100 animate-in fade-in duration-500">
                          {schema.map(field => {
                            const val = control.customValues?.[field.id];
                            const level = control.customValues?.[`_level_${field.id}`] || 1;
                            const idxLabel = control.customValues?.[`_idx_${field.id}`] || '';
                            
                            return (
                              <div key={field.id} className="group/attr border-l-2 border-slate-100 hover:border-indigo-300 transition-all pl-6" style={{ marginLeft: `${(level - 1) * 24}px` }}>
                                <div className="flex items-start gap-3">
                                  <div className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[9px] font-mono font-bold shrink-0 mt-0.5">{idxLabel}</div>
                                  <div className={`text-[13px] break-words whitespace-pre-wrap leading-relaxed min-h-[1.25rem] ${!val ? 'text-slate-300 italic font-light' : 'text-slate-700 font-medium'}`}>
                                    {val || 'Empty Data Point'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-8 border-l border-slate-100 shrink-0 self-start md:mt-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { 
                          setControlFormData({ ...control }); 
                          const entries: CustomDataEntry[] = (control.controlSchema || []).map(s => ({
                            id: s.id,
                            type: s.type,
                            value: control.customValues?.[s.id] || '',
                            level: control.customValues?.[`_level_${s.id}`] || 1,
                            options: s.options
                          }));
                          setDynamicEntries(entries);
                          setEditingControlId(control.id); 
                          setIsControlModalOpen(true); 
                        }}
                        className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                        title="Edit Architecture"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteControl(control.id)}
                        className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          }) : (
            <div className="py-32 text-center glass rounded-[3rem] border border-dashed border-slate-200 bg-white/40">
              <Component size={48} className="text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 text-sm font-light uppercase tracking-widest">No requirements defined for this domain.</p>
            </div>
          )}
        </div>

        <Modal 
          isOpen={isControlModalOpen} 
          onClose={() => setIsControlModalOpen(false)} 
          title={editingControlId ? "Update Requirement Architecture" : "Register Requirement"}
        >
          <div className="max-w-4xl mx-auto py-2">
            <form onSubmit={handleSaveControl} className="space-y-12">
              <div className="space-y-8">
                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em]">
                  <Shield size={12} /> Requirement Root Meta
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Requirement</label>
                    <div className="relative">
                       <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                       <input 
                         required type="text" 
                         placeholder="e.g. Identity Access Management"
                         className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[14px] focus:outline-none focus:border-blue-400 transition-all shadow-sm"
                         value={controlFormData.name}
                         onChange={(e) => setControlFormData({...controlFormData, name: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Reference ID</label>
                    <div className="relative">
                       <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                       <input 
                         required type="text" 
                         placeholder="e.g. CORE-1"
                         className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[14px] font-mono focus:outline-none focus:border-blue-400 transition-all shadow-sm"
                         value={controlFormData.id}
                         onChange={(e) => setControlFormData({...controlFormData, id: e.target.value})}
                       />
                    </div>
                  </div>
                </div>
              </div>

              {/* HIERARCHICAL DYNAMIC DATA SECTION */}
              <div className="pt-8 border-t border-slate-100 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold uppercase tracking-[0.2em]">
                    <ListTree size={12} /> Requirement Attributes & Nodes
                  </div>
                  <button 
                    type="button"
                    onClick={addRootNode}
                    className="flex items-center gap-2 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    <Plus size={14} /> Add Root Entry
                  </button>
                </div>

                <div className="space-y-6">
                  {dynamicEntries.map((entry, idx) => (
                    <div 
                      key={entry.id} 
                      className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 relative group animate-in slide-in-from-top-2 duration-300 shadow-sm"
                      style={{ marginLeft: `${(entry.level - 1) * 24}px` }}
                    >
                      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 z-10">
                        <button 
                          type="button"
                          onClick={() => addChildNode(idx)}
                          disabled={entry.level >= 7}
                          className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-30"
                          title={entry.level < 7 ? "Add Sub-Node (Nested)" : "Maximum depth reached"}
                        >
                          <PlusCircle size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeDataEntry(entry.id)}
                          className="p-1.5 bg-white border border-slate-200 text-slate-300 hover:text-rose-500 rounded-lg shadow-sm transition-all"
                          title="Delete Node"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 {entry.level > 1 && <CornerDownRight size={10} className="text-slate-300" />}
                                 Level {entry.level} Architecture
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                          <div className="md:col-span-4 space-y-4">
                            <div>
                               <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Data Interface</label>
                               <CustomSelect 
                                 options={FIELD_TYPE_OPTIONS}
                                 value={entry.type}
                                 onChange={(val) => updateEntryType(entry.id, val as FieldType)}
                               />
                            </div>
                          </div>
                          
                          <div className="md:col-span-8 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                               <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold font-mono shadow-md shadow-indigo-100 shrink-0">
                                 {hierarchyLabels[idx]}
                               </div>
                               <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Data Population</label>
                            </div>
                            
                            {entry.type === 'text' && (
                              <input 
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:border-indigo-400 transition-all font-light"
                                value={entry.value}
                                onChange={(e) => updateEntryValue(entry.id, e.target.value)}
                                placeholder="Value..."
                              />
                            )}

                            {entry.type === 'textarea' && (
                              <textarea 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] h-24 focus:outline-none focus:border-indigo-400 transition-all font-light resize-none custom-scrollbar"
                                value={entry.value}
                                onChange={(e) => updateEntryValue(entry.id, e.target.value)}
                                placeholder="Narrative..."
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {dynamicEntries.length === 0 && (
                    <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center bg-slate-50/20 group hover:border-indigo-100 transition-all cursor-pointer" onClick={addRootNode}>
                      <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">No data nodes defined. Click 'Add Root Entry' to begin.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button type="button" onClick={() => setIsControlModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-500 font-bold rounded-xl text-[11px] uppercase active:scale-95 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] uppercase shadow-xl active:scale-95 transition-all">
                  {editingControlId ? "Finalize Updates" : "Commit to Registry"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col gap-8 pb-6 border-b border-slate-100 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-xl z-[40]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-blue-600 font-medium uppercase tracking-[0.2em] mb-1">
              <Library size={10} /> Governance Registry
            </div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">Compliance Frameworks</h1>
            <div className="flex items-center gap-8 mt-6">
              <button onClick={() => setActiveTab('library')} className={`text-[11px] font-bold uppercase tracking-widest pb-3 transition-all relative ${activeTab === 'library' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                Standard Library
                {activeTab === 'library' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>}
              </button>
              <button onClick={() => setActiveTab('custom')} className={`text-[11px] font-bold uppercase tracking-widest pb-3 transition-all relative ${activeTab === 'custom' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                Custom Frameworks
                {activeTab === 'custom' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>}
              </button>
            </div>
          </div>
          
          {activeTab === 'custom' && (
            <button 
              onClick={() => {
                setFrameworkFormData({ name: '', version: '1.0.0', description: '' });
                setIsFrameworkModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              <Plus size={18} strokeWidth={2.5} /> Define Framework
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(activeTab === 'library' ? libraryFrameworks : customFrameworks).map((f) => {
          const controlCount = (controls || []).filter(c => c.frameworks.includes(f.id)).length;
          
          return (
            <GlassCard key={f.id} title={f.name} subtitle={`Revision ${f.version}`} className="bg-white flex flex-col h-full border-slate-200/50 group rounded-[2rem] hover:shadow-xl transition-all">
              <div className="flex-1 flex flex-col min-w-0">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${f.isCustom ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                      {f.isCustom ? <Lock size={20} strokeWidth={1.5} /> : <Globe size={20} strokeWidth={1.5} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{f.isCustom ? 'Corporate Policy' : 'Global Standard'}</span>
                      <span className="text-[11px] font-mono text-slate-300 font-bold uppercase truncate">{f.id}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-[13px] text-slate-500 leading-relaxed font-light mb-8 line-clamp-4 flex-1 break-words">{f.description}</p>
                
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <FileText size={14} className="text-blue-500/60" />
                    {controlCount} Active Entries
                  </div>
                  <div className="flex items-center gap-2">
                    {f.isCustom && (
                      <button onClick={(e) => handleDeleteFramework(f.id, e)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                    )}
                    <button onClick={() => setSelectedFrameworkId(f.id)} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 flex items-center gap-2">Explore <ChevronLeft size={14} className="rotate-180" /></button>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Modal isOpen={isFrameworkModalOpen} onClose={() => setIsFrameworkModalOpen(false)} title="Initialize Governance Framework">
        <form onSubmit={handleCreateCustomFramework} className="space-y-8 max-w-2xl mx-auto py-2">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-widest">
              <Library size={12} /> Framework Identity
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Framework Name</label>
                <input required type="text" className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 font-medium shadow-sm" value={frameworkFormData.name} onChange={(e) => setFrameworkFormData({...frameworkFormData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Revision</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 font-mono shadow-sm" value={frameworkFormData.version} onChange={(e) => setFrameworkFormData({...frameworkFormData, version: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Scope & Narrative</label>
              <textarea className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-[14px] text-slate-900 h-32 resize-none font-light shadow-sm" value={frameworkFormData.description} onChange={(e) => setFrameworkFormData({...frameworkFormData, description: e.target.value})} />
            </div>
          </div>

          <div className="pt-8 flex items-center gap-4">
            <button type="button" onClick={() => setIsFrameworkModalOpen(false)} className="flex-1 py-5 border border-slate-200 text-slate-500 font-bold rounded-2xl text-[11px] uppercase active:scale-95 transition-all">Cancel</button>
            <button type="submit" className="flex-[2] py-5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-[11px] uppercase shadow-xl active:scale-95 transition-all">Deploy Framework</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FrameworksModule;
