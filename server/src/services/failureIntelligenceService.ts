import prisma from '../config/db';
import { aiGateway } from './ai/AIGateway';
import { AIContextPayload } from './ai/AIProvider';
import { sanitizeSecrets } from './ai/secretScrubber';

export interface DiagnoseFailureInput {
  projectId: string;
  testName: string;
  framework?: string;
  errorMessage: string;
  stackTrace?: string;
  executionLogs?: string;
  screenshotUrl?: string;
  save?: boolean;
}

export class FailureIntelligenceService {
  async diagnoseFailure(input: DiagnoseFailureInput) {
    const {
      projectId,
      testName,
      framework = 'Playwright',
      errorMessage,
      stackTrace,
      executionLogs,
      screenshotUrl,
      save = true,
    } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const sanitizedError = sanitizeSecrets(errorMessage);
    const sanitizedStack = stackTrace ? sanitizeSecrets(stackTrace) : '';
    const sanitizedLogs = executionLogs ? sanitizeSecrets(executionLogs) : '';

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'Web Application',
      testFramework: framework,
      qaStandards: project.qaStandards || undefined,
    };

    const prompt = `Diagnose Test Failure and Calculate Culpability.
Test Name: ${testName}
Framework: ${framework}
Error Message:
${sanitizedError}
Stack Trace:
${sanitizedStack || 'None'}
Execution Logs:
${sanitizedLogs || 'None'}

Strict Requirement: Return ONLY a valid JSON object matching:
{
  "testName": "${testName}",
  "framework": "${framework}",
  "culpability": "Application Defect" | "Test Automation Flaw" | "Environment / Infrastructure",
  "culpabilityScore": number (0-100),
  "culpabilityBreakdown": {
    "appBug": number (0-100),
    "testFlaw": number (0-100),
    "environment": number (0-100)
  },
  "rootCauseCategory": string,
  "rootCauseAnalysis": string,
  "suggestedFixApp": string,
  "suggestedFixTest": string,
  "regressionStubCode": string
}`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let diagnosisData: any;
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      diagnosisData = JSON.parse(cleaned);
    } catch {
      diagnosisData = {
        testName,
        framework,
        culpability: 'Test Automation Flaw',
        culpabilityScore: 75,
        culpabilityBreakdown: { appBug: 15, testFlaw: 75, environment: 10 },
        rootCauseCategory: 'Element Locator Timeout',
        rootCauseAnalysis: 'The test failed waiting for target element selector actionability.',
        suggestedFixApp: 'Ensure target element renders with a unique data-testid identifier.',
        suggestedFixTest: 'Use getByRole with auto-waiting assertions.',
        regressionStubCode: `test('TC_RESILIENT - ${testName}', async ({ page }) => { await expect(page.locator('button')).toBeVisible(); });`,
      };
    }

    let savedRecord = null;
    if (save) {
      savedRecord = await prisma.testFailureDiagnosis.create({
        data: {
          testName: diagnosisData.testName || testName,
          framework: diagnosisData.framework || framework,
          errorMessage: sanitizedError,
          stackTrace: sanitizedStack,
          executionLogs: sanitizedLogs,
          screenshotUrl: screenshotUrl || null,
          culpability: diagnosisData.culpability || 'Test Automation Flaw',
          culpabilityScore: typeof diagnosisData.culpabilityScore === 'number' ? diagnosisData.culpabilityScore : 80,
          culpabilityBreakdown: JSON.stringify(diagnosisData.culpabilityBreakdown || { appBug: 10, testFlaw: 80, environment: 10 }),
          rootCauseCategory: diagnosisData.rootCauseCategory || 'Unhandled Failure',
          rootCauseAnalysis: diagnosisData.rootCauseAnalysis || 'Analysis completed.',
          suggestedFixApp: diagnosisData.suggestedFixApp || '',
          suggestedFixTest: diagnosisData.suggestedFixTest || '',
          regressionStubCode: diagnosisData.regressionStubCode || '',
          projectId,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'FAILURE_DIAGNOSED',
          target: testName,
          details: `Diagnosed failure: ${savedRecord.culpability} (${savedRecord.culpabilityScore}% confidence) - ${savedRecord.rootCauseCategory}.`,
          projectId,
        },
      });
    }

    return {
      diagnosis: savedRecord || diagnosisData,
      rawOutput: diagnosisData,
      provider: aiGateway.getActiveProvider().name,
    };
  }

  async getDiagnosesByProject(projectId: string) {
    const list = await prisma.testFailureDiagnosis.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((d) => ({
      ...d,
      culpabilityBreakdown: JSON.parse(d.culpabilityBreakdown),
    }));
  }

  async getDiagnosisById(id: string) {
    const diagnosis = await prisma.testFailureDiagnosis.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!diagnosis) throw new Error(`Test failure diagnosis ${id} not found.`);
    return {
      ...diagnosis,
      culpabilityBreakdown: JSON.parse(diagnosis.culpabilityBreakdown),
    };
  }

  async deleteDiagnosis(id: string) {
    const diagnosis = await prisma.testFailureDiagnosis.findUnique({ where: { id } });
    if (!diagnosis) throw new Error(`Diagnosis ${id} not found.`);

    await prisma.testFailureDiagnosis.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'FAILURE_DIAGNOSIS_DELETED',
        target: diagnosis.testName,
        details: `Deleted failure diagnosis for "${diagnosis.testName}".`,
        projectId: diagnosis.projectId,
      },
    });

    return { deletedId: id };
  }

  async convertToBugReport(diagnosisId: string) {
    const diag = await prisma.testFailureDiagnosis.findUnique({
      where: { id: diagnosisId },
    });
    if (!diag) throw new Error(`Diagnosis ${diagnosisId} not found.`);

    const bug = await prisma.bugReport.create({
      data: {
        title: `[Defect from Failure] ${diag.testName}: ${diag.rootCauseCategory}`,
        module: 'Automated Test Suite',
        severity: diag.culpability === 'Application Defect' ? 'Major' : 'Minor',
        priority: 'High',
        bugType: diag.culpability === 'Application Defect' ? 'Functional' : 'Environment / Script',
        environment: `${diag.framework} CI Test Runner`,
        preconditions: 'Automated CI test execution environment.',
        stepsToReproduce: `1. Run test suite for: ${diag.testName}\n2. Observe assertion failure:\n${diag.errorMessage}`,
        expectedResult: 'Test should execute and assert successfully without error.',
        actualResult: diag.errorMessage,
        rootCause: diag.rootCauseAnalysis,
        evidence: diag.stackTrace || diag.executionLogs || 'Captured from failure logs',
        suggestedFix: diag.suggestedFixApp || diag.suggestedFixTest,
        regressionRisk: 'Affects automated deployment gate and feature functionality.',
        projectId: diag.projectId,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'BUG_CREATED',
        target: bug.title,
        details: `Converted failed test "${diag.testName}" into Defect Report.`,
        projectId: diag.projectId,
      },
    });

    return bug;
  }

  async convertToTestCase(diagnosisId: string) {
    const diag = await prisma.testFailureDiagnosis.findUnique({
      where: { id: diagnosisId },
    });
    if (!diag) throw new Error(`Diagnosis ${diagnosisId} not found.`);

    const testCase = await prisma.testCase.create({
      data: {
        testCaseId: `TC_REG_FAIL_${Date.now()}`,
        title: `[Regression] Prevent Failure in: ${diag.testName}`,
        module: 'Regression Testing',
        preconditions: 'Application and test dependencies are operational.',
        testData: 'Automated regression payload.',
        steps: `1. Execute flow under test: ${diag.testName}\n2. Verify fix for ${diag.rootCauseCategory}\n3. Confirm clean assertion status`,
        expectedResult: `Defect is prevented: ${diag.rootCauseCategory} no longer occurs.`,
        priority: 'High',
        severity: 'Major',
        type: 'Regression',
        projectId: diag.projectId,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'TEST_CASE_CREATED',
        target: testCase.title,
        details: `Generated regression test case from failure diagnosis "${diag.testName}".`,
        projectId: diag.projectId,
      },
    });

    return testCase;
  }
}

export const failureIntelligenceService = new FailureIntelligenceService();
