import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[4px] transition-all duration-1000" onClick={onClose}></div>
      <div className="glass-thick w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-white relative z-10 animate-in zoom-in-95 fade-in duration-500 bg-white/90">
        <div className="px-8 md:px-10 py-5 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold tracking-widest text-slate-400">
             <span className="uppercase">Core</span>
             <span className="opacity-30">/</span>
             <h3 className="text-slate-900 font-semibold tracking-tight uppercase">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-900">
            <X size={14} strokeWidth={1.2} />
          </button>
        </div>
        <div className="p-8 md:p-10 max-h-[75vh] overflow-y-auto no-scrollbar scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;