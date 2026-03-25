
import React, { useState, useMemo, useRef, useEffect } from 'react';
import GlassCard from './GlassCard';
import Modal from './Modal';
import { 
  Plus, Search, MoreVertical, HardDrive, ShieldCheck, 
  Download, Filter, RotateCcw, Box, User, Briefcase, 
  Settings, Users, Info, Eye, EyeOff, Layout, ChevronRight,
  ShieldAlert, Clock, Settings2,
  Trash,
  Trash2
} from 'lucide-react';
import { Asset, Severity } from '../types';
import CustomSelect from './CustomSelect';
import api from './api/AxiosInstance';

interface AssetListProps {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  addAuditEntry: (action: string, details: string) => void;
}

const AssetList: React.FC<AssetListProps> = ({ assets, setAssets, addAuditEntry }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [nodeTypes, setNodeTypes] = useState<{ value: string; label: string }[]>([]);
  const [assetCategories, setAssetCategories] = useState<{ value: string; label: string }[]>([]);
  const [classificationOptions, setClassificationOptions] = useState<{ value: string; label: string }[]>([]);
  const [criticalityLevels, setCriticalityLevels] = useState<{ value: string; label: string }[]>([]);
  
  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    category: true,
    type: true,
    custodian: true,
    techOwner: false,
    businessUnit: true,
    classification: true,
    criticality: true,
    createdAt: false,
  });

  // Filter States
  const [typeFilter, setTypeFilter] = useState('All');
  const [criticalityFilter, setCriticalityFilter] = useState('All');
  const [classificationFilter, setClassificationFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '', 
    type: '', 
    category: '',
    owner: '', 
    technicalOwner: '',
    businessUnit: '', 
    classification: '', 
    criticality: ''
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const filteredAssets = useMemo(() => {
    return (assets || []).filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            a.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || a.type === typeFilter;
      const matchesCriticality = criticalityFilter === 'All' || a.criticality === criticalityFilter;
      const matchesClassification = classificationFilter === 'All' || a.classification === classificationFilter;
      const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter;
      
      return matchesSearch && matchesType && matchesCriticality && matchesClassification && matchesCategory;
    });
  }, [assets, searchTerm, typeFilter, criticalityFilter, classificationFilter, categoryFilter]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const asset: Asset = {
      ...newAsset as Asset,
      id: `AST-${Math.floor(Math.random() * 90000) + 10000}`,
      createdAt: new Date().toISOString().split('T')[0],
      customFields: {}
    };
    setAssets([asset, ...assets]);
    addAuditEntry('Register Asset', `New inventory node created: ${asset.id} - ${asset.name}`);

    try {
      api.post("/assets/create-asset", {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        category: asset.category,
        classification: asset.classification,
        criticality: asset.criticality,
      })
    } catch (error: any) {
      console.error("Error sending asset data to backend:", error);
    }

    setIsRegisterModalOpen(false);
    setNewAsset({ 
      name: '', type: 'Application', category: 'Software', owner: '', 
      technicalOwner: '', businessUnit: '', classification: 'Internal', criticality: 'Medium' 
    });

  };

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Type", "Category", "Business Custodian", "Technical Owner", "Business Unit", "Classification", "Criticality", "Created At"];
    const rows = filteredAssets.map(a => [
      a.id, 
      `"${a.name.replace(/"/g, '""')}"`, 
      a.type,
      a.category,
      `"${a.owner}"`, 
      `"${a.technicalOwner}"`,
      `"${a.businessUnit}"`, 
      a.classification, 
      a.criticality, 
      a.createdAt
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `grc_assets_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditEntry('Export Ledger', `Asset inventory CSV exported for ${filteredAssets.length} nodes`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setCriticalityFilter('All');
    setClassificationFilter('All');
    setCategoryFilter('All');
  };

  async function deleteAsset(id: string) {
    if (!window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/assets/delete-asset/${id}`);
      setAssets(prev => prev.filter(a => a.id !== id));
      addAuditEntry('Delete Asset', `Asset ${id} removed from inventory`);
      setViewingAsset(null);
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  }

  useEffect(() => {
    try {
      api.get("/assets/get-options").then(res => {
        const options = res.data;
        function groupOptionsByType(options: any[]) {
          return options.reduce((groups: any, option) => {
            const type = option.type || 'Uncategorized';
            if (!groups[type]) {
              groups[type] = [];
            }
            groups[type].push({ value: option.value, label: option.label });
            return groups;
          }, {});
        }
        const grouped = groupOptionsByType(options);
        setNodeTypes(grouped['NODE_TYPE'] || []);
        setAssetCategories(grouped['ASSET_CATEGORIES'] || []);
        setClassificationOptions(grouped['CLASSIFICATION_OPTIONS'] || []);
        setCriticalityLevels(grouped['CRITICALITY_LEVELS'] || []);
      });
    } catch (error) {
      console.error("Error fetching asset options:", error);
    }
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-10 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[10px] text-blue-600 font-medium uppercase tracking-[0.2em] mb-1">
            <HardDrive size={12} /> Resource Lifecycle
          </div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Asset Inventory</h1>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-normal">
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500" /> {assets.length} nodes registered</span>
            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            <span>Audit ready visibility</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 shadow-sm active:scale-95"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button 
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} />
            Register Asset
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4 bg-white/50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID, name, owner..." 
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-400 shadow-sm font-light transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2" ref={settingsRef}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 border rounded-xl transition-all flex items-center gap-2 ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900'}`}
            >
              <Filter size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Advanced Scope</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-slate-50 border border-slate-200 rounded-[2rem] animate-in slide-in-from-top-2 duration-300">
            <CustomSelect 
              label="Asset Type"
              options={[{ value: 'All', label: 'All Types' }, ...nodeTypes]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
            />
            <CustomSelect 
              label="Asset Category"
              options={[{ value: 'All', label: 'All Categories' }, ...assetCategories]}
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
            />
            <CustomSelect 
              label="Criticality"
              options={[{ value: 'All', label: 'All Levels' }, ...criticalityLevels]}
              value={criticalityFilter}
              onChange={(val) => setCriticalityFilter(val)}
            />
            <CustomSelect 
              label="Classification"
              options={[{ value: 'All', label: 'All Classes' }, ...classificationOptions]}
              value={classificationFilter}
              onChange={(val) => setClassificationFilter(val)}
            />
          </div>
        )}
      </div>

      <div className="space-y-1 overflow-x-auto custom-scrollbar rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="min-w-max w-full">
          <div className="grid grid-flow-col auto-cols-fr px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 bg-slate-50/50">
            {visibleColumns.name && <div className="min-w-[200px]">Asset Identity</div>}
            {visibleColumns.id && <div className="min-w-[120px]">Asset ID</div>}
            {visibleColumns.category && <div className="min-w-[120px]">Category</div>}
            {visibleColumns.type && <div className="min-w-[120px]">Type</div>}
            {visibleColumns.custodian && <div className="min-w-[180px]">Business Custodian</div>}
            {visibleColumns.businessUnit && <div className="min-w-[180px]">Business Unit</div>}
            {visibleColumns.classification && <div className="min-w-[120px] text-center">Class</div>}
            {visibleColumns.criticality && <div className="min-w-[120px] text-center">Criticality</div>}
          </div>
          
          <div className="divide-y divide-slate-50">
            {filteredAssets.length > 0 ? filteredAssets.map((asset) => (
              <div 
                key={asset.id} 
                onClick={() => setViewingAsset(asset)}
                className="grid grid-flow-col auto-cols-fr items-center px-8 py-6 group hover:bg-slate-50/80 transition-all duration-500 cursor-pointer"
              >
                {/* Name */}
                {visibleColumns.name && (
                  <div className="min-w-[200px] pr-4">
                    <span className="text-[14px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight truncate block" title={asset.name}>
                      {asset.name}
                    </span>
                  </div>
                )}

                {/* ID */}
                {visibleColumns.id && (
                  <div className="min-w-[120px]">
                    <span className="text-[9px] text-slate-400 font-mono font-bold tracking-widest truncate block">
                      {asset.id}
                    </span>
                  </div>
                )}

                {/* Category */}
                {visibleColumns.category && (
                  <div className="min-w-[120px] pr-2">
                    <span className="text-[11px] text-indigo-600 font-semibold px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md truncate inline-block max-w-full">
                      {asset.category}
                    </span>
                  </div>
                )}

                {/* Type */}
                {visibleColumns.type && (
                  <div className="min-w-[120px] pr-2">
                    <span className="text-[11px] text-slate-600 font-medium truncate block" title={asset.type}>
                      {asset.type}
                    </span>
                  </div>
                )}

                {/* Custodian */}
                {visibleColumns.custodian && (
                  <div className="min-w-[180px] pr-4 flex items-center gap-2">
                    <User size={12} className="text-blue-400 shrink-0" />
                    <span className="text-[11px] text-slate-700 truncate font-medium" title={asset.owner}>
                      {asset.owner}
                    </span>
                  </div>
                )}

                {/* Business Unit */}
                {visibleColumns.businessUnit && (
                  <div className="min-w-[180px] pr-4 flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-300 shrink-0" />
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-tight truncate block" title={asset.businessUnit}>
                      {asset.businessUnit || 'Corporate'}
                    </span>
                  </div>
                )}

                {/* Classification */}
                {visibleColumns.classification && (
                  <div className="min-w-[120px] text-center">
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-tight border inline-block max-w-full truncate ${
                      asset.classification === 'Restricted' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                      asset.classification === 'Confidential' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                      'text-slate-500 bg-slate-50 border-slate-100'
                    }`}>
                      {asset.classification}
                    </span>
                  </div>
                )}

                {/* Criticality */}
                {visibleColumns.criticality && (
                  <div className="min-w-[120px] flex flex-col items-center justify-center">
                    <div className={`w-1.5 h-1.5 rounded-full mb-1 shrink-0 ${
                      asset.criticality === 'Critical' ? 'bg-rose-500 animate-pulse shadow-sm shadow-rose-200' : 
                      asset.criticality === 'High' ? 'bg-rose-400' : 
                      asset.criticality === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}></div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{asset.criticality}</span>
                  </div>
                )}
              </div>
            )) : (
              <div className="py-32 text-center bg-white">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Search size={24} className="text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-light">No records found matching current scope.</p>
                <button onClick={resetFilters} className="mt-4 text-blue-600 text-xs font-bold uppercase tracking-widest hover:underline">Reset Global Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Viewing Asset Modal */}
      <Modal 
        isOpen={!!viewingAsset} 
        onClose={() => setViewingAsset(null)} 
        title="Asset Detailed View"
      >
        {viewingAsset && (
          <div className="space-y-10 animate-in fade-in duration-500 py-4">
            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 shrink-0">
                <HardDrive size={32} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Global Identifier: {viewingAsset.id}</p>
                <h3 className="text-2xl font-light text-slate-900 truncate tracking-tight">{viewingAsset.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                   <span className="text-[10px] px-2 py-0.5 bg-blue-600 text-white font-bold rounded-lg uppercase tracking-wider">{viewingAsset.category}</span>
                   <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-600 font-bold rounded-lg uppercase tracking-wider">{viewingAsset.type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div
                onClick={() => deleteAsset(viewingAsset.id)}
                className="flex flex-col items-center justify-center group"
              >
                <button className="w-10 h-10 flex items-center justify-center rounded-md border border-slate-200 bg-red-500 text-white hover:bg-red-600 transition-all">
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setViewingAsset(null)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-md text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Register Asset Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Register Enterprise Asset">
        <form onSubmit={handleAddAsset} className="space-y-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <HardDrive size={12} /> Asset Basic Identity
            </h3>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] ml-1">Asset Name / Title</label>
              <input 
                required type="text" placeholder="e.g. Oracle Financials DB"
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all font-light"
                value={newAsset.name}
                onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <CustomSelect 
              label="Asset Category"
              options={assetCategories}
              value={newAsset.category || assetCategories[0]?.value}
              onChange={(val) => setNewAsset({...newAsset, category: val as any})}
            />
            <CustomSelect 
              label="Specific Asset Type"
              options={nodeTypes}
              value={newAsset.type || nodeTypes[0]?.value}
              onChange={(val) => setNewAsset({...newAsset, type: val})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <CustomSelect 
              label="Classification"
              options={classificationOptions}
              value={newAsset.classification || classificationOptions[0]?.value}
              onChange={(val) => setNewAsset({...newAsset, classification: val as any})}
            />
            <CustomSelect 
              label="Business Criticality"
              options={criticalityLevels}
              value={newAsset.criticality || criticalityLevels[0]?.value}
              onChange={(val) => setNewAsset({...newAsset, criticality: val as Severity})}
            />
          </div>
          <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-[12px] tracking-[0.25em] transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-95">
            FINALIZE REGISTRATION
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AssetList;
