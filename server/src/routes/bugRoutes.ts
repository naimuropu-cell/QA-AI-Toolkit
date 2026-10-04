import { Router } from 'express';
import {
  analyzeBug,
  getBugsByProject,
  getBugById,
  convertBugToTestCase,
  deleteBug,
} from '../controllers/bugController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/analyze', optionalAuth, analyzeBug);
router.get('/project/:projectId', optionalAuth, getBugsByProject);
router.get('/:id', optionalAuth, getBugById);
router.post('/:id/convert-test-case', optionalAuth, convertBugToTestCase);
router.delete('/:id', optionalAuth, deleteBug);

export default router;
