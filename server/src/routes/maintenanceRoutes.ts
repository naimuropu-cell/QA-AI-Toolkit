import { Router } from 'express';
import {
  auditScript,
  getAuditsByProject,
  getAuditById,
  deleteAudit,
  healLocator,
  getHealedLocatorsByProject,
} from '../controllers/maintenanceController';

const router = Router();

router.post('/audit', auditScript);
router.get('/audits', getAuditsByProject);
router.get('/project/:projectId', getAuditsByProject);
router.get('/audits/:id', getAuditById);
router.delete('/audits/:id', deleteAudit);

router.post('/heal-locator', healLocator);
router.get('/healed-locators', getHealedLocatorsByProject);
router.get('/healed-locators/:projectId', getHealedLocatorsByProject);

export default router;
