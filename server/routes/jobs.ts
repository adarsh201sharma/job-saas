import { Router } from 'express';
import { search, linkedinSearch, scrape } from '../controllers/jobController';
import auth from '../middleware/auth';

const router = Router();

router.post('/search', auth, search);
router.post('/linkedin', auth, linkedinSearch);
router.post('/scrape', auth, scrape);

export default router;
