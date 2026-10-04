import prisma from '../config/db';
import { aiGateway } from './ai/AIGateway';
import { AIContextPayload } from './ai/AIProvider';

export interface AnalyzeBugInput {
  projectId: string;
  title: string;
  module: string;
  description: string;
  stepsToReproduce?: string;
  errorMessage?: string;
  logs?: string;
  expectedResult: string;
  actualResult: string;
  environment?: string;
  save?: boolean;
}

export class BugService {
  async analyzeBug(input: AnalyzeBugInput) {
    const {
      projectId,
      title,
      module,
      description,
      stepsToReproduce,
      errorMessage,
      logs,
      expectedResult,
      actualResult,
      environment = 'QA / Staging',
      save = true,
    } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'Web Application',
      testFramework: project.testFramework || 'Playwright',
    };

    const prompt = `Analyze Bug and Generate Professional Defect Report.
Title: ${title}
Module: ${module}
Description: ${description}
Steps: ${stepsToReproduce || 'None'}
Error Logs: ${logs || errorMessage || 'None'}
Expected: ${expectedResult}
Actual: ${actualResult}
Environment: ${environment}

Return ONLY a valid JSON object matching:
{
  "title": "[DEFECT] Title",
  "module": "${module}",
  "environment": "${environment}",
  "preconditions": "Preconditions required",
  "stepsToReproduce": "Numbered reproduction steps",
  "expectedResult": "Clear expected result",
  "actualResult": "Observed actual result",
  "severity": "Critical" | "Major" | "Minor" | "Trivial",
  "priority": "High" | "Medium" | "Low",
  "bugType": "Functional" | "Security" | "UI/UX" | "Performance" | "Data Integrity",
  "rootCauseHypothesis": "Likely root cause explanation",
  "evidence": "Observed log or stack trace snippet",
  "suggestedFix": "Developer guidance for remediation",
  "regressionRisk": "Risk level and affected modules"
}`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let report: any;
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      report = JSON.parse(cleaned);
    } catch {
      report = {
        title: `[DEFECT] ${title}`,
        module,
        environment,
        preconditions: 'User authenticated in QA environment.',
        stepsToReproduce: stepsToReproduce || `1. Execute ${title}\n2. Observe defect`,
        expectedResult,
        actualResult,
        severity: 'Major',
        priority: 'High',
        bugType: 'Functional',
        rootCauseHypothesis: 'Unexpected state transition or unhandled exception during processing.',
        evidence: logs || errorMessage || 'Observed failure response',
        suggestedFix: 'Implement error boundary check and validate payload state.',
        regressionRisk: 'Medium',
      };
    }

    let savedBug = null;
    if (save) {
      savedBug = await prisma.bugReport.create({
        data: {
          title: report.title || title,
          module: report.module || module,
          environment: report.environment || environment,
          preconditions: report.preconditions || 'None',
          stepsToReproduce: report.stepsToReproduce || '1. Reproduce issue',
          expectedResult: report.expectedResult || expectedResult,
          actualResult: report.actualResult || actualResult,
          severity: report.severity || 'Major',
          priority: report.priority || 'High',
          bugType: report.bugType || 'Functional',
          rootCause: report.rootCauseHypothesis || 'Under investigation',
          evidence: report.evidence || 'Console logs',
          suggestedFix: report.suggestedFix || 'Apply fix in controller',
          regressionRisk: report.regressionRisk || 'Medium',
          projectId,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'BUG_ANALYZED',
          target: savedBug.title,
          details: `Identified ${savedBug.severity} severity defect in module ${savedBug.module}.`,
          projectId,
        },
      });
    }

    return {
      bug: savedBug || report,
      analysis: report,
      provider: aiGateway.getActiveProvider().name,
    };
  }

  async convertBugToTestCase(bugId: string) {
    const bug = await prisma.bugReport.findUnique({
      where: { id: bugId },
    });
    if (!bug) throw new Error(`Bug report ${bugId} not found.`);

    const testCase = await prisma.testCase.create({
      data: {
        testCaseId: `TC_REG_${Date.now()}`,
        title: `[Regression] Verify Fix for: ${bug.title}`,
        module: bug.module,
        preconditions: bug.preconditions || 'Target environment is operational.',
        testData: 'Data used during defect reproduction.',
        steps: bug.stepsToReproduce,
        expectedResult: `Defect is resolved: ${bug.expectedResult}`,
        priority: bug.priority,
        severity: bug.severity,
        type: 'Regression',
        projectId: bug.projectId,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'TEST_CASE_CREATED',
        target: testCase.title,
        details: `Created regression test case from Bug "${bug.title}".`,
        projectId: bug.projectId,
      },
    });

    return testCase;
  }
}

export const bugService = new BugService();
