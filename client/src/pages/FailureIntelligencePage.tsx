import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Bug,
  CheckSquare,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Clock,
  Shield,
  FileCode,
  Terminal,
  Activity,
  Layers,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Server,
  Wrench,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { FailureDiagnosisRecord, NavigationTab } from '../types';

interface FailureIntelligencePageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

type RemediationTab = 'appFix' | 'testFix' | 'regressionStub';

export const FailureIntelligencePage: React.FC<FailureIntelligencePageProps> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [diagnoses, setDiagnoses] = useState<FailureDiagnosisRecord[]>([]);
  const [activeDiagnosis, setActiveDiagnosis] = useState<FailureDiagnosisRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Form Inputs
  const [testName, setTestName] = useState('test_checkout_payment_submission');
  const [framework, setFramework] = useState('Playwright');
  const [errorMessage, setErrorMessage] = useState(
    "Error: expect(received).toBe(expected) // Object.is equality\nExpected: 200\nReceived: 500\nBody: {\"error\": \"NullPointerException: customer payment token cannot be resolved\"}"
  );
  const [stackTrace, setStackTrace] = useState(
    `at CheckoutPage.submitPayment (src/pages/CheckoutPage.ts:48:15)
at /tests/checkout.spec.ts:24:22
at WorkerRunner._runTestWithHooks (/node_modules/@playwright/test/lib/worker.js:842:15)`
  );
  const [executionLogs, setExecutionLogs] = useState(
    `[INFO] [14:22:01.102] POST /api/v1/orders/checkout -> HTTP 500 Internal Server Error (Duration: 342ms)
[ERROR] Database transaction rollback initiated for order_id: null`
  );

  // Remediation & Action States
  const [remediationTab, setRemediationTab] = useState<RemediationTab>('appFix');
  const [copiedCode, setCopiedCode] = useState(false);
  const [convertedBugSuccess, setConvertedBugSuccess] = useState(false);
  const [convertedTestSuccess, setConvertedTestSuccess] = useState(false);

  const fetchDiagnoses = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const res = await api.getDiagnoses(activeProject.id);
      setDiagnoses(res.diagnoses);
      if (res.diagnoses.length > 0 && !activeDiagnosis) {
        setActiveDiagnosis(res.diagnoses[0]);
      }
    } catch (err) {
      console.error('Failed to load failure diagnoses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnoses();
  }, [activeProject]);

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) {
      alert('Please select an active project first.');
      return;
    }

    try {
      setDiagnosing(true);
      const res = await api.diagnoseFailure({
        projectId: activeProject.id,
        testName,
        framework,
        errorMessage,
        stackTrace,
        executionLogs,
        save: true,
      });

      setActiveDiagnosis(res.diagnosis);
      await fetchDiagnoses();
    } catch (err: any) {
      alert(`Diagnosis failed: ${err.message}`);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleDeleteDiagnosis = async (id: string) => {
    if (!confirm('Are you sure you want to delete this failure diagnosis?')) return;
    try {
      await api.deleteDiagnosis(id);
      setDiagnoses((prev) => prev.filter((d) => d.id !== id));
      if (activeDiagnosis?.id === id) {
        setActiveDiagnosis(diagnoses.find((d) => d.id !== id) || null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleConvertToBug = async () => {
    if (!activeDiagnosis) return;
    try {
      await api.convertFailureToBug(activeDiagnosis.id);
      setConvertedBugSuccess(true);
      setTimeout(() => setConvertedBugSuccess(false), 3000);
    } catch (err: any) {
      alert(`Conversion to bug failed: ${err.message}`);
    }
  };

  const handleConvertToTestCase = async () => {
    if (!activeDiagnosis) return;
    try {
      await api.convertFailureToTestCase(activeDiagnosis.id);
      setConvertedTestSuccess(true);
      setTimeout(() => setConvertedTestSuccess(false), 3000);
    } catch (err: any) {
      alert(`Conversion to test case failed: ${err.message}`);
    }
  };

  const loadSample = (sampleType: 'appBug' | 'locatorFlaw' | 'envOutage') => {
    if (sampleType === 'appBug') {
      setTestName('test_checkout_order_submission');
      setFramework('Playwright');
      setErrorMessage(
        "Error: expect(received).toBe(expected) // Expected: 200, Received: 500\nResponse body: {\"error\": \"NullPointerException: customer payment token cannot be resolved in checkout gateway\"}"
      );
      setStackTrace(
        `at CheckoutPage.submitOrder (src/pages/CheckoutPage.ts:52:12)\nat /tests/checkout.spec.ts:31:18`
      );
      setExecutionLogs(
        `[INFO] POST /api/v1/orders/checkout -> HTTP 500 (310ms)\n[ERROR] Unhandled server exception: Cannot invoke payment method on null entity`
      );
    } else if (sampleType === 'locatorFlaw') {
      setTestName('test_user_profile_avatar_upload');
      setFramework('Playwright');
      setErrorMessage(
        "TimeoutError: page.waitForSelector: Timeout 30000ms exceeded.\nwaiting for locator('button.btn-save-avatar') to be visible"
      );
      setStackTrace(
        `at ProfilePage.saveAvatar (src/pages/ProfilePage.ts:34:16)\nat /tests/profile.spec.ts:18:24`
      );
      setExecutionLogs(
        `[WARN] Element matching locator('button.btn-save-avatar') was not found in active DOM.\n[DEBUG] DOM tree contains <button data-testid="save-profile-btn" class="btn-primary-2026">Save</button>`
      );
    } else {
      setTestName('test_inventory_sync_webhook');
      setFramework('Pytest');
      setErrorMessage(
        "ConnectionRefusedError: [Errno 111] Connection refused / HTTP 504 Gateway Timeout connecting to https://staging-api.internal.net:8443"
      );
      setStackTrace(
        `File "tests/test_sync.py", line 42, in test_sync\nresponse = requests.post(WEBHOOK_URL, timeout=10)\nFile "urllib3/connectionpool.py", line 715, in urlopen`
      );
      setExecutionLogs(
        `[FATAL] Unable to connect to upstream ingress gateway.\n[TCP] Connection failed after 3 attempts with exponential backoff.`
      );
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getCulpabilityBadge = (culpability: string) => {
    switch (culpability) {
      case 'Application Defect':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          icon: Bug,
          label: 'Application Defect',
        };
      case 'Test Automation Flaw':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          icon: Wrench,
          label: 'Test Automation Flaw',
        };
      default:
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          icon: Server,
          label: 'Environment / Infrastructure',
        };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Failure Intelligence & Root Cause Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Culpability Scoring
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Triages failing tests: classifies culpability (App Defect vs. Test Flaw vs. Environment), diagnoses root causes, and generates remediation recipes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => loadSample('appBug')}
              className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Load App 500 failure sample"
            >
              App 500 Defect
            </button>
            <button
              onClick={() => loadSample('locatorFlaw')}
              className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Load Locator Drift sample"
            >
              Locator Drift
            </button>
            <button
              onClick={() => loadSample('envOutage')}
              className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Load Network Gateway timeout sample"
            >
              Gateway 504
            </button>
          </div>

          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition"
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Diagnoses ({diagnoses.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Diagnostic Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Failure Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleDiagnose}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 text-xs shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                Failure Triage Parameters
              </span>
              <span className="text-[11px] text-slate-400">
                Project: <span className="text-white font-medium">{activeProject?.name || 'Active Project'}</span>
              </span>
            </div>

            {/* Test Name & Framework */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-300">
                  Failing Test Name / ID
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. test_checkout_payment"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-300">
                  Test Framework
                </label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500 transition text-xs"
                >
                  <option value="Playwright">Playwright</option>
                  <option value="Selenium">Selenium</option>
                  <option value="Cypress">Cypress</option>
                  <option value="Pytest">Pytest</option>
                  <option value="Jest/Vitest">Jest / Vitest</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-300">
                Primary Error Message / Assertion Failure
              </label>
              <textarea
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                rows={3}
                placeholder="Paste the primary assertion error, exception message, or HTTP status mismatch..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono text-xs"
              />
            </div>

            {/* Stack Trace */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-300">
                Stack Trace
              </label>
              <textarea
                value={stackTrace}
                onChange={(e) => setStackTrace(e.target.value)}
                rows={3}
                placeholder="at Page.method (file.ts:12:4)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono text-[11px]"
              />
            </div>

            {/* Execution Logs */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-300">
                Console Logs & Network Details
              </label>
              <textarea
                value={executionLogs}
                onChange={(e) => setExecutionLogs(e.target.value)}
                rows={2}
                placeholder="[INFO] Network call 500, Database query timeout..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono text-[11px]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={diagnosing}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-600/20"
            >
              {diagnosing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculating Culpability & Root Cause...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Diagnose Failure & Classify Culpability</span>
                </>
              )}
            </button>
          </form>

          {/* Culpability Diagnostic Legend */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              Triage Culpability Categories
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] mt-2">
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                <strong>App Defect</strong>
                <p className="text-[9px] text-slate-400 mt-0.5">Server 500, NullPointer, logic break</p>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                <strong>Test Flaw</strong>
                <p className="text-[9px] text-slate-400 mt-0.5">Locator drift, race condition, timeout</p>
              </div>
              <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <strong>Environment</strong>
                <p className="text-[9px] text-slate-400 mt-0.5">Gateway 504, connection refused, DNS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Diagnosis & Remediation Workspace */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {activeDiagnosis ? (
            <div className="space-y-4">
              {/* Culpability Gauge & Verdict Header */}
              {(() => {
                const badge = getCulpabilityBadge(activeDiagnosis.culpability);
                const BadgeIcon = badge.icon;
                const breakdown = activeDiagnosis.culpabilityBreakdown;
                return (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Triage Verdict
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${badge.bg}`}
                          >
                            <BadgeIcon className="w-4 h-4" />
                            {activeDiagnosis.culpability} ({activeDiagnosis.culpabilityScore}% Confidence)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Test: <strong className="text-white">{activeDiagnosis.testName}</strong>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Framework: {activeDiagnosis.framework}
                        </span>
                      </div>
                    </div>

                    {/* Multi-segment Culpability Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Culpability Distribution</span>
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span className="text-red-400">App: {breakdown?.appBug ?? 0}%</span>
                          <span className="text-cyan-400">Test: {breakdown?.testFlaw ?? 0}%</span>
                          <span className="text-purple-400">Env: {breakdown?.environment ?? 0}%</span>
                        </div>
                      </div>

                      <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 flex overflow-hidden p-0.5">
                        <div
                          style={{ width: `${breakdown?.appBug ?? 0}%` }}
                          className="h-full bg-red-500 rounded-l-full transition-all duration-500"
                          title={`App Defect: ${breakdown?.appBug ?? 0}%`}
                        />
                        <div
                          style={{ width: `${breakdown?.testFlaw ?? 0}%` }}
                          className="h-full bg-cyan-400 transition-all duration-500"
                          title={`Test Flaw: ${breakdown?.testFlaw ?? 0}%`}
                        />
                        <div
                          style={{ width: `${breakdown?.environment ?? 0}%` }}
                          className="h-full bg-purple-500 rounded-r-full transition-all duration-500"
                          title={`Environment: ${breakdown?.environment ?? 0}%`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Root Cause Analysis Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Root Cause Diagnosis
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
                    {activeDiagnosis.rootCauseCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  {activeDiagnosis.rootCauseAnalysis}
                </p>
              </div>

              {/* Remediation Suite & Action Tabs */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-0">
                {/* Tabs Top Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3">
                  <div className="flex items-center text-xs">
                    <button
                      onClick={() => setRemediationTab('appFix')}
                      className={`px-3.5 py-2.5 font-medium border-b-2 transition ${
                        remediationTab === 'appFix'
                          ? 'border-red-500 text-red-400 bg-red-500/5'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Developer Fix Guidance
                    </button>
                    <button
                      onClick={() => setRemediationTab('testFix')}
                      className={`px-3.5 py-2.5 font-medium border-b-2 transition ${
                        remediationTab === 'testFix'
                          ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      QA Automation Fix
                    </button>
                    <button
                      onClick={() => setRemediationTab('regressionStub')}
                      className={`px-3.5 py-2.5 font-medium border-b-2 transition ${
                        remediationTab === 'regressionStub'
                          ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Regression Test Stub
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      handleCopyCode(
                        remediationTab === 'appFix'
                          ? activeDiagnosis.suggestedFixApp || ''
                          : remediationTab === 'testFix'
                          ? activeDiagnosis.suggestedFixTest || ''
                          : activeDiagnosis.regressionStubCode || ''
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tab Code / Text Content */}
                <div className="p-4 bg-slate-950 font-mono text-xs leading-relaxed text-slate-200 max-h-72 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    <code>
                      {remediationTab === 'appFix'
                        ? activeDiagnosis.suggestedFixApp || 'No application code fix needed for this failure category.'
                        : remediationTab === 'testFix'
                        ? activeDiagnosis.suggestedFixTest || 'No test automation fix needed.'
                        : activeDiagnosis.regressionStubCode || '// No regression test stub provided'}
                    </code>
                  </pre>
                </div>

                {/* 1-Click Escalation Action Bar */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">One-Click Failure Escalation:</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleConvertToBug}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      {convertedBugSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Bug Report Created!</span>
                        </>
                      ) : (
                        <>
                          <Bug className="w-3.5 h-3.5" />
                          <span>Convert to Bug Report</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleConvertToTestCase}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      {convertedTestSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Regression Test Added!</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Convert to Regression Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-bold text-white">No Failure Diagnosed Yet</h3>
                <p className="text-xs text-slate-400">
                  Input a failing automated test with error logs or choose one of the sample presets to run deep culpability classification.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadSample('appBug')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Sample Server 500 Defect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Drawer Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 p-6 flex flex-col h-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-white text-sm">Past Failure Diagnoses</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {diagnoses.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No failure diagnoses recorded yet.
                </div>
              ) : (
                diagnoses.map((diag) => {
                  const isCurrent = activeDiagnosis?.id === diag.id;
                  const badge = getCulpabilityBadge(diag.culpability);
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={diag.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2 ${
                        isCurrent
                          ? 'border-rose-500/60 bg-rose-500/10'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-white text-xs">{diag.testName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate max-w-[220px]">
                            {diag.rootCauseCategory}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {diag.culpabilityScore}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <button
                          onClick={() => {
                            setActiveDiagnosis(diag);
                            setIsHistoryOpen(false);
                          }}
                          className="text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1"
                        >
                          <span>View Triage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDiagnosis(diag.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                          title="Delete Diagnosis"
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
        </div>
      )}
    </div>
  );
};
