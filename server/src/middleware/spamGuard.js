import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

const MIN_FILL_MS = 2000; // humans do not complete a form in under 2 seconds
const MAX_FORM_AGE_MS = 12 * 60 * 60 * 1000;
const MAX_LINKS = 3;

const countLinks = (value) => (String(value).match(/https?:\/\//gi) || []).length;

/**
 * Layered, dependency-free bot protection for public forms:
 *  1. Honeypot field (`_hp`) that real users never see or fill.
 *  2. Time-to-submit check using a render timestamp (`_ts`).
 *  3. Link-flood heuristic on free-text fields.
 *
 * Rejected submissions are still recorded (flagged as spam) by the controller
 * when useful, but never trigger notification emails.
 */
const spamGuard = (options = {}) => {
  const { textFields = ['message', 'notes', 'comments', 'enquiry'] } = options;

  return (req, _res, next) => {
    const body = req.body || {};

    if (typeof body._hp === 'string' && body._hp.trim() !== '') {
      logger.warn('Spam blocked: honeypot filled', { path: req.originalUrl, ip: req.ip });
      return next(ApiError.badRequest('Your submission could not be processed.'));
    }

    const renderedAt = Number(body._ts);
    if (Number.isFinite(renderedAt) && renderedAt > 0) {
      const elapsed = Date.now() - renderedAt;
      if (elapsed < MIN_FILL_MS) {
        logger.warn('Spam blocked: submitted too fast', { path: req.originalUrl, elapsed });
        return next(
          ApiError.badRequest('That was submitted a little too quickly. Please try again.'),
        );
      }
      if (elapsed > MAX_FORM_AGE_MS) {
        return next(
          ApiError.badRequest('This form expired. Please refresh the page and try again.'),
        );
      }
    }

    for (const field of textFields) {
      const value = body[field];
      if (typeof value === 'string' && countLinks(value) > MAX_LINKS) {
        logger.warn('Spam blocked: too many links', { path: req.originalUrl, field });
        return next(
          ApiError.badRequest('Your message contains too many links. Please remove some and retry.'),
        );
      }
    }

    // Strip the guard fields so they never reach Firestore.
    delete req.body._hp;
    delete req.body._ts;

    return next();
  };
};

export default spamGuard;
