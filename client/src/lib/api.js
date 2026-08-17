import { env } from '../config/env.js';
import { getFirebaseAuth } from './firebase.js';

/** Error thrown for every non-2xx API response, carrying the server's shape. */
export class ApiError extends Error {
  constructor(message, { status, code, details, path } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.path = path;
  }

  /** Maps server-side field errors into a { field: message } object for forms. */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return this.details.reduce((acc, item) => {
      if (item?.field && item?.message && !acc[item.field]) acc[item.field] = item.message;
      return acc;
    }, {});
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

const buildUrl = (path, params) => {
  const base = path.startsWith('http') ? path : `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return base;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }
  const query = search.toString();
  return query ? `${base}${base.includes('?') ? '&' : '?'}${query}` : base;
};

const getAuthHeader = async (auth) => {
  if (auth === false) return {};
  const firebaseAuth = getFirebaseAuth();
  const user = firebaseAuth?.currentUser;
  if (!user) {
    if (auth === true) {
      throw new ApiError('You need to sign in to continue.', { status: 401, code: 'UNAUTHORIZED' });
    }
    return {};
  }
  // getIdToken() refreshes automatically when the token is close to expiry.
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
};

/**
 * Single fetch wrapper used by the whole app.
 *
 * @param {string} path        Path relative to the API base, e.g. "/vehicles"
 * @param {object} options
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} options.method
 * @param {object} options.body     JSON body (ignored for GET)
 * @param {FormData} options.formData Multipart body for uploads
 * @param {object} options.params   Query-string parameters
 * @param {boolean|'optional'} options.auth  true = required, 'optional' = attach if present
 * @param {AbortSignal} options.signal
 */
export const apiRequest = async (
  path,
  { method = 'GET', body, formData, params, auth = false, signal, timeout = 20000 } = {},
) => {
  const url = buildUrl(path, params);
  const headers = { Accept: 'application/json', ...(await getAuthHeader(auth)) };

  let payload;
  if (formData) {
    payload = formData; // The browser sets the multipart boundary itself.
  } else if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

  let response;
  try {
    response = await fetch(url, { method, headers, body: payload, signal: controller.signal });
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError' && signal?.aborted) throw error;
    throw new ApiError(
      error.name === 'AbortError'
        ? 'The request took too long. Please check your connection and try again.'
        : 'We could not reach the server. Please check your connection and try again.',
      { status: 0, code: 'NETWORK_ERROR', path },
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return { data: null, meta: null };

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (!response.ok) {
      throw new ApiError(
        response.status === 404 ? 'That resource could not be found.' : 'Unexpected server response.',
        { status: response.status, code: 'UNEXPECTED_RESPONSE', path },
      );
    }
    return { data: text, meta: null };
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.success === false) {
    const error = json?.error || {};
    throw new ApiError(error.message || 'Something went wrong. Please try again.', {
      status: response.status,
      code: error.code || 'UNKNOWN',
      details: error.details,
      path,
    });
  }

  return { data: json?.data ?? null, meta: json?.meta ?? null };
};

/** Convenience helper that returns just the payload. */
export const api = {
  get: async (path, options) => (await apiRequest(path, { ...options, method: 'GET' })).data,
  getWithMeta: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: async (path, body, options) => (await apiRequest(path, { ...options, method: 'POST', body })).data,
  put: async (path, body, options) => (await apiRequest(path, { ...options, method: 'PUT', body })).data,
  patch: async (path, body, options) => (await apiRequest(path, { ...options, method: 'PATCH', body })).data,
  delete: async (path, options) => (await apiRequest(path, { ...options, method: 'DELETE' })).data,
  upload: async (path, formData, options) =>
    (await apiRequest(path, { ...options, method: 'POST', formData, auth: true, timeout: 120000 })).data,
};

export default api;
