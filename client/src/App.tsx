import React, { useState } from 'react';
import { NavigationTab } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { RequirementAnalyzer } from './pages/RequirementAnalyzer';
import { ModulePlaceholder } from './pages/ModulePlaceholder';
import { ProjectModal } from './components/ProjectModal';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'projects' && <ProjectsPage />}
          {currentTab === 'requirement-analyzer' && <RequirementAnalyzer onNavigate={setCurrentTab} />}

          {currentTab === 'test-design' && (
            <ModulePlaceholder
              tab="test-design"
              title="Test Scenario Generator"
              phase={3}
              description="Design comprehensive test scenarios applying Equivalence Partitioning and Boundary Value Analysis."
              plannedFeatures={[
                'Positive & Negative scenario mapping',
                'Boundary value & edge-case discovery',
                'Risk and priority classification',
                'Traceability matrix generation',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'test-cases' && (
            <ModulePlaceholder
              tab="test-cases"
              title="Test Case Generator & Manager"
              phase={3}
              description="Generate full test case specifications with preconditions, test data, steps, and expected results."
              plannedFeatures={[
                'Complete step-by-step test cases with test data',
                'Severity, priority, and test type tagging',
                'Bulk export to CSV, Excel, JSON, and Markdown',
                'Conversion to automated test stubs',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'api-testing' && (
            <ModulePlaceholder
              tab="api-testing"
              title="API Testing Assistant"
              phase={4}
              description="Analyze REST contracts (GET, POST, PUT, PATCH, DELETE) and generate Postman/Newman validation suites."
              plannedFeatures={[
                'Contract validation and payload fuzzing ideas',
                'Negative testing and HTTP status code verification',
                'Automatic token and secret masking',
                'Executable Postman test scripts export',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'automation' && (
            <ModulePlaceholder
              tab="automation"
              title="Automation Generator"
              phase={5}
              description="Synthesize robust Playwright (TypeScript) and Selenium (Python) tests following Page Object Model."
              plannedFeatures={[
                'Playwright + TypeScript and Selenium + Python synthesis',
                'Strict Page Object Model (POM) class generation',
                'Locator prioritization (getByRole, getByTestId)',
                'Code preview and one-click file download',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'codebase' && (
            <ModulePlaceholder
              tab="codebase"
              title="Codebase-Aware Intelligence"
              phase={6}
              description="Upload or connect existing repositories to extract conventions, existing page objects, and folder patterns."
              plannedFeatures={[
                'ZIP and local directory repository scanner',
                'Automated tech-stack and test framework detection',
                'Existing Page Object inventory indexing',
                'Repository-native code generation without duplication',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'failure-intelligence' && (
            <ModulePlaceholder
              tab="failure-intelligence"
              title="Failure Intelligence & Root Cause Engine"
              phase={7}
              description="Perform deep triage on logs, stack traces, and screenshots to calculate test vs. app culpability."
              plannedFeatures={[
                'Stack trace and execution log parsing',
                'Root cause hypothesis with confidence rating',
                'Culpability determination: Test vs. App vs. Environment',
                'Actionable fix recommendations and regression test stubs',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'maintenance' && (
            <ModulePlaceholder
              tab="maintenance"
              title="Automation Maintenance"
              phase={8}
              description="Audit test suites for brittle locators, arbitrary sleeps, test rot, and duplicate page objects."
              plannedFeatures={[
                'Duplicate test and obsolete test detection',
                'Hard-coded sleep and timeout inspection',
                'Broken locator and selector migration suggestions',
                'Flaky test risk scoring and remediation recipes',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'knowledge-base' && (
            <ModulePlaceholder
              tab="knowledge-base"
              title="QA Knowledge Base"
              phase={9}
              description="Manage personal QA rules, locator hierarchies, and framework standards injected into AI workflows."
              plannedFeatures={[
                'Locator strategy hierarchy rules',
                'Automation conventions and assertions standards',
                'Bug reporting standards and severity guidelines',
                'Project-level rule inheritance',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'prompt-library' && (
            <ModulePlaceholder
              tab="prompt-library"
              title="Prompt & AI Skill Library"
              phase={9}
              description="Curate reusable QA prompts across requirements, test cases, automation, and failure analysis."
              plannedFeatures={[
                'Categorized QA prompts library',
                'Variable placeholders for user stories and endpoints',
                'Search, tag, and favorite custom prompts',
                'Direct one-click prompt execution',
              ]}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'settings' && (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              <h1 className="text-xl font-bold text-white">System Settings & Configuration</h1>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
                <div>
                  <h2 className="text-sm font-semibold text-white">AI Provider Configuration</h2>
                  <p className="text-slate-400 mt-1">
                    Configure your LLM credentials securely. API keys are stored only in your local backend environment.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Default Engine:</span>
                    <span className="font-mono text-blue-400">Local Provider (Phase 1)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Database:</span>
                    <span className="font-mono text-emerald-400">Prisma SQLite (Zero-config)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Secret Detection:</span>
                    <span className="font-mono text-emerald-400">Enabled (.env & credential scrubber)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ProjectModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};
