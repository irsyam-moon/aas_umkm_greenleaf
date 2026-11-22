import { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const ok = (res: Response, data: unknown, message = 'Berhasil', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({ success: false, message, data: null });

// bungkus handler async supaya error masuk ke error handler
export const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { fn(req, res).catch(next); };