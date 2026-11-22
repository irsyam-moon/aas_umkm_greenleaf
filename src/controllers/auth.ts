import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { ok, fail } from '../utils/response';

export const register = async (req: Request, res: Response) => {
  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');

  if (!name || !email || !password) return fail(res, 'Nama, email, dan password wajib diisi');
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 'Format email tidak valid');
  if (password.length < 6) return fail(res, 'Password minimal 6 karakter');

  const exist = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
  if (exist.rowCount) return fail(res, 'Email sudah terdaftar', 409);

  const hash = await bcrypt.hash(password, 10);
  const r = await pool.query(
    `INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,'user')
     RETURNING id_user, name, email, role`, [name, email, hash]);
  return ok(res, r.rows[0], 'Registrasi berhasil', 201);
};

export const login = async (req: Request, res: Response) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');
  if (!email || !password) return fail(res, 'Email dan password wajib diisi');

  const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (!r.rowCount) return fail(res, 'Email tidak terdaftar', 401);

  const u = r.rows[0];
  if (!(await bcrypt.compare(password, u.password))) return fail(res, 'Password salah', 401);

  const token = jwt.sign({ id: u.id_user, role: u.role }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
  return ok(res, { token, user: { id_user: u.id_user, name: u.name, email: u.email, role: u.role } }, 'Login berhasil');
};