import React, { useEffect, useState } from "react";
import GlassCard from "./GlassCard";
import api from "./api/AxiosInstance";
import {
  Mail,
  ShieldCheck,
  Calendar,
  HardDrive,
  ClipboardList,
  FileCheck,
  Briefcase,
  Activity,
  Scale,
  ChevronRight,
  User,
  Key
} from "lucide-react";
import PasswordManagement from "./UpdatePassword";

const ProfileModule: React.FC = () => {

  const [profile, setProfile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    api.get("/profile/get-profile-data")
      .then(res => setProfile(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!profile) return null;

  const stats = [
    { label: "Assets", value: profile.stats.assets, icon: HardDrive },
    { label: "Assessments", value: profile.stats.assessments, icon: ClipboardList },
    { label: "Evidence Files", value: profile.stats.evidence, icon: FileCheck },
    { label: "Projects", value: profile.stats.projects, icon: Briefcase },
    { label: "Controls", value: profile.stats.controls, icon: ShieldCheck },
    { label: "Frameworks", value: profile.stats.frameworks, icon: Activity },
    { label: "Compliances", value: profile.stats.internalAssessments, icon: Scale },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <GlassCard
                key={i}
                className="bg-white border-slate-200 hover:border-blue-200 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <stat.icon size={16} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <h4 className="text-2xl font-light text-slate-900">
                    {stat.value}
                  </h4>
                </div>
              </GlassCard>
            ))}
          </div>
        )

      case 'password':
        return <PasswordManagement />
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">

      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <h1 className="text-3xl font-light text-slate-900 tracking-tight">
          Profile
        </h1>
        <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-medium">
          Personal profile & contribution overview
        </p>
      </div>

      {/* Profile Card */}
      <GlassCard className="bg-white border-slate-200/40">

        <div className="flex items-center gap-6">

          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden">
            <img
              src={`https://picsum.photos/seed/${profile.email}/120`}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2 flex-1">

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                {profile.name}
              </h2>

              <span className="text-[9px] px-2 py-0.5 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-100 font-bold uppercase tracking-widest">
                {profile.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-6 text-[12px] text-slate-500">

              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-300" />
                {profile.email}
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-300" />
                {profile.role}
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-300" />
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </div>

            </div>

          </div>

        </div>

      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-3">
          <div 
            onClick={() => setActiveSection('profile')}
            className={`glass p-5 rounded-2xl flex items-center justify-between border group cursor-pointer transition-all ${
              activeSection === 'profile' ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-100' : 'border-slate-100 bg-white hover:border-blue-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl transition-colors ${activeSection === 'profile' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <User size={20} strokeWidth={1.5} />
              </div>
              <span className={`text-[13px] font-semibold ${activeSection === 'profile' ? 'text-blue-700' : 'text-slate-900'}`}>My Profle</span>
            </div>
            <ChevronRight size={14} className={activeSection === 'profile' ? 'text-blue-400' : 'text-slate-300'} />
          </div>

          <div 
            onClick={() => setActiveSection('password')}
            className={`glass p-5 rounded-2xl flex items-center justify-between border group cursor-pointer transition-all ${
              activeSection === 'password' ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-100' : 'border-slate-100 bg-white hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl transition-colors ${activeSection === 'password' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'}`}>
                <Key size={20} strokeWidth={1.5} />
              </div>
              <span className={`text-[13px] font-semibold ${activeSection === 'password' ? 'text-amber-700' : 'text-slate-900'}`}>Update Password</span>
            </div>
            <ChevronRight size={14} className={activeSection === 'password' ? 'text-amber-400' : 'text-slate-300'} />
          </div>
        </div>

        <div className="lg:col-span-9 animate-in slide-in-from-right-2 duration-500">
          {renderSectionContent()}
        </div>
      </div>

    </div>
  );
};

export default ProfileModule;