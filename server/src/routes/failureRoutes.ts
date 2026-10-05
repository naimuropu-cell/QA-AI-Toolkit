import { Router } from 'express';
import {
  diagnoseFailure,
  getDiagnosesByProject,
  getDiagnosisById,
  deleteDiagnosis,
  convertToBug,
  convertToTestCase,
} from '../controllers/failureController';

const router = Router();

router.post('/diagnose', diagnoseFailure);
router.get('/', getDiagnosesByProject);
router.get('/project/:projectId', getDiagnosesByProject);
router.get('/:id', getDiagnosisById);
router.delete('/:id', deleteDiagnosis);
router.post('/:id/convert-bug', convertToBug);
router.post('/:id/convert-test-case', convertToTestCase);

export default router;
