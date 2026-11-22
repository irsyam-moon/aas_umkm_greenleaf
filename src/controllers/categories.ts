import { Request, Response } from 'express';
import { pool } from '../config/db';
import { ok, fail } from '../utils/response';

export const listCategories = async (_req: Request, res: Response) => {
  const r = await pool.query('SELECT * FROM categories ORDER BY id_category');
  return ok(res, r.rows);
};

export const createCategory = async (req: Request, res: Response) => {
  const name = String(req.body.name ?? '').trim();
  const type = String(req.body.type ?? '').trim();
  if (!name) return fail(res, 'Nama kategori wajib diisi');
  const r = await pool.query('INSERT INTO categories (name,type) VALUES ($1,$2) RETURNING *', [name, type]);
  return ok(res, r.rows[0], 'Kategori ditambahkan', 201);
};

export const updateCategory = async (req: Request, res: Response) => {
  const name = String(req.body.name ?? '').trim();
  const type = String(req.body.type ?? '').trim();
  if (!name) return fail(res, 'Nama kategori wajib diisi');
  const r = await pool.query('UPDATE categories SET name=$1, type=$2 WHERE id_category=$3 RETURNING *',
    [name, type, req.params.id]);
  return r.rowCount ? ok(res, r.rows[0], 'Kategori diperbarui') : fail(res, 'Kategori tidak ditemukan', 404);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const r = await pool.query('DELETE FROM categories WHERE id_category=$1', [req.params.id]);
  return r.rowCount ? ok(res, null, 'Kategori dihapus') : fail(res, 'Kategori tidak ditemukan', 404);
};