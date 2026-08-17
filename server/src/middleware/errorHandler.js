import multer from 'multer';
import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';
import { sendError } from '../utils/http.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist.`));
};

const normalise = (error) => {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return ApiError.validation(
      'Please correct the highlighted fields.',
      error.issues.map((issue) => ({
        field: issue.path.join('.') || '_root',
        message: issue.message,
      })),
    );
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return ApiError.payloadTooLarge(
        `That file is too large. The maximum upload size is ${Math.round(
          env.security.maxUploadBytes / (1024 * 1024),
        )} MB.`,
      );
    }
    return ApiError.badRequest(`Upload failed: ${error.message}`);
  }

  if (error?.type === 'entity.too.large') {
    return ApiError.payloadTooLarge('The request body is too large.');
  }

  if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    return ApiError.badRequest('The request body is not valid JSON.');
  }

  if (typeof error?.code === 'string' && error.code.startsWith('auth/')) {
    const map = {
      'auth/email-already-exists': [409, 'EMAIL_IN_USE', 'That email address is already registered.'],
      'auth/invalid-email': [422, 'INVALID_EMAIL', 'That email address is not valid.'],
      'auth/invalid-password': [422, 'WEAK_PASSWORD', 'Passwords must be at least 8 characters.'],
      'auth/user-not-found': [404, 'USER_NOT_FOUND', 'No account exists for that email address.'],
      'auth/phone-number-already-exists': [409, 'PHONE_IN_USE', 'That phone number is already in use.'],
    };
    const [status, code, message] = map[error.code] || [400, 'AUTH_ERROR', 'Authentication failed.'];
    return new ApiError(status, code, message);
  }

  // Firestore / gRPC status codes.
  if (typeof error?.code === 'number') {
    if (error.code === 5) return ApiError.notFound();
    if (error.code === 7) return ApiError.forbidden('The server is not allowed to perform that operation.');
    if (error.code === 8) return ApiError.tooManyRequests('Database quota exceeded. Please retry shortly.');
    if (error.code === 14 || error.code === 4) {
      return ApiError.serviceUnavailable('The database is temporarily unreachable. Please retry.');
    }
    if (error.code === 9 && /index/i.test(error.message || '')) {
      return ApiError.serviceUnavailable(
        'A required database index is still building. Please retry in a minute.',
      );
    }
  }

  if (error?.message === 'CORS_NOT_ALLOWED') {
    return ApiError.forbidden('This origin is not allowed to call the API.');
  }

  return null;
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, _next) => {
  const apiError = normalise(error);

  if (apiError) {
    if (apiError.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} -> ${apiError.statusCode}`, error);
    } else {
      logger.debug(`${req.method} ${req.originalUrl} -> ${apiError.statusCode}: ${apiError.message}`);
    }
    return sendError(res, {
      status: apiError.statusCode,
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    });
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, error);

  return sendError(res, {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: env.isProduction
      ? 'Something went wrong on our side. Please try again.'
      : error?.message || 'Unknown error',
    details: env.isProduction ? undefined : { stack: error?.stack },
  });
};

export default errorHandler;
