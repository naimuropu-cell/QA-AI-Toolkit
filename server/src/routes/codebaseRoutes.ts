import { Router } from 'express';
import {
  scanDirectoryPath,
  scanManifest,
  generateRepositoryNative,
  getScansByProject,
  getScanById,
  deleteScan,
} from '../controllers/codebaseController';

const router = Router();

router.post('/scan-path', scanDirectoryPath);
router.post('/scan-manifest', scanManifest);
router.post('/generate-native', generateRepositoryNative);
router.get('/project/:projectId', getScansByProject);
router.get('/:id', getScanById);
router.delete('/:id', deleteScan);

export default router;
