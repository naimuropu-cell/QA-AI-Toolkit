import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Allow optional auth so personal local use works without blocking
router.get('/', optionalAuth, getProjects);
router.get('/:id', optionalAuth, getProjectById);
router.post('/', optionalAuth, createProject);
router.put('/:id', optionalAuth, updateProject);
router.delete('/:id', optionalAuth, deleteProject);

export default router;
