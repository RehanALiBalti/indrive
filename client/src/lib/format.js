/** Small formatting helpers shared by the public site and the admin CMS. */

/** URL-safe slug. Mirrors the server-side `slugify` so previews match. */
export const slugify = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

export const formatDate = (value, options = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', options);
};

export const formatDateTime = (value) =>
  formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** "3 hours" / "1 hour" style pluralisation without pulling in a library. */
export const pluralise = (count, singular, plural = `${singular}s`) =>
  `${count} ${Number(count) === 1 ? singular : plural}`;

export const truncate = (value, length = 160) => {
  const text = String(value || '').trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trimEnd()}…`;
};

/** Title Case for URL segments and enum-ish values. */
export const titleCase = (value) =>
  String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
