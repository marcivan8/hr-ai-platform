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
      role: role || 'employee' // Default to employee if not specified
    });
    await user.save();
    
    // Generate token for immediate login after registration
    const token = jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, { expiresIn: '8h' });
    
    // Return user data with token
    return res.json({ 
      ok: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role || 'employee',
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        department: user.department,
        position: user.position
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}