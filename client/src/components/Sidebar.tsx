import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileSearch,
  Layers,
  CheckSquare,
  Globe2,
  Cpu,
  Code2,
  AlertTriangle,
  Wrench,
  BookOpen,
  Sparkles,
  Settings,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  phase?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'requirement-analyzer', label: 'Requirement Analyzer', icon: FileSearch },
  { id: 'test-design', label: 'Test Design', icon: Layers, phase: 3 },
  { id: 'test-cases', label: 'Test Cases', icon: CheckSquare, phase: 3 },
  { id: 'api-testing', label: 'API Testing', icon: Globe2, phase: 4 },
  { id: 'automation', label: 'Automation', icon: Cpu, phase: 5 },
  { id: 'codebase', label: 'Codebase', icon: Code2, phase: 6 },
  { id: 'failure-intelligence', label: 'Failure Intelligence', icon: AlertTriangle, phase: 7 },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, phase: 8 },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, phase: 9 },
  { id: 'prompt-library', label: 'Prompt Library', icon: Sparkles, phase: 9 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <aside className="w-60 border-r border-slate-800 bg-slate-950/70 flex flex-col shrink-0">
      <div className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        QA Workspace
      </div>
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.phase && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  P{item.phase}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex justify-between items-center text-slate-300 font-medium">
          <span>Engine Status</span>
          <span className="text-emerald-400">Online</span>
        </div>
        <div className="text-[10px] mt-1 text-slate-400 truncate">
          Phase 1 Foundation
        </div>
      </div>
    </aside>
  );
};
