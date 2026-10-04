import prisma from '../config/db';
import { aiGateway } from './ai/AIGateway';
import { AIContextPayload } from './ai/AIProvider';

export interface AnalyzeRequirementInput {
  projectId: string;
  title: string;
  userStory: string;
  acceptanceCriteria?: string;
  additionalContext?: string;
  save?: boolean;
}

export class RequirementService {
  async analyzeRequirement(input: AnalyzeRequirementInput) {
    const { projectId, title, userStory, acceptanceCriteria, additionalContext, save = true } = input;

    // Retrieve active Project Context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        knowledgeItems: { take: 5 },
      },
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'React / TypeScript',
      testFramework: project.testFramework || 'Playwright',
      qaStandards: project.qaStandards || 'Page Object Model',
      knowledgeRules: project.knowledgeItems.map((k) => `${k.title}: ${k.content}`),
    };

    const prompt = `Analyze this software requirement for professional QA test planning and edge-case discovery.
Title: ${title}
User Story: ${userStory}
Acceptance Criteria: ${acceptanceCriteria || 'None provided'}
Additional Context: ${additionalContext || 'None'}

Return ONLY a valid JSON object matching the following structure:
{
  "summary": "High-level overview",
  "frameworkTarget": "${contextPayload.testFramework}",
  "functionalRequirements": ["string"],
  "nonFunctionalRequirements": ["string"],
  "missingRequirements": ["string"],
  "ambiguousStatements": ["string"],
  "acceptanceCriteriaGaps": ["string"],
  "positiveScenarios": [
    { "id": "SCN_POS_001", "title": "string", "type": "Positive", "priority": "High", "risk": "Low" }
  ],
  "negativeScenarios": [
    { "id": "SCN_NEG_001", "title": "string", "type": "Negative", "priority": "High", "risk": "Medium" }
  ],
  "edgeCases": [
    { "id": "SCN_EDGE_001", "title": "string", "type": "Edge Case", "priority": "High", "risk": "High" }
  ],
  "boundaryConditions": [
    { "id": "SCN_BND_001", "title": "string", "type": "Boundary Value", "priority": "Medium", "risk": "Low" }
  ],
  "qaClarificationQuestions": ["string"],
  "potentialRisks": ["string"],
  "suggestedTestCoverage": ["string"]
}`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let parsedResult: any;
    try {
      // Find JSON block if wrapped in markdown
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    } catch {
      // Fallback object if raw text returned
      parsedResult = {
        summary: `Analysis for ${title}`,
        frameworkTarget: contextPayload.testFramework,
        rawAnalysis: completion,
        functionalRequirements: ['Analyze primary user story execution.'],
        nonFunctionalRequirements: ['Verify response latency, accessibility, and input sanitization.'],
        missingRequirements: ['Concurrency and session boundary expectations.'],
        ambiguousStatements: ['Error copy and localized message standards.'],
        acceptanceCriteriaGaps: ['Negative test boundary constraints.'],
        positiveScenarios: [{ id: 'SCN_POS_001', title: `Execute ${title}`, type: 'Positive', priority: 'High', risk: 'Low' }],
        negativeScenarios: [{ id: 'SCN_NEG_001', title: 'Invalid parameter rejection', type: 'Negative', priority: 'High', risk: 'Medium' }],
        edgeCases: [{ id: 'SCN_EDGE_001', title: 'Network interruption during submission', type: 'Edge Case', priority: 'High', risk: 'High' }],
        boundaryConditions: [{ id: 'SCN_BND_001', title: 'Payload boundary limits', type: 'Boundary Value', priority: 'Medium', risk: 'Low' }],
        qaClarificationQuestions: ['What are the expected rate limits on this endpoint?'],
        potentialRisks: ['Data race conditions during concurrent execution.'],
        suggestedTestCoverage: ['Unit logic', 'API schema validation', 'End-to-end automation'],
      };
    }

    let savedRecord = null;
    if (save) {
      savedRecord = await prisma.requirementAnalysis.create({
        data: {
          title,
          userStory,
          acceptanceCriteria: acceptanceCriteria || '',
          analysisJson: JSON.stringify(parsedResult),
          projectId,
        },
      });

      // Log QA activity
      await prisma.activityLog.create({
        data: {
          action: 'REQUIREMENT_ANALYZED',
          target: title,
          details: `Analyzed requirement and generated ${
            (parsedResult.positiveScenarios?.length || 0) +
            (parsedResult.negativeScenarios?.length || 0) +
            (parsedResult.edgeCases?.length || 0) +
            (parsedResult.boundaryConditions?.length || 0)
          } test scenarios.`,
          projectId,
        },
      });
    }

    return {
      record: savedRecord,
      analysis: parsedResult,
      provider: aiGateway.getActiveProvider().name,
    };
  }

  async convertToScenarios(requirementId: string) {
    const requirement = await prisma.requirementAnalysis.findUnique({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new Error(`Requirement with ID ${requirementId} not found.`);
    }

    const analysis = JSON.parse(requirement.analysisJson);
    const allScenarios = [
      ...(analysis.positiveScenarios || []),
      ...(analysis.negativeScenarios || []),
      ...(analysis.edgeCases || []),
      ...(analysis.boundaryConditions || []),
    ];

    const createdScenarios = [];
    for (const scn of allScenarios) {
      const created = await prisma.testScenario.create({
        data: {
          scenarioId: scn.id || `SCN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: scn.title,
          module: requirement.title,
          type: scn.type || 'Functional',
          priority: scn.priority || 'Medium',
          risk: scn.risk || 'Low',
          projectId: requirement.projectId,
        },
      });
      createdScenarios.push(created);
    }

    await prisma.activityLog.create({
      data: {
        action: 'SCENARIOS_GENERATED',
        target: `${createdScenarios.length} Scenarios`,
        details: `Converted from requirement "${requirement.title}"`,
        projectId: requirement.projectId,
      },
    });

    return {
      convertedCount: createdScenarios.length,
      scenarios: createdScenarios,
    };
  }
}

export const requirementService = new RequirementService();
