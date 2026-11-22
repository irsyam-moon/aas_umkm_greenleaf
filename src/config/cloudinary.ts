import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Vercel tidak punya disk yang bisa ditulis, jadi upload dari memori (buffer)
export const uploadToCloudinary = (buffer: Buffer, folder: string) =>
  new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (err, result) =>
        err || !result ? reject(err) : resolve(result.secure_url))
      .end(buffer);
  });