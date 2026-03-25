
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={containerRef} style={{ zIndex: isOpen ? 1000 : 'auto' }}>
      {label && (
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
          {label}
        </label>
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'} rounded-xl px-5 py-3.5 text-[13px] text-slate-900 flex items-center justify-between cursor-pointer transition-all duration-300 group hover:border-blue-400 shadow-sm relative z-20`}
      >
        <span className={`${!selectedOption ? 'text-slate-400' : 'text-slate-900'} font-medium truncate mr-2`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-500 shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'}`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-[999] w-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
          <div className="max-h-64 overflow-y-auto custom-scrollbar py-2">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`px-5 py-3.5 text-[13px] transition-all cursor-pointer flex items-center justify-between group/opt ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {isSelected && (
                    <Check size={14} className="text-blue-600 shrink-0" />
                  )}
                </div>
              );
            })}
            {options.length === 0 && (
              <div className="px-5 py-4 text-center text-slate-400 text-xs italic font-light">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
