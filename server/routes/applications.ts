import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import Application from '../models/Application';

const router = Router();

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const apps = await Application.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

router.get('/stats/summary', auth, async (req: Request, res: Response) => {
  try {
    const stats = await Application.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const total = stats.reduce((a, b) => a + b.count, 0);
    res.json({ total, byStatus: stats });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!app) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(app);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const app = await Application.create({ ...req.body, user: req.user._id });
    res.status(201).json(app);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

router.patch('/:id', auth, async (req: Request, res: Response) => {
  try {
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true },
    );
    if (!app) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(app);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const app = await Application.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!app) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

export default router;
