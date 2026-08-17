import crypto from 'node:crypto';
import { getBucket, hasStorage } from '../config/firebase.js';
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_DOC_MIME,
  extensionForMime,
  verifyFileSignature,
  sanitiseSvg,
} from '../middleware/upload.js';
import ApiError from '../utils/ApiError.js';
import { slugify } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const ALLOWED_FOLDERS = ['vehicles', 'blog', 'pages', 'seo', 'services', 'testimonials', 'general'];

export const isStorageEnabled = () => hasStorage();

const buildObjectPath = (folder, originalName, mimetype) => {
  const safeFolder = ALLOWED_FOLDERS.includes(folder) ? folder : 'general';
  const base = slugify(String(originalName || 'file').replace(/\.[^.]+$/, '')) || 'file';
  const stamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `media/${safeFolder}/${base}-${stamp}-${random}.${extensionForMime(mimetype)}`;
};

/**
 * Validates and uploads a single file to Firebase Storage, returning a public
 * URL plus the metadata that gets recorded in the `media` collection.
 */
export const uploadFile = async (file, { folder = 'general', alt = '', actor } = {}) => {
  if (!file || !file.buffer) throw ApiError.badRequest('No file was received.');

  const allowed = [...ALLOWED_IMAGE_MIME, ...ALLOWED_DOC_MIME];
  if (!allowed.includes(file.mimetype)) {
    throw ApiError.badRequest(`Unsupported file type "${file.mimetype}".`);
  }

  if (file.size > env.security.maxUploadBytes) {
    throw ApiError.payloadTooLarge(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum is ${Math.round(
        env.security.maxUploadBytes / 1024 / 1024,
      )} MB.`,
    );
  }

  if (!verifyFileSignature(file.buffer, file.mimetype)) {
    throw ApiError.badRequest(
      'That file’s contents do not match its type. Please upload a genuine image or PDF.',
    );
  }

  const buffer = file.mimetype === 'image/svg+xml' ? sanitiseSvg(file.buffer) : file.buffer;
  const objectPath = buildObjectPath(folder, file.originalname, file.mimetype);
  const bucket = getBucket();
  const blob = bucket.file(objectPath);
  const downloadToken = crypto.randomUUID();

  try {
    await blob.save(buffer, {
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          uploadedBy: actor?.uid || 'system',
          originalName: file.originalname || '',
        },
      },
    });
  } catch (error) {
    if (/bucket does not exist|No such bucket|404/i.test(error?.message || '')) {
      throw ApiError.serviceUnavailable(
        'Firebase Storage is not set up yet. In Firebase Console open Storage → Get started, ' +
          'then set FIREBASE_STORAGE_BUCKET in server/.env to the bucket name shown there and restart the API.',
      );
    }
    throw error;
  }

  // Objects under media/** are publicly readable by the Storage rules, but we
  // also mark them public so the plain storage.googleapis.com URL works even
  // when uniform bucket-level access is off.
  let url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    objectPath,
  )}?alt=media&token=${downloadToken}`;

  try {
    await blob.makePublic();
    url = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
  } catch (error) {
    logger.debug('makePublic skipped (uniform bucket-level access likely enabled)', error?.message);
  }

  return {
    url,
    path: objectPath,
    bucket: bucket.name,
    alt: alt || '',
    contentType: file.mimetype,
    size: buffer.length,
    originalName: file.originalname || '',
    folder: ALLOWED_FOLDERS.includes(folder) ? folder : 'general',
    uploadedBy: actor?.uid || null,
  };
};

export const deleteFile = async (objectPath) => {
  if (!objectPath) return false;
  try {
    await getBucket().file(objectPath).delete({ ignoreNotFound: true });
    return true;
  } catch (error) {
    logger.warn(`Failed to delete storage object "${objectPath}"`, error?.message);
    return false;
  }
};

export const allowedFolders = ALLOWED_FOLDERS;
