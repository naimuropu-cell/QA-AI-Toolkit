import {
  DashboardMetrics,
  Project,
  ActivityLogItem,
  User,
  AutomationSuiteRecord,
  CodebaseScanRecord,
  RepositoryNativeResult,
  FailureDiagnosisRecord,
  AutomationAuditRecord,
  HealedLocatorRecord,
} from '../types';

const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('qa_toolkit_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('qa_toolkit_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('qa_toolkit_token');
};

const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    return res.json();
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    return res.json();
  },

  async demoLogin(): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Demo login failed');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Not authenticated');
    }
    return res.json();
  },

  // Projects
  async getProjects(): Promise<{ projects: Project[] }> {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(id: string): Promise<{ project: Project }> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  async createProject(data: Partial<Project>): Promise<{ project: Project }> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create project');
    }
    return res.json();
  },

  async updateProject(id: string, data: Partial<Project>): Promise<{ project: Project }> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update project');
    }
    return res.json();
  },

  async deleteProject(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  // Dashboard
  async getDashboardData(): Promise<{
    metrics: DashboardMetrics;
    recentProjects: Project[];
    recentActivities: ActivityLogItem[];
  }> {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  // Requirements
  async analyzeRequirement(data: {
    projectId: string;
    title: string;
    userStory: string;
    acceptanceCriteria?: string;
    additionalContext?: string;
    save?: boolean;
  }): Promise<{
    record?: any;
    analysis: any;
    provider: string;
  }> {
    const res = await fetch(`${API_BASE}/requirements/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze requirement');
    }
    return res.json();
  },

  async getRequirementsByProject(projectId: string): Promise<{ requirements: any[] }> {
    const res = await fetch(`${API_BASE}/requirements/project/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch project requirements');
    return res.json();
  },

  async getRequirement(id: string): Promise<{ requirement: any; analysis: any }> {
    const res = await fetch(`${API_BASE}/requirements/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch requirement');
    return res.json();
  },

  async convertRequirementToScenarios(id: string): Promise<{
    message: string;
    convertedCount: number;
    scenarios: any[];
  }> {
    const res = await fetch(`${API_BASE}/requirements/${id}/convert-scenarios`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to convert scenarios');
    return res.json();
  },

  async deleteRequirement(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/requirements/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete requirement');
    return res.json();
  },

  // Test Design & Scenarios
  async getScenarios(projectId: string): Promise<{ scenarios: any[] }> {
    const res = await fetch(`${API_BASE}/test-design/scenarios/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch test scenarios');
    return res.json();
  },

  async generateScenarios(data: {
    projectId: string;
    module: string;
    requirementText: string;
    acceptanceCriteria?: string;
    testTypes?: string[];
  }): Promise<{ count: number; scenarios: any[]; provider: string }> {
    const res = await fetch(`${API_BASE}/test-design/generate-scenarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate scenarios');
    }
    return res.json();
  },

  async deleteScenario(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/test-design/scenarios/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete scenario');
    return res.json();
  },

  // Test Cases
  async getTestCases(projectId: string): Promise<{ testCases: any[] }> {
    const res = await fetch(`${API_BASE}/test-design/test-cases/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch test cases');
    return res.json();
  },

  async getTestCase(id: string): Promise<{ testCase: any }> {
    const res = await fetch(`${API_BASE}/test-design/test-cases/detail/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch test case details');
    return res.json();
  },

  async generateTestCases(data: {
    projectId: string;
    module: string;
    requirementText: string;
    acceptanceCriteria?: string;
    scenarios?: string[];
  }): Promise<{ count: number; testCases: any[]; provider: string }> {
    const res = await fetch(`${API_BASE}/test-design/generate-test-cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate test cases');
    }
    return res.json();
  },

  async createTestCase(data: any): Promise<{ testCase: any }> {
    const res = await fetch(`${API_BASE}/test-design/test-cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create test case');
    }
    return res.json();
  },

  async updateTestCase(id: string, data: any): Promise<{ testCase: any }> {
    const res = await fetch(`${API_BASE}/test-design/test-cases/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update test case');
    }
    return res.json();
  },

  async deleteTestCase(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/test-design/test-cases/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete test case');
    return res.json();
  },

  async convertScenarioToTestCase(scenarioId: string): Promise<{ message: string; testCase: any }> {
    const res = await fetch(`${API_BASE}/test-design/convert-scenario`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ scenarioId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to convert scenario to test case');
    }
    return res.json();
  },

  // Bugs & Defect Analysis
  async analyzeBug(data: any): Promise<{ bug: any; analysis: any; provider: string }> {
    const res = await fetch(`${API_BASE}/bugs/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze bug');
    }
    return res.json();
  },

  async getBugs(projectId: string): Promise<{ bugs: any[] }> {
    const res = await fetch(`${API_BASE}/bugs/project/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch bug reports');
    return res.json();
  },

  async getBug(id: string): Promise<{ bug: any }> {
    const res = await fetch(`${API_BASE}/bugs/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch bug report');
    return res.json();
  },

  async convertBugToTestCase(id: string): Promise<{ message: string; testCase: any }> {
    const res = await fetch(`${API_BASE}/bugs/${id}/convert-test-case`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to convert bug to test case');
    return res.json();
  },

  async deleteBug(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/bugs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete bug report');
    return res.json();
  },

  // API Testing
  async generateApiTests(data: any): Promise<{
    suite: any;
    analysis: any;
    postmanCollection: any;
    provider: string;
  }> {
    const res = await fetch(`${API_BASE}/api-testing/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate API tests');
    }
    return res.json();
  },

  async getApiSuites(projectId: string): Promise<{ suites: any[] }> {
    const res = await fetch(`${API_BASE}/api-testing/project/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch API test suites');
    return res.json();
  },

  async deleteApiSuite(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/api-testing/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete API test suite');
    return res.json();
  },

  // Automation Generator
  async generateAutomationSuite(data: {
    projectId: string;
    framework?: string;
    pageName: string;
    targetUrl?: string;
    featureDescription: string;
    locatorHints?: string;
    codingStandards?: string;
    save?: boolean;
  }): Promise<{ suite: AutomationSuiteRecord; rawOutput: any; provider: string }> {
    const res = await fetch(`${API_BASE}/automation/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate automation suite');
    }
    return res.json();
  },

  async getAutomationSuites(projectId: string): Promise<{ suites: AutomationSuiteRecord[] }> {
    const res = await fetch(`${API_BASE}/automation/project/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch automation suites');
    return res.json();
  },

  async getAutomationSuite(id: string): Promise<{ suite: AutomationSuiteRecord }> {
    const res = await fetch(`${API_BASE}/automation/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch automation suite');
    return res.json();
  },

  async deleteAutomationSuite(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/automation/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete automation suite');
    return res.json();
  },

  // Codebase Intelligence
  async scanCodebasePath(projectId: string, dirPath: string): Promise<{ scan: CodebaseScanRecord }> {
    const res = await fetch(`${API_BASE}/codebase/scan-path`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ projectId, dirPath }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to scan repository path');
    }
    return res.json();
  },

  async scanCodebaseManifest(data: {
    projectId: string;
    repositoryName?: string;
    manifestContent: string;
    samplePageObjects?: any[];
  }): Promise<{ scan: CodebaseScanRecord }> {
    const res = await fetch(`${API_BASE}/codebase/scan-manifest`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze repository manifest');
    }
    return res.json();
  },

  async generateRepositoryNative(data: {
    projectId: string;
    scenario: string;
    selectedPageObjects?: string[];
    codingStandards?: string;
  }): Promise<RepositoryNativeResult> {
    const res = await fetch(`${API_BASE}/codebase/generate-native`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate repository-native automation');
    }
    return res.json();
  },

  async getCodebaseScans(projectId: string): Promise<{ scans: CodebaseScanRecord[] }> {
    const res = await fetch(`${API_BASE}/codebase/project/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch codebase scans');
    return res.json();
  },

  async getCodebaseScan(id: string): Promise<{ scan: CodebaseScanRecord }> {
    const res = await fetch(`${API_BASE}/codebase/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch scan details');
    return res.json();
  },

  async deleteCodebaseScan(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/codebase/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete codebase scan');
    return res.json();
  },

  // Failure Intelligence
  async diagnoseFailure(data: {
    projectId: string;
    testName: string;
    framework?: string;
    errorMessage: string;
    stackTrace?: string;
    executionLogs?: string;
    screenshotUrl?: string;
    save?: boolean;
  }): Promise<{ diagnosis: FailureDiagnosisRecord; rawOutput: any; provider: string }> {
    const res = await fetch(`${API_BASE}/failures/diagnose`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to diagnose test failure');
    }
    return res.json();
  },

  async getDiagnoses(projectId: string): Promise<{ diagnoses: FailureDiagnosisRecord[] }> {
    const res = await fetch(`${API_BASE}/failures/project/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch failure diagnoses');
    return res.json();
  },

  async getDiagnosis(id: string): Promise<{ diagnosis: FailureDiagnosisRecord }> {
    const res = await fetch(`${API_BASE}/failures/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch failure diagnosis');
    return res.json();
  },

  async deleteDiagnosis(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/failures/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete failure diagnosis');
    return res.json();
  },

  async convertFailureToBug(id: string): Promise<{ message: string; bug: any }> {
    const res = await fetch(`${API_BASE}/failures/${id}/convert-bug`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to convert failure to bug report');
    return res.json();
  },

  async convertFailureToTestCase(id: string): Promise<{ message: string; testCase: any }> {
    const res = await fetch(`${API_BASE}/failures/${id}/convert-test-case`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to convert failure to regression test case');
    return res.json();
  },

  // Maintenance & Self-Healing
  async auditAutomationScript(data: {
    projectId: string;
    suiteName: string;
    framework?: string;
    scriptContent: string;
    save?: boolean;
  }): Promise<{ audit: AutomationAuditRecord; rawOutput: any; provider: string }> {
    const res = await fetch(`${API_BASE}/maintenance/audit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to audit automation script');
    }
    return res.json();
  },

  async getAutomationAudits(projectId: string): Promise<{ audits: AutomationAuditRecord[] }> {
    const res = await fetch(`${API_BASE}/maintenance/project/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch automation audits');
    return res.json();
  },

  async getAutomationAudit(id: string): Promise<{ audit: AutomationAuditRecord }> {
    const res = await fetch(`${API_BASE}/maintenance/audits/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch automation audit');
    return res.json();
  },

  async deleteAutomationAudit(id: string): Promise<{ deletedId: string }> {
    const res = await fetch(`${API_BASE}/maintenance/audits/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete automation audit');
    return res.json();
  },

  async healLocator(data: {
    projectId: string;
    originalLocator: string;
    framework?: string;
    domSnippet?: string;
    targetDescription?: string;
    save?: boolean;
  }): Promise<{ healed: HealedLocatorRecord; rawOutput: any; provider: string }> {
    const res = await fetch(`${API_BASE}/maintenance/heal-locator`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to heal locator');
    }
    return res.json();
  },

  async getHealedLocators(projectId: string): Promise<{ healedLocators: HealedLocatorRecord[] }> {
    const res = await fetch(`${API_BASE}/maintenance/healed-locators/${projectId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch healed locators');
    return res.json();
  },

  // Health
  async checkHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  }
};
