import React, { useState } from 'react';
import { NavigationTab } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { RequirementAnalyzer } from './pages/RequirementAnalyzer';
import { TestDesignPage } from './pages/TestDesignPage';
import { TestCasesPage } from './pages/TestCasesPage';
import { BugAnalyzerPage } from './pages/BugAnalyzerPage';
import { ApiTestingPage } from './pages/ApiTestingPage';
import { AutomationPage } from './pages/AutomationPage';
import { CodebasePage } from './pages/CodebasePage';
import { FailureIntelligencePage } from './pages/FailureIntelligencePage';
import { AutomationMaintenancePage } from './pages/AutomationMaintenancePage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { PromptLibraryPage } from './pages/PromptLibraryPage';
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
          {currentTab === 'test-design' && <TestDesignPage onNavigate={setCurrentTab} />}
          {currentTab === 'test-cases' && <TestCasesPage onNavigate={setCurrentTab} />}
          {currentTab === 'bug-analyzer' && <BugAnalyzerPage onNavigate={setCurrentTab} />}
          {currentTab === 'api-testing' && <ApiTestingPage onNavigate={setCurrentTab} />}
          {currentTab === 'automation' && <AutomationPage onNavigate={setCurrentTab} />}
          {currentTab === 'codebase' && <CodebasePage onNavigate={setCurrentTab} />}
          {currentTab === 'failure-intelligence' && <FailureIntelligencePage onNavigate={setCurrentTab} />}
          {currentTab === 'maintenance' && <AutomationMaintenancePage onNavigate={setCurrentTab} />}
          {currentTab === 'knowledge-base' && <KnowledgeBasePage onNavigate={setCurrentTab} />}
          {currentTab === 'prompt-library' && <PromptLibraryPage onNavigate={setCurrentTab} />}

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
