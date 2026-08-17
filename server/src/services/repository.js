import { getDb, FieldValue } from '../config/firebase.js';
import ApiError from '../utils/ApiError.js';
import {
  docToJson,
  snapshotToJson,
  pruneUndefined,
  matchesSearch,
  paginate,
} from '../utils/helpers.js';

const HARD_FETCH_CAP = 2000;

const compare = (a, b, field, direction) => {
  const av = field.split('.').reduce((acc, key) => acc?.[key], a);
  const bv = field.split('.').reduce((acc, key) => acc?.[key], b);
  const dir = direction === 'desc' ? -1 : 1;

  if (av === bv) return 0;
  if (av === undefined || av === null) return 1;
  if (bv === undefined || bv === null) return -1;
  if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
  return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
};

/**
 * Generic Firestore data-access layer shared by every content collection.
 *
 * Reads pull the (bounded) collection and then filter/sort/paginate in memory.
 * For CMS-scale content this is both faster and cheaper than many composite
 * indexes, and it keeps the admin UI free to filter on any field. Results are
 * cached by the calling controller layer.
 */
export const repository = (collectionName) => {
  const col = () => getDb().collection(collectionName);

  const fetchAll = async ({ where = [], limit } = {}) => {
    let query = col();
    for (const [field, op, value] of where) {
      query = query.where(field, op, value);
    }
    query = query.limit(Math.min(limit || HARD_FETCH_CAP, HARD_FETCH_CAP));
    const snapshot = await query.get();
    return snapshotToJson(snapshot);
  };

  return {
    collectionName,
    raw: col,

    fetchAll,

    /**
     * @param {object} options
     * @param {Array}  options.where      Firestore where tuples applied server-side
     * @param {object} options.filters    Exact-match filters applied in memory
     * @param {string} options.search     Free-text term
     * @param {string[]} options.searchFields
     * @param {string} options.sortBy
     * @param {'asc'|'desc'} options.sortDir
     * @param {number} options.page
     * @param {number} options.limit
     * @param {boolean} options.paginated
     * @param {Function} [options.predicate] Extra in-memory filter applied before pagination
     */
    async list({
      where = [],
      filters = {},
      search = '',
      searchFields = ['title', 'name', 'slug'],
      sortBy = 'createdAt',
      sortDir = 'desc',
      page = 1,
      limit = 20,
      paginated = true,
      predicate,
    } = {}) {
      let items = await fetchAll({ where });

      if (typeof predicate === 'function') {
        items = items.filter(predicate);
      }

      for (const [field, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '' || value === 'all') continue;
        items = items.filter((item) => {
          const actual = field.split('.').reduce((acc, key) => acc?.[key], item);
          if (Array.isArray(actual)) return actual.includes(value);
          if (typeof actual === 'boolean') return actual === (value === true || value === 'true');
          return String(actual ?? '') === String(value);
        });
      }

      if (search) items = items.filter((item) => matchesSearch(item, search, searchFields));

      items.sort((a, b) => compare(a, b, sortBy, sortDir));

      if (!paginated) return { items, meta: { total: items.length } };
      return paginate(items, page, limit);
    },

    async getById(id) {
      if (!id) return null;
      const snapshot = await col().doc(String(id)).get();
      return docToJson(snapshot);
    },

    async getByIdOrFail(id) {
      const found = await this.getById(id);
      if (!found) throw ApiError.notFound(`No ${collectionName} record found for id "${id}".`);
      return found;
    },

    async findOne(field, value) {
      const snapshot = await col().where(field, '==', value).limit(1).get();
      if (snapshot.empty) return null;
      return docToJson(snapshot.docs[0]);
    },

    async getBySlug(slug) {
      return this.findOne('slug', slug);
    },

    async slugExists(slug, exceptId) {
      const snapshot = await col().where('slug', '==', slug).limit(2).get();
      return snapshot.docs.some((doc) => doc.id !== exceptId);
    },

    /** Appends -2, -3 ... until the slug is unique within the collection. */
    async uniqueSlug(baseSlug, exceptId) {
      let candidate = baseSlug;
      let counter = 2;
      /* eslint-disable no-await-in-loop */
      while (await this.slugExists(candidate, exceptId)) {
        candidate = `${baseSlug}-${counter}`;
        counter += 1;
        if (counter > 200) break;
      }
      /* eslint-enable no-await-in-loop */
      return candidate;
    },

    async create(data, { id, actor } = {}) {
      const payload = pruneUndefined({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: actor?.uid || null,
        updatedBy: actor?.uid || null,
      });

      const ref = id ? col().doc(String(id)) : col().doc();
      if (id) {
        const existing = await ref.get();
        if (existing.exists) throw ApiError.conflict(`A record with id "${id}" already exists.`);
      }
      await ref.set(payload);
      return docToJson(await ref.get());
    },

    async update(id, data, { actor } = {}) {
      const ref = col().doc(String(id));
      const existing = await ref.get();
      if (!existing.exists) {
        throw ApiError.notFound(`No ${collectionName} record found for id "${id}".`);
      }
      const payload = pruneUndefined({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor?.uid || null,
      });
      delete payload.createdAt;
      delete payload.createdBy;
      await ref.set(payload, { merge: true });
      return docToJson(await ref.get());
    },

    /** Create-or-update by known document id (used for singletons). */
    async upsert(id, data, { actor } = {}) {
      const ref = col().doc(String(id));
      const existing = await ref.get();
      const payload = pruneUndefined({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor?.uid || null,
        ...(existing.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp(), createdBy: actor?.uid || null }),
      });
      await ref.set(payload, { merge: true });
      return docToJson(await ref.get());
    },

    async remove(id) {
      const ref = col().doc(String(id));
      const existing = await ref.get();
      if (!existing.exists) {
        throw ApiError.notFound(`No ${collectionName} record found for id "${id}".`);
      }
      const snapshot = docToJson(existing);
      await ref.delete();
      return snapshot;
    },

    async count(where = []) {
      let query = col();
      for (const [field, op, value] of where) query = query.where(field, op, value);
      const snapshot = await query.count().get();
      return snapshot.data().count;
    },

    /** Batched reorder used by drag-to-sort admin lists. */
    async reorder(orderedIds = [], { actor } = {}) {
      const batch = getDb().batch();
      orderedIds.forEach((id, index) => {
        batch.set(
          col().doc(String(id)),
          {
            sortOrder: index + 1,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: actor?.uid || null,
          },
          { merge: true },
        );
      });
      await batch.commit();
      return orderedIds.length;
    },
  };
};

export default repository;
