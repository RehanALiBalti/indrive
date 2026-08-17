/**
 * Consistent response envelope used by every endpoint:
 *   success -> { success: true, data, meta? }
 *   failure -> { success: false, error: { code, message, details? } }
 */
export const sendSuccess = (res, data, { status = 200, meta } = {}) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

export const sendError = (res, { status = 500, code = 'INTERNAL_ERROR', message, details }) => {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(status).json(body);
};

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
