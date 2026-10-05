import React, { useState, useEffect } from 'react';
import {
  Code2,
  FolderTree,
  FileCode,
  Sparkles,
  Layers,
  Search,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Trash2,
  Clock,
  Shield,
  RefreshCw,
  FolderOpen,
  FileText,
  ChevronRight,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import {
  CodebaseScanRecord,
  DiscoveredPageObject,
  RepositoryNativeResult,
  NavigationTab,
} from '../types';

interface CodebasePageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

type ScanMode = 'path' | 'manifest';

export const CodebasePage: React.FC<CodebasePageProps> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [scans, setScans] = useState<CodebaseScanRecord[]>([]);
  const [activeScan, setActiveScan] = useState<CodebaseScanRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Scanning Inputs
  const [scanMode, setScanMode] = useState<ScanMode>('path');
  const [dirPath, setDirPath] = useState('d:/QA ToolKIT');
  const [manifestContent, setManifestContent] = useState(`{
  "name": "ecommerce-storefront-qa",
  "dependencies": {
    "@playwright/test": "^1.42.0",
    "typescript": "^5.3.0"
  },
  "scripts": {
    "test": "playwright test"
  }
}`);
  const [repoName, setRepoName] = useState('E-Commerce Repository');

  // Search filter for Page Objects
  const [poFilter, setPoFilter] = useState('');

  // Native Automation Synthesis inputs
  const [scenarioInput, setScenarioInput] = useState(
    'User navigates to checkout, applies promo code "SUMMER2026", and verifies order summary recalculates with 20% discount.'
  );
  const [selectedPoNames, setSelectedPoNames] = useState<string[]>([]);
  const [nativeResult, setNativeResult] = useState<RepositoryNativeResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'testFile' | 'additiveMethods' | 'explanation'>('testFile');
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchScans = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const res = await api.getCodebaseScans(activeProject.id);
      setScans(res.scans);
      if (res.scans.length > 0 && !activeScan) {
        setActiveScan(res.scans[0]);
        setSelectedPoNames(res.scans[0].pageObjects.map((p) => p.name));
      }
    } catch (err) {
      console.error('Failed to load codebase scans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [activeProject]);

  const handleScanPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) {
      alert('Please select or create an active project first.');
      return;
    }

    try {
      setScanning(true);
      const res = await api.scanCodebasePath(activeProject.id, dirPath);
      setActiveScan(res.scan);
      setSelectedPoNames(res.scan.pageObjects.map((p) => p.name));
      await fetchScans();
    } catch (err: any) {
      alert(`Directory scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleScanManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) {
      alert('Please select an active project.');
      return;
    }

    try {
      setScanning(true);
      const res = await api.scanCodebaseManifest({
        projectId: activeProject.id,
        repositoryName: repoName,
        manifestContent,
      });
      setActiveScan(res.scan);
      setSelectedPoNames(res.scan.pageObjects.map((p) => p.name));
      await fetchScans();
    } catch (err: any) {
      alert(`Manifest scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateNative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    try {
      setSynthesizing(true);
      const res = await api.generateRepositoryNative({
        projectId: activeProject.id,
        scenario: scenarioInput,
        selectedPageObjects: selectedPoNames,
      });
      setNativeResult(res);
      setActiveResultTab('testFile');
    } catch (err: any) {
      alert(`Native automation synthesis failed: ${err.message}`);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleDeleteScan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this codebase scan?')) return;
    try {
      await api.deleteCodebaseScan(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
      if (activeScan?.id === id) {
        setActiveScan(scans.find((s) => s.id !== id) || null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const togglePoSelection = (name: string) => {
    setSelectedPoNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const loadSampleManifest = (type: 'playwright' | 'selenium') => {
    setScanMode('manifest');
    if (type === 'playwright') {
      setRepoName('Storefront Playwright TS');
      setManifestContent(`{
  "name": "storefront-qa",
  "scripts": { "test": "playwright test" },
  "devDependencies": {
    "@playwright/test": "^1.42.0",
    "typescript": "^5.3.0"
  }
}`);
    } else {
      setRepoName('Python Pytest Selenium Suite');
      setManifestContent(`pytest>=8.0.0
selenium>=4.18.0
pytest-html>=4.1.0
webdriver-manager>=4.0.1`);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredPageObjects = activeScan
    ? activeScan.pageObjects.filter(
        (p) =>
          p.name.toLowerCase().includes(poFilter.toLowerCase()) ||
          p.filePath.toLowerCase().includes(poFilter.toLowerCase()) ||
          p.methods.some((m) => m.toLowerCase().includes(poFilter.toLowerCase()))
      )
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Code2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Codebase-Aware Intelligence
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Repository-Native
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan local repositories or manifests to index existing Page Objects, fixtures, and locator conventions for reuse without duplication.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => loadSampleManifest('playwright')}
              className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Load sample Playwright manifest"
            >
              Playwright Sample
            </button>
            <button
              onClick={() => loadSampleManifest('selenium')}
              className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Load sample Selenium manifest"
            >
              Selenium Sample
            </button>
          </div>

          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scans ({scans.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Scan Configuration & Active Scan Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Ingestion & Scanner */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 text-xs shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                Repository Ingestion Mode
              </span>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setScanMode('path')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    scanMode === 'path'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Local Path
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('manifest')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    scanMode === 'manifest'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Manifest
                </button>
              </div>
            </div>

            {scanMode === 'path' ? (
              <form onSubmit={handleScanPath} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-300">
                    Local Repository Absolute Directory Path
                  </label>
                  <input
                    type="text"
                    value={dirPath}
                    onChange={(e) => setDirPath(e.target.value)}
                    placeholder="e.g. d:/projects/my-qa-automation"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Auto-excludes <code className="text-amber-400">node_modules</code>, <code className="text-amber-400">.git</code>, <code className="text-amber-400">.env</code>, and binary files.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={scanning}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                >
                  {scanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning Repository & Indexing AST...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Scan & Index Local Repository</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleScanManifest} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-300">
                    Repository Identifier
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="e.g. Storefront Automation Suite"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-300">
                    Manifest / Config Content (package.json, conftest.py, etc.)
                  </label>
                  <textarea
                    value={manifestContent}
                    onChange={(e) => setManifestContent(e.target.value)}
                    rows={6}
                    placeholder="Paste package.json, requirements.txt, or page object snippets..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={scanning}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                >
                  {scanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Manifest & Conventions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Analyze Manifest & Extract Context</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Privacy & Secret Scrubber Guarantee */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Zero Secret Leakage Guarantee
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All files pass through an automated credential scrubber before processing. Bearer tokens, private keys, API secrets, and sensitive <code className="text-amber-300">.env</code> entries are strictly redacted and never stored or sent to AI models.
            </p>
          </div>
        </div>

        {/* Right Panel: Project QA Context & Metrics */}
        <div className="lg:col-span-7 space-y-4">
          {activeScan ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                    Framework
                  </span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    {activeScan.detectedFramework}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                    Language
                  </span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-sky-400" />
                    {activeScan.detectedLanguage}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                    Page Objects
                  </span>
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    {activeScan.pageObjects.length} Indexed
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                    Locator Strategy
                  </span>
                  <span className="text-xs font-bold text-amber-300 truncate block font-mono" title={activeScan.locatorStrategy || 'Default'}>
                    {activeScan.locatorStrategy || 'getByRole > getByTestId'}
                  </span>
                </div>
              </div>

              {/* Discovered Page Objects Inventory */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Indexed Page Object Model Inventory ({activeScan.pageObjects.length})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select Page Objects to reuse for additive, repository-native test synthesis.
                    </p>
                  </div>

                  {/* Search filter */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={poFilter}
                      onChange={(e) => setPoFilter(e.target.value)}
                      placeholder="Filter page objects..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {filteredPageObjects.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No matching Page Objects found in this codebase scan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {filteredPageObjects.map((po) => {
                      const isSelected = selectedPoNames.includes(po.name);
                      return (
                        <div
                          key={po.name}
                          onClick={() => togglePoSelection(po.name)}
                          className={`p-3 rounded-lg border transition cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? 'border-indigo-500/60 bg-indigo-500/10'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-500 text-white'
                                      : 'border-slate-700 bg-slate-900'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span className="font-semibold text-white text-xs">{po.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                                {po.filePath}
                              </span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {po.methods.length} methods
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1">
                            {po.methods.slice(0, 4).map((m) => (
                              <span
                                key={m}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono"
                              >
                                {m}()
                              </span>
                            ))}
                            {po.methods.length > 4 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500">
                                +{po.methods.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FolderTree className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-bold text-white">No Codebase Scanned Yet</h3>
                <p className="text-xs text-slate-400">
                  Provide your local directory path or paste a project manifest to index existing Page Objects and establish your Project QA Context.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadSampleManifest('playwright')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Sample Playwright Manifest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Repository-Native Automation Generator */}
      {activeScan && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Repository-Native Automation Synthesizer
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Generates test specifications and additive methods strictly reusing your discovered{' '}
              <strong className="text-white">
                {selectedPoNames.length > 0 ? selectedPoNames.join(', ') : 'indexed Page Objects'}
              </strong>
              .
            </p>
          </div>

          <form onSubmit={handleGenerateNative} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-300">
                New User Journey / Scenario to Automate
              </label>
              <textarea
                value={scenarioInput}
                onChange={(e) => setScenarioInput(e.target.value)}
                rows={2}
                placeholder="Describe user actions, inputs, and validation assertions for the test..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition leading-relaxed text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={synthesizing}
              className="py-2.5 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
            >
              {synthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Native Test with Discovered Abstractions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Synthesize Repository-Native Automation</span>
                </>
              )}
            </button>
          </form>

          {/* Native Synthesis Results Viewer */}
          {nativeResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden space-y-0">
              {/* Output Top Bar */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-xs">
                    {nativeResult.output.testTitle}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {nativeResult.output.framework}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Reusing: <strong className="text-white">{nativeResult.output.reusedPageObjects?.join(', ') || 'POM'}</strong>
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleCopyCode(
                      activeResultTab === 'testFile'
                        ? nativeResult.output.testFileCode
                        : activeResultTab === 'additiveMethods'
                        ? nativeResult.output.additiveMethodsCode
                        : nativeResult.output.explanation
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center border-b border-slate-800 bg-slate-950 px-2 text-xs">
                <button
                  onClick={() => setActiveResultTab('testFile')}
                  className={`px-3.5 py-2.5 font-medium border-b-2 transition ${
                    activeResultTab === 'testFile'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1. Native Test Specification
                </button>
                <button
                  onClick={() => setActiveResultTab('additiveMethods')}
                  className={`px-3.5 py-2.5 font-medium border-b-2 transition ${
                    activeResultTab === 'additiveMethods'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2. Additive Page Object Methods
                </button>
                <button
                  onClick={() => setActiveResultTab('explanation')}
                  className={`px-3.5 py-2.5 font-medium border-b-2 transition ${
                    activeResultTab === 'explanation'
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3. Architectural Rationale
                </button>
              </div>

              {/* Code Pre */}
              <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-slate-200 bg-slate-950/80 max-h-96">
                <pre>
                  <code>
                    {activeResultTab === 'testFile'
                      ? nativeResult.output.testFileCode
                      : activeResultTab === 'additiveMethods'
                      ? nativeResult.output.additiveMethodsCode
                      : nativeResult.output.explanation}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Drawer Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 p-6 flex flex-col h-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Codebase Scans History</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {scans.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No codebase scans recorded yet.
                </div>
              ) : (
                scans.map((scan) => {
                  const isCurrent = activeScan?.id === scan.id;
                  return (
                    <div
                      key={scan.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2 ${
                        isCurrent
                          ? 'border-indigo-500/60 bg-indigo-500/10'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-white text-xs">{scan.repositoryName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            {scan.pageObjects.length} Page Objects • {new Date(scan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {scan.detectedFramework}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <button
                          onClick={() => {
                            setActiveScan(scan);
                            setSelectedPoNames(scan.pageObjects.map((p) => p.name));
                            setIsHistoryOpen(false);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center gap-1"
                        >
                          <span>Load Context</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteScan(scan.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                          title="Delete Scan"
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
