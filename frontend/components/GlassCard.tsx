
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noOverflow?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, subtitle, actions, noOverflow }) => {
  return (
    <div className={`glass rounded-xl p-6 md:p-8 relative ${noOverflow ? '' : 'overflow-hidden'} transition-all duration-500 group/card bg-white/70 border-slate-200/60 ${className}`}>
      {/* Subtle hover effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-50/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none ${noOverflow ? 'rounded-xl' : ''}`}></div>
      
      {(title || actions) && (
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <div className="space-y-1">
            {title && <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[10px] text-slate-400 font-normal uppercase tracking-[0.15em]">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="relative z-10 text-[12px] text-slate-600 leading-relaxed font-light">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;
