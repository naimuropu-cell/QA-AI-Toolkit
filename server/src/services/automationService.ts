import prisma from '../config/db';
import { aiGateway } from './ai/AIGateway';
import { AIContextPayload } from './ai/AIProvider';

export interface GenerateAutomationInput {
  projectId: string;
  framework?: string; // Playwright-TS, Playwright-JS, Selenium-Python, Selenium-Java
  pageName: string;
  targetUrl?: string;
  featureDescription: string;
  locatorHints?: string;
  codingStandards?: string;
  save?: boolean;
}

export class AutomationService {
  async generateSuite(input: GenerateAutomationInput) {
    const {
      projectId,
      framework = 'Playwright-TS',
      pageName,
      targetUrl,
      featureDescription,
      locatorHints,
      codingStandards,
      save = true,
    } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const effectiveUrl = targetUrl || project.targetUrl || 'https://app.example.com';
    const effectiveStandards = codingStandards || project.qaStandards || 'Page Object Model, no arbitrary sleeps, strict typing';

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'Web Application',
      testFramework: framework,
      targetUrl: effectiveUrl,
      qaStandards: effectiveStandards,
    };

    const prompt = `Generate Repository-Native Automation Suite adhering strictly to Page Object Model architecture.
Framework: ${framework}
Page/Component Name: ${pageName}
Target URL: ${effectiveUrl}
Feature Description: ${featureDescription}
Locator Hints: ${locatorHints || 'prefer getByRole and getByTestId locators'}
Coding Standards: ${effectiveStandards}

Strict Requirement: Return ONLY a valid JSON object matching this schema:
{
  "name": "${pageName} ${framework} Automation Suite",
  "framework": "${framework}",
  "targetUrl": "${effectiveUrl}",
  "pageObjectName": "${pageName}Page",
  "pageObjectCode": "Page Object implementation code",
  "testFileCode": "Test specification code utilizing the Page Object",
  "fixtureCode": "Fixture / conftest / test configuration code",
  "testDataJson": "Isolated test data JSON string",
  "folderStructure": "Repository directory tree ascii"
}`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let suiteData: any;
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      suiteData = JSON.parse(cleaned);
    } catch {
      suiteData = {
        name: `${pageName} Automation Suite`,
        framework,
        targetUrl: effectiveUrl,
        pageObjectName: `${pageName}Page`,
        pageObjectCode: `// Generated Page Object for ${pageName}\nexport class ${pageName}Page {}`,
        testFileCode: `// Generated Test for ${pageName}`,
        fixtureCode: `// Generated Fixture for ${pageName}`,
        testDataJson: `{ "test": "data" }`,
        folderStructure: `tests/${pageName}.spec.ts`,
      };
    }

    let savedRecord = null;
    if (save) {
      savedRecord = await prisma.automationSuite.create({
        data: {
          name: suiteData.name || `${pageName} ${framework} Suite`,
          framework: suiteData.framework || framework,
          targetUrl: suiteData.targetUrl || effectiveUrl,
          pageObjectName: suiteData.pageObjectName || `${pageName}Page`,
          pageObjectCode: suiteData.pageObjectCode || '',
          testFileCode: suiteData.testFileCode || '',
          fixtureCode: suiteData.fixtureCode || '',
          testDataJson: typeof suiteData.testDataJson === 'string' ? suiteData.testDataJson : JSON.stringify(suiteData.testDataJson, null, 2),
          folderStructure: suiteData.folderStructure || '',
          projectId,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'AUTOMATION_GENERATED',
          target: savedRecord.name,
          details: `Generated repository-native automation suite using ${framework} for ${pageName}.`,
          projectId,
        },
      });
    }

    return {
      suite: savedRecord || suiteData,
      rawOutput: suiteData,
      provider: aiGateway.getActiveProvider().name,
    };
  }

  async getSuitesByProject(projectId: string) {
    return prisma.automationSuite.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSuiteById(id: string) {
    const suite = await prisma.automationSuite.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!suite) throw new Error(`Automation suite ${id} not found.`);
    return suite;
  }

  async deleteSuite(id: string) {
    const suite = await prisma.automationSuite.findUnique({ where: { id } });
    if (!suite) throw new Error(`Automation suite ${id} not found.`);

    await prisma.automationSuite.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'AUTOMATION_DELETED',
        target: suite.name,
        details: `Deleted automation suite "${suite.name}".`,
        projectId: suite.projectId,
      },
    });

    return { deletedId: id };
  }
}

export const automationService = new AutomationService();
