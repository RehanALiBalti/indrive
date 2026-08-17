import multer from 'multer';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
];

export const ALLOWED_DOC_MIME = ['application/pdf'];

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

export const extensionForMime = (mime) => EXTENSION_BY_MIME[mime] || 'bin';

/**
 * Memory storage: files are validated then streamed straight to Firebase
 * Storage. Nothing is ever written to the API server's disk.
 */
const storage = multer.memoryStorage();

const fileFilter = (allowed) => (_req, file, cb) => {
  if (!allowed.includes(file.mimetype)) {
    cb(
      ApiError.badRequest(
        `Unsupported file type "${file.mimetype}". Allowed types: ${allowed.join(', ')}.`,
      ),
    );
    return;
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: env.security.maxUploadBytes, files: 10 },
  fileFilter: fileFilter([...ALLOWED_IMAGE_MIME, ...ALLOWED_DOC_MIME]),
});

/**
 * Magic-number check so a renamed executable cannot masquerade as an image.
 * SVG and PDF are matched textually.
 */
export const verifyFileSignature = (buffer, mimetype) => {
  if (!buffer || buffer.length < 12) return false;
  const hex = buffer.subarray(0, 12).toString('hex').toLowerCase();
  const ascii = buffer.subarray(0, 1024).toString('utf8');

  switch (mimetype) {
    case 'image/jpeg':
      return hex.startsWith('ffd8ff');
    case 'image/png':
      return hex.startsWith('89504e470d0a1a0a');
    case 'image/gif':
      return hex.startsWith('474946383761') || hex.startsWith('474946383961');
    case 'image/webp':
      return hex.startsWith('52494646') && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    case 'image/avif':
      return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
    case 'image/svg+xml':
      return /<svg[\s>]/i.test(ascii);
    case 'application/pdf':
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    default:
      return false;
  }
};

/**
 * SVGs can carry script payloads, so inline scripts and event handlers are
 * removed before the file is stored.
 */
export const sanitiseSvg = (buffer) => {
  const source = buffer.toString('utf8');
  const cleaned = source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/(href|xlink:href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '');
  return Buffer.from(cleaned, 'utf8');
};

export default uploadImage;
