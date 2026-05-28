import { Router, Request, Response } from 'express';
import multer from 'multer';
import auth from '../middleware/auth';
import Profile from '../models/Profile';
import { parseResume } from '../services/aiService';

// pdf-parse v2 doesn't ship types — declare inline
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }> } };

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) profile = await Profile.create({ user: req.user._id, fullName: req.user.name });
    res.json(profile);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

router.put('/', auth, async (req: Request, res: Response) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { new: true, upsert: true },
    );
    res.json(profile);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

router.post('/parse-resume', auth, upload.single('resume'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    const text = result.text;
    if (!text || text.trim().length < 50) {
      res.status(400).json({ error: 'Could not extract text from PDF' });
      return;
    }
    const parsed = await parseResume(text);
    res.json(parsed);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

export default router;
