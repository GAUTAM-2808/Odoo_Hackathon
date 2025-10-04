import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  ocrLang: process.env.OCR_LANG || 'eng',
};

export function ensureEnv() {
  const required = ['JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    // Not throwing to keep DX friendly in ephemeral envs
    console.warn(`Warning: Missing env vars: ${missing.join(', ')}`);
  }
}

export function resolveUploadPath(...segments: string[]) {
  return path.join(process.cwd(), config.uploadDir, ...segments);
}
