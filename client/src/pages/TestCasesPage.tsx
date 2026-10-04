import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  X,
  FileSpreadsheet,
  FileText,
  FileJson,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { TestCaseRecord, NavigationTab } from '../types';

interface TestCasesPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const TestCasesPage: React.FC<TestCasesPageProps> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TestCaseRecord | null>(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Generator form
  const [genModule, setGenModule] = useState('Checkout');
  const [genRequirement, setGenRequirement] = useState('');
  const [genAc, setGenAc] = useState('');

  const fetchTestCases = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const res = await api.getTestCases(activeProject.id);
      setTestCases(res.testCases);
    } catch (err) {
      console.error('Failed to load test cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestCases();
  }, [activeProject]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      setGenerating(true);
      await api.generateTestCases({
        projectId: activeProject.id,
        module: genModule,
        requirementText: genRequirement,
        acceptanceCriteria: genAc,
      });
      await fetchTestCases();
      setIsGeneratorModalOpen(false);
      setGenRequirement('');
      setGenAc('');
    } catch (err: any) {
      alert(err.message || 'Failed to generate test cases');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this test case?')) return;
    try {
      await api.deleteTestCase(id);
      if (selectedCase?.id === id) setSelectedCase(null);
      await fetchTestCases();
    } catch (err: any) {
      alert(err.message || 'Failed to delete test case');
    }
  };

  // Modules list for filtering
  const modules = Array.from(new Set(testCases.map((tc) => tc.module).filter(Boolean)));

  const filtered = testCases.filter((tc) => {
    const matchesSearch =
      tc.title.toLowerCase().includes(search.toLowerCase()) ||
      tc.testCaseId.toLowerCase().includes(search.toLowerCase()) ||
      tc.steps.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === 'All' || tc.module === moduleFilter;
    const matchesType = typeFilter === 'All' || tc.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'All' || tc.priority.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesModule && matchesType && matchesPriority;
  });

  // EXPORT UTILITIES
  const exportAsCSV = () => {
    const headers = [
      'Test Case ID',
      'Module',
      'Title',
      'Preconditions',
      'Test Data',
      'Test Steps',
      'Expected Result',
      'Priority',
      'Severity',
      'Test Type',
    ];
    const rows = testCases.map((tc) => [
      `"${tc.testCaseId}"`,
      `"${tc.module}"`,
      `"${tc.title.replace(/"/g, '""')}"`,
      `"${(tc.preconditions || '').replace(/"/g, '""')}"`,
      `"${(tc.testData || '').replace(/"/g, '""')}"`,
      `"${tc.steps.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${tc.expectedResult.replace(/"/g, '""')}"`,
      `"${tc.priority}"`,
      `"${tc.severity}"`,
      `"${tc.type}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadBlob(csvContent, 'text/csv;charset=utf-8;', 'csv');
  };

  const exportAsExcel = () => {
    // Generate Excel HTML spreadsheet compatible format
    let table = `<table border="1">
      <thead>
        <tr style="background-color: #2563eb; color: #ffffff;">
          <th>Test Case ID</th>
          <th>Module</th>
          <th>Title</th>
          <th>Preconditions</th>
          <th>Test Data</th>
          <th>Test Steps</th>
          <th>Expected Result</th>
          <th>Priority</th>
          <th>Severity</th>
          <th>Test Type</th>
        </tr>
      </thead>
      <tbody>`;
    for (const tc of testCases) {
      table += `<tr>
        <td>${tc.testCaseId}</td>
        <td>${tc.module}</td>
        <td>${tc.title}</td>
        <td>${tc.preconditions || ''}</td>
        <td>${tc.testData || ''}</td>
        <td>${tc.steps.replace(/\n/g, '<br/>')}</td>
        <td>${tc.expectedResult}</td>
        <td>${tc.priority}</td>
        <td>${tc.severity}</td>
        <td>${tc.type}</td>
      </tr>`;
    }
    table += `</tbody></table>`;
    downloadBlob(table, 'application/vnd.ms-excel', 'xls');
  };

  const exportAsJSON = () => {
    const jsonContent = JSON.stringify(testCases, null, 2);
    downloadBlob(jsonContent, 'application/json', 'json');
  };

  const copyAsMarkdown = () => {
    let md = `# QA Test Case Specifications - ${activeProject?.name || 'Project'}\n\n`;
    for (const tc of testCases) {
      md += `### [${tc.testCaseId}] ${tc.title}\n`;
      md += `- **Module**: ${tc.module} | **Type**: ${tc.type} | **Priority**: ${tc.priority} | **Severity**: ${tc.severity}\n`;
      md += `- **Preconditions**: ${tc.preconditions || 'None'}\n`;
      md += `- **Test Data**: ${tc.testData || 'None'}\n`;
      md += `\n**Test Steps**:\n${tc.steps}\n\n`;
      md += `**Expected Result**:\n${tc.expectedResult}\n\n---\n\n`;
    }
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBlob = (content: string, mime: string, ext: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_cases_${activeProject?.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'qa'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-400" />
              Test Case Management & Specifications
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
              Module 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Author, organize, inspect, and export production-ready step-by-step test cases.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGeneratorModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Test Case Generator
          </button>

          <button
            onClick={copyAsMarkdown}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors flex items-center gap-1"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>MD</span>
          </button>

          <button
            onClick={exportAsCSV}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors flex items-center gap-1"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportAsExcel}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors flex items-center gap-1"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>

          <button
            onClick={exportAsJSON}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors flex items-center gap-1"
            title="Export JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test case ID, title, or steps..."
            className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-full text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="All">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="Functional">Functional</option>
            <option value="Negative">Negative</option>
            <option value="Boundary">Boundary</option>
            <option value="Security">Security</option>
            <option value="Regression">Regression</option>
            <option value="Usability">Usability</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No test cases found. Use the AI generator above or expand scenarios in Test Design.
                  </td>
                </tr>
              ) : (
                filtered.map((tc) => (
                  <tr
                    key={tc.id}
                    onClick={() => setSelectedCase(tc)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-teal-400 text-[11px] whitespace-nowrap">
                      {tc.testCaseId}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{tc.module}</td>
                    <td className="px-4 py-3 font-medium text-white max-w-md truncate">{tc.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {tc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          tc.priority === 'High'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : tc.priority === 'Medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tc.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          tc.severity === 'Critical'
                            ? 'bg-red-950 text-red-300 font-semibold'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {tc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCase(tc)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(tc.id, e)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Test Case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Case Inspection Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <span className="font-mono text-teal-400">{selectedCase.testCaseId}</span>
                <span>•</span>
                <span className="truncate max-w-md">{selectedCase.title}</span>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Module</span>
                  <span className="font-medium text-slate-200">{selectedCase.module}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Type</span>
                  <span className="font-medium text-slate-200">{selectedCase.type}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Priority</span>
                  <span className="font-medium text-slate-200">{selectedCase.priority}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Severity</span>
                  <span className="font-medium text-slate-200">{selectedCase.severity}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-1">
                  Preconditions
                </span>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-200">
                  {selectedCase.preconditions || 'None'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-1">
                  Test Data
                </span>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px]">
                  {selectedCase.testData || 'None'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-1">
                  Step-by-Step Test Steps
                </span>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                  {selectedCase.steps}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-1">
                  Expected Result
                </span>
                <div className="p-3 rounded bg-emerald-950/20 border border-emerald-800/50 text-emerald-300">
                  {selectedCase.expectedResult}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Test Case Generator Modal */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-teal-400" />
                AI Test Case Generator
              </div>
              <button
                onClick={() => setIsGeneratorModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Module Name</label>
                <input
                  type="text"
                  required
                  value={genModule}
                  onChange={(e) => setGenModule(e.target.value)}
                  placeholder="e.g. Shopping Cart / Authentication"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Feature / User Story</label>
                <textarea
                  rows={3}
                  required
                  value={genRequirement}
                  onChange={(e) => setGenRequirement(e.target.value)}
                  placeholder="Describe requirement to generate test cases for..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Acceptance Criteria</label>
                <textarea
                  rows={3}
                  value={genAc}
                  onChange={(e) => setGenAc(e.target.value)}
                  placeholder="1. Criteria A&#10;2. Criteria B..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorModalOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {generating ? 'Generating Test Cases...' : 'Generate Cases'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
