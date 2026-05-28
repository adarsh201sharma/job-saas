import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import profileRoutes from './routes/profile';

const app = express();

connectDB();

const clientOrigin = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '5mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Job SaaS API is running', version: '2.0.0' });
});

app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
