import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Sparkles,
  Layers,
  Copy,
  Download,
  Check,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { RequirementAnalysisResult, RequirementRecord, NavigationTab } from '../types';

interface RequirementAnalyzerProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const RequirementAnalyzer: React.FC<RequirementAnalyzerProps> = ({ onNavigate }) => {
  const { activeProject } = useProject();

  // Form inputs
  const [title, setTitle] = useState('');
  const [userStory, setUserStory] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  // Active Analysis & History
  const [currentAnalysis, setCurrentAnalysis] = useState<RequirementAnalysisResult | null>(null);
  const [savedRecord, setSavedRecord] = useState<RequirementRecord | null>(null);
  const [history, setHistory] = useState<RequirementRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'gaps' | 'risks'>('overview');

  const loadHistory = async () => {
    if (!activeProject) return;
    try {
      const res = await api.getRequirementsByProject(activeProject.id);
      setHistory(res.requirements);
    } catch (err) {
      console.error('Failed to load requirement history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeProject]);

  const loadSample = () => {
    setTitle('Secure Checkout & Payment Gateway');
    setUserStory(
      'As a registered shopper, I want to checkout using Credit Card or PayPal, so that I can purchase items in my cart securely.'
    );
    setAcceptanceCriteria(
      `1. Cart must not be empty prior to checkout initiation.
2. User must select or provide valid shipping address.
3. System must support Visa, MasterCard, and PayPal sandbox payments.
4. CVV must be 3 or 4 digits and never stored unencrypted in plain text.
5. On successful charge, deduct inventory, generate order ID, and dispatch confirmation email.
6. If payment fails or is rejected, display clear error and retain cart items.`
    );
    setAdditionalContext(
      'Payment API complies with PCI-DSS Level 1. 3D-Secure 2.0 verification challenge triggered for transactions over $100. Gateway timeout is 30 seconds.'
    );
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) {
      setError('Please select or create an active project first.');
      return;
    }
    if (!title.trim() || !userStory.trim()) {
      setError('Title and User Story are mandatory fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setConvertSuccess(null);
      const res = await api.analyzeRequirement({
        projectId: activeProject.id,
        title,
        userStory,
        acceptanceCriteria,
        additionalContext,
        save: true,
      });

      setCurrentAnalysis(res.analysis);
      setSavedRecord(res.record);
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'Requirement analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = async (item: RequirementRecord) => {
    try {
      setLoading(true);
      setTitle(item.title);
      setUserStory(item.userStory);
      setAcceptanceCriteria(item.acceptanceCriteria || '');
      setSavedRecord(item);
      setCurrentAnalysis(JSON.parse(item.analysisJson));
      setConvertSuccess(null);
    } catch (err: any) {
      setError('Failed to parse saved analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved analysis?')) return;
    try {
      await api.deleteRequirement(id);
      if (savedRecord?.id === id) {
        setSavedRecord(null);
        setCurrentAnalysis(null);
      }
      await loadHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to delete requirement.');
    }
  };

  const handleConvertToScenarios = async () => {
    if (!savedRecord) return;
    try {
      setConverting(true);
      setConvertSuccess(null);
      const res = await api.convertRequirementToScenarios(savedRecord.id);
      setConvertSuccess(`Successfully generated and stored ${res.convertedCount} test scenarios!`);
    } catch (err: any) {
      alert(err.message || 'Failed to convert to scenarios.');
    } finally {
      setConverting(false);
    }
  };

  const copyAsMarkdown = () => {
    if (!currentAnalysis) return;
    const md = `# Requirement Analysis: ${title}

## Summary
${currentAnalysis.summary}

## 1. Functional Requirements
${currentAnalysis.functionalRequirements.map((r) => `- ${r}`).join('\n')}

## 2. Non-Functional Requirements
${currentAnalysis.nonFunctionalRequirements.map((r) => `- ${r}`).join('\n')}

## 3. Missing Requirements & Gaps
${currentAnalysis.missingRequirements.map((r) => `- ${r}`).join('\n')}

## 4. Ambiguous Statements
${currentAnalysis.ambiguousStatements.map((r) => `- ${r}`).join('\n')}

## 5. Acceptance Criteria Gaps
${currentAnalysis.acceptanceCriteriaGaps.map((r) => `- ${r}`).join('\n')}

## 6. Positive Scenarios
${currentAnalysis.positiveScenarios.map((s) => `- [${s.id}] ${s.title} (${s.priority})`).join('\n')}

## 7. Negative Scenarios
${currentAnalysis.negativeScenarios.map((s) => `- [${s.id}] ${s.title} (${s.priority})`).join('\n')}

## 8. Edge Cases
${currentAnalysis.edgeCases.map((s) => `- [${s.id}] ${s.title} (${s.priority})`).join('\n')}

## 9. Boundary Conditions
${currentAnalysis.boundaryConditions.map((s) => `- [${s.id}] ${s.title} (${s.priority})`).join('\n')}

## 10. QA Clarification Questions
${currentAnalysis.qaClarificationQuestions.map((q) => `- ${q}`).join('\n')}

## 11. Potential Risks
${currentAnalysis.potentialRisks.map((r) => `- ${r}`).join('\n')}

## 12. Suggested Test Coverage
${currentAnalysis.suggestedTestCoverage.map((c) => `- ${c}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsJSON = () => {
    if (!currentAnalysis) return;
    const blob = new Blob([JSON.stringify(currentAnalysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requirement_analysis_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
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
              <FileSearch className="w-5 h-5 text-indigo-400" />
              Requirement Analyzer
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              Module 2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deeply analyze user stories, discover ambiguities, identify AC gaps, and generate full-spectrum test scenarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSample}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            Load Sample User Story
          </button>
        </div>
      </div>

      {/* Main Grid: Form + History (Left) | Analysis Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form & History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Requirement Details
              </div>
              {activeProject && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800">
                  {activeProject.testFramework}
                </span>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAnalyze} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Feature / User Story Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Order Checkout Flow"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  User Story (As a... I want to... So that...) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={userStory}
                  onChange={(e) => setUserStory(e.target.value)}
                  placeholder="As a user, I want to..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Acceptance Criteria</label>
                <textarea
                  rows={4}
                  value={acceptanceCriteria}
                  onChange={(e) => setAcceptanceCriteria(e.target.value)}
                  placeholder="1. Criteria A&#10;2. Criteria B..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Additional Context / Tech Notes</label>
                <textarea
                  rows={2}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Dependencies, rate limits, compliance standards..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Analyzing with QA Intelligence...' : 'Analyze Requirement'}
              </button>
            </form>
          </div>

          {/* History Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Past Analyses ({history.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-[11px] text-slate-500 py-3 text-center">
                  No saved analyses for this project.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      savedRecord?.id === item.id
                        ? 'bg-indigo-950/30 border-indigo-700 text-indigo-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-white truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Structured QA Analysis Output */}
        <div className="lg:col-span-7 space-y-4">
          {currentAnalysis ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
              {/* Output Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-bold text-base text-white">{title || 'Analysis Overview'}</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentAnalysis.summary}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAsMarkdown}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700/60 transition-colors"
                    title="Copy Markdown Report"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={exportAsJSON}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700/60 transition-colors"
                    title="Export as JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>

                  {savedRecord && (
                    <button
                      onClick={handleConvertToScenarios}
                      disabled={converting}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {converting ? 'Converting...' : 'Convert to Test Scenarios'}
                    </button>
                  )}
                </div>
              </div>

              {convertSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{convertSuccess}</span>
                </div>
              )}

              {/* Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Functional & Non-Functional
                </button>
                <button
                  onClick={() => setActiveTab('scenarios')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'scenarios'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Scenarios ({currentAnalysis.positiveScenarios.length + currentAnalysis.negativeScenarios.length + currentAnalysis.edgeCases.length + currentAnalysis.boundaryConditions.length})
                </button>
                <button
                  onClick={() => setActiveTab('gaps')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'gaps'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gaps & Ambiguities
                </button>
                <button
                  onClick={() => setActiveTab('risks')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'risks'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  QA Questions & Risks
                </button>
              </div>

              {/* Tab 1: Functional & Non-Functional */}
              {activeTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Functional Requirements ({currentAnalysis.functionalRequirements?.length || 0})
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.functionalRequirements?.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                      Non-Functional Requirements ({currentAnalysis.nonFunctionalRequirements?.length || 0})
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.nonFunctionalRequirements?.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Test Scenarios */}
              {activeTab === 'scenarios' && (
                <div className="space-y-4 text-xs">
                  {/* Positive Scenarios */}
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                      Positive / Happy Path Scenarios
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.positiveScenarios?.map((s) => (
                        <div key={s.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-200">{s.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                            {s.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Negative Scenarios */}
                  <div>
                    <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5">
                      Negative Scenarios
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.negativeScenarios?.map((s) => (
                        <div key={s.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-200">{s.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono">
                            {s.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edge Cases */}
                  <div>
                    <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                      Edge Cases
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.edgeCases?.map((s) => (
                        <div key={s.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-200">{s.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                            {s.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Boundary Value Analysis */}
                  <div>
                    <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">
                      Boundary Conditions
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.boundaryConditions?.map((s) => (
                        <div key={s.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-200">{s.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                            {s.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Gaps & Ambiguities */}
              {activeTab === 'gaps' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      Missing Requirements & Unspecified Behaviors
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.missingRequirements?.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      Ambiguous Statements & Vague Terms
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.ambiguousStatements?.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-teal-400" />
                      Acceptance Criteria Gaps
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.acceptanceCriteriaGaps?.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: QA Clarifications & Risks */}
              {activeTab === 'risks' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      Clarification Questions for Product Owners & Developers
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.qaClarificationQuestions?.map((q, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      Identified Technical & Quality Risks
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.potentialRisks?.map((r, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Suggested Test Coverage Strategy
                    </div>
                    <div className="space-y-1.5">
                      {currentAnalysis.suggestedTestCoverage?.map((c, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-500 space-y-3">
              <FileSearch className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-slate-300 font-medium text-sm">No Requirement Analyzed Yet</div>
              <p className="max-w-md mx-auto text-slate-400">
                Provide a user story and acceptance criteria on the left or click "Load Sample User Story" to run a comprehensive 12-point QA analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
