import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { 
  Plus, Database, Lock, Users, ChevronRight, Settings, 
  UserPlus, Mail, Shield, Trash2, CheckCircle2, 
  UserCheck, AlertCircle, Info, Key, ChevronLeft,
  Eye, Edit3, Trash, Download, PlusSquare, ToggleLeft, ToggleRight
} from 'lucide-react';
import { UserEntity, PlatformRole } from '../types';
import api from './api/AxiosInstance';
import PasswordPolicy from './PasswordPolicy';

interface SettingsModuleProps {
  addAuditEntry: (action: string, details: string) => void;
}

const ROLE_OPTIONS = [
  { value: 'Administrator', label: 'Administrator (Full Access)' },
  { value: 'Risk Manager', label: 'Risk Manager (Risk & Pipeline)' },
  { value: 'Compliance Analyst', label: 'Compliance Analyst (Evidence & Audit)' },
  { value: 'Auditor', label: 'Auditor (Read-only + Evidence)' },
  { value: 'Viewer', label: 'Global Viewer (Read-only)' },
];

const MODULE_PERMISSIONS = [
  { id: 'risks', label: 'Risk Management', actions: ['View', 'Create', 'Edit', 'Delete'] },
  { id: 'assets', label: 'Asset Inventory', actions: ['View', 'Create', 'Edit', 'Delete'] },
  { id: 'controls', label: 'Internal Controls', actions: ['View', 'Create', 'Edit', 'Delete'] },
  { id: 'frameworks', label: 'Frameworks', actions: ['View', 'Create', 'Edit', 'Delete'] },
  { id: 'compliance', label: 'Compliance Engagements', actions: ['View', 'Assess', 'Audit'] },
  { id: 'pipeline', label: 'Remediation Pipeline', actions: ['View', 'Create', 'Edit', 'Move'] },
  { id: 'audit', label: 'Audit Log', actions: ['View', 'Export'] },
  { id: 'settings', label: 'System Settings', actions: ['View', 'Identity', 'Schema'] },
];

