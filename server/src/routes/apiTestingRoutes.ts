import { Router } from 'express';
import {
  generateApiTests,
  getApiSuitesByProject,
  deleteApiSuite,
} from '../controllers/apiTestingController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/generate', optionalAuth, generateApiTests);
router.get('/project/:projectId', optionalAuth, getApiSuitesByProject);
router.delete('/:id', optionalAuth, deleteApiSuite);

export default router;
