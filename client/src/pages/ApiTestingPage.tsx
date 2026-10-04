import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Terminal,
  Shield,
  FileJson,
  Code2,
  Clock,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { ApiTestSuiteRecord, NavigationTab } from '../types';

interface ApiTestingPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const ApiTestingPage: React.FC<ApiTestingPageProps> = ({ onNavigate }) => {
  const { activeProject } = useProject();
  const [suites, setSuites] = useState<ApiTestSuiteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedNewman, setCopiedNewman] = useState(false);

  // Form Inputs
  const [endpoint, setEndpoint] = useState('/api/v1/orders/checkout');
  const [method, setMethod] = useState('POST');
  const [headers, setHeaders] = useState('Content-Type: application/json\nAccept: application/json');
  const [authType, setAuthType] = useState('Bearer');
  const [requestBody, setRequestBody] = useState(
    '{\n  "cartId": "cart_9872",\n  "paymentMethod": "credit_card",\n  "amount": 149.99,\n  "currency": "USD"\n}'
  );
  const [exampleResponse, setExampleResponse] = useState(
    '{\n  "orderId": "ord_10294",\n  "status": "confirmed",\n  "chargedAmount": 149.99\n}'
  );

  // Active Generated Suite
  const [activeSuite, setActiveSuite] = useState<any | null>(null);
  const [postmanCollection, setPostmanCollection] = useState<any | null>(null);

  const fetchSuites = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const res = await api.getApiSuites(activeProject.id);
      setSuites(res.suites);
    } catch (err) {
      console.error('Failed to load API suites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuites();
  }, [activeProject]);

  const loadSample = () => {
    setEndpoint('/api/v1/payments/charge');
    setMethod('POST');
    setHeaders('Content-Type: application/json\nIdempotency-Key: idemp_9921');
    setAuthType('Bearer');
    setRequestBody(
      '{\n  "customerToken": "tok_visa_4242",\n  "amount": 250.00,\n  "currency": "USD",\n  "capture": true\n}'
    );
    setExampleResponse(
      '{\n  "chargeId": "ch_77312",\n  "status": "succeeded",\n  "amountCaptured": 250.00,\n  "failureCode": null\n}'
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    if (!endpoint) return;

    try {
      setGenerating(true);
      const res = await api.generateApiTests({
        projectId: activeProject.id,
        name: `${method} ${endpoint}`,
        endpoint,
        method,
        headers,
        requestBody,
        authType,
        exampleResponse,
      });

      setActiveSuite(res.suite);
      setPostmanCollection(res.postmanCollection);
      await fetchSuites();
    } catch (err: any) {
      alert(err.message || 'Failed to generate API tests');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this API test suite?')) return;
    try {
      await api.deleteApiSuite(id);
      if (activeSuite?.id === id) setActiveSuite(null);
      await fetchSuites();
    } catch (err: any) {
      alert(err.message || 'Failed to delete API suite');
    }
  };

  const downloadPostmanCollection = () => {
    if (!postmanCollection) return;
    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postman_collection_${method.toLowerCase()}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyScript = () => {
    if (!activeSuite?.postmanScript) return;
    navigator.clipboard.writeText(activeSuite.postmanScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const copyNewman = () => {
    if (!activeSuite?.newmanCommand) return;
    navigator.clipboard.writeText(activeSuite.newmanCommand);
    setCopiedNewman(true);
    setTimeout(() => setCopiedNewman(false), 2000);
  };

  const scenariosList = activeSuite?.testScenarios
    ? typeof activeSuite.testScenarios === 'string'
      ? JSON.parse(activeSuite.testScenarios)
      : activeSuite.testScenarios
    : activeSuite?.scenarios || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-violet-400" />
              API Testing Assistant
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
              Module 5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Author and execute REST API scenarios, status validation scripts, and exportable Postman / Newman test collections.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSample}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors self-start md:self-auto"
        >
          Load Payment Endpoint Sample
        </button>
      </div>

      {/* Grid: Request Config (Left) & Test Suite Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Parameters Form & History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-violet-400" />
              API Contract Specifications
            </div>

            <form onSubmit={handleGenerate} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-2 text-slate-200 focus:outline-none focus:border-violet-500 font-mono font-semibold"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Endpoint Path</label>
                  <input
                    type="text"
                    required
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/v1/resource"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Authorization</label>
                <div className="flex gap-2">
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value)}
                    className="w-1/3 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200 focus:outline-none text-[11px]"
                  >
                    <option value="None">None</option>
                    <option value="Bearer">Bearer Token</option>
                    <option value="ApiKey">API Key</option>
                  </select>
                  <div className="flex-1 p-2 rounded bg-slate-950 border border-slate-800 text-slate-500 text-[10px] flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Secrets masked automatically</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Headers</label>
                <textarea
                  rows={2}
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder="Key: Value..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Request Body (JSON)</label>
                  <textarea
                    rows={4}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder="{ 'key': 'value' }"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Example Expected Response</label>
                <textarea
                  rows={3}
                  value={exampleResponse}
                  onChange={(e) => setExampleResponse(e.target.value)}
                  placeholder="{ 'status': 'success' }"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-xs mt-3"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? 'Generating Test Suite...' : 'Generate API Test Suite'}
              </button>
            </form>
          </div>

          {/* Past API Suites Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Saved API Test Suites ({suites.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {suites.length === 0 ? (
                <div className="text-[11px] text-slate-500 py-3 text-center">
                  No API test suites generated yet.
                </div>
              ) : (
                suites.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setActiveSuite(s)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                      activeSuite?.id === s.id
                        ? 'bg-violet-950/30 border-violet-700 text-violet-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-white flex items-center gap-1.5 truncate">
                        <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-800 text-violet-400 font-semibold">
                          {s.method}
                        </span>
                        <span className="truncate">{s.endpoint}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{s.name}</div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(s.id, e)}
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

        {/* Right: API Test Suite Output */}
        <div className="lg:col-span-7">
          {activeSuite ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-bold text-base text-white flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 font-semibold">
                      {activeSuite.method}
                    </span>
                    <span>{activeSuite.endpoint}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeSuite.name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadPostmanCollection}
                    className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Postman JSON</span>
                  </button>
                </div>
              </div>

              {/* Scenarios Breakdown */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  API Test Scenarios ({scenariosList.length})
                </span>
                <div className="space-y-2">
                  {scenariosList.map((sc: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          <span>{sc.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              sc.type === 'Positive'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : sc.type === 'Security'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {sc.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {sc.description}
                        </div>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold shrink-0">
                        HTTP {sc.expectedStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Postman Test Scripts */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Postman Assertion Scripts (`pm.test`)
                  </span>
                  <button
                    onClick={copyScript}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 whitespace-pre leading-relaxed overflow-x-auto">
                  {activeSuite.postmanScript}
                </div>
              </div>

              {/* Newman CLI Runner Suggestion */}
              {activeSuite.newmanCommand && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      Newman CLI Execution Command
                    </span>
                    <button
                      onClick={copyNewman}
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {copiedNewman ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNewman ? 'Copied' : 'Copy Command'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                    {activeSuite.newmanCommand}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-500 space-y-3">
              <Globe2 className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-slate-300 font-medium text-sm">No API Test Suite Generated Yet</div>
              <p className="max-w-md mx-auto text-slate-400">
                Configure your API endpoint contract on the left or click "Load Payment Endpoint Sample" to generate comprehensive REST validation tests and Postman collections.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
