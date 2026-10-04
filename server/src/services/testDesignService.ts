import prisma from '../config/db';
import { aiGateway } from './ai/AIGateway';
import { AIContextPayload } from './ai/AIProvider';

export interface GenerateScenariosInput {
  projectId: string;
  module: string;
  requirementText: string;
  acceptanceCriteria?: string;
  testTypes?: string[];
  save?: boolean;
}

export interface GenerateTestCasesInput {
  projectId: string;
  module: string;
  requirementText: string;
  acceptanceCriteria?: string;
  scenarios?: string[];
  targetFramework?: string;
  save?: boolean;
}

export class TestDesignService {
  async generateScenarios(input: GenerateScenariosInput) {
    const { projectId, module, requirementText, acceptanceCriteria, testTypes = [], save = true } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { knowledgeItems: { take: 5 } },
    });

    if (!project) throw new Error(`Project ${projectId} not found.`);

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'TypeScript',
      testFramework: project.testFramework || 'Playwright',
      qaStandards: project.qaStandards || 'Page Object Model',
    };

    const prompt = `Generate comprehensive QA Test Scenarios.
Module: ${module}
Requirement: ${requirementText}
Acceptance Criteria: ${acceptanceCriteria || 'None'}
Requested Test Types: ${testTypes.length > 0 ? testTypes.join(', ') : 'Positive, Negative, Boundary, Security, Usability, Regression'}

Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "scenarioId": "SCN_001",
    "title": "Scenario description",
    "type": "Positive" | "Negative" | "Boundary Value" | "Equivalence Partitioning" | "Security" | "Usability" | "Regression",
    "priority": "High" | "Medium" | "Low",
    "risk": "High" | "Medium" | "Low"
  }
]`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let scenarios: any[] = [];
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      scenarios = JSON.parse(cleaned);
      if (!Array.isArray(scenarios)) {
        scenarios = (scenarios as any).scenarios || [];
      }
    } catch {
      // Rule-based fallback if parsing raw text
      const baseId = module.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'MOD';
      scenarios = [
        {
          scenarioId: `SCN_${baseId}_POS_01`,
          title: `Verify successful user flow for ${module} with valid parameters`,
          type: 'Positive',
          priority: 'High',
          risk: 'Low',
        },
        {
          scenarioId: `SCN_${baseId}_NEG_01`,
          title: `Verify validation alert on submitting missing mandatory inputs in ${module}`,
          type: 'Negative',
          priority: 'High',
          risk: 'Medium',
        },
        {
          scenarioId: `SCN_${baseId}_BND_01`,
          title: `Verify maximum character length and boundary values on ${module} inputs`,
          type: 'Boundary Value',
          priority: 'Medium',
          risk: 'Low',
        },
        {
          scenarioId: `SCN_${baseId}_SEC_01`,
          title: `Verify authorization barrier and XSS sanitization on ${module} submission`,
          type: 'Security',
          priority: 'High',
          risk: 'High',
        },
        {
          scenarioId: `SCN_${baseId}_REG_01`,
          title: `Verify that submitting ${module} does not alter preexisting user session state`,
          type: 'Regression',
          priority: 'Medium',
          risk: 'Medium',
        },
      ];
    }

    const savedScenarios = [];
    if (save && Array.isArray(scenarios)) {
      for (const scn of scenarios) {
        const created = await prisma.testScenario.create({
          data: {
            scenarioId: scn.scenarioId || `SCN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            title: scn.title,
            module: module || 'General',
            type: scn.type || 'Functional',
            priority: scn.priority || 'Medium',
            risk: scn.risk || 'Low',
            projectId,
          },
        });
        savedScenarios.push(created);
      }

      await prisma.activityLog.create({
        data: {
          action: 'SCENARIOS_GENERATED',
          target: `${savedScenarios.length} Scenarios (${module})`,
          details: `Generated test scenarios for module ${module}.`,
          projectId,
        },
      });
    }

    return {
      count: save ? savedScenarios.length : scenarios.length,
      scenarios: save ? savedScenarios : scenarios,
      provider: aiGateway.getActiveProvider().name,
    };
  }

  async generateTestCases(input: GenerateTestCasesInput) {
    const { projectId, module, requirementText, acceptanceCriteria, scenarios = [], save = true } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'TypeScript',
      testFramework: project.testFramework || 'Playwright',
      qaStandards: project.qaStandards || 'Page Object Model',
    };

    const prompt = `Generate detailed, production-grade QA Test Cases with explicit steps, test data, and expected results.
Module: ${module}
Requirement / Story: ${requirementText}
Acceptance Criteria: ${acceptanceCriteria || 'None provided'}
Context Scenarios: ${scenarios.length > 0 ? scenarios.join('\n') : 'All standard testing types'}

Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "testCaseId": "TC_001",
    "title": "Clear concise test title",
    "module": "${module}",
    "preconditions": "Preconditions required before starting test",
    "testData": "Explicit test data parameters",
    "steps": "1. Step one\\n2. Step two\\n3. Step three",
    "expectedResult": "Clear verifiable expected result",
    "priority": "High" | "Medium" | "Low",
    "severity": "Critical" | "Major" | "Minor",
    "type": "Functional" | "Negative" | "Boundary" | "Security" | "Usability" | "Regression"
  }
]`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let testCases: any[] = [];
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      testCases = JSON.parse(cleaned);
      if (!Array.isArray(testCases)) {
        testCases = (testCases as any).testCases || [];
      }
    } catch {
      const prefix = module.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'TC';
      testCases = [
        {
          testCaseId: `TC_${prefix}_001`,
          title: `Verify Happy Path execution for ${module}`,
          module: module,
          preconditions: 'User is authenticated and navigates to the target page.',
          testData: 'Valid payload with all mandatory fields populated.',
          steps: '1. Navigate to target URL.\\n2. Populate required input fields with valid data.\\n3. Click Submit button.\\n4. Verify response confirmation.',
          expectedResult: 'System accepts inputs, returns success status 200/201, and updates UI.',
          priority: 'High',
          severity: 'Critical',
          type: 'Functional',
        },
        {
          testCaseId: `TC_${prefix}_002`,
          title: `Verify Validation on Missing Mandatory Inputs in ${module}`,
          module: module,
          preconditions: 'Target form is loaded with empty inputs.',
          testData: 'Empty strings for required fields.',
          steps: '1. Leave required fields blank.\\n2. Click Submit button.\\n3. Inspect client-side and server-side responses.',
          expectedResult: 'Submission is blocked; inline validation messages highlight required fields.',
          priority: 'High',
          severity: 'Major',
          type: 'Negative',
        },
        {
          testCaseId: `TC_${prefix}_003`,
          title: `Verify Boundary Character Limits on ${module} Inputs`,
          module: module,
          preconditions: 'Input fields are active.',
          testData: 'String of maximum boundary length + 1 character.',
          steps: '1. Enter boundary string exceeding max limit.\\n2. Attempt to submit.',
          expectedResult: 'Input is trimmed or error alert states character length limitation.',
          priority: 'Medium',
          severity: 'Minor',
          type: 'Boundary',
        },
        {
          testCaseId: `TC_${prefix}_004`,
          title: `Verify Injection Sanitization on ${module}`,
          module: module,
          preconditions: 'User is on submission page.',
          testData: '<script>alert("xss")</script> and `\' OR \'1\'=\'1`',
          steps: '1. Input HTML/SQL payload into text fields.\\n2. Submit the form.',
          expectedResult: 'Payload is sanitized and encoded safely without script execution.',
          priority: 'High',
          severity: 'Critical',
          type: 'Security',
        },
      ];
    }

    const savedCases = [];
    if (save && Array.isArray(testCases)) {
      for (const tc of testCases) {
        const created = await prisma.testCase.create({
          data: {
            testCaseId: tc.testCaseId || `TC_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            title: tc.title,
            module: tc.module || module || 'General',
            preconditions: tc.preconditions || 'None',
            testData: tc.testData || 'None',
            steps: typeof tc.steps === 'string' ? tc.steps : JSON.stringify(tc.steps),
            expectedResult: tc.expectedResult || 'Expected behavior verified.',
            priority: tc.priority || 'Medium',
            severity: tc.severity || 'Medium',
            type: tc.type || 'Functional',
            projectId,
          },
        });
        savedCases.push(created);
      }

      await prisma.activityLog.create({
        data: {
          action: 'TEST_CASES_GENERATED',
          target: `${savedCases.length} Test Cases (${module})`,
          details: `Generated complete test cases for module ${module}.`,
          projectId,
        },
      });
    }

    return {
      count: save ? savedCases.length : testCases.length,
      testCases: save ? savedCases : testCases,
      provider: aiGateway.getActiveProvider().name,
    };
  }

  async convertScenarioToTestCase(scenarioId: string) {
    const scenario = await prisma.testScenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found.`);

    const project = await prisma.project.findUnique({
      where: { id: scenario.projectId },
    });

    const prompt = `Expand this single QA Test Scenario into a comprehensive Test Case with preconditions, test data, step-by-step actions, and expected results.
Scenario Title: ${scenario.title}
Module: ${scenario.module}
Type: ${scenario.type}
Priority: ${scenario.priority}

Return ONLY a valid JSON object matching:
{
  "testCaseId": "TC_${scenario.scenarioId.replace(/[^a-zA-Z0-9]/g, '_')}",
  "title": "${scenario.title}",
  "module": "${scenario.module}",
  "preconditions": "Detailed preconditions",
  "testData": "Specific test data values",
  "steps": "1. First step\\n2. Second step\\n3. Third step",
  "expectedResult": "Verifiable expected result",
  "priority": "${scenario.priority}",
  "severity": "${scenario.risk === 'High' ? 'Critical' : scenario.risk === 'Medium' ? 'Major' : 'Minor'}",
  "type": "${scenario.type}"
}`;

    const completion = await aiGateway.generate(prompt);
    let tcData: any;
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      tcData = JSON.parse(cleaned);
    } catch {
      tcData = {
        testCaseId: `TC_${scenario.scenarioId}`,
        title: scenario.title,
        module: scenario.module,
        preconditions: 'System is online and user is on the relevant module view.',
        testData: 'Standard valid / boundary dataset depending on test type.',
        steps: `1. Open module ${scenario.module}.\\n2. Execute action specified in scenario: "${scenario.title}".\\n3. Observe system response.`,
        expectedResult: `System behavior aligns with test expectations for ${scenario.title}.`,
        priority: scenario.priority,
        severity: scenario.risk === 'High' ? 'Critical' : 'Major',
        type: scenario.type,
      };
    }

    const testCase = await prisma.testCase.create({
      data: {
        testCaseId: tcData.testCaseId || `TC_${Date.now()}`,
        title: tcData.title || scenario.title,
        module: tcData.module || scenario.module,
        preconditions: tcData.preconditions || 'None',
        testData: tcData.testData || 'None',
        steps: typeof tcData.steps === 'string' ? tcData.steps : JSON.stringify(tcData.steps),
        expectedResult: tcData.expectedResult || 'Expected result verified.',
        priority: tcData.priority || scenario.priority,
        severity: tcData.severity || 'Medium',
        type: tcData.type || scenario.type,
        projectId: scenario.projectId,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'TEST_CASE_CREATED',
        target: testCase.title,
        details: `Created from Scenario [${scenario.scenarioId}].`,
        projectId: scenario.projectId,
      },
    });

    return testCase;
  }
}

export const testDesignService = new TestDesignService();
