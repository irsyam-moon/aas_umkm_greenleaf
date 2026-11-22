import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from '../utils/response';

export interface AuthRequest extends Request {
  user?: { id: number; role: 'admin' | 'user' };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return fail(res, 'Token tidak ditemukan', 401);
  try {
    const p = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET as string) as any;
    req.user = { id: p.id, role: p.role };
    next();
  } catch {
    return fail(res, 'Token tidak valid atau kedaluwarsa', 401);
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) =>
  req.user?.role === 'admin' ? next() : fail(res, 'Akses ditolak: khusus Admin', 403);

export const isUser = (req: AuthRequest, res: Response, next: NextFunction) =>
  req.user?.role === 'user' ? next() : fail(res, 'Akses ditolak: Admin tidak dapat melakukan pembelian', 403);