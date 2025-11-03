import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';

export async function register(req: Request, res: Response): Promise<Response> {
  const { email, password, name, firstName, lastName, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ 
      email, 
      password: hashed, 
      firstName: firstName || name?.split(' ')[0] || '',
      lastName: lastName || name?.split(' ').slice(1).join(' ') || '',
      role 
    });
    await user.save();
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response): Promise<Response> {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.password) return res.status(403).json({ error: 'No local login' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, { expiresIn: '8h' });
  
  // Recharger l'utilisateur pour avoir accès aux virtuals
  const userWithVirtuals = await User.findById(user._id);
  
  return res.json({ 
    token, 
    user: { 
      id: user._id, 
      email: user.email, 
      role: user.role, 
      firstName: user.firstName,
      lastName: user.lastName,
      name: userWithVirtuals?.name || `${user.firstName} ${user.lastName}`.trim()
    } 
  });
}