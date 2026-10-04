import { Router } from 'express';
import {
  getScenariosByProject,
  createScenario,
  deleteScenario,
  generateScenarios,
  getTestCasesByProject,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  generateTestCases,
  convertScenarioToTestCase,
} from '../controllers/testDesignController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Scenarios
router.get('/scenarios/:projectId', optionalAuth, getScenariosByProject);
router.post('/scenarios', optionalAuth, createScenario);
router.delete('/scenarios/:id', optionalAuth, deleteScenario);
router.post('/generate-scenarios', optionalAuth, generateScenarios);

// Test Cases
router.get('/test-cases/:projectId', optionalAuth, getTestCasesByProject);
router.get('/test-cases/detail/:id', optionalAuth, getTestCaseById);
router.post('/test-cases', optionalAuth, createTestCase);
router.put('/test-cases/:id', optionalAuth, updateTestCase);
router.delete('/test-cases/:id', optionalAuth, deleteTestCase);
router.post('/generate-test-cases', optionalAuth, generateTestCases);
router.post('/convert-scenario', optionalAuth, convertScenarioToTestCase);

export default router;
