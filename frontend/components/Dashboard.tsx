
import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ShieldCheck, AlertCircle, HardDrive, FileCheck, Settings2, Eye, EyeOff, ArrowUpRight, ChevronRight, Activity, CheckCircle2, Grid3X3 } from 'lucide-react';
import { MOCK_RISKS } from '../constants';

const data = [
  { name: 'Jan', score: 62 },
  { name: 'Feb', score: 65 },
  { name: 'Mar', score: 78 },
  { name: 'Apr', score: 72 },
  { name: 'May', score: 85 },
  { name: 'Jun', score: 88 },
];

const riskData = [
  { category: 'Cyber', count: 12, color: '#3b82f6' },
  { category: 'Compliance', count: 7, color: '#10b981' },
  { category: 'Ops', count: 5, color: '#f59e0b' },
];

const StatCard = ({ icon: Icon, label, value, trend, color, isCustomizing, isVisible, onToggle }: any) => (
  <div className={`glass group rounded-2xl p-6 border transition-all duration-500 relative flex flex-col justify-between h-40 bg-white ${
    isCustomizing ? 'border-dashed border-slate-300' : 'border-slate-200 hover:border-blue-200'
  } ${!isVisible && isCustomizing ? 'opacity-30 grayscale scale-[0.98]' : 'opacity-100'}`}>
    
    {isCustomizing && (
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all z-20"
      >
        {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
    )}

    <div className="flex items-center justify-between">
      <div className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-600 border border-${color}-100 transition-colors duration-500`}>
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
        <ArrowUpRight size={10} /> {trend}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-[11px] text-slate-400 font-normal uppercase tracking-widest">{label}</p>
      <h4 className="text-3xl font-light text-slate-900 tracking-tighter">{value}</h4>
    </div>
    
    {!isVisible && isCustomizing && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-2 py-1 rounded">Hidden</span>
      </div>
    )}
  </div>
);

const RiskHeatmap = () => {
  const grid = Array(5).fill(0).map(() => Array(5).fill(0));
  
  MOCK_RISKS.forEach(risk => {
    const l = Math.min(Math.max(risk.inherentLikelihood - 1, 0), 4);
    const i = Math.min(Math.max(risk.inherentImpact - 1, 0), 4);
    grid[4 - l][i]++; // Invert Y for visual likelihood (5 at top)
  });

  const getCellColor = (row: number, col: number, count: number) => {
    const score = (5 - row) * (col + 1);
    if (count === 0) return 'bg-slate-50 opacity-20';
    if (score >= 16) return 'bg-rose-500 text-white';
    if (score >= 9) return 'bg-amber-400 text-slate-900';
    return 'bg-emerald-400 text-slate-900';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-1 aspect-square w-full">
        {grid.map((row, rIdx) => 
          row.map((count, cIdx) => (
            <div 
              key={`${rIdx}-${cIdx}`}
              className={`rounded-sm flex items-center justify-center text-[10px] font-bold transition-all hover:scale-105 cursor-help ${getCellColor(rIdx, cIdx, count)}`}
              title={`Score: ${(5-rIdx)*(cIdx+1)} | Risks: ${count}`}
            >
              {count > 0 ? count : ''}
            </div>
          ))
        )}
      </div>
      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
        <span>Impact Low</span>
        <span>Impact High</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState({ 
    stats: true, 
    trend: true, 
    risk: true, 
    heatmap: true,
    ledger: true, 
    nodes: true 
  });

  const toggleWidget = (key: keyof typeof visibleWidgets) => {
    setVisibleWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsCustomizing(false);
    setShowSaveFeedback(true);
    setTimeout(() => setShowSaveFeedback(false), 3000);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] text-blue-600 font-medium uppercase tracking-[0.2em] mb-1">
            <Activity size={10} /> System Operational
          </div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Executive Intelligence</h1>
          <p className="text-[12px] text-slate-500 font-normal tracking-wide max-w-lg leading-relaxed">
            Strategic visibility for governance, active risk monitoring, and framework alignment.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-fit">
          {showSaveFeedback && (
            <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 size={14} /> Layout Saved
            </div>
          )}
          <button 
            onClick={() => isCustomizing ? handleSave() : setIsCustomizing(true)}
            className={`px-4 py-2 rounded-xl text-[10px] font-medium transition-all duration-500 border flex items-center justify-center gap-2 w-full sm:w-fit ${
              isCustomizing 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200' 
                : 'glass border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 size={12} strokeWidth={1.5} className={isCustomizing ? 'animate-spin' : ''} />
            {isCustomizing ? 'SAVE LAYOUT' : 'CUSTOMIZE VIEW'}
          </button>
        </div>
      </div>

      {(visibleWidgets.stats || isCustomizing) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <StatCard 
            icon={ShieldCheck} label="Compliance Score" value="88.4%" trend="3.2%" color="blue" 
            isCustomizing={isCustomizing} isVisible={visibleWidgets.stats} onToggle={() => toggleWidget('stats')} 
          />
          <StatCard 
            icon={AlertCircle} label="Risk Exposure" value="14" trend="12%" color="rose" 
            isCustomizing={isCustomizing} isVisible={visibleWidgets.stats} onToggle={() => toggleWidget('stats')} 
          />
          <StatCard 
            icon={HardDrive} label="Monitored Assets" value="2,481" trend="0.8%" color="indigo" 
            isCustomizing={isCustomizing} isVisible={visibleWidgets.stats} onToggle={() => toggleWidget('stats')} 
          />
          <StatCard 
            icon={FileCheck} label="Pending Evidence" value="09" trend="High" color="amber" 
            isCustomizing={isCustomizing} isVisible={visibleWidgets.stats} onToggle={() => toggleWidget('stats')} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(visibleWidgets.trend || isCustomizing) && (
          <GlassCard 
            className={`lg:col-span-2 transition-all duration-500 ${isCustomizing ? 'border-dashed' : ''} ${!visibleWidgets.trend ? 'opacity-30 grayscale scale-[0.98]' : ''}`} 
            title="Readiness Pulse" 
            subtitle="Audit probability trend"
            actions={isCustomizing && (
              <button onClick={() => toggleWidget('trend')} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                {visibleWidgets.trend ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            )}
          >
            <div className="h-[280px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                    itemStyle={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPulse)" animationDuration={2500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {(visibleWidgets.heatmap || isCustomizing) && (
          <GlassCard 
            className={`transition-all duration-500 ${isCustomizing ? 'border-dashed' : ''} ${!visibleWidgets.heatmap ? 'opacity-30 grayscale scale-[0.98]' : ''}`}
            title="Risk Heatmap" 
            subtitle="Likelihood vs Impact"
            actions={isCustomizing && (
              <button onClick={() => toggleWidget('heatmap')} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                {visibleWidgets.heatmap ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            )}
          >
            <div className="mt-6">
              <RiskHeatmap />
            </div>
          </GlassCard>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(visibleWidgets.ledger || isCustomizing) && (
          <GlassCard 
            title="Global Ledger" 
            subtitle="Latest activity logs"
            className={`transition-all duration-500 ${isCustomizing ? 'border-dashed' : ''} ${!visibleWidgets.ledger ? 'opacity-30 grayscale scale-[0.98]' : ''}`}
            actions={isCustomizing && (
              <button onClick={() => toggleWidget('ledger')} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                {visibleWidgets.ledger ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            )}
          >
            <div className="space-y-5">
              {[
                { user: 'Sarah Analyst', action: 'authorized', target: 'SOC2-C5 Evidence', time: '2m' },
                { user: 'System Bot', action: 'completed', target: 'Cloud Scan #441', time: '1h' },
                { user: 'Security Ops', action: 'mitigated', target: 'Risk R-442', time: '4h' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-slate-100 overflow-hidden bg-slate-50">
                      <img src={`https://picsum.photos/seed/${item.user}/48/48`} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[12px] text-slate-500 group-hover:text-slate-900 transition-colors duration-500 leading-none">
                      <span className="text-slate-900 font-medium">{item.user}</span> {item.action} <span className="text-blue-600">{item.target}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">{item.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {(visibleWidgets.nodes || isCustomizing) && (
          <GlassCard 
            title="Urgent Nodes" 
            subtitle="Action required"
            className={`transition-all duration-500 ${isCustomizing ? 'border-dashed' : ''} ${!visibleWidgets.nodes ? 'opacity-30 grayscale scale-[0.98]' : ''}`}
            actions={isCustomizing && (
              <button onClick={() => toggleWidget('nodes')} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                {visibleWidgets.nodes ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            )}
          >
            <div className="space-y-3">
              {[
                { title: 'ISO 27001 Surveillance Audit', urgency: 'High', date: 'Due in 4 days' },
                { title: 'SOC 2 Annual Certification', urgency: 'Critical', date: 'Due in 12 days' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all duration-500 group cursor-pointer bg-white">
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.urgency === 'Critical' ? 'bg-rose-50 shadow-sm animate-pulse' : item.urgency === 'High' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                    <div>
                      <h5 className="text-[12px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.date}</p>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-400 transition-all" />
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
