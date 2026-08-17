import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import { sendError } from '../utils/http.js';

const handler = (_req, res) =>
  sendError(res, {
    status: 429,
    code: 'RATE_LIMITED',
    message: 'Too many requests from this address. Please wait a moment and try again.',
  });

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
  skip: (req) => req.method === 'OPTIONS' || env.isTest,
};

/** Broad limit for all API traffic. */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: env.security.rateLimitWindowMs,
  max: env.security.rateLimitMax,
});

/** Strict limit for anonymous form submissions (contact, enquiries, etc.). */
export const formLimiter = rateLimit({
  ...base,
  windowMs: env.security.formRateLimitWindowMs,
  max: env.security.formRateLimitMax,
  message: 'Too many submissions from this address.',
});

/** Very strict limit for authentication endpoints to slow credential stuffing. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 30,
});

/** Upload limit — uploads are expensive and admin-only. */
export const uploadLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 120,
});
