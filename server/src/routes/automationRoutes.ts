import { Router } from 'express';
import {
  generateAutomationSuite,
  getAutomationSuitesByProject,
  getAutomationSuiteById,
  deleteAutomationSuite,
} from '../controllers/automationController';

const router = Router();

router.post('/generate', generateAutomationSuite);
router.get('/project/:projectId', getAutomationSuitesByProject);
router.get('/:id', getAutomationSuiteById);
router.delete('/:id', deleteAutomationSuite);

export default router;
