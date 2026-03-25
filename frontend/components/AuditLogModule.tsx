
import React, { useState, useMemo } from 'react';
import GlassCard from './GlassCard';
import { AuditEntry } from '../types';
import { Activity, Search, Filter, Download, Terminal, Clock, User, ShieldAlert, ChevronRight } from 'lucide-react';

interface AuditLogModuleProps {
  logs: AuditEntry[];
}

const AuditLogModule: React.FC<AuditLogModuleProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'All' || log.action.includes(filterType);
      
      return matchesSearch && matchesType;
    });
  }, [logs, searchTerm, filterType]);

  const getActionStyles = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('initialize') || act.includes('add') || act.includes('register')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    if (act.includes('delete') || act.includes('remove') || act.includes('terminate')) {
      return 'bg-rose-50 text-rose-600 border-rose-100';
    }
    if (act.includes('update') || act.includes('commit') || act.includes('edit')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (act.includes('authentication')) {
      return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
    return 'bg-slate-50 text-slate-500 border-slate-200';
  };

  const handleExport = () => {
    const headers = ["Timestamp", "User", "Action", "Details"];
    const rows = filteredLogs.map(l => [l.timestamp, l.user, l.action, `"${l.details.replace(/"/g, '""')}"`]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `grc_audit_ledger_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-xl z-[40]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold uppercase tracking-[0.2em] mb-1">
            <Terminal size={12} /> System Integrity Ledger
          </div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Audit Log</h1>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Tamper-evident activity monitoring</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
        >
          <Download size={14} /> Export Ledger
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white/50 border border-slate-200 rounded-[2rem] p-4 shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input 
            type="text" 
            placeholder="Search log history by action, user or details..." 
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[12px] focus:outline-none focus:border-indigo-400 shadow-sm font-light transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm uppercase tracking-widest"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Create">Create / Init</option>
          <option value="Update">Update / Commit</option>
          <option value="Delete">Delete / Remove</option>
          <option value="Authentication">Authentication</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] w-48">Timestamp</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] w-48">Operator</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] w-56">Action Event</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Transaction Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                <td className="px-8 py-5 whitespace-nowrap">
                   <div className="flex items-center gap-3">
                      <Clock size={12} className="text-slate-300" />
                      <span className="text-[11px] font-mono font-bold text-slate-500 tabular-nums">
                        {new Date(log.timestamp).toLocaleString('en-GB', { hour12: false })}
                      </span>
                   </div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                         <img src={`https://picsum.photos/seed/${log.user}/24/24`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[12px] font-semibold text-slate-700">{log.name}</span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <span className={`text-[9px] px-3 py-1 rounded-lg font-bold uppercase tracking-widest border inline-block ${getActionStyles(log.action)}`}>
                     {log.action}
                   </span>
                </td>
                <td className="px-8 py-5">
                   <p className="text-[12px] text-slate-600 font-light leading-relaxed group-hover:text-slate-900 transition-colors">
                     {log.details}
                   </p>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-32 text-center">
                   <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                      <ShieldAlert size={28} className="text-slate-200" />
                   </div>
                   <p className="text-slate-400 text-sm font-light italic">No matching transaction records found in the ledger.</p>
                   <button onClick={() => {setSearchTerm(''); setFilterType('All');}} className="mt-4 text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:underline">Reset Filters</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogModule;
