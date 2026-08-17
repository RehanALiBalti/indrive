import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

const formatIssues = (error) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
    code: issue.code,
  }));

/**
 * Validates and REPLACES req.body / req.query / req.params with the parsed
 * result, so controllers only ever see coerced, whitelisted data.
 */
const validate = (schemas = {}) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) {
      const parsed = schemas.query.parse(req.query ?? {});
      // Express 5 exposes req.query as a getter; assign field by field.
      req.validatedQuery = parsed;
      Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
    }
    if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(ApiError.validation('Please correct the highlighted fields.', formatIssues(error)));
    }
    return next(error);
  }
};

export default validate;
