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
    apiSuites?: number;
    automationSuites?: number;
    codebaseScans?: number;
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
  | 'bug-analyzer'
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

export interface TestScenarioRecord {
  id: string;
  scenarioId: string;
  title: string;
  module: string;
  type: string;
  priority: string;
  risk: string;
  projectId: string;
  createdAt: string;
}

export interface TestCaseRecord {
  id: string;
  testCaseId: string;
  title: string;
  module: string;
  preconditions?: string;
  testData?: string;
  steps: string;
  expectedResult: string;
  priority: string;
  severity: string;
  type: string;
  projectId: string;
  createdAt: string;
}

export interface BugReportRecord {
  id: string;
  title: string;
  module: string;
  severity: string;
  priority: string;
  bugType: string;
  environment: string;
  preconditions?: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  rootCause?: string;
  evidence?: string;
  suggestedFix?: string;
  regressionRisk?: string;
  projectId: string;
  createdAt: string;
}

export interface ApiScenario {
  id: string;
  name: string;
  type: string;
  expectedStatus: number;
  description: string;
}

export interface ApiTestSuiteRecord {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  headers?: string;
  requestBody?: string;
  testScenarios: string; // JSON
  postmanScript: string;
  newmanCommand?: string;
  projectId: string;
  createdAt: string;
}

export interface AutomationSuiteRecord {
  id: string;
  name: string;
  framework: string;
  targetUrl?: string;
  pageObjectName: string;
  pageObjectCode: string;
  testFileCode: string;
  fixtureCode?: string;
  testDataJson?: string;
  folderStructure?: string;
  projectId: string;
  createdAt: string;
}

export interface DiscoveredPageObject {
  name: string;
  filePath: string;
  methods: string[];
  locators?: string[];
}

export interface DiscoveredFixture {
  name: string;
  filePath: string;
  description: string;
}

export interface CodebaseScanRecord {
  id: string;
  repositoryName: string;
  repositoryPath?: string;
  detectedFramework: string;
  detectedLanguage: string;
  testDirectory?: string;
  locatorStrategy?: string;
  pageObjects: DiscoveredPageObject[];
  fixtures: DiscoveredFixture[];
  summaryMetrics: {
    totalFilesScanned: number;
    pageObjectsCount: number;
    testFilesCount: number;
    fixturesCount: number;
  };
  fileTree: string[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryNativeResult {
  output: {
    testTitle: string;
    framework: string;
    reusedPageObjects: string[];
    testFileCode: string;
    additiveMethodsCode: string;
    explanation: string;
  };
  provider: string;
  scanContext?: {
    repositoryName: string;
    framework: string;
    locatorStrategy?: string;
  } | null;
}



