import React from 'react';
import { ArrowLeft, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { NavigationTab } from '../types';
import { useProject } from '../context/ProjectContext';

interface ModulePlaceholderProps {
  tab: NavigationTab;
  title: string;
  phase: number;
  description: string;
  plannedFeatures: string[];
  onBackToDashboard: () => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  tab,
  title,
  phase,
  description,
  plannedFeatures,
  onBackToDashboard,
}) => {
  const { activeProject } = useProject();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={onBackToDashboard}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950 text-blue-400 border border-blue-800">
                Phase {phase} Module
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg shrink-0">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Scheduled for Phase {phase}</span>
          </div>
        </div>

        {/* Active Project Context Box */}
        <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Bound Project Context
          </div>
          <div className="text-slate-200">
            {activeProject ? (
              <div className="space-y-1">
                <div>
                  <span className="text-slate-400">Target Project: </span>
                  <span className="font-semibold text-white">{activeProject.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Automation Framework: </span>
                  <span className="text-blue-400 font-medium">{activeProject.testFramework}</span>
                  <span className="text-slate-400"> ({activeProject.techStack})</span>
                </div>
              </div>
            ) : (
              <span className="text-slate-500">
                No active project selected. The module will bind to your chosen workspace once initialized.
              </span>
            )}
          </div>
        </div>

        {/* Planned Capabilities */}
        <div>
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Planned Capabilities in Phase {phase}
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            {plannedFeatures.map((feat, idx) => (
              <li
                key={idx}
                className="p-2.5 rounded bg-slate-950/40 border border-slate-800/80 flex items-start gap-2"
              >
                <span className="text-blue-400 font-mono text-[11px]">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
