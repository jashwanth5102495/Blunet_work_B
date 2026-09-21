import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'blunet_workplace_super_secret_jwt_key_2026';

export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): AuthPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
};
