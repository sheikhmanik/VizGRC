
import React, { useState, useEffect } from 'react';
import { NavigationTab } from '../types';
import { NAVIGATION_ITEMS } from '../constants';
import { ChevronRight, LogOut, User, Bell, Command, Search, Menu, X, ChevronDown } from 'lucide-react';
import api from './api/AxiosInstance';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onLogout: () => void;
}

interface userData {
  id: string,
  name: string,
  email: string,
  role: {
    id: string,
    name: string,
  },
  status: string,
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    [NavigationTab.Compliance]: true
  });
  const [userData, setUserData] = useState<userData>({});

  const isTabInSubItems = (tab: NavigationTab, items: any[]) => {
    return items.some(item => item.id === tab);
  };

  const handleTabClick = (item: any) => {
    if (item.subItems) {
      setExpandedMenus(prev => ({ ...prev, [item.id]: !prev[item.id] }));
      // If parent is clicked and not expanded, expand and select first child
      if (!expandedMenus[item.id] && item.subItems.length > 0) {
        setActiveTab(item.subItems[0].id);
      }
    } else {
      setActiveTab(item.id);
      if (window.innerWidth < 768) setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    try {
      api.get("/settings/get-user")
        .then(res => {
          const userData = res.data;
          setUserData(userData);
        })
        .catch(err => {
          console.error("Error fetching user data in layout:", err);
        })
      ;
    } catch (error) {
      console.error("Unexpected error in layout:", error);
    }
  }, []);

  if (!userData.name || !userData.role.name) return null;

  return (
    <div className="flex h-screen overflow-hidden font-light text-[12px] bg-[#f8fafc]">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside 
            className="w-72 h-full glass-thick border-r border-slate-200 p-6 flex flex-col animate-in slide-in-from-left duration-500"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-2">
                <Command size={14} className="text-blue-600" />
                <span className="font-medium text-sm text-slate-900">Vis GRC</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {NAVIGATION_ITEMS.map((item) => {
                const isParentActive = activeTab === item.id || (item.subItems && isTabInSubItems(activeTab, item.subItems));
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => handleTabClick(item)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
                        isParentActive ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {React.cloneElement(item.icon as React.ReactElement<any>, { size: 16, strokeWidth: 1.5 })}
                      <span className="text-[13px] font-normal tracking-wide flex-1 text-left">{item.label}</span>
                      {item.subItems && <ChevronDown size={14} className={`transition-transform duration-300 ${expandedMenus[item.id] ? 'rotate-180' : ''}`} />}
                    </button>
                    {item.subItems && expandedMenus[item.id] && (
                      <div className="pl-12 space-y-1 mt-1 border-l border-slate-100 ml-6 animate-in slide-in-from-top-2 duration-300">
                        {item.subItems.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => { setActiveTab(sub.id as NavigationTab); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] transition-all ${
                              activeTab === sub.id ? 'text-blue-600 bg-blue-50/50 font-medium' : 'text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex glass border-r border-slate-200 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) flex-col z-30 ${isSidebarOpen ? 'w-60' : 'w-20'}`}>
        <div className={`p-6 mb-4 flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
            <Command size={16} strokeWidth={2} />
          </div>
          {isSidebarOpen && <span className="font-semibold tracking-tight text-slate-900 text-[15px] animate-in fade-in duration-700 truncate">Vis GRC</span>}
        </div>

        <nav className="flex-1 px-4 pb-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {NAVIGATION_ITEMS.map((item) => {
            const isChildActive = item.subItems && isTabInSubItems(activeTab, item.subItems);
            const isParentActive = activeTab === item.id || isChildActive;
            const isExpanded = expandedMenus[item.id];

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => handleTabClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${
                    isParentActive 
                      ? 'text-blue-600 bg-blue-50/60 border border-blue-100/50 shadow-sm shadow-blue-500/5' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  } ${!isSidebarOpen ? 'justify-center' : ''}`}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  <div className={`transition-all duration-500 shrink-0 ${isParentActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 18, strokeWidth: isParentActive ? 1.8 : 1.4 })}
                  </div>
                  {isSidebarOpen && (
                    <>
                      <span className={`font-medium text-[12px] tracking-wide animate-in fade-in duration-500 truncate flex-1 text-left ${isParentActive ? 'text-blue-700' : ''}`}>{item.label}</span>
                      {item.subItems && (
                        <ChevronDown size={14} className={`transition-transform duration-500 opacity-40 group-hover:opacity-100 ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </>
                  )}
                  {isParentActive && !isSidebarOpen && (
                    <div className="absolute left-0 w-1 h-4 bg-blue-600 rounded-r-full"></div>
                  )}
                </button>
                
                {isSidebarOpen && item.subItems && isExpanded && (
                  <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-300 border-l border-slate-100 ml-5">
                    {item.subItems.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveTab(sub.id as NavigationTab)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all relative ${
                          activeTab === sub.id 
                            ? 'text-blue-600 bg-blue-50/40 font-semibold shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {activeTab === sub.id && (
                          <div className="absolute -left-[1px] w-0.5 h-3 bg-blue-500 rounded-full"></div>
                        )}
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setActiveTab(NavigationTab.Profile)}
            className={`w-full flex items-center gap-3 px-3 py-2 transition-colors group ${!isSidebarOpen ? 'justify-center' : ''} ${activeTab === NavigationTab.Profile ? 'text-blue-600 font-semibold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User size={16} strokeWidth={1.4} className="shrink-0" />
            {isSidebarOpen && <span className="text-[12px] font-medium">Profile</span>}
          </button>
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-rose-500 transition-colors group ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut size={16} strokeWidth={1.4} className="shrink-0" />
            {isSidebarOpen && <span className="text-[12px] font-medium">Logout</span>}
          </button>
        </div>

        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full glass flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-md z-50 bg-white"
        >
          <ChevronRight size={12} className={`transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 md:px-10 bg-white/60 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-[12px] font-medium tracking-wide text-slate-400">
              <span className="hover:text-slate-600 cursor-pointer transition-colors hidden sm:inline">Workspace</span>
              <ChevronRight size={12} strokeWidth={2} className="opacity-30 hidden sm:inline" />
              <span className="text-slate-900 capitalize font-semibold">{activeTab.replace('-', ' ')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Quick Search (⌘K)" 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 text-[12px] text-slate-600 transition-all w-60 font-light"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative">
              <Bell size={18} strokeWidth={1.4} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div
              onClick={() => setActiveTab(NavigationTab.Profile)}
              className="flex items-center gap-3 group cursor-pointer pl-2"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-none">{userData.name}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">{userData.role.name}</p>
              </div>
              <div className="w-8 h-8 rounded-xl border border-slate-200 overflow-hidden shadow-sm group-hover:scale-105 transition-all">
                <img src="https://picsum.photos/seed/grc-user/128/128" className="w-full h-full object-cover" alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-1000">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
