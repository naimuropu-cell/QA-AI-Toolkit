import { DashboardMetrics, Project, ActivityLogItem, User } from '../types';

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

  // Health
  async checkHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  }
};
