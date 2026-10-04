import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { TestScenarioRecord, NavigationTab } from '../types';

interface TestDesignPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const TestDesignPage: React.FC<TestDesignPageProps> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [scenarios, setScenarios] = useState<TestScenarioRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertedNotice, setConvertedNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form
  const [module, setModule] = useState('Authentication');
  const [requirementText, setRequirementText] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'Positive',
    'Negative',
    'Boundary Value',
    'Security',
  ]);

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchScenarios = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const res = await api.getScenarios(activeProject.id);
      setScenarios(res.scenarios);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [activeProject]);

  const loadSample = () => {
    setModule('Checkout & Payment');
    setRequirementText(
      'Customers can pay using Visa, MasterCard, or PayPal, applying discount promo codes before submitting.'
    );
    setAcceptanceCriteria(
      '1. Card expiration must be in the future.\n2. Promo code discounts must recalculate tax.\n3. Failures must retain items in basket.'
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    if (!module || !requirementText) return;

    try {
      setGenerating(true);
      setConvertedNotice(null);
      await api.generateScenarios({
        projectId: activeProject.id,
        module,
        requirementText,
        acceptanceCriteria,
        testTypes: selectedTypes,
      });
      await fetchScenarios();
    } catch (err: any) {
      alert(err.message || 'Failed to generate scenarios');
    } finally {
      setGenerating(false);
    }
  };

  const handleConvertToTestCase = async (id: string, title: string) => {
    try {
      setConvertingId(id);
      setConvertedNotice(null);
      const res = await api.convertScenarioToTestCase(id);
      setConvertedNotice(`Converted scenario into Test Case: "${res.testCase.title}" (${res.testCase.testCaseId})`);
    } catch (err: any) {
      alert(err.message || 'Failed to convert scenario to test case');
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this scenario?')) return;
    try {
      await api.deleteScenario(id);
      await fetchScenarios();
    } catch (err: any) {
      alert(err.message || 'Failed to delete scenario');
    }
  };

  const toggleType = (t: string) => {
    if (selectedTypes.includes(t)) {
      setSelectedTypes(selectedTypes.filter((x) => x !== t));
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const filtered = scenarios.filter((s) => {
    const matchesType = typeFilter === 'All' || s.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.scenarioId.toLowerCase().includes(search.toLowerCase()) ||
      s.module.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const exportAsCSV = () => {
    const headers = ['Scenario ID', 'Module', 'Scenario Title', 'Type', 'Priority', 'Risk'];
    const rows = scenarios.map((s) => [
      `"${s.scenarioId}"`,
      `"${s.module}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.type}"`,
      `"${s.priority}"`,
      `"${s.risk}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_scenarios_${activeProject?.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'qa'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAsMarkdown = () => {
    const mdRows = scenarios
      .map((s) => `| ${s.scenarioId} | ${s.module} | ${s.title} | ${s.type} | ${s.priority} | ${s.risk} |`)
      .join('\n');
    const md = `# Test Scenarios - ${activeProject?.name || 'QA Project'}

| Scenario ID | Module | Scenario Title | Type | Priority | Risk |
|---|---|---|---|---|---|
${mdRows}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Test Scenario Generator & Matrix
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Module 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Design positive, negative, boundary, equivalence, and security scenarios for your QA suite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyAsMarkdown}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy MD'}</span>
          </button>
          <button
            onClick={exportAsCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {convertedNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{convertedNotice}</span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('test-cases')}
              className="text-emerald-400 hover:underline text-xs flex items-center gap-1"
            >
              View in Test Cases <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Grid: Generator Form (Left) & Scenario Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Form */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Scenario AI Synthesizer
            </div>
            <button
              type="button"
              onClick={loadSample}
              className="text-[11px] text-blue-400 hover:underline"
            >
              Sample Data
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Module Name</label>
              <input
                type="text"
                required
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g. Authentication / Cart"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Requirement / User Story</label>
              <textarea
                rows={3}
                required
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                placeholder="Describe the feature requirement..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Acceptance Criteria (Optional)</label>
              <textarea
                rows={2}
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                placeholder="1. Condition A&#10;2. Condition B..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Testing Techniques</label>
              <div className="flex flex-wrap gap-1.5">
                {['Positive', 'Negative', 'Boundary Value', 'Security', 'Equivalence', 'Regression'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      selectedTypes.includes(t)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-xs mt-3"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Synthesizing Scenarios...' : 'Generate Scenarios'}
            </button>
          </form>
        </div>

        {/* Scenarios Table / List */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Scenario Matrix ({scenarios.length})
              </span>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search scenarios..."
                  className="bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-36 sm:w-48"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
                <option value="Boundary">Boundary Value</option>
                <option value="Security">Security</option>
                <option value="Regression">Regression</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No test scenarios found. Use the generator on the left or convert a requirement analysis.
              </div>
            ) : (
              filtered.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-semibold text-[11px] bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                        {s.scenarioId}
                      </span>
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                        {s.module}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          s.type === 'Positive'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : s.type === 'Negative'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : s.type === 'Security'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {s.type}
                      </span>
                    </div>
                    <div className="text-slate-200 font-medium text-xs leading-snug">
                      {s.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => handleConvertToTestCase(s.id, s.title)}
                      disabled={convertingId === s.id}
                      className="px-2.5 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-700/60 font-medium text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Expand into full Test Case"
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      {convertingId === s.id ? 'Expanding...' : 'Expand to Test Case'}
                    </button>

                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
