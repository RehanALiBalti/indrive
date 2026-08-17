import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  normalisePath,
  paginate,
  stripHtml,
  sanitizeRichText,
  excerptFromHtml,
  matchesSearch,
  pruneUndefined,
  escapeXml,
  escapeHtml,
} from '../utils/helpers.js';

describe('slugify', () => {
  it('produces lowercase hyphenated slugs', () => {
    assert.equal(slugify('Heathrow Airport'), 'heathrow-airport');
  });

  it('strips punctuation and accents', () => {
    assert.equal(slugify("London–Manchester"), 'london-manchester');
    assert.equal(slugify('Café'), 'cafe');
  });
});

describe('normalisePath', () => {
  it('adds a leading slash and strips trailing slashes', () => {
    assert.equal(normalisePath('about-us/'), '/about-us');
    assert.equal(normalisePath('/fleet'), '/fleet');
    assert.equal(normalisePath(''), '/');
    assert.equal(normalisePath('/'), '/');
  });

  it('collapses duplicate slashes', () => {
    assert.equal(normalisePath('//airport-transfer//'), '/airport-transfer');
  });
});

describe('paginate', () => {
  it('returns the requested page and metadata', () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1);
    const result = paginate(items, 2, 10);
    assert.deepEqual(result.items, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    assert.equal(result.meta.page, 2);
    assert.equal(result.meta.total, 25);
    assert.equal(result.meta.totalPages, 3);
    assert.equal(result.meta.hasNext, true);
    assert.equal(result.meta.hasPrev, true);
  });

  it('clamps out-of-range pages', () => {
    const result = paginate([1, 2, 3], 99, 10);
    assert.equal(result.meta.page, 1);
    assert.deepEqual(result.items, [1, 2, 3]);
  });
});

describe('HTML helpers', () => {
  it('strips tags from public input', () => {
    assert.equal(stripHtml('<script>alert(1)</script>Hello'), 'Hello');
  });

  it('sanitises admin HTML but keeps safe markup', () => {
    const html = sanitizeRichText('<h2>Title</h2><p>Hello <a href="https://example.com">link</a></p><script>x()</script>');
    assert.match(html, /<h2>Title<\/h2>/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /rel="noopener noreferrer"/);
  });

  it('builds an excerpt from HTML', () => {
    assert.equal(excerptFromHtml('<p>Short copy</p>'), 'Short copy');
  });
});

describe('search, prune and escaping', () => {
  it('matches nested search fields', () => {
    const item = { title: 'Heathrow', seo: { title: 'Airport transfers' } };
    assert.equal(matchesSearch(item, 'heath', ['title']), true);
    assert.equal(matchesSearch(item, 'airport', ['seo.title']), true);
    assert.equal(matchesSearch(item, 'xyz', ['title']), false);
  });

  it('drops undefined values', () => {
    assert.deepEqual(pruneUndefined({ a: 1, b: undefined, c: { d: undefined, e: 2 } }), {
      a: 1,
      c: { e: 2 },
    });
  });

  it('escapes XML and HTML', () => {
    assert.equal(escapeXml(`<a href="x">`), '&lt;a href=&quot;x&quot;&gt;');
    assert.equal(escapeHtml(`it's <ok>`), 'it&#39;s &lt;ok&gt;');
  });
});
