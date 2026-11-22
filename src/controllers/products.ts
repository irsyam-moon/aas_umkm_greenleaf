import { Request, Response } from 'express';
import { pool } from '../config/db';
import { uploadToCloudinary } from '../config/cloudinary';
import { ok, fail } from '../utils/response';

const BASE = `SELECT p.*, c.name AS category_name
              FROM products p JOIN categories c ON c.id_category = p.id_category`;

export const listProducts = async (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : null;
  const cat = req.query.category ? Number(req.query.category) : null;
  const r = await pool.query(
    `${BASE} WHERE ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%')
               AND ($2::int  IS NULL OR p.id_category = $2)
     ORDER BY p.id_product DESC`, [search, cat]);
  return ok(res, r.rows);
};

export const getProduct = async (req: Request, res: Response) => {
  const r = await pool.query(`${BASE} WHERE p.id_product=$1`, [req.params.id]);
  return r.rowCount ? ok(res, r.rows[0]) : fail(res, 'Produk tidak ditemukan', 404);
};

const readBody = (b: any) => ({
  id_category: Number(b.id_category),
  name: String(b.name ?? '').trim(),
  price: Number(b.price),
  stock: Number(b.stock),
  description: String(b.description ?? '').trim(),
  care_guide: String(b.care_guide ?? '').trim(),
});

const validate = (p: ReturnType<typeof readBody>) => {
  if (!p.name) return 'Nama tanaman wajib diisi';
  if (!Number.isInteger(p.id_category) || p.id_category <= 0) return 'Kategori wajib dipilih';
  if (!Number.isInteger(p.price) || p.price <= 0) return 'Harga harus angka lebih dari 0';
  if (!Number.isInteger(p.stock) || p.stock < 0) return 'Stok harus angka 0 atau lebih';
  return null;
};

export const createProduct = async (req: Request, res: Response) => {
  const p = readBody(req.body);
  const err = validate(p);
  if (err) return fail(res, err);
  if (!req.file) return fail(res, 'Foto tanaman wajib diunggah');

  const url = await uploadToCloudinary(req.file.buffer, 'greenleaf/products');
  const r = await pool.query(
    `INSERT INTO products (id_category,name,price,stock,image_url,description,care_guide)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [p.id_category, p.name, p.price, p.stock, url, p.description, p.care_guide]);
  return ok(res, r.rows[0], 'Produk ditambahkan', 201);
};

export const updateProduct = async (req: Request, res: Response) => {
  const p = readBody(req.body);
  const err = validate(p);
  if (err) return fail(res, err);

  const old = await pool.query('SELECT image_url FROM products WHERE id_product=$1', [req.params.id]);
  if (!old.rowCount) return fail(res, 'Produk tidak ditemukan', 404);

  const url = req.file ? await uploadToCloudinary(req.file.buffer, 'greenleaf/products') : old.rows[0].image_url;
  const r = await pool.query(
    `UPDATE products SET id_category=$1,name=$2,price=$3,stock=$4,image_url=$5,description=$6,care_guide=$7
     WHERE id_product=$8 RETURNING *`,
    [p.id_category, p.name, p.price, p.stock, url, p.description, p.care_guide, req.params.id]);
  return ok(res, r.rows[0], 'Produk diperbarui');
};

export const deleteProduct = async (req: Request, res: Response) => {
  const r = await pool.query('DELETE FROM products WHERE id_product=$1', [req.params.id]);
  return r.rowCount ? ok(res, null, 'Produk dihapus') : fail(res, 'Produk tidak ditemukan', 404);
};