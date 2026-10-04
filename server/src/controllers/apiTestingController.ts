import { Request, Response } from 'express';
import { apiTestingService } from '../services/apiTestingService';

export const generateApiTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      name,
      endpoint,
      method,
      headers,
      requestBody,
      authType,
      authToken,
      exampleResponse,
      save,
    } = req.body;

    if (!projectId || !endpoint) {
      res.status(400).json({ error: 'projectId and endpoint are required.' });
      return;
    }

    const result = await apiTestingService.generateApiTests({
      projectId,
      name,
      endpoint,
      method: method || 'GET',
      headers,
      requestBody,
      authType,
      authToken,
      exampleResponse,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate API tests.' });
  }
};

export const getApiSuitesByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const suites = await apiTestingService.getSuitesByProject(projectId);
    res.json({ suites });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch API suites.' });
  }
};

export const deleteApiSuite = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await apiTestingService.deleteSuite(id);
    res.json({ message: 'API test suite deleted successfully.', deletedId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete API test suite.' });
  }
};
