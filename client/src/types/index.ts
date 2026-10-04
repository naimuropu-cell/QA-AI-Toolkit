export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  techStack?: string;
  testFramework?: string;
  qaStandards?: string;
  targetUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    requirements: number;
    scenarios: number;
    testCases: number;
    bugs: number;
    knowledgeItems?: number;
  };
}

export interface ActivityLogItem {
  id: string;
  action: string;
  target: string;
  details?: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface DashboardMetrics {
  totalProjects: number;
  requirementsAnalyzed: number;
  scenariosGenerated: number;
  testCasesGenerated: number;
  automationGenerated: number;
  apiTestsGenerated: number;
  bugsAnalyzed: number;
  failedTestsDiagnosed: number;
  knowledgeBaseItems: number;
}

export type NavigationTab =
  | 'dashboard'
  | 'projects'
  | 'requirement-analyzer'
  | 'test-design'
  | 'test-cases'
  | 'api-testing'
  | 'automation'
  | 'codebase'
  | 'failure-intelligence'
  | 'maintenance'
  | 'knowledge-base'
  | 'prompt-library'
  | 'settings';

export interface ScenarioDetail {
  id: string;
  title: string;
  type: string;
  priority: string;
  risk: string;
}

export interface RequirementAnalysisResult {
  summary: string;
  frameworkTarget: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  missingRequirements: string[];
  ambiguousStatements: string[];
  acceptanceCriteriaGaps: string[];
  positiveScenarios: ScenarioDetail[];
  negativeScenarios: ScenarioDetail[];
  edgeCases: ScenarioDetail[];
  boundaryConditions: ScenarioDetail[];
  qaClarificationQuestions: string[];
  potentialRisks: string[];
  suggestedTestCoverage: string[];
}

export interface RequirementRecord {
  id: string;
  title: string;
  userStory: string;
  acceptanceCriteria?: string;
  analysisJson: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

