/** Read a nested value with a dotted path, e.g. `seo.ogImage.url`. */
export const getPath = (source, path) =>
  String(path)
    .split('.')
    .reduce((value, key) => (value === null || value === undefined ? undefined : value[key]), source);

/** Immutably write a nested value, creating intermediate objects as needed. */
export const setPath = (source, path, value) => {
  const [key, ...rest] = String(path).split('.');
  const base = source && typeof source === 'object' ? source : {};
  if (!rest.length) return { ...base, [key]: value };
  return { ...base, [key]: setPath(base[key], rest.join('.'), value) };
};

/** Removes undefined values so Firestore never receives them. */
export const pruneUndefined = (value) => {
  if (Array.isArray(value)) return value.map(pruneUndefined);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value).reduce((acc, [key, item]) => {
      if (item !== undefined) acc[key] = pruneUndefined(item);
      return acc;
    }, {});
  }
  return value;
};
