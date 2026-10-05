import { Request, Response } from 'express';
import { codebaseScannerService } from '../services/codebaseScannerService';

export const scanDirectoryPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, dirPath } = req.body;
    if (!projectId || !dirPath) {
      res.status(400).json({ error: 'projectId and dirPath are required.' });
      return;
    }

    const result = await codebaseScannerService.scanDirectory(projectId, dirPath);
    res.json({ scan: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to scan repository directory.' });
  }
};

export const scanManifest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, repositoryName, manifestContent, samplePageObjects } = req.body;
    if (!projectId || !manifestContent) {
      res.status(400).json({ error: 'projectId and manifestContent are required.' });
      return;
    }

    const result = await codebaseScannerService.scanManifest(
      projectId,
      repositoryName,
      manifestContent,
      samplePageObjects
    );
    res.json({ scan: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze repository manifest.' });
  }
};

export const generateRepositoryNative = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, scenario, selectedPageObjects, codingStandards } = req.body;
    if (!projectId || !scenario) {
      res.status(400).json({ error: 'projectId and scenario are required.' });
      return;
    }

    const result = await codebaseScannerService.generateRepositoryNative({
      projectId,
      scenario,
      selectedPageObjects,
      codingStandards,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate repository-native automation.' });
  }
};

export const getScansByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const scans = await codebaseScannerService.getScansByProject(projectId);
    res.json({ scans });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch codebase scans.' });
  }
};

export const getScanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const scan = await codebaseScannerService.getScanById(id);
    res.json({ scan });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scan details.' });
  }
};

export const deleteScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await codebaseScannerService.deleteScan(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete scan.' });
  }
};
