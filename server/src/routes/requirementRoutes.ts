import { Router } from 'express';
import {
  analyzeRequirement,
  getRequirementsByProject,
  getRequirementById,
  convertRequirementToScenarios,
  deleteRequirement,
} from '../controllers/requirementController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/analyze', optionalAuth, analyzeRequirement);
router.get('/project/:projectId', optionalAuth, getRequirementsByProject);
router.get('/:id', optionalAuth, getRequirementById);
router.post('/:id/convert-scenarios', optionalAuth, convertRequirementToScenarios);
router.delete('/:id', optionalAuth, deleteRequirement);

export default router;
