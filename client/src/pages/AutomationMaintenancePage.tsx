import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  History,
  AlertTriangle,
  Clock,
  Crosshair,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Code2,
  CheckCircle2,
  Info,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import {
  Project,
  AutomationAuditRecord,
  HealedLocatorRecord,
  NavigationTab,
} from '../types';

interface AutomationMaintenancePageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

const SAMPLE_SCRIPTS = {
  playwrightFlaky: {
    name: 'Flaky E-Commerce Checkout (Playwright)',
    framework: 'Playwright',
    code: `import { test, expect } from '@playwright/test';

test('Checkout Flow - select expedited shipping', async ({ page }) => {
  await page.goto('https://shop.example.com/checkout');

  // Hardcoded sleep causing arbitrary delay and test flakiness
  await page.waitForTimeout(5000);

  // Fragile absolute XPath selector
  const expeditedRadio = page.locator('//html/body/div[2]/div/div[3]/form/div[2]/input');
  await expeditedRadio.click();

  // Missing await on async operation causing silent race condition
  page.click('.btn.btn-primary.btn-large.mt-4.sc-1234');

  // Hardcoded sleep waiting for order confirmation
  await page.waitForTimeout(8000);

  // Fragile class-soup assertion
  const confirmationMsg = page.locator('.alert.alert-success.bold');
  expect(await confirmationMsg.textContent()).toContain('Order Confirmed');
});
`,
  },
  cypressLegacy: {
    name: 'Legacy User Login Flow (Cypress)',
    framework: 'Cypress',
    code: `describe('Authentication Suite', () => {
  it('logs in with standard credentials', () => {
    cy.visit('/login');

    // Hard sleep
    cy.wait(4000);

    // Deep brittle DOM hierarchy
    cy.get('div > div:nth-child(2) > form > div:nth-child(1) > input').type('qa@example.com');
    cy.get('div > div:nth-child(2) > form > div:nth-child(2) > input').type('Secret123!');

    // Brittle XPath
    cy.xpath("//button[contains(@class, 'login-btn-v2')]").click();

    // Arbitrary sleep
    cy.wait(6000);

    cy.get('.dashboard-header > h1').should('be.visible');
  });
});
`,
  },
  seleniumFragile: {
    name: 'Order Submission Suite (Selenium Java)',
    framework: 'Selenium',
    code: `@Test
public void testOrderSubmission() throws Exception {
    driver.get("https://app.example.com/orders");

    // Thread.sleep causing thread starvation
    Thread.sleep(7000);

    // Fragile absolute XPath locator
    WebElement submitBtn = driver.findElement(By.xpath("/html/body/div[1]/section/div/button[2]"));
    submitBtn.click();

    Thread.sleep(5000);
    WebElement successToast = driver.findElement(By.className("toast-item-active"));
    Assert.assertTrue(successToast.isDisplayed());
}
`,
  },
};

const SAMPLE_LOCATORS = [
  {
    title: 'Fragile Checkout Button XPath',
    original: '//html/body/div[2]/div/div[3]/div/button[1]',
    framework: 'Playwright',
    desc: 'Primary CTA button to place order',
    dom: `<button class="btn btn-primary cta-btn checkout-act-948" data-testid="place-order-btn" role="button">
  <span>Confirm &amp; Place Order</span>
</button>`,
  },
  {
    title: 'Class-Soup Submit Button',
    original: '.btn.btn-accent.w-full.py-3.rounded-xl.hover\\:bg-blue-600',
    framework: 'Playwright',
    desc: 'Submit application form button',
    dom: `<button type="submit" data-testid="submit-application" aria-label="Submit Application" class="btn btn-accent w-full py-3 rounded-xl hover:bg-blue-600">
  Submit Application
</button>`,
  },
  {
    title: 'Cypress Deep Table Cell Selector',
    original: 'table > tbody > tr:nth-child(2) > td:nth-child(4) > button',
    framework: 'Cypress',
    desc: 'Action button to download invoice for second row',
    dom: `<button data-testid="download-invoice-row-2" class="p-2 text-blue-500" aria-label="Download Invoice #1042">
  <svg>...</svg> Download
</button>`,
  },
];

