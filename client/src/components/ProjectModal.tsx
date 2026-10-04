import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';

export const ProjectModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, refreshProjects, setActiveProject } = useProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('React / Next.js / TypeScript');
  const [testFramework, setTestFramework] = useState('Playwright');
  const [qaStandards, setQaStandards] = useState(
    'Page Object Model (POM), prefer getByRole locators, avoid arbitrary sleeps.'
  );
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.createProject({
        name,
        description,
        techStack,
        testFramework,
        qaStandards,
        targetUrl,
      });
      await refreshProjects();
      setActiveProject(res.project);
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      setTargetUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <FolderPlus className="w-4 h-4 text-blue-400" />
            Create QA Project
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HireConnect QA Suite"
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope, test coverage goals, and critical modules..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Test Framework</label>
              <select
                value={testFramework}
                onChange={(e) => setTestFramework(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Playwright">Playwright (TypeScript)</option>
                <option value="Playwright-JS">Playwright (JavaScript)</option>
                <option value="Selenium-Python">Selenium (Python)</option>
                <option value="Selenium-Java">Selenium (Java)</option>
                <option value="Cypress">Cypress</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Application Tech Stack</label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React / Node.js"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Target Application URL</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://staging.app.example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">QA Standards & Automation Rules</label>
            <textarea
              rows={2}
              value={qaStandards}
              onChange={(e) => setQaStandards(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
