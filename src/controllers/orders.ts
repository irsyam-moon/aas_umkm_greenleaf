import { Response } from 'express';
import { pool } from '../config/db';
import { uploadToCloudinary } from '../config/cloudinary';
import { AuthRequest } from '../middleware/auth';
import { ok, fail } from '../utils/response';

const SELECT = `SELECT o.*, u.name AS user_name, p.name AS product_name, p.image_url AS product_image
                FROM orders o
                JOIN users u ON u.id_user = o.id_user
                JOIN products p ON p.id_product = o.id_product`;

export const createOrder = async (req: AuthRequest, res: Response) => {
  const idProduct = Number(req.body.id_product);
  const qty = Number(req.body.quantity);
  const address = String(req.body.shipping_address ?? '').trim();

  if (!Number.isInteger(idProduct) || idProduct <= 0) return fail(res, 'Produk tidak valid');
  if (!Number.isInteger(qty) || qty <= 0) return fail(res, 'Jumlah harus lebih dari 0');
  if (!address) return fail(res, 'Alamat pengiriman wajib diisi');
  if (!req.file) return fail(res, 'Bukti transfer wajib diunggah');

  const proofUrl = await uploadToCloudinary(req.file.buffer, 'greenleaf/payments');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // FOR UPDATE: kunci baris supaya stok tidak balapan antar pembeli
    const p = await client.query('SELECT price, stock FROM products WHERE id_product=$1 FOR UPDATE', [idProduct]);
    if (!p.rowCount) { await client.query('ROLLBACK'); return fail(res, 'Produk tidak ditemukan', 404); }
    if (p.rows[0].stock < qty) { await client.query('ROLLBACK'); return fail(res, 'Stok tidak mencukupi', 409); }

    const total = p.rows[0].price * qty;
    const o = await client.query(
      `INSERT INTO orders (id_user,id_product,quantity,total_price,shipping_address,payment_proof)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user!.id, idProduct, qty, total, address, proofUrl]);
    await client.query('UPDATE products SET stock = stock - $1 WHERE id_product=$2', [qty, idProduct]);
    await client.query('COMMIT');
    return ok(res, o.rows[0], 'Pesanan berhasil dibuat', 201);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export const listAllOrders = async (_req: AuthRequest, res: Response) => {
  const r = await pool.query(`${SELECT} ORDER BY o.id_order DESC`);
  return ok(res, r.rows);
};

export const myOrders = async (req: AuthRequest, res: Response) => {
  const r = await pool.query(`${SELECT} WHERE o.id_user=$1 ORDER BY o.id_order DESC`, [req.user!.id]);
  return ok(res, r.rows);
};

const FLOW: Record<string, string> = { Pending: 'Diproses', Diproses: 'Dikirim' };

export const updateStatus = async (req: AuthRequest, res: Response) => {
  const status = String(req.body.status ?? '');
  if (!['Pending', 'Diproses', 'Dikirim'].includes(status)) return fail(res, 'Status tidak valid');

  const cur = await pool.query('SELECT status FROM orders WHERE id_order=$1', [req.params.id]);
  if (!cur.rowCount) return fail(res, 'Pesanan tidak ditemukan', 404);
  if (FLOW[cur.rows[0].status] !== status)
    return fail(res, `Status hanya bisa berubah dari ${cur.rows[0].status} ke ${FLOW[cur.rows[0].status] ?? '-'}`, 400);

  const r = await pool.query('UPDATE orders SET status=$1 WHERE id_order=$2 RETURNING *', [status, req.params.id]);
  return ok(res, r.rows[0], 'Status pesanan diperbarui');
};