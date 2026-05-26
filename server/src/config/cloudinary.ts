import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';
import path from 'path';
import fs from 'fs';

const hasCloudinary =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[Cloudinary] Configurado');
} else if (process.env.VERCEL) {
  console.warn('[Cloudinary] Obrigatório na Vercel — configure CLOUDINARY_* nas variáveis de ambiente');
} else {
  console.warn(
    '[Cloudinary] Credenciais não definidas — usando armazenamento local em /uploads como fallback'
  );
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.originalname.match(/\.xlsx?$/i)) {
      return cb(new Error('Tipo de arquivo não permitido'));
    }
    cb(null, true);
  },
});

export interface UploadedImage {
  url: string;
  publicId: string;
}

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!process.env.VERCEL && !fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function uploadImage(file: Express.Multer.File): Promise<UploadedImage> {
  if (process.env.VERCEL && !hasCloudinary) {
    throw new Error('Cloudinary é obrigatório na Vercel. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.');
  }
  if (hasCloudinary) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || 'esentinel2',
          resource_type: 'image',
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Falha no upload'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
  const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const fullPath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(fullPath, file.buffer);
  return { url: `/uploads/${filename}`, publicId: filename };
}

export async function deleteImage(publicId: string) {
  if (!publicId) return;
  if (hasCloudinary && !publicId.includes('/uploads/')) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {}
  } else {
    const fullPath = path.join(UPLOADS_DIR, publicId);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {}
    }
  }
}

export { cloudinary, hasCloudinary };
