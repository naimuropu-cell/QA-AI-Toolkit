import { Request, Response } from 'express';
import prisma from '../config/db';
import { bugService } from '../services/bugService';

export const analyzeBug = async (req: Request, res: Response): Promise<void> => {
  try {
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
      environment,
      save,
    } = req.body;

    if (!projectId || !title || !description || !expectedResult || !actualResult) {
      res.status(400).json({ error: 'projectId, title, description, expectedResult, and actualResult are required.' });
      return;
    }

    const result = await bugService.analyzeBug({
      projectId,
      title,
      module: module || 'General',
      description,
      stepsToReproduce,
      errorMessage,
      logs,
      expectedResult,
      actualResult,
      environment,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Bug analysis failed.' });
  }
};

export const getBugsByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const bugs = await prisma.bugReport.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ bugs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch bugs.' });
  }
};

export const getBugById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const bug = await prisma.bugReport.findUnique({ where: { id } });
    if (!bug) {
      res.status(404).json({ error: 'Bug report not found.' });
      return;
    }
    res.json({ bug });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch bug.' });
  }
};

export const convertBugToTestCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const testCase = await bugService.convertBugToTestCase(id);
    res.status(201).json({ message: 'Converted Bug to Regression Test Case.', testCase });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to convert bug to test case.' });
  }
};

export const deleteBug = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.bugReport.delete({ where: { id } });
    res.json({ message: 'Bug report deleted successfully.', deletedId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete bug report.' });
  }
};
