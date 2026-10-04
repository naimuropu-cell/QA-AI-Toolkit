import React, { useState } from 'react';
import { ShieldCheck, FolderGit2, Plus, User, LogOut, CheckCircle2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal }) => {
  const { projects, activeProject, setActiveProject, setIsCreateModalOpen } = useProject();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 flex items-center justify-between">
      {/* Brand & Project Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              QA AI Toolkit
              <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                Assistant
              </span>
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Project Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="max-w-[160px] truncate">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>
            {activeProject?.testFramework && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                {activeProject.testFramework}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-lg bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active QA Project
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors ${
                      activeProject?.id === p.id
                        ? 'bg-blue-600/20 text-blue-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {activeProject?.id === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-800 pt-1 mt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-blue-400 hover:bg-blue-950/40 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: System Status & User Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local Engine Active</span>
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-xs text-slate-200">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium">{user.name}</span>
              <span className="text-[10px] text-slate-400 capitalize">({user.role.replace('_', ' ')})</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            Sign In / Demo
          </button>
        )}
      </div>
    </header>
  );
};