const SettingsModule: React.FC<SettingsModuleProps> = ({ addAuditEntry }) => {
  const [activeSection, setActiveSection] = useState<'identity' | 'policies' | 'schema' | 'password'>('identity');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedRoleForConfig, setSelectedRoleForConfig] = useState<PlatformRole | null>(null);
  
  // State for Role Permissions (Mock Initial State)
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

  // State for Users
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [currentUser, setCurrentUser] = useState<UserEntity | null>(null);

  // State for Schema Fields
  const [customFields, setCustomFields] = useState([
    { name: 'Hardware Serial', type: 'String', scope: 'Asset' },
    { name: 'Regulatory Reference', type: 'String', scope: 'Control' },
    { name: 'Business Importance', type: 'Enum', scope: 'Asset' },
  ]);

  // Form State for New User
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Viewer' as PlatformRole
  });

  const [options, setOptions] = useState<{ type: string; value: string; label: string }[]>([]);
  const [optionsGroup, setOptionsGroup] = useState<{ [key: string]: { type: string, value: string; label: string }[] }>({});
  const [optionTypes, setOptionTypes] = useState<string[]>([]);
  const [isOptionModal, setIsOptionModal] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<{ type: string; value: string; label: string } | null>(null);
  const [isCreatingOption, setIsCreatingOption] = useState<boolean>(false);
  const [newAttribute, setNewAttribute] = useState({
    type: "",
    value: "",
    label: "",
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const user: UserEntity = {
      id: `U-${users.length + 1}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Pending'
    };

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };

    try {
      await api.post("/settings/send-invitation", payload).then((res) => {
        if (res.data) {
          console.log(res.data);
          setUsers([...users, { ...user, role: { name: user.role } }]);
          addAuditEntry('Create User', `Provisioned new platform user: ${user.name} (${user.email}) as ${user.role}`);
          setIsAddUserModalOpen(false);
          setNewUser({ name: '', email: '', role: 'Viewer' });
        }
      });
    } catch (error) {
      console.error('Failed to add user:', error.response?.data || error);
      alert('An error occurred while adding the user. Please try again.');
      return;      
    }
  };

  const [openModalForRoleUpdate, setOpenModalForRoleUpdate] = useState<boolean>(false);
  const [roleChangeUserId, setRoleChangeUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);
  
  const openModalForRoleChange = (userId: string) => {
    setRoleChangeUserId(userId);
    setOpenModalForRoleUpdate(true);
    setSelectedRoleId(users.find(u => u.id === userId)?.role?.name || null);
  }

  const handleUpdateRole = (userId: string, newRole: PlatformRole) => {
    setIsUpdatingRole(true);
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const oldRole = user?.role?.name;
    if (oldRole === newRole) return;
    console.log(`Updating role for user ${userId} from ${oldRole} to ${newRole}`);
    try {
      api.put(`/settings/update-user-role/${userId}`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: { ...u.role, name: newRole } } : u));
      addAuditEntry('Update Permissions', `Modified RBAC role for ${user.name}: ${oldRole} → ${newRole}`);
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('An error occurred while updating the user role. Please try again.');
      return;
    } finally {
      setIsUpdatingRole(false);
      setOpenModalForRoleUpdate(false);
      setRoleChangeUserId(null);
      setSelectedRoleId(null);
    }
  };

  const togglePermission = async (role: PlatformRole, permId: string) => {
    try {
      await api.post('/settings/toggle-permission', { roleName: role, permId });

      const current = rolePermissions[role] || [];
      const isAdding = !current.includes(permId);
      const next = isAdding ? [...current, permId] : current.filter(p => p !== permId);
      
      setRolePermissions(prev => ({ ...prev, [role]: next }));
      addAuditEntry('Update Permissions', `${isAdding ? 'Granted' : 'Revoked'} permission [${permId}] for role: ${role}`);
    } catch (error) {
      console.error('Failed to update permissions:', error.response.data || error);
      alert('An error occurred while updating permissions. Please try again.');
      return;      
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (!confirm(`Revoke access for ${user.name}?`)) return;
    
    try {
      await api.delete(`settings/delete-user/${userId}`)
        .then(() => {
          setUsers(prev => prev.filter(u => u.id !== userId));
          addAuditEntry('Delete User', `Revoked platform access for user: ${user.name} (${user.id})`);
        })
        .catch(error => {
          alert(error?.response?.data?.error || 'Failed to delete user. Please try again.');
          return null;
        })
      ;
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('An error occurred while deleting the user. Please try again.');
      return;      
    }
  };

  async function deleteOption() {
    if (!confirm("Are you sure you want to delete this option?")) return;
    try {
      await api.delete(`/assets/delete-option/${selectedOption.id}`);
      setOptions(prev => prev.filter(o => o.id !== selectedOption.id));
      addAuditEntry('Delete Option', `Removed custom option with ID: ${selectedOption.id}`);
      setIsOptionModal(false);
      setSelectedOption(null);
    } catch (error) {
      console.error('Failed to delete option:', error.response?.data || error);
      alert('An error occurred while deleting the option. Please try again.');
      return;      
    }
  }

  async function createAttribute() {
    try {
      const payload = {
        type: newAttribute.type,
        value: newAttribute.value,
        label: newAttribute.label,
      };
      const res = await api.post("/assets/create-option", payload);
      const createdOption = res.data;
      setOptions(prev => [...prev, createdOption]);
      addAuditEntry('Create Option', `Defined new global attribute: ${createdOption.label} (${createdOption.type})`);
      setIsCreatingOption(false);
      setNewAttribute({ type: '', value: '', label: '' });
    } catch (error) {
      console.error('Failed to create option:', error.response?.data || error);
      alert('An error occurred while creating the option. Please try again.');
      return;      
    }
  }

  useEffect(() => {
    api
      .get("/settings/get-users")
      .then(response => setUsers(response.data))
      .catch(error => console.error('Failed to fetch users:', error.response?.data || error));
    api
      .get("/settings/get-role-permissions")
      .then(response => {
        setRolePermissions(response.data);
      })
      .catch(error => console.error('Failed to fetch role permissions:', error.response?.data || error));
    api
      .get("/settings/get-user")
      .then(response => setCurrentUser(response.data))
      .catch(error => console.error('Failed to fetch current user:', error.response?.data || error));
    api
      .get("/assets/get-options").then(res => {
        const options = res.data;
        setOptions(options);
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
        setOptionsGroup(grouped);
        setOptionTypes(() => {
          const types = Object.keys(grouped);
          return types;
        })
      });
  }, []);

  useEffect(() => {
    try {
    } catch (error) {
      console.error("Error fetching asset options:", error);
    }
  }, []);

  if (!currentUser) return null;

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'identity':
        return (
          <GlassCard 
            title="User Directory" 
            subtitle="Manage platform access and workforce identity"
            className="bg-white"
            actions={
              currentUser.role?.name === "Administrator" && (
                <button 
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-md transition-all active:scale-95"
                >
                  <UserPlus size={14} /> Add Team Member
                </button>
              )
            }
          >
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Team Member</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Platform Role</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-32 text-center">Status</th>
                      {currentUser?.role?.name === "Administrator" && (
                        <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-20"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((u) => (
                      <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                               <img src={`https://picsum.photos/seed/${u.email}/48/48`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-slate-900">{u.name}</span>
                              <span className="text-[11px] text-slate-400 font-light">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {currentUser?.role?.name === "Administrator" ? (
                              <div
                                onClick={() => openModalForRoleChange(u.id)}
                                className="cursor-pointer flex flex-col items-start"
                              >
                                <p
                                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-blue-400 shadow-sm w-full">
                                  {u?.role?.name}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                  (Click to Modify)
                                </p>
                              </div>
                            ) : (
                              <p className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-blue-400 shadow-sm w-full">
                                {u?.role?.name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border ${
                            u.status === 'Active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-200'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                        {currentUser?.role?.name === "Administrator" && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>
        );

      case 'policies':
        if (currentUser?.role?.name === "Administrator") {
          if (selectedRoleForConfig) {
            return (
              <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedRoleForConfig(null)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                      <ChevronLeft size={18} className="text-slate-500" />
                    </button>
                    <div>
                      <h2 className="text-xl font-light text-slate-900 tracking-tight">Permissions: {selectedRoleForConfig}</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tailor granular access rights</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRoleForConfig(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    Finish Configuration
                  </button>
                </div>
  
                <div className="space-y-6">
                  {MODULE_PERMISSIONS.map((module) => (
                    <div key={module.id} className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm group hover:border-blue-200 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                          <h4 className="text-[15px] font-bold text-slate-900 tracking-tight">{module.label}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">Define capabilities for this module</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {module.actions.map(action => {
                            const permId = `${module.id}-${action}`;
                            const isActive = rolePermissions[selectedRoleForConfig]?.includes(permId);
                            return (
                              <button 
                                key={permId}
                                onClick={() => togglePermission(selectedRoleForConfig, permId)}
                                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all active:scale-95 ${
                                  isActive 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-100' 
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                                }`}
                              >
                                <span className="text-[11px] font-bold uppercase tracking-widest">{action}</span>
                                {isActive ? <ToggleRight size={20} strokeWidth={1.5} /> : <ToggleLeft size={20} strokeWidth={1.5} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <GlassCard title="Authorization Policies" subtitle="Role Based Access Control (RBAC) definitions" className="bg-white">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { role: 'Administrator', desc: 'Full administrative access to all system modules, configurations, and user management.', icon: Shield, color: 'indigo' },
                    { role: 'Risk Manager', desc: 'Authorized to define risk scenarios, manage assessment campaigns, and oversee pipeline remediation.', icon: AlertCircle, color: 'blue' },
                    { role: 'Compliance Analyst', desc: 'Access to compliance frameworks, audit runs, and artifact vault management.', icon: CheckCircle2, color: 'emerald' },
                    { role: 'Auditor', desc: 'Read-only access to most modules with focused write-access to evidence and assessment comments.', icon: UserCheck, color: 'amber' },
                    { role: 'Viewer', desc: 'Read-only visibility across the entire platform ecosystem.', icon: Eye, color: 'slate' },
                  ].map((p) => (
                    <div key={p.role} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-all group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-2.5 bg-${p.color}-50 text-${p.color}-600 rounded-xl border border-${p.color}-100`}>
                          <p.icon size={18} strokeWidth={1.5} />
                        </div>
                        <h4 className="text-[14px] font-bold text-slate-900">{p.role}</h4>
                      </div>
                      <p className="text-[12px] text-slate-500 font-light leading-relaxed mb-6">{p.desc}</p>
                      <button 
                        onClick={() => setSelectedRoleForConfig(p.role as PlatformRole)}
                        className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity hover:underline"
                      >
                        <Key size={12} /> Configure Permissions
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          );
        }

      case 'schema':
        if (currentUser?.role?.name === "Administrator") {
          return (
            <GlassCard title="Dynamic Entity Fields" subtitle="Expand data models without migrations" className="bg-white">
              <div className="space-y-4">
                {options && options.map((group) => {
                  return (
                    <div
                      key={group.id}
                      onClick={() => {
                        setSelectedOption(group);
                        setIsOptionModal(true);
                      }}
                      className="flex items-center justify-between p-5 rounded-xl border border-slate-100 bg-slate-50/30  hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col gap-1">
                        <h5 className="text-[13px] font-semibold text-slate-900">{group.label}</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Options for {group.label}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-slate-500 font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg uppercase tracking-widest shadow-sm">
                          {
                            group.type === "CLASSIFICATION_OPTIONS" ? "Classification"
                            : group.type === "NODE_TYPE" ? "Specific Asset Type"
                            : group.type === "ASSET_CATEGORIES" ? "Asset Category"
                            : group.type === "CRITICALITY_LEVELS" ? "Business Criticality"
                            : "Uncategorized"
                          }
                        </span>
                        <button className="p-2 text-slate-300">
                          <Settings size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {/* {customFields.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <h5 className="text-[13px] font-semibold text-slate-900">{f.name}</h5>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{f.scope} Context</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-500 font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg uppercase tracking-widest shadow-sm">{f.type}</span>
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                          <Settings size={14} />
                      </button>
                    </div>
                  </div>
                ))} */}
                <button 
                  onClick={() => setIsCreatingOption(true)}
                  className="w-full flex items-center justify-center gap-3 p-5 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/20 transition-all text-[12px] font-bold mt-6 tracking-widest uppercase bg-slate-50/10"
                >
                  <Plus size={16} /> Define Global Attribute
                </button>
              </div>
            </GlassCard>
          );
        }
      
      case 'password':
        if (currentUser?.role?.name === "Administrator") {
          return (
            <GlassCard title="Password Policies" subtitle="Enforce strong authentication practices" className="bg-white">
              <PasswordPolicy addAuditEntry={addAuditEntry} />
            </GlassCard>
          )
        }
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="pb-4 border-b border-slate-100">
        <h1 className="text-3xl font-light text-slate-900 tracking-tight">Platform Configuration</h1>
        <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-medium">Global governance and instance settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-3">
          <div 
            onClick={() => { setActiveSection('identity'); setSelectedRoleForConfig(null); }}
            className={`glass p-5 rounded-2xl flex items-center justify-between border group cursor-pointer transition-all ${
              activeSection === 'identity' ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-100' : 'border-slate-100 bg-white hover:border-blue-200'
            }`}
          >
             <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-colors ${activeSection === 'identity' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    <Users size={20} strokeWidth={1.5} />
                </div>
                <span className={`text-[13px] font-semibold ${activeSection === 'identity' ? 'text-blue-700' : 'text-slate-900'}`}>Identity & Access</span>
             </div>
             <ChevronRight size={14} className={activeSection === 'identity' ? 'text-blue-400' : 'text-slate-300'} />
          </div>

          {currentUser?.role?.name === "Administrator" && (
            <div 
              onClick={() => { setActiveSection('policies'); setSelectedRoleForConfig(null); }}
              className={`glass p-5 rounded-2xl flex items-center justify-between border group cursor-pointer transition-all ${
                activeSection === 'policies' ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-100' : 'border-slate-100 bg-white hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-colors ${activeSection === 'policies' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Lock size={20} strokeWidth={1.5} />
                  </div>
                  <span className={`text-[13px] font-semibold ${activeSection === 'policies' ? 'text-emerald-700' : 'text-slate-900'}`}>Policies & RBAC</span>
              </div>
              <ChevronRight size={14} className={activeSection === 'policies' ? 'text-emerald-400' : 'text-slate-300'} />
            </div>
          )}

          {currentUser?.role?.name === "Administrator" && (
            <div 
              onClick={() => { setActiveSection('schema'); setSelectedRoleForConfig(null); }}
              className={`glass p-5 rounded-2xl flex items-center justify-between border group cursor-pointer transition-all ${
                activeSection === 'schema' ? 'border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-100' : 'border-slate-100 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-colors ${activeSection === 'schema' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Database size={20} strokeWidth={1.5} />
                  </div>
                  <span className={`text-[13px] font-semibold ${activeSection === 'schema' ? 'text-indigo-700' : 'text-slate-900'}`}>Schema Evolution</span>
              </div>
              <ChevronRight size={14} className={activeSection === 'schema' ? 'text-indigo-400' : 'text-slate-300'} />
            </div>
          )}
          
          {currentUser?.role?.name === "Administrator" && (
            <div 
              onClick={() => { setActiveSection('password'); setSelectedRoleForConfig(null); }}
              className={`glass p-5 rounded-2xl flex items-center justify-between border group cursor-pointer transition-all ${
                activeSection === 'password' ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-100' : 'border-slate-100 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-colors ${activeSection === 'password' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'}`}>
                  <Key size={20} strokeWidth={1.5} />
                </div>
                <span className={`text-[13px] font-semibold ${activeSection === 'password' ? 'text-amber-700' : 'text-slate-900'}`}>Password Management</span>
              </div>
              <ChevronRight size={14} className={activeSection === 'password' ? 'text-amber-400' : 'text-slate-300'} />
            </div>
          )}
        </div>

        <div className="lg:col-span-9 animate-in slide-in-from-right-2 duration-500">
           {renderSectionContent()}
        </div>
      </div>

      <Modal 
        isOpen={isAddUserModalOpen} 
        onClose={() => setIsAddUserModalOpen(false)} 
        title="Onboard Team Member"
      >
        <form onSubmit={handleAddUser} className="space-y-8">
          <div className="space-y-6">

            {/* Demo Environment Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 -mt-2">
              <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[12px] text-amber-800 leading-relaxed">
                <p className="font-semibold tracking-wide">
                  Demo Environment Notice
                </p>
                <p className="text-amber-700 mt-1">
                  Email delivery is currently limited. Invitations will only be sent to the administrator email configured for this demo.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                required 
                type="text" 
                placeholder="John Doe"
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 transition-all font-light"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  required 
                  type="email" 
                  placeholder="john@company.com"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[14px] text-slate-900 focus:outline-none focus:border-blue-400 transition-all font-light"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
            </div>

            <CustomSelect 
              label="Assigned RBAC Role"
              options={ROLE_OPTIONS}
              value={newUser.role}
              onChange={(val) => setNewUser({...newUser, role: val as PlatformRole})}
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
             <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
             <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
               Newly added users will receive an automated invitation email to establish their secure session credentials via SAML/SSO.
             </p>
          </div>

          <button type="submit" className="w-full py-4.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-[11px] tracking-[0.25em] uppercase shadow-xl transition-all active:scale-95">
            Provision Platform Access
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={openModalForRoleUpdate}
        onClose={() => setOpenModalForRoleUpdate(false)}
        title="Configure Role Permissions"
      >
        <select 
          className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-blue-400 cursor-pointer shadow-sm w-full"
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value as PlatformRole)}
        >
          {ROLE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button 
          onClick={() => handleUpdateRole(roleChangeUserId!, selectedRoleId!)}
          className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-[11px] tracking-[0.25em] uppercase shadow-xl transition-all active:scale-95"
        >
          Save Changes
        </button>
      </Modal>

      <Modal
        isOpen={isOptionModal}
        onClose={() => {
          setIsOptionModal(false)
          setSelectedOption(null);
        }}
        title="Manage Asset Options"
      >
        <div className="space-y-6">
          
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedOption?.label}
              </h3>

              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                {selectedOption?.type}
              </p>

              <p className="text-xs text-slate-500">
                Created: {new Date(selectedOption?.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`text-[10px] px-3 py-1 rounded-md border font-bold uppercase tracking-widest
              ${selectedOption?.isActive 
                ? "bg-green-50 text-green-600 border-green-200"
                : "bg-red-50 text-red-500 border-red-200"
              }`}
            >
              {selectedOption?.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={deleteOption}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <Trash2 size={14} />
              <span className="text-xs font-semibold">Delete</span>
            </button>
            <button 
              onClick={() => setIsOptionModal(false)}
              className="px-6 py-2 bg-slate-900 text-white rounded-md text-xs font-bold uppercase tracking-widest shadow-md active:scale-95 transition-all"
            >
              Close
            </button>
          </div>

        </div>
      </Modal>

      <Modal
        isOpen={isCreatingOption}
        onClose={() => setIsCreatingOption(false)}
        title="Define New Global Attribute"
      >
        <div className="space-y-6">

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Attribute Type
            </label>
            <select
              onChange={(e) => setNewAttribute({ ...newAttribute, type: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 transition"
            >
              {optionTypes.map((type) => (
                <option key={type} value={type}>
                  {
                    type === "CLASSIFICATION_OPTIONS" ? "Classification"
                    : type === "NODE_TYPE" ? "Specific Asset Type"
                    : type === "ASSET_CATEGORIES" ? "Asset Category"
                    : type === "CRITICALITY_LEVELS" ? "Business Criticality"
                    : "Uncategorized"
                  }
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Attribute Value
            </label>
            <input
              type="text"
              placeholder="Enter attribute name"
              value={newAttribute.value}
              onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 transition"
            />
          </div>
         
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Attribute Label
            </label>
            <input
              type="text"
              placeholder="Enter attribute name"
              value={newAttribute.label}
              onChange={(e) => setNewAttribute({ ...newAttribute, label: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsCreatingOption(false)}
              className="px-5 py-2 text-sm text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>

            <button
              onClick={createAttribute}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Save Attribute
            </button>
          </div>

        </div>
      </Modal>
    </div>
  );
};

export default SettingsModule;
