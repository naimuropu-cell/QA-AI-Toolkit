import { Request, Response } from 'express';
import { failureIntelligenceService } from '../services/failureIntelligenceService';

export const diagnoseFailure = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      testName,
      framework,
      errorMessage,
      stackTrace,
      executionLogs,
      screenshotUrl,
      save,
    } = req.body;

    if (!projectId || !testName || !errorMessage) {
      res.status(400).json({ error: 'projectId, testName, and errorMessage are required.' });
      return;
    }

    const result = await failureIntelligenceService.diagnoseFailure({
      projectId,
      testName,
      framework,
      errorMessage,
      stackTrace,
      executionLogs,
      screenshotUrl,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failure diagnosis failed.' });
  }
};

export const getDiagnosesByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.params.projectId || req.query.projectId) as string;
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required.' });
      return;
    }
    const diagnoses = await failureIntelligenceService.getDiagnosesByProject(projectId);
    res.json({ diagnoses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch diagnoses.' });
  }
};

export const getDiagnosisById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const diagnosis = await failureIntelligenceService.getDiagnosisById(id);
    res.json({ diagnosis });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch diagnosis details.' });
  }
};

export const deleteDiagnosis = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await failureIntelligenceService.deleteDiagnosis(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete diagnosis.' });
  }
};

export const convertToBug = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const bug = await failureIntelligenceService.convertToBugReport(id);
    res.status(201).json({ message: 'Converted failure diagnosis to Bug Report.', bug });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to convert failure to bug.' });
  }
};

export const convertToTestCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const testCase = await failureIntelligenceService.convertToTestCase(id);
    res.status(201).json({ message: 'Converted failure diagnosis to Regression Test Case.', testCase });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to convert failure to test case.' });
  }
};
