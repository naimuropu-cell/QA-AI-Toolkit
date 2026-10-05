import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Code2,
  FolderTree,
  FileCode,
  Layers,
  ExternalLink,
  FileText,
  RefreshCw,
  Play,
  Shield,
  Clock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { AutomationSuiteRecord, NavigationTab } from '../types';

interface AutomationPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

type FrameworkOption = 'Playwright-TS' | 'Selenium-Python' | 'Playwright-JS' | 'Selenium-Java';
type ActiveTab = 'pageObject' | 'testFile' | 'fixture' | 'testData' | 'structure';

const FRAMEWORK_CONFIG: Record<
  FrameworkOption,
  {
    label: string;
    runtime: string;
    pageExt: string;
    testExt: string;
    fixtureName: string;
    recommended?: boolean;
    badgeColor: string;
  }
> = {
  'Playwright-TS': {
    label: 'Playwright + TypeScript',
    runtime: 'Node.js / TS',
    pageExt: 'ts',
    testExt: 'spec.ts',
    fixtureName: 'testFixtures.ts',
    recommended: true,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  'Selenium-Python': {
    label: 'Selenium + Python',
    runtime: 'Python / pytest',
    pageExt: 'py',
    testExt: 'py',
    fixtureName: 'conftest.py',
    recommended: true,
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  },
  'Playwright-JS': {
    label: 'Playwright + JavaScript',
    runtime: 'Node.js / ES6',
    pageExt: 'js',
    testExt: 'spec.js',
    fixtureName: 'testFixtures.js',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  'Selenium-Java': {
    label: 'Selenium + Java',
    runtime: 'Java / JUnit 5',
    pageExt: 'java',
    testExt: 'Test.java',
    fixtureName: 'pom.xml',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
};

export const AutomationPage: React.FC<AutomationPageProps> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [suites, setSuites] = useState<AutomationSuiteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Form inputs
  const [framework, setFramework] = useState<FrameworkOption>('Playwright-TS');
  const [pageName, setPageName] = useState('CheckoutPage');
  const [targetUrl, setTargetUrl] = useState('https://demo-ecommerce.example.com/checkout');
  const [featureDescription, setFeatureDescription] = useState(
    'User navigates to checkout page, fills shipping details, selects payment method, submits order, and verifies that the confirmation message is displayed with zero arbitrary sleeps.'
  );
  const [locatorHints, setLocatorHints] = useState(
    'Prefer getByRole and data-testid attributes. Heading has level 1, submit button role="button" name="Submit Order", email has data-testid="email-input".'
  );
  const [codingStandards, setCodingStandards] = useState(
    'Page Object Model (POM), strict typing, isolated test fixtures, explicit assertions on visible state, no arbitrary sleeps.'
  );

  // Active Suite and active tab in viewer
  const [activeSuite, setActiveSuite] = useState<AutomationSuiteRecord | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pageObject');
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchSuites = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const res = await api.getAutomationSuites(activeProject.id);
      setSuites(res.suites);
      if (res.suites.length > 0 && !activeSuite) {
        setActiveSuite(res.suites[0]);
      }
    } catch (err) {
      console.error('Failed to load automation suites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuites();
  }, [activeProject]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) {
      alert('Please select or create an active project first.');
      return;
    }

    try {
      setGenerating(true);
      const res = await api.generateAutomationSuite({
        projectId: activeProject.id,
        framework,
        pageName,
        targetUrl,
        featureDescription,
        locatorHints,
        codingStandards,
        save: true,
      });

      setActiveSuite(res.suite);
      setActiveTab('pageObject');
      await fetchSuites();
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSuite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation suite?')) return;
    try {
      await api.deleteAutomationSuite(id);
      setSuites((prev) => prev.filter((s) => s.id !== id));
      if (activeSuite?.id === id) {
        setActiveSuite(suites.find((s) => s.id !== id) || null);
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const getActiveCodeContent = (): { code: string; filename: string } => {
    if (!activeSuite) return { code: '', filename: '' };
    const fw = activeSuite.framework as FrameworkOption;
    const config = FRAMEWORK_CONFIG[fw] || FRAMEWORK_CONFIG['Playwright-TS'];
    const cleanName = activeSuite.pageObjectName.replace(/Page$/, '');

    switch (activeTab) {
      case 'pageObject':
        return {
          code: activeSuite.pageObjectCode,
          filename: `${activeSuite.pageObjectName}.${config.pageExt}`,
        };
      case 'testFile':
        return {
          code: activeSuite.testFileCode,
          filename:
            fw === 'Selenium-Python'
              ? `test_${cleanName.toLowerCase()}.${config.testExt}`
              : `${cleanName.toLowerCase()}.${config.testExt}`,
        };
      case 'fixture':
        return {
          code: activeSuite.fixtureCode || '// No fixture code provided',
          filename: config.fixtureName,
        };
      case 'testData':
        return {
          code: activeSuite.testDataJson || '{}',
          filename: 'testData.json',
        };
      case 'structure':
        return {
          code: activeSuite.folderStructure || '// Directory tree',
          filename: 'REPOSITORY_STRUCTURE.txt',
        };
    }
  };

  const handleCopyCode = () => {
    const { code } = getActiveCodeContent();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadActiveFile = () => {
    const { code, filename } = getActiveCodeContent();
    if (!code || !filename) return;
    downloadTextFile(filename, code);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const handleDownloadAllFiles = () => {
    if (!activeSuite) return;
    const fw = activeSuite.framework as FrameworkOption;
    const config = FRAMEWORK_CONFIG[fw] || FRAMEWORK_CONFIG['Playwright-TS'];
    const cleanName = activeSuite.pageObjectName.replace(/Page$/, '');

    // 1. Page Object
    downloadTextFile(`${activeSuite.pageObjectName}.${config.pageExt}`, activeSuite.pageObjectCode);

    // 2. Test File
    const testName =
      fw === 'Selenium-Python'
        ? `test_${cleanName.toLowerCase()}.${config.testExt}`
        : `${cleanName.toLowerCase()}.${config.testExt}`;
    setTimeout(() => {
      downloadTextFile(testName, activeSuite.testFileCode);
    }, 200);

    // 3. Fixtures
    if (activeSuite.fixtureCode) {
      setTimeout(() => {
        downloadTextFile(config.fixtureName, activeSuite.fixtureCode || '');
      }, 400);
    }

    // 4. Test Data
    if (activeSuite.testDataJson) {
      setTimeout(() => {
        downloadTextFile('testData.json', activeSuite.testDataJson || '{}');
      }, 600);
    }

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const loadSample = (sampleType: 'checkout' | 'auth') => {
    if (sampleType === 'checkout') {
      setPageName('CheckoutPage');
      setTargetUrl('https://demo-ecommerce.example.com/checkout');
      setFeatureDescription(
        'E-Commerce checkout completion: User inputs shipping address, selects express courier shipping, fills tokenized credit card info, checks promo code discount assertion, and validates final receipt display.'
      );
      setLocatorHints(
        'getByRole("heading", { level: 1 }), getByTestId("shipping-address"), getByRole("radio", { name: /express/i }), getByRole("button", { name: /complete order/i })'
      );
      setCodingStandards(
        'Page Object Model (POM), strict Playwright TypeScript, getByRole prioritization, assert on visible state without arbitrary sleeps.'
      );
    } else {
      setPageName('LoginPage');
      setTargetUrl('https://demo-ecommerce.example.com/login');
      setFeatureDescription(
        'User authentication and session verification: User enters valid email and password credentials, clicks Sign In, verifies dashboard redirection, and validates invalid credentials inline error messaging.'
      );
      setLocatorHints(
        'getByLabel("Email address"), getByLabel("Password"), getByRole("button", { name: "Sign in" }), getByRole("alert")'
      );
      setCodingStandards(
        'Page Object Model, no arbitrary sleeps, isolate test fixtures with test.extend, strongly typed locators.'
      );
    }
  };

  const activeContent = getActiveCodeContent();
  const currentFwConfig =
    FRAMEWORK_CONFIG[(activeSuite?.framework as FrameworkOption) || framework] ||
    FRAMEWORK_CONFIG['Playwright-TS'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Repository-Native Automation Generator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Page Object Model
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Synthesize production-grade Playwright & Selenium test suites with stable locators, isolated fixtures, and zero arbitrary sleeps.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => loadSample('checkout')}
              className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Load E-Commerce Checkout sample"
            >
              Sample Checkout
            </button>
            <button
              onClick={() => loadSample('auth')}
              className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Load User Authentication sample"
            >
              Sample Login
            </button>
          </div>

          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Suites ({suites.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Artifact Viewer Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleGenerate}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 text-xs shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                Automation Specifications
              </span>
              <span className="text-[11px] text-slate-400">
                Project:{' '}
                <span className="text-white font-medium">
                  {activeProject?.name || 'No project selected'}
                </span>
              </span>
            </div>

            {/* Framework Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-300">
                Target Framework & Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FRAMEWORK_CONFIG) as FrameworkOption[]).map((key) => {
                  const item = FRAMEWORK_CONFIG[key];
                  const isSelected = framework === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFramework(key)}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm ring-1 ring-blue-500/30'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-xs text-white">{item.label}</span>
                        {item.recommended && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">{item.runtime}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Page / Component Name & Target URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-300">
                  Page Object Class Name
                </label>
                <input
                  type="text"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  placeholder="e.g. CheckoutPage, LoginPage"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-300">
                  Target Application URL
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://app.example.com/checkout"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-mono text-xs"
                />
              </div>
            </div>

            {/* Feature Description */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-300">
                User Flow & Test Scenario Description
              </label>
              <textarea
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                rows={3}
                placeholder="Describe the end-to-end user journey, required inputs, actions, and validation assertions..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-xs leading-relaxed"
              />
            </div>

            {/* Locator Strategy Hints */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-300">
                  Locator Hints & Priority Strategy
                </label>
                <span className="text-[10px] text-blue-400">getByRole / getByTestId</span>
              </div>
              <textarea
                value={locatorHints}
                onChange={(e) => setLocatorHints(e.target.value)}
                rows={2}
                placeholder="e.g. data-testid='submit-btn', role='button' name='Submit Order', form has .shipping-form..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-xs font-mono"
              />
            </div>

            {/* Coding Standards */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-300">
                QA Architectural Standards & Rules
              </label>
              <input
                type="text"
                value={codingStandards}
                onChange={(e) => setCodingStandards(e.target.value)}
                placeholder="Page Object Model, no arbitrary sleeps, strict typing, isolated fixtures"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Architecture & Tests...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Repository-Native Automation Suite</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Best Practice Highlights */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Production QA Automation Guarantee
            </span>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">Strict POM Pattern:</strong> Encapsulates locators and user actions within reusable page classes.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">Zero Arbitrary Sleeps:</strong> Eliminates flaky <code className="text-amber-300">page.waitForTimeout</code> and <code className="text-amber-300">time.sleep</code>; relies on auto-waiting and explicit web assertions.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">Isolated Test Fixtures:</strong> Provides clean setup/teardown per test run for parallel execution resilience.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Panel: Artifact & Code Viewer */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {activeSuite ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col flex-1 shadow-lg overflow-hidden">
              {/* Suite Top Bar */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-sm">{activeSuite.name}</h2>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        FRAMEWORK_CONFIG[activeSuite.framework as FrameworkOption]?.badgeColor ||
                        'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {activeSuite.framework}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    {activeSuite.targetUrl || 'Target URL not specified'}
                  </p>
                </div>

                {/* Actions: Copy & Download */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                    title="Copy active file contents"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy File</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadActiveFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition"
                    title="Download active file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>

                  <button
                    onClick={handleDownloadAllFiles}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
                    title="Download all generated files as a bundle"
                  >
                    {downloadSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Downloaded</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Suite</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center border-b border-slate-800 bg-slate-950/80 px-2 overflow-x-auto text-xs">
                <button
                  onClick={() => setActiveTab('pageObject')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'pageObject'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Page Object ({activeSuite.pageObjectName})</span>
                </button>

                <button
                  onClick={() => setActiveTab('testFile')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'testFile'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Specification</span>
                </button>

                <button
                  onClick={() => setActiveTab('fixture')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'fixture'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Fixtures / Setup</span>
                </button>

                <button
                  onClick={() => setActiveTab('testData')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'testData'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Test Data (JSON)</span>
                </button>

                <button
                  onClick={() => setActiveTab('structure')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'structure'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Repository Structure</span>
                </button>
              </div>

              {/* Code Display Area */}
              <div className="relative flex-1 p-4 bg-slate-950/90 overflow-auto font-mono text-xs leading-relaxed text-slate-200 max-h-[600px] select-text">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-3">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block animate-pulse"></span>
                    File: <strong className="text-white font-mono">{activeContent.filename}</strong>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Lines: {activeContent.code.split('\n').length} | Characters: {activeContent.code.length}
                  </span>
                </div>

                <pre className="overflow-x-auto whitespace-pre font-mono text-slate-300">
                  <code>{activeContent.code}</code>
                </pre>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-bold text-white">No Automation Suite Generated Yet</h3>
                <p className="text-xs text-slate-400">
                  Select your target framework (Playwright + TypeScript or Selenium + Python), specify your page name, target URL, and user flow to synthesize a repository-native test suite.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadSample('checkout')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Sample E-Commerce Flow
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
                <Clock className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Generated Automation Suites</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {suites.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No automation suites saved yet.
                </div>
              ) : (
                suites.map((suite) => {
                  const isCurrent = activeSuite?.id === suite.id;
                  return (
                    <div
                      key={suite.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2 ${
                        isCurrent
                          ? 'border-blue-500/60 bg-blue-500/10'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-white text-xs">{suite.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            {suite.pageObjectName} • {new Date(suite.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${
                            FRAMEWORK_CONFIG[suite.framework as FrameworkOption]?.badgeColor ||
                            'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {suite.framework}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <button
                          onClick={() => {
                            setActiveSuite(suite);
                            setIsHistoryOpen(false);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1"
                        >
                          <span>Load in Workspace</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSuite(suite.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                          title="Delete Suite"
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
