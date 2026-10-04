import { Request, Response } from 'express';
import prisma from '../config/db';
import { testDesignService } from '../services/testDesignService';

// SCENARIOS
export const getScenariosByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const scenarios = await prisma.testScenario.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ scenarios });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch test scenarios.' });
  }
};

export const createScenario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, scenarioId, title, module, type, priority, risk } = req.body;
    if (!projectId || !title) {
      res.status(400).json({ error: 'projectId and title are required.' });
      return;
    }

    const scenario = await prisma.testScenario.create({
      data: {
        projectId,
        scenarioId: scenarioId || `SCN_${Date.now()}`,
        title,
        module: module || 'General',
        type: type || 'Functional',
        priority: priority || 'Medium',
        risk: risk || 'Low',
      },
    });

    res.status(201).json({ scenario });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create scenario.' });
  }
};

export const deleteScenario = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.testScenario.delete({ where: { id } });
    res.json({ message: 'Scenario deleted successfully', deletedId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete scenario.' });
  }
};

export const generateScenarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, module, requirementText, acceptanceCriteria, testTypes, save } = req.body;
    if (!projectId || !module || !requirementText) {
      res.status(400).json({ error: 'projectId, module, and requirementText are required.' });
      return;
    }

    const result = await testDesignService.generateScenarios({
      projectId,
      module,
      requirementText,
      acceptanceCriteria,
      testTypes,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate scenarios.' });
  }
};

// TEST CASES
export const getTestCasesByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const testCases = await prisma.testCase.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ testCases });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch test cases.' });
  }
};

export const getTestCaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const testCase = await prisma.testCase.findUnique({
      where: { id },
    });
    if (!testCase) {
      res.status(404).json({ error: 'Test case not found.' });
      return;
    }
    res.json({ testCase });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch test case.' });
  }
};

export const createTestCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      testCaseId,
      title,
      module,
      preconditions,
      testData,
      steps,
      expectedResult,
      priority,
      severity,
      type,
    } = req.body;

    if (!projectId || !title || !expectedResult) {
      res.status(400).json({ error: 'projectId, title, and expectedResult are required.' });
      return;
    }

    const testCase = await prisma.testCase.create({
      data: {
        projectId,
        testCaseId: testCaseId || `TC_${Date.now()}`,
        title,
        module: module || 'General',
        preconditions: preconditions || 'None',
        testData: testData || 'None',
        steps: steps || '1. Execute test action',
        expectedResult,
        priority: priority || 'Medium',
        severity: severity || 'Medium',
        type: type || 'Functional',
      },
    });

    res.status(201).json({ testCase });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create test case.' });
  }
};

export const updateTestCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      title,
      module,
      preconditions,
      testData,
      steps,
      expectedResult,
      priority,
      severity,
      type,
    } = req.body;

    const testCase = await prisma.testCase.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(module && { module }),
        ...(preconditions !== undefined && { preconditions }),
        ...(testData !== undefined && { testData }),
        ...(steps !== undefined && { steps }),
        ...(expectedResult !== undefined && { expectedResult }),
        ...(priority && { priority }),
        ...(severity && { severity }),
        ...(type && { type }),
      },
    });

    res.json({ message: 'Test case updated successfully', testCase });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update test case.' });
  }
};

export const deleteTestCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.testCase.delete({ where: { id } });
    res.json({ message: 'Test case deleted successfully', deletedId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete test case.' });
  }
};

export const generateTestCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, module, requirementText, acceptanceCriteria, scenarios, save } = req.body;
    if (!projectId || !module || !requirementText) {
      res.status(400).json({ error: 'projectId, module, and requirementText are required.' });
      return;
    }

    const result = await testDesignService.generateTestCases({
      projectId,
      module,
      requirementText,
      acceptanceCriteria,
      scenarios,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate test cases.' });
  }
};

export const convertScenarioToTestCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scenarioId } = req.body;
    if (!scenarioId) {
      res.status(400).json({ error: 'scenarioId is required.' });
      return;
    }

    const testCase = await testDesignService.convertScenarioToTestCase(scenarioId);
    res.status(201).json({ message: 'Scenario converted to full test case.', testCase });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to convert scenario.' });
  }
};
