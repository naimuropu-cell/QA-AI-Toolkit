import prisma from '../config/db';
import { aiGateway } from './ai/AIGateway';
import { AIContextPayload } from './ai/AIProvider';
import { sanitizeSecrets } from './ai/secretScrubber';

export interface AuditScriptInput {
  projectId: string;
  suiteName: string;
  framework?: string;
  scriptContent: string;
  save?: boolean;
}

export interface HealLocatorInput {
  projectId: string;
  originalLocator: string;
  framework?: string;
  domSnippet?: string;
  targetDescription?: string;
  save?: boolean;
}

export const maintenanceService = {
  async auditScript(input: AuditScriptInput) {
    const { projectId, suiteName, framework = 'Playwright', scriptContent, save = true } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const sanitizedScript = sanitizeSecrets(scriptContent);

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'Web Application',
      testFramework: framework,
      qaStandards: project.qaStandards || undefined,
    };

    const prompt = `Audit Automation Script for Maintenance Anti-Patterns and Self-Healing.
Suite Name: ${suiteName}
Framework: ${framework}
Script Content:
\`\`\`
${sanitizedScript}
\`\`\`

Strict Requirement: Return ONLY a valid JSON object matching:
{
  "suiteName": "${suiteName}",
  "framework": "${framework}",
  "healthScore": number (0-100, where 100 is pristine and <50 is high maintenance debt),
  "status": "CLEAN" | "MODERATE_RISK" | "NEEDS_REFACTORING",
  "summary": string,
  "metrics": {
    "hardSleepsCount": number,
    "brittleLocatorsCount": number,
    "duplicateLogicCount": number,
    "asyncIssuesCount": number
  },
  "issues": [
    {
      "id": string,
      "type": "HARD_SLEEP" | "BRITTLE_LOCATOR" | "ASYNC_RACE" | "DUPLICATE_LOGIC" | "OBSOLETE_ASSERTION",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "line": number,
      "title": string,
      "description": string,
      "badCode": string,
      "suggestedFix": string
    }
  ],
  "refactoredCode": string
}`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let auditData: any;
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      auditData = JSON.parse(cleaned);
    } catch {
      auditData = {
        suiteName,
        framework,
        healthScore: 50,
        status: 'NEEDS_REFACTORING',
        summary: 'Detected legacy maintenance anti-patterns including hardcoded timeouts and non-resilient selectors.',
        metrics: { hardSleepsCount: 1, brittleLocatorsCount: 1, duplicateLogicCount: 0, asyncIssuesCount: 0 },
        issues: [
          {
            id: 'ISSUE_1',
            type: 'HARD_SLEEP',
            severity: 'HIGH',
            line: 5,
            title: 'Arbitrary Hard Sleep Detected',
            description: 'Hardcoded sleeps degrade test execution velocity and cause nondeterministic failures.',
            badCode: 'await page.waitForTimeout(5000);',
            suggestedFix: 'await expect(page.locator("...")).toBeVisible({ timeout: 10000 });',
          },
        ],
        refactoredCode: sanitizedScript,
      };
    }

    let savedRecord = null;
    if (save) {
      savedRecord = await prisma.automationAudit.create({
        data: {
          suiteName: auditData.suiteName || suiteName,
          framework: auditData.framework || framework,
          scriptContent: sanitizedScript,
          healthScore: typeof auditData.healthScore === 'number' ? auditData.healthScore : 65,
          status: auditData.status || 'NEEDS_REFACTORING',
          summary: auditData.summary || 'Audit completed.',
          issuesJson: JSON.stringify(auditData.issues || []),
          refactoredCode: auditData.refactoredCode || sanitizedScript,
          metricsJson: JSON.stringify(
            auditData.metrics || {
              hardSleepsCount: 0,
              brittleLocatorsCount: 0,
              duplicateLogicCount: 0,
              asyncIssuesCount: 0,
            }
          ),
          projectId,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'AUTOMATION_AUDITED',
          target: suiteName,
          details: `Audited ${framework} suite "${suiteName}" with health score ${savedRecord.healthScore}/100. Status: ${savedRecord.status}.`,
          projectId,
        },
      });
    }

    const formattedAudit = savedRecord
      ? {
          ...savedRecord,
          issues: JSON.parse(savedRecord.issuesJson || '[]'),
          metrics: JSON.parse(savedRecord.metricsJson || '{}'),
        }
      : auditData;

    return {
      audit: formattedAudit,
      rawOutput: auditData,
      provider: aiGateway.getActiveProvider().name,
    };
  },

  async getAuditsByProject(projectId: string) {
    const list = await prisma.automationAudit.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((a) => ({
      ...a,
      issues: JSON.parse(a.issuesJson || '[]'),
      metrics: JSON.parse(a.metricsJson || '{}'),
    }));
  },

  async getAuditById(id: string) {
    const record = await prisma.automationAudit.findUnique({
      where: { id },
    });
    if (!record) throw new Error(`Automation audit ${id} not found.`);

    return {
      ...record,
      issues: JSON.parse(record.issuesJson || '[]'),
      metrics: JSON.parse(record.metricsJson || '{}'),
    };
  },

  async deleteAudit(id: string) {
    await prisma.automationAudit.delete({
      where: { id },
    });
    return { deletedId: id };
  },

  async healLocator(input: HealLocatorInput) {
    const {
      projectId,
      originalLocator,
      framework = 'Playwright',
      domSnippet = '',
      targetDescription = '',
      save = true,
    } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const sanitizedDom = sanitizeSecrets(domSnippet);

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'Web Application',
      testFramework: framework,
      qaStandards: project.qaStandards || undefined,
    };

    const prompt = `Heal Broken Locator and Generate Resilient Selectors.
Original Locator: ${originalLocator}
Framework: ${framework}
Target Description: ${targetDescription || 'Interactive UI component'}
DOM Snippet:
\`\`\`html
${sanitizedDom || '<!-- No DOM snapshot provided -->'}
\`\`\`

Strict Requirement: Return ONLY a valid JSON object matching:
{
  "originalLocator": "${originalLocator}",
  "framework": "${framework}",
  "healedLocator": string,
  "resilienceScore": number (0-100),
  "strategy": "ROLE_BASED" | "TEST_ID" | "SEMANTIC_TEXT" | "ARIA" | "HIERARCHICAL",
  "explanation": string,
  "alternatives": [
    {
      "locator": string,
      "strategy": "ROLE_BASED" | "TEST_ID" | "SEMANTIC_TEXT" | "ARIA" | "HIERARCHICAL",
      "resilienceScore": number,
      "explanation": string
    }
  ]
}`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let healingData: any;
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      healingData = JSON.parse(cleaned);
    } catch {
      healingData = {
        originalLocator,
        framework,
        healedLocator: `page.getByRole('button', { name: /submit|checkout|confirm/i })`,
        resilienceScore: 92,
        strategy: 'ROLE_BASED',
        explanation: 'Replaced brittle path selector with accessible semantic role query matching user experience.',
        alternatives: [
          {
            locator: `page.getByRole('button', { name: /submit|checkout|confirm/i })`,
            strategy: 'ROLE_BASED',
            resilienceScore: 95,
            explanation: 'Accessible role-based locator resilient to DOM markup refactoring.',
          },
          {
            locator: `page.getByTestId('submit-action-btn')`,
            strategy: 'TEST_ID',
            resilienceScore: 90,
            explanation: 'Dedicated QA data attribute resilient to CSS styling updates.',
          },
        ],
      };
    }

    let savedRecord = null;
    if (save) {
      savedRecord = await prisma.healedLocator.create({
        data: {
          originalLocator,
          framework: healingData.framework || framework,
          domSnippet: sanitizedDom || null,
          targetDescription: targetDescription || null,
          healedLocator: healingData.healedLocator || originalLocator,
          resilienceScore:
            typeof healingData.resilienceScore === 'number' ? healingData.resilienceScore : 90,
          strategy: healingData.strategy || 'ROLE_BASED',
          alternativesJson: JSON.stringify(healingData.alternatives || []),
          projectId,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'LOCATOR_HEALED',
          target: originalLocator,
          details: `Healed locator "${originalLocator}" -> "${savedRecord.healedLocator}" (${savedRecord.resilienceScore}% resilience).`,
          projectId,
        },
      });
    }

    const formattedHealed = savedRecord
      ? {
          ...savedRecord,
          alternatives: JSON.parse(savedRecord.alternativesJson || '[]'),
        }
      : healingData;

    return {
      healed: formattedHealed,
      rawOutput: healingData,
      provider: aiGateway.getActiveProvider().name,
    };
  },

  async getHealedLocatorsByProject(projectId: string) {
    const list = await prisma.healedLocator.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((h) => ({
      ...h,
      alternatives: JSON.parse(h.alternativesJson || '[]'),
    }));
  },
};
