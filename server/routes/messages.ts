import { Router } from 'express';
import { generate } from '../controllers/messageController';
import auth from '../middleware/auth';

const router = Router();

router.post('/generate', auth, generate);

export default router;
