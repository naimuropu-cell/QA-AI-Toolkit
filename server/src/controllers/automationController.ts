import { Request, Response } from 'express';
import { automationService } from '../services/automationService';

export const generateAutomationSuite = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      framework,
      pageName,
      targetUrl,
      featureDescription,
      locatorHints,
      codingStandards,
      save,
    } = req.body;

    if (!projectId || !pageName || !featureDescription) {
      res.status(400).json({ error: 'projectId, pageName, and featureDescription are required.' });
      return;
    }

    const result = await automationService.generateSuite({
      projectId,
      framework: framework || 'Playwright-TS',
      pageName,
      targetUrl,
      featureDescription,
      locatorHints,
      codingStandards,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Automation generation failed.' });
  }
};

export const getAutomationSuitesByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const suites = await automationService.getSuitesByProject(projectId);
    res.json({ suites });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch automation suites.' });
  }
};

export const getAutomationSuiteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const suite = await automationService.getSuiteById(id);
    res.json({ suite });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch automation suite.' });
  }
};

export const deleteAutomationSuite = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await automationService.deleteSuite(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete automation suite.' });
  }
};
