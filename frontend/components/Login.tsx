
import React, { useState } from 'react';
import { Command, Mail, Lock, ArrowRight, ShieldCheck, Info } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
  loginError: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, loginError } : LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin({
        name: 'Alex Rivera',
        role: 'GRC Lead',
        email,
        password
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6 bg-[#f8fafc]">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 glass rounded-2xl border border-blue-100 text-blue-600 mb-4 shadow-xl shadow-blue-500/5">
            <Command size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-light text-slate-900 tracking-tighter">Vis GRC</h1>
          <p className="text-slate-400 text-[13px] font-normal tracking-wide">Governance, Risk, and Compliance Operating System</p>
        </div>

        <div className="glass-thick p-10 rounded-[2.5rem] border border-white shadow-2xl relative overflow-hidden">
          {/* Shimmer effect when loading */}
          {isLoading && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-[shimmer_2s_infinite_linear] origin-left"></div>}
          
          {/* Demo credentials */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 mb-4 -mt-3">
            <div className="mt-1">
              <ShieldCheck size={18} className="text-blue-500" />
            </div>

            <div className="text-[12px] text-slate-700 space-y-1">
              <p className="font-semibold text-slate-800 tracking-wide">
                Demo Credentials
              </p>

              <div className="text-slate-600">
                <p>
                  <span className="font-medium text-slate-800">Email:</span> admin@gmail.com
                </p>
                <p>
                  <span className="font-medium text-slate-800">Password:</span> Admin@123
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input 
                    required 
                    type="email" 
                    placeholder="name@company.com"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-light"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <button type="button" className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold tracking-wide uppercase">Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input 
                    required 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-light"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loginError && (
              <div className="text-red-700 rounded-md text-sm">
                {loginError}
              </div>
            )}

            <div className="space-y-3">
              <button 
                disabled={isLoading}
                type="submit" 
                className={`w-full py-4.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-[12px] tracking-[0.2em] transition-all duration-300 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${isLoading ? 'cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'ESTABLISHING HANDSHAKE...' : 'SECURE SIGN IN'}
                {!isLoading && <ArrowRight size={16} />}
              </button>

              {isLoading && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                  <Info size={13} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-600 leading-relaxed">
                    The backend is hosted on a free tier as no paid users yet, so the first request may take up to 50 seconds to wake up. Please be patient — it'll be fast after that. ☕
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-50 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-500" />
              SAML 2.0 & MFA Enabled
            </div>
          </form>
        </div>

        <p className="text-center mt-10 text-[11px] text-slate-400">
          New to the platform? <button className="text-blue-600 font-semibold hover:underline">Request an enterprise account</button>
        </p>
      </div>
    </div>
  );
};

export default Login;
