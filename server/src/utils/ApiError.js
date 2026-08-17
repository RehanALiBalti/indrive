/**
 * Application error carrying an HTTP status and a stable machine-readable code.
 * Anything thrown that is not an ApiError is treated as an unexpected 500 and
 * its message is hidden from clients in production.
 */
export default class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Invalid request.', details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static validation(message = 'Validation failed.', details) {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required.') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'The requested resource was not found.') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'That resource already exists.', details) {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }

  static payloadTooLarge(message = 'The uploaded file is too large.') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', message);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable.') {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message);
  }

  static internal(message = 'Something went wrong on our side.') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
