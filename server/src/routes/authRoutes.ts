import { Router } from 'express';
import { register, login, me, demoLogin } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo', demoLogin);
router.get('/me', requireAuth, me);

export default router;
