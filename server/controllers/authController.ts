import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import Profile from '../models/Profile';
import { Types } from 'mongoose';

const sign = (id: Types.ObjectId): string => {
  const opts: SignOptions = { expiresIn: (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'] };
  return jwt.sign({ id }, process.env.JWT_SECRET as string, opts);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    if (!name || !email || !password) {
      res.status(400).json({ error: 'All fields required' });
      return;
    }
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }
    const user = await User.create({ name, email, password });
    await Profile.create({ user: user._id, fullName: name });
    res.status(201).json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const match = await user.matchPassword(password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    res.json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const me = (req: Request, res: Response): void => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
};
