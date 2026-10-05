import { Request, Response } from 'express';
import { maintenanceService } from '../services/maintenanceService';

export const auditScript = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, suiteName, framework, scriptContent, save } = req.body;

    if (!projectId || !suiteName || !scriptContent) {
      res.status(400).json({ error: 'projectId, suiteName, and scriptContent are required.' });
      return;
    }

    const result = await maintenanceService.auditScript({
      projectId,
      suiteName,
      framework,
      scriptContent,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Script audit failed.' });
  }
};

export const getAuditsByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.params.projectId || req.query.projectId) as string;
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required.' });
      return;
    }

    const audits = await maintenanceService.getAuditsByProject(projectId);
    res.json({ audits });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch maintenance audits.' });
  }
};

export const getAuditById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const audit = await maintenanceService.getAuditById(id);
    res.json({ audit });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit details.' });
  }
};

export const deleteAudit = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await maintenanceService.deleteAudit(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete audit.' });
  }
};

export const healLocator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, originalLocator, framework, domSnippet, targetDescription, save } = req.body;

    if (!projectId || !originalLocator) {
      res.status(400).json({ error: 'projectId and originalLocator are required.' });
      return;
    }

    const result = await maintenanceService.healLocator({
      projectId,
      originalLocator,
      framework,
      domSnippet,
      targetDescription,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Locator healing failed.' });
  }
};

export const getHealedLocatorsByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.params.projectId || req.query.projectId) as string;
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required.' });
      return;
    }

    const healedLocators = await maintenanceService.getHealedLocatorsByProject(projectId);
    res.json({ healedLocators });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch healed locators.' });
  }
};
