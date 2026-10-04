import React, { useState, useEffect } from 'react';
import {
  Bug,
  Sparkles,
  Layers,
  Copy,
  Download,
  Check,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Flame,
  Clock,
  Terminal,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { BugReportRecord, NavigationTab } from '../types';

interface BugAnalyzerPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const BugAnalyzerPage: React.FC<BugAnalyzerPageProps> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [bugs, setBugs] = useState<BugReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertedNotice, setConvertedNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form Inputs
  const [title, setTitle] = useState('');
  const [module, setModule] = useState('Checkout & Payment');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [environment, setEnvironment] = useState('Staging (Chrome 128 / Windows 11)');

  // Selected Bug Report
  const [activeReport, setActiveReport] = useState<BugReportRecord | null>(null);

  const fetchBugs = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const res = await api.getBugs(activeProject.id);
      setBugs(res.bugs);
    } catch (err) {
      console.error('Failed to load bugs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [activeProject]);

  const loadSample = () => {
    setTitle('Payment Gateway 500 Internal Error on 3D-Secure Challenge');
    setModule('Checkout & Payment');
    setDescription(
      'When customer places an order with credit card exceeding $100 requiring 3D-Secure 2.0 verification, the gateway returns HTTP 500 instead of rendering the challenge iframe.'
    );
    setStepsToReproduce(
      '1. Add item > $100 to cart.\n2. Proceed to checkout and enter test Visa card.\n3. Click "Complete Order".\n4. Observe 500 error screen.'
    );
    setErrorMessage(
      'HTTP 500 Internal Server Error: TypeError: Cannot read properties of undefined (reading "threeDSecureRedirectUrl") at PaymentController.processCharge (paymentService.ts:142)'
    );
    setExpectedResult(
      '3D-Secure authentication modal appears, allowing customer to authorize the transaction.'
    );
    setActualResult(
      'Checkout crashes with generic "Something went wrong" message and cart is cleared.'
    );
    setEnvironment('Staging Cluster v2.4 (Node.js 20 / PostgreSQL)');
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    if (!title || !description || !expectedResult || !actualResult) return;

    try {
      setAnalyzing(true);
      setConvertedNotice(null);
      const res = await api.analyzeBug({
        projectId: activeProject.id,
        title,
        module,
        description,
        stepsToReproduce,
        errorMessage,
        logs: errorMessage,
        expectedResult,
        actualResult,
        environment,
      });

      setActiveReport(res.bug);
      await fetchBugs();
    } catch (err: any) {
      alert(err.message || 'Failed to analyze bug');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConvertToRegressionTest = async (bugId: string) => {
    try {
      setConvertingId(bugId);
      const res = await api.convertBugToTestCase(bugId);
      setConvertedNotice(`Converted defect into Regression Test Case: "${res.testCase.title}" (${res.testCase.testCaseId})`);
    } catch (err: any) {
      alert(err.message || 'Failed to convert bug to test case');
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this bug report?')) return;
    try {
      await api.deleteBug(id);
      if (activeReport?.id === id) setActiveReport(null);
      await fetchBugs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete bug report');
    }
  };

  const copyAsMarkdown = () => {
    if (!activeReport) return;
    const md = `# Defect Report: ${activeReport.title}

- **Module**: ${activeReport.module}
- **Environment**: ${activeReport.environment}
- **Severity**: ${activeReport.severity} | **Priority**: ${activeReport.priority}
- **Bug Type**: ${activeReport.bugType}

## Preconditions
${activeReport.preconditions || 'None'}

## Steps to Reproduce
${activeReport.stepsToReproduce}

## Expected Result
${activeReport.expectedResult}

## Actual Result
${activeReport.actualResult}

## Root Cause Hypothesis
${activeReport.rootCause || 'Under investigation'}

## Evidence
\`\`\`
${activeReport.evidence || 'None'}
\`\`\`

## Suggested Fix
${activeReport.suggestedFix || 'N/A'}

## Regression Risk
${activeReport.regressionRisk || 'Medium'}
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
              <Bug className="w-5 h-5 text-rose-400" />
              Bug Analyzer & Defect Report Generator
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              Module 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transform raw logs, stack traces, and defect symptoms into structured, reproducible bug reports with root-cause hypotheses.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSample}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors self-start md:self-auto"
        >
          Load 500 Defect Sample
        </button>
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
              className="text-emerald-400 hover:underline text-xs flex items-center gap-1 font-medium"
            >
              View in Test Cases <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Grid: Form (Left) & Report Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form & History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Defect Intelligence Input
            </div>

            <form onSubmit={handleAnalyze} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Defect Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 500 error when clicking checkout"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Module</label>
                  <input
                    type="text"
                    required
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    placeholder="e.g. Checkout / Cart"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Environment</label>
                  <input
                    type="text"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Observed Defect Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? Trigger sequence..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Steps to Reproduce</label>
                <textarea
                  rows={2}
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1. Step one&#10;2. Step two..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Expected Result <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={expectedResult}
                    onChange={(e) => setExpectedResult(e.target.value)}
                    placeholder="Should succeed"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Actual Result <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={actualResult}
                    onChange={(e) => setActualResult(e.target.value)}
                    placeholder="Crash / 500 error"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Error Message, Stack Trace or Console Logs
                </label>
                <textarea
                  rows={3}
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  placeholder="Paste stack trace or error response snippet..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-[10px]"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4" />
                {analyzing ? 'Analyzing Defect & Root Cause...' : 'Generate Bug Report'}
              </button>
            </form>
          </div>

          {/* Past Bugs Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Logged Defect Reports ({bugs.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {bugs.length === 0 ? (
                <div className="text-[11px] text-slate-500 py-3 text-center">
                  No bug reports logged yet.
                </div>
              ) : (
                bugs.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setActiveReport(b)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                      activeReport?.id === b.id
                        ? 'bg-rose-950/30 border-rose-700 text-rose-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-white truncate">{b.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {b.module} • <span className="text-rose-400">{b.severity}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(b.id, e)}
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

        {/* Right: Detailed Professional Bug Report */}
        <div className="lg:col-span-7">
          {activeReport ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-bold text-base text-white">{activeReport.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                      {activeReport.severity} Severity
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      {activeReport.priority} Priority
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {activeReport.bugType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAsMarkdown}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors flex items-center gap-1"
                    title="Copy Markdown for Jira / GitHub"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy MD'}</span>
                  </button>

                  <button
                    onClick={() => handleConvertToRegressionTest(activeReport.id)}
                    disabled={convertingId === activeReport.id}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {convertingId === activeReport.id ? 'Converting...' : 'Convert to Regression Test'}
                  </button>
                </div>
              </div>

              {/* Preconditions & Environment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Environment
                  </span>
                  <div className="text-slate-200">{activeReport.environment}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Preconditions
                  </span>
                  <div className="text-slate-200">{activeReport.preconditions || 'None'}</div>
                </div>
              </div>

              {/* Reproduction Steps */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Steps to Reproduce
                </span>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                  {activeReport.stepsToReproduce}
                </div>
              </div>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                    Expected Result
                  </span>
                  <div className="text-emerald-200">{activeReport.expectedResult}</div>
                </div>
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40">
                  <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                    Actual Result
                  </span>
                  <div className="text-rose-200">{activeReport.actualResult}</div>
                </div>
              </div>

              {/* Root Cause Hypothesis */}
              <div>
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Root Cause Hypothesis
                </span>
                <div className="p-3 rounded-lg bg-slate-950 border border-amber-900/40 text-amber-100 leading-relaxed">
                  {activeReport.rootCause || 'Under investigation'}
                </div>
              </div>

              {/* Evidence */}
              {activeReport.evidence && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    Observed Evidence & Logs
                  </span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] max-h-32 overflow-y-auto">
                    {activeReport.evidence}
                  </div>
                </div>
              )}

              {/* Suggested Fix & Regression Risk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Suggested Developer Fix
                  </span>
                  <div className="text-slate-200">{activeReport.suggestedFix || 'N/A'}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Regression Risk
                  </span>
                  <div className="text-slate-200">{activeReport.regressionRisk || 'Medium'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-500 space-y-3">
              <Bug className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-slate-300 font-medium text-sm">No Defect Analyzed Yet</div>
              <p className="max-w-md mx-auto text-slate-400">
                Input defect symptoms, error logs, and reproduction steps on the left or click "Load 500 Defect Sample" to test the AI analyzer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