export const AutomationMaintenancePage: React.FC<AutomationMaintenancePageProps> = () => {
  const [activeTab, setActiveTab] = useState<'auditor' | 'healer' | 'history'>('auditor');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Auditor State
  const [suiteName, setSuiteName] = useState('Flaky E-Commerce Checkout');
  const [framework, setFramework] = useState('Playwright');
  const [scriptContent, setScriptContent] = useState(SAMPLE_SCRIPTS.playwrightFlaky.code);
  const [isAuditing, setIsAuditing] = useState(false);
  const [currentAudit, setCurrentAudit] = useState<AutomationAuditRecord | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [codeViewMode, setCodeViewMode] = useState<'refactored' | 'original'>('refactored');
  const [copiedCode, setCopiedCode] = useState(false);

  // Healer State
  const [originalLocator, setOriginalLocator] = useState('//html/body/div[2]/div/div[3]/div/button[1]');
  const [healerFramework, setHealerFramework] = useState('Playwright');
  const [targetDescription, setTargetDescription] = useState('Primary CTA button to place order');
  const [domSnippet, setDomSnippet] = useState(SAMPLE_LOCATORS[0].dom);
  const [isHealing, setIsHealing] = useState(false);
  const [healedResult, setHealedResult] = useState<HealedLocatorRecord | null>(null);
  const [healerError, setHealerError] = useState<string | null>(null);
  const [copiedLocator, setCopiedLocator] = useState<string | null>(null);

  // History State
  const [auditHistory, setAuditHistory] = useState<AutomationAuditRecord[]>([]);
  const [healedHistory, setHealedHistory] = useState<HealedLocatorRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadHistory();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await api.getProjects();
      setProjects(res.projects || []);
      if (res.projects && res.projects.length > 0) {
        setSelectedProjectId(res.projects[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load projects', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedProjectId) return;
    try {
      setLoadingHistory(true);
      const [auditsRes, healedRes] = await Promise.all([
        api.getAutomationAudits(selectedProjectId),
        api.getHealedLocators(selectedProjectId),
      ]);
      setAuditHistory(auditsRes.audits || []);
      setHealedHistory(healedRes.healedLocators || []);
    } catch (err: any) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRunAudit = async () => {
    if (!selectedProjectId || !scriptContent.trim()) {
      setAuditError('Please select a project and provide a test script.');
      return;
    }

    try {
      setIsAuditing(true);
      setAuditError(null);
      const res = await api.auditAutomationScript({
        projectId: selectedProjectId,
        suiteName: suiteName.trim() || 'Automated Test Suite',
        framework,
        scriptContent,
        save: true,
      });
      setCurrentAudit(res.audit);
      loadHistory();
    } catch (err: any) {
      setAuditError(err.message || 'Audit failed. Check backend connectivity.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleHealLocator = async () => {
    if (!selectedProjectId || !originalLocator.trim()) {
      setHealerError('Please select a project and provide an original locator.');
      return;
    }

    try {
      setIsHealing(true);
      setHealerError(null);
      const res = await api.healLocator({
        projectId: selectedProjectId,
        originalLocator: originalLocator.trim(),
        framework: healerFramework,
        domSnippet: domSnippet.trim(),
        targetDescription: targetDescription.trim(),
        save: true,
      });
      setHealedResult(res.healed);
      loadHistory();
    } catch (err: any) {
      setHealerError(err.message || 'Locator healing failed.');
    } finally {
      setIsHealing(false);
    }
  };

  const handleCopy = (text: string, locatorId?: string) => {
    navigator.clipboard.writeText(text);
    if (locatorId) {
      setCopiedLocator(locatorId);
      setTimeout(() => setCopiedLocator(null), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadRefactored = () => {
    if (!currentAudit?.refactoredCode) return;
    const blob = new Blob([currentAudit.refactoredCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${suiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-healed.spec.ts`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAudit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteAutomationAudit(id);
      setAuditHistory((prev) => prev.filter((a) => a.id !== id));
      if (currentAudit?.id === id) {
        setCurrentAudit(null);
      }
    } catch (err) {
      console.error('Failed to delete audit', err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Automation Maintenance &amp; Self-Healing Engine
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                  Phase 8
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Audit test code for flaky sleeps, brittle locators &amp; code smells, and dynamically heal failing selectors with AI resilience scoring.
              </p>
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <span className="text-xs font-medium text-slate-400 pl-2">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={loadingProjects}
            className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadHistory}
            title="Refresh History"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('auditor')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === 'auditor'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Test Suite Health Auditor
        </button>

        <button
          onClick={() => setActiveTab('healer')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === 'healer'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Self-Healing Locator Studio
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === 'history'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Audit &amp; Healed History
          {(auditHistory.length > 0 || healedHistory.length > 0) && (
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-800 text-slate-300">
              {auditHistory.length + healedHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TEST SUITE HEALTH AUDITOR */}
      {activeTab === 'auditor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  Script Input
                </h2>

                {/* Preset sample buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Samples:</span>
                  <button
                    onClick={() => {
                      setSuiteName(SAMPLE_SCRIPTS.playwrightFlaky.name);
                      setFramework(SAMPLE_SCRIPTS.playwrightFlaky.framework);
                      setScriptContent(SAMPLE_SCRIPTS.playwrightFlaky.code);
                    }}
                    className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    Playwright
                  </button>
                  <button
                    onClick={() => {
                      setSuiteName(SAMPLE_SCRIPTS.cypressLegacy.name);
                      setFramework(SAMPLE_SCRIPTS.cypressLegacy.framework);
                      setScriptContent(SAMPLE_SCRIPTS.cypressLegacy.code);
                    }}
                    className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    Cypress
                  </button>
                  <button
                    onClick={() => {
                      setSuiteName(SAMPLE_SCRIPTS.seleniumFragile.name);
                      setFramework(SAMPLE_SCRIPTS.seleniumFragile.framework);
                      setScriptContent(SAMPLE_SCRIPTS.seleniumFragile.code);
                    }}
                    className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    Selenium
                  </button>
                </div>
              </div>

              {/* Suite Name & Framework */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Suite Name</label>
                  <input
                    type="text"
                    value={suiteName}
                    onChange={(e) => setSuiteName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Checkout Flow Spec"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Framework</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Playwright">Playwright</option>
                    <option value="Cypress">Cypress</option>
                    <option value="Selenium">Selenium</option>
                  </select>
                </div>
              </div>

              {/* Test Script Code Area */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Test Script Content
                </label>
                <textarea
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  rows={14}
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-y"
                  placeholder="// Paste test script code here..."
                />
              </div>

              {auditError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {auditError}
                </div>
              )}

              <button
                onClick={handleRunAudit}
                disabled={isAuditing || !scriptContent.trim()}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Auditing Test Suite &amp; Detecting Code Smells...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Audit Suite for Maintenance Anti-Patterns
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Results (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {currentAudit ? (
              <div className="space-y-4">
                {/* Health Score Summary Card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                          Suite Health Audit
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getScoreColor(
                            currentAudit.healthScore
                          )}`}
                        >
                          {currentAudit.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{currentAudit.suiteName}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{currentAudit.summary}</p>
                    </div>

                    {/* Circular Health Gauge */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div
                        className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg ${getScoreColor(
                          currentAudit.healthScore
                        )}`}
                      >
                        <span className="text-2xl font-black">{currentAudit.healthScore}</span>
                        <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">
                          Health
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Anti-Pattern Metrics Badges */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold mb-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        Sleeps
                      </div>
                      <span className="text-base font-bold text-white">
                        {currentAudit.metrics?.hardSleepsCount ?? 0}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-semibold mb-0.5">
                        <Crosshair className="w-3.5 h-3.5" />
                        Brittle Selectors
                      </div>
                      <span className="text-base font-bold text-white">
                        {currentAudit.metrics?.brittleLocatorsCount ?? 0}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div className="flex items-center justify-center gap-1 text-violet-400 text-xs font-semibold mb-0.5">
                        <Zap className="w-3.5 h-3.5" />
                        Async Risks
                      </div>
                      <span className="text-base font-bold text-white">
                        {currentAudit.metrics?.asyncIssuesCount ?? 0}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div className="flex items-center justify-center gap-1 text-cyan-400 text-xs font-semibold mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Framework
                      </div>
                      <span className="text-xs font-semibold text-white">
                        {currentAudit.framework}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detected Issues List */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Detected Anti-Patterns ({currentAudit.issues?.length ?? 0})
                  </h4>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {currentAudit.issues && currentAudit.issues.length > 0 ? (
                      currentAudit.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(issue.severity)}
                              <span className="text-xs font-semibold text-white">{issue.title}</span>
                            </div>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              Line {issue.line}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300">{issue.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
                            <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20 text-rose-300">
                              <span className="text-[10px] text-rose-400 font-sans font-bold block mb-0.5">
                                Anti-Pattern:
                              </span>
                              <code className="text-[11px]">{issue.badCode}</code>
                            </div>
                            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                              <span className="text-[10px] text-emerald-400 font-sans font-bold block mb-0.5">
                                Resilient Fix:
                              </span>
                              <code className="text-[11px]">{issue.suggestedFix}</code>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        No critical code smells detected. The suite follows modern resilience standards!
                      </div>
                    )}
                  </div>
                </div>

                {/* Refactored Script Card */}
                {currentAudit.refactoredCode && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-white">Healed / Refactored Script</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                          <button
                            onClick={() => setCodeViewMode('refactored')}
                            className={`px-2.5 py-1 text-xs rounded-md transition ${
                              codeViewMode === 'refactored'
                                ? 'bg-amber-500 text-slate-900 font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Refactored
                          </button>
                          <button
                            onClick={() => setCodeViewMode('original')}
                            className={`px-2.5 py-1 text-xs rounded-md transition ${
                              codeViewMode === 'original'
                                ? 'bg-amber-500 text-slate-900 font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Original
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            handleCopy(
                              codeViewMode === 'refactored'
                                ? currentAudit.refactoredCode || ''
                                : currentAudit.scriptContent
                            )
                          }
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleDownloadRefactored}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </div>
                    </div>

                    <pre className="font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto max-h-80 leading-relaxed">
                      <code>
                        {codeViewMode === 'refactored'
                          ? currentAudit.refactoredCode
                          : currentAudit.scriptContent}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-white">No Active Audit Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Paste an automated test script on the left and click &quot;Audit Suite for Maintenance
                  Anti-Patterns&quot; to compute health scores, identify hard sleeps, and generate refactored code.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SELF-HEALING LOCATOR STUDIO */}
      {activeTab === 'healer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-amber-400" />
                  Target Selector Context
                </h2>

                {/* Samples */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Samples:</span>
                  {SAMPLE_LOCATORS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setOriginalLocator(s.original);
                        setHealerFramework(s.framework);
                        setTargetDescription(s.desc);
                        setDomSnippet(s.dom);
                      }}
                      className="text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                      #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Original Locator */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Broken / Fragile Original Locator
                </label>
                <input
                  type="text"
                  value={originalLocator}
                  onChange={(e) => setOriginalLocator(e.target.value)}
                  className="w-full font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. //html/body/div[2]/div/button"
                />
              </div>

              {/* Framework & Target Description */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Framework</label>
                  <select
                    value={healerFramework}
                    onChange={(e) => setHealerFramework(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Playwright">Playwright</option>
                    <option value="Cypress">Cypress</option>
                    <option value="Selenium">Selenium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Component Intent
                  </label>
                  <input
                    type="text"
                    value={targetDescription}
                    onChange={(e) => setTargetDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Place Order CTA"
                  />
                </div>
              </div>

              {/* DOM Snippet */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  DOM Snippet / HTML Element Context
                </label>
                <textarea
                  value={domSnippet}
                  onChange={(e) => setDomSnippet(e.target.value)}
                  rows={8}
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-y"
                  placeholder="<button class='...' data-testid='...'>Click Me</button>"
                />
              </div>

              {healerError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {healerError}
                </div>
              )}

              <button
                onClick={handleHealLocator}
                disabled={isHealing || !originalLocator.trim()}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isHealing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Resilient Healed Locators...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Heal Locator &amp; Calculate Resilience
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Results (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {healedResult ? (
              <div className="space-y-4">
                {/* Top Pick Recommendation */}
                <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 border-b border-l border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                    Top Recommended Fix
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Optimal Resilient Selector ({healedResult.strategy})
                  </div>

                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <code className="text-sm font-mono text-emerald-300 font-semibold break-all">
                      {healedResult.healedLocator}
                    </code>
                    <button
                      onClick={() => handleCopy(healedResult.healedLocator, 'top')}
                      className="ml-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1.5 transition shrink-0"
                    >
                      {copiedLocator === 'top' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <span>
                      Resilience Score:{' '}
                      <strong className="text-emerald-400 font-mono">
                        {healedResult.resilienceScore}%
                      </strong>
                    </span>
                    <span className="text-slate-400 text-[11px]">{healedResult.framework} syntax</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                    {healedResult.alternatives?.[0]?.explanation ||
                      'Replaced brittle layout path with resilient semantic locator.'}
                  </p>
                </div>

                {/* Ranked Alternatives Table */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-amber-400" />
                    Ranked Alternative Selector Strategies
                  </h4>

                  <div className="space-y-2.5">
                    {healedResult.alternatives?.map((alt, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {alt.strategy}
                            </span>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-slate-400">Resilience:</span>
                              <span
                                className={`font-mono font-bold ${
                                  alt.resilienceScore >= 90
                                    ? 'text-emerald-400'
                                    : alt.resilienceScore >= 80
                                    ? 'text-blue-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {alt.resilienceScore}%
                              </span>
                            </div>
                          </div>

                          <code className="text-xs font-mono text-slate-200 block pt-1 break-all">
                            {alt.locator}
                          </code>
                          <p className="text-[11px] text-slate-400">{alt.explanation}</p>
                        </div>

                        <button
                          onClick={() => handleCopy(alt.locator, `alt_${idx}`)}
                          className="self-end md:self-auto px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition shrink-0"
                        >
                          {copiedLocator === `alt_${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Crosshair className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-white">No Healed Locator Generated Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Provide a broken locator and target element HTML snippet on the left to calculate
                  resilient alternative locators with user-facing ARIA, testId, and semantic strategies.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT & HEALED HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Audits History */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Past Automation Suite Audits ({auditHistory.length})
            </h3>

            {loadingHistory ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                Loading audit history...
              </div>
            ) : auditHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {auditHistory.map((audit) => (
                  <div
                    key={audit.id}
                    onClick={() => {
                      setCurrentAudit(audit);
                      setActiveTab('auditor');
                    }}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getScoreColor(
                            audit.healthScore
                          )}`}
                        >
                          {audit.healthScore}/100
                        </span>
                        <span className="text-xs font-semibold text-white group-hover:text-amber-400 transition">
                          {audit.suiteName}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteAudit(audit.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition opacity-0 group-hover:opacity-100"
                        title="Delete audit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">{audit.summary}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>{audit.framework}</span>
                      <span>{new Date(audit.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No past test suite audits found for this project.
              </div>
            )}
          </div>

          {/* Healed Locators History */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              Healed Locator Library ({healedHistory.length})
            </h3>

            {healedHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {healedHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 line-through truncate max-w-[200px]">
                        {h.originalLocator}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {h.resilienceScore}% Resilience
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <code className="text-xs font-mono text-emerald-300 font-semibold truncate mr-2">
                        {h.healedLocator}
                      </code>
                      <button
                        onClick={() => handleCopy(h.healedLocator, h.id)}
                        className="p-1 rounded text-slate-400 hover:text-white transition shrink-0"
                      >
                        {copiedLocator === h.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {h.strategy}
                      </span>
                      <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No healed locators in repository.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationMaintenancePage;
