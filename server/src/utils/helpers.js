import sanitizeHtmlLib from 'sanitize-html';
import { Timestamp } from '../config/firebase.js';

/** URL-safe slug: lowercase, ASCII, hyphen separated. */
export const slugify = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

/** Normalises a URL path: always leading slash, no trailing slash (except root). */
export const normalisePath = (value) => {
  let path = String(value || '').trim();
  if (!path) return '/';
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path;
};

/**
 * Rich-text sanitiser for admin-authored HTML. Even though only authenticated
 * admins can write content, storing sanitised HTML prevents stored XSS if an
 * admin account is ever compromised.
 */
export const sanitizeRichText = (html) => {
  if (!html) return '';
  return sanitizeHtmlLib(String(html), {
    allowedTags: [
      'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'a', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      'div', 'span', 'section',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      col: ['span', 'width'],
      '*': ['class', 'id'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => {
        const isExternal = /^https?:\/\//i.test(attribs.href || '');
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(isExternal ? { rel: 'noopener noreferrer' } : {}),
          },
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { loading: 'lazy', ...attribs },
      }),
    },
  });
};

/** Strips every tag: used for anything a member of the public can submit. */
export const stripHtml = (value) => {
  if (value === undefined || value === null) return '';
  return sanitizeHtmlLib(String(value), { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
};

/** Recursively converts Firestore Timestamps to ISO strings for JSON output. */
const convertValue = (value) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp || typeof value?.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(convertValue);
  if (typeof value === 'object' && value.constructor === Object) {
    const out = {};
    for (const [key, nested] of Object.entries(value)) out[key] = convertValue(nested);
    return out;
  }
  return value;
};

/** Firestore snapshot -> plain JSON-safe object with an `id` field. */
export const docToJson = (snapshot) => {
  if (!snapshot || !snapshot.exists) return null;
  return { id: snapshot.id, ...convertValue(snapshot.data()) };
};

export const snapshotToJson = (querySnapshot) =>
  querySnapshot.docs.map((doc) => docToJson(doc)).filter(Boolean);

/** Removes undefined values so Firestore never receives them. */
export const pruneUndefined = (input) => {
  if (Array.isArray(input)) return input.map(pruneUndefined);
  if (input && typeof input === 'object' && input.constructor === Object) {
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      out[key] = pruneUndefined(value);
    }
    return out;
  }
  return input;
};

/** Case-insensitive "contains" search across the given fields. */
export const matchesSearch = (item, term, fields) => {
  if (!term) return true;
  const needle = String(term).toLowerCase();
  return fields.some((field) => {
    const value = field.split('.').reduce((acc, key) => acc?.[key], item);
    if (Array.isArray(value)) return value.join(' ').toLowerCase().includes(needle);
    return String(value ?? '').toLowerCase().includes(needle);
  });
};

export const paginate = (items, page = 1, limit = 20) => {
  const total = items.length;
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.max(1, Math.min(Number(page) || 1, totalPages));
  const start = (safePage - 1) * safeLimit;
  return {
    items: items.slice(start, start + safeLimit),
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
};

export const excerptFromHtml = (html, length = 160) => {
  const text = stripHtml(html).replace(/\s+/g, ' ').trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, '')}…`;
};

export const nowIso = () => new Date().toISOString();

export const escapeXml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
