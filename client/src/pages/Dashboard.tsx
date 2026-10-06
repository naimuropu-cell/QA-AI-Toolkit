import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  FileSearch,
  Layers,
  CheckSquare,
  Cpu,
  Globe2,
  Bug,
  AlertTriangle,
  Wrench,
  BookOpen,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { DashboardMetrics, Project, ActivityLogItem, NavigationTab } from '../types';
import { api } from '../services/api';
import { useProject } from '../context/ProjectContext';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { activeProject, setActiveProject, setIsCreateModalOpen } = useProject();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardData();
      setMetrics(data.metrics);
      setRecentProjects(data.recentProjects);
      setRecentActivities(data.recentActivities);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metricCards = [
    { label: 'Total Projects', value: metrics?.totalProjects ?? 0, icon: FolderKanban, color: 'text-blue-400', tab: 'projects' as NavigationTab },
    { label: 'Requirements Analyzed', value: metrics?.requirementsAnalyzed ?? 0, icon: FileSearch, color: 'text-indigo-400', tab: 'requirement-analyzer' as NavigationTab },
    { label: 'Scenarios Generated', value: metrics?.scenariosGenerated ?? 0, icon: Layers, color: 'text-emerald-400', tab: 'test-design' as NavigationTab },
    { label: 'Test Cases Generated', value: metrics?.testCasesGenerated ?? 0, icon: CheckSquare, color: 'text-teal-400', tab: 'test-cases' as NavigationTab },
    { label: 'Automation Generated', value: metrics?.automationGenerated ?? 0, icon: Cpu, color: 'text-cyan-400', tab: 'automation' as NavigationTab },
    { label: 'API Tests Generated', value: metrics?.apiTestsGenerated ?? 0, icon: Globe2, color: 'text-violet-400', tab: 'api-testing' as NavigationTab },
    { label: 'Bugs Analyzed', value: metrics?.bugsAnalyzed ?? 0, icon: Bug, color: 'text-amber-400', tab: 'failure-intelligence' as NavigationTab },
    { label: 'Failures Diagnosed', value: metrics?.failedTestsDiagnosed ?? 0, icon: AlertTriangle, color: 'text-rose-400', tab: 'failure-intelligence' as NavigationTab },
    { label: 'Maintenance Audits', value: metrics?.maintenanceAudits ?? 0, icon: Wrench, color: 'text-amber-400', tab: 'maintenance' as NavigationTab },
    { label: 'Knowledge Base Items', value: metrics?.knowledgeBaseItems ?? 0, icon: BookOpen, color: 'text-sky-400', tab: 'knowledge-base' as NavigationTab },
    { label: 'Prompt Templates', value: metrics?.promptTemplates ?? 0, icon: Sparkles, color: 'text-purple-400', tab: 'prompt-library' as NavigationTab },
  ];

  const quickActions = [
    { title: 'Analyze Requirement', desc: 'Dissect user stories, detect AC gaps & risks', icon: FileSearch, tab: 'requirement-analyzer' as NavigationTab, color: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-300' },
    { title: 'Generate Test Cases', desc: 'Equivalence, boundary & positive/negative tests', icon: CheckSquare, tab: 'test-cases' as NavigationTab, color: 'border-teal-500/30 bg-teal-950/20 text-teal-300' },
    { title: 'Analyze Codebase', desc: 'Scan repo structure & detect locator conventions', icon: Cpu, tab: 'codebase' as NavigationTab, color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300' },
    { title: 'Generate Automation', desc: 'Create repo-native Playwright or Selenium POMs', icon: Sparkles, tab: 'automation' as NavigationTab, color: 'border-blue-500/30 bg-blue-950/20 text-blue-300' },
    { title: 'Analyze Failure', desc: 'Diagnose stack trace & test vs. app culpability', icon: AlertTriangle, tab: 'failure-intelligence' as NavigationTab, color: 'border-rose-500/30 bg-rose-950/20 text-rose-300' },
    { title: 'Maintain & Heal Tests', desc: 'Audit anti-patterns & heal brittle locators', icon: Wrench, tab: 'maintenance' as NavigationTab, color: 'border-amber-500/30 bg-amber-950/20 text-amber-300' },
    { title: 'Curated QA Prompts', desc: 'Battle-tested prompts with variable runner', icon: Sparkles, tab: 'prompt-library' as NavigationTab, color: 'border-purple-500/30 bg-purple-950/20 text-purple-300' },
    { title: 'Generate API Tests', desc: 'Synthesize REST scenarios & Postman scripts', icon: Globe2, tab: 'api-testing' as NavigationTab, color: 'border-violet-500/30 bg-violet-950/20 text-violet-300' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 p-5 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Personal QA AI Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active Workspace:{' '}
            <span className="font-semibold text-blue-400">
              {activeProject ? activeProject.name : 'No project selected'}
            </span>
            {activeProject?.testFramework && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                {activeProject.testFramework}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            title="Refresh Metrics"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New QA Project
          </button>
        </div>
      </div>

      {/* 9 Key Metrics Grid */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Lifecycle Metrics
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {metricCards.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate(m.tab)}
                className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group hover:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 truncate">
                    {m.label}
                  </span>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {loading ? '...' : m.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Hub */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Quick Actions
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((qa, idx) => {
            const Icon = qa.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate(qa.tab)}
                className={`p-3.5 rounded-lg border text-left flex items-start justify-between gap-3 transition-all hover:scale-[1.01] ${qa.color}`}
              >
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {qa.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {qa.desc}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Column Lower Section: Recent Projects & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              Recent Projects
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {recentProjects.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                No QA projects created yet.
              </div>
            ) : (
              recentProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActiveProject(p)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                    activeProject?.id === p.id
                      ? 'bg-blue-950/20 border-blue-800 text-blue-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-white flex items-center gap-2 truncate">
                      {p.name}
                      {activeProject?.id === p.id && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-mono">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {p.techStack} • {p.testFramework}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 shrink-0">
                    {p._count?.testCases || 0} tests
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent AI Activities / Audit Stream */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent QA Activities & Audit
            </div>
            <span className="text-[10px] text-slate-500">Live stream</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentActivities.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                No recent activity recorded yet.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="font-mono text-blue-400 uppercase">{act.action}</span>
                    <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="font-medium text-slate-200 truncate">{act.target}</div>
                  {act.details && (
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {act.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
