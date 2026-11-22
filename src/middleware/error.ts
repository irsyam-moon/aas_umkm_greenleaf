import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { HttpError, fail } from '../utils/response';

export const notFound = (_req: Request, res: Response) => fail(res, 'Endpoint tidak ditemukan', 404);

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return fail(res, err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file maksimal 2MB' : err.message, 400);
  }
  if (err instanceof HttpError) return fail(res, err.message, err.status);
  if (err.code === '23503') return fail(res, 'Data masih dipakai data lain, tidak bisa dihapus/diubah', 409);
  console.error(err);
  return fail(res, 'Terjadi kesalahan pada server', 500);
};