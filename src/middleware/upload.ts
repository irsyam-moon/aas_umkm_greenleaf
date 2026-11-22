import multer from 'multer';
import path from 'path';
import { HttpError } from '../utils/response';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const okExt = /\.(jpg|jpeg|png)$/i.test(path.extname(file.originalname));
    const okMime = ['image/jpeg', 'image/png'].includes(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(new HttpError(400, 'File harus berformat .jpg, .jpeg, atau .png'));
  },
});