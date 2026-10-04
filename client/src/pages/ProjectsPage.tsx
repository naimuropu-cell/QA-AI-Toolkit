import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Code2,
  CheckSquare,
  Search,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';

export const ProjectsPage: React.FC = () => {
  const { projects, activeProject, setActiveProject, setIsCreateModalOpen, refreshProjects } = useProject();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.techStack?.toLowerCase().includes(search.toLowerCase()) ||
    p.testFramework?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"?`)) return;
    try {
      setDeletingId(id);
      await api.deleteProject(id);
      await refreshProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-400" />
            QA Projects Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-project QA test suites, standards, and automation configurations.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by project name, framework, or technology stack..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No matching projects found.
          </div>
        ) : (
          filtered.map((p) => {
            const isActive = activeProject?.id === p.id;
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all bg-slate-900/90 ${
                  isActive
                    ? 'border-blue-600 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-sm text-white truncate">{p.name}</h2>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveProject(p)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 border border-blue-900 px-2 py-0.5 rounded-md hover:bg-blue-950 transition-colors shrink-0"
                      >
                        Set Active
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {p.description || 'No description provided.'}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Framework:</span>
                      <span className="font-medium text-slate-300 px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">
                        {p.testFramework || 'Not set'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Tech Stack:</span>
                      <span className="text-slate-300 text-[11px] truncate max-w-[170px]">
                        {p.techStack || 'Generic'}
                      </span>
                    </div>

                    {p.targetUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Target URL:</span>
                        <a
                          href={p.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline text-[11px] flex items-center gap-1 truncate max-w-[170px]"
                        >
                          {p.targetUrl.replace(/^https?:\/\//, '')}
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p._count?.testCases || 0} Test Cases</span>
                  </div>

                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deletingId === p.id}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
