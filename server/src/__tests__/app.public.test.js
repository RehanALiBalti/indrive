import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { EXCLUDED_PATHS } from '../services/sitemap.service.js';

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      base = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(
  () =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);

const get = async (path) => {
  const response = await fetch(`${base}${path}`);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { response, text, json };
};

describe('public endpoints', () => {
  it('returns a health payload', async () => {
    const { response, json } = await get('/api/health');
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'ok');
    assert.ok(json.data.firebase === 'connected' || json.data.firebase === 'unavailable');
  });

  it('serves robots.txt', async () => {
    const { response, text } = await get('/robots.txt');
    assert.equal(response.status, 200);
    assert.match(text, /User-agent:/);
    assert.match(text, /Sitemap:/);
    // Non-production deployments must not be indexed.
    assert.match(text, /Disallow: \//);
  });

  it('serves a sitemap index', async () => {
    const { response, text } = await get('/sitemap.xml');
    assert.equal(response.status, 200);
    assert.match(text, /<sitemapindex/);
    assert.match(text, /sitemap-pages\.xml/);
    assert.match(text, /sitemap-locations\.xml/);
  });

  it('rejects unauthenticated admin access', async () => {
    const { response, json } = await get('/api/admin/pages');
    assert.equal(response.status, 401);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'UNAUTHORIZED');
  });

  it('uses a consistent error envelope for unknown API routes', async () => {
    const { response, json } = await get('/api/does-not-exist');
    assert.equal(response.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'NOT_FOUND');
  });

  it('keeps private routes out of the sitemap', () => {
    for (const path of ['/login', '/sign-up', '/verify-email', '/auth-action', '/thank-you', '/account']) {
      assert.equal(EXCLUDED_PATHS.has(path), true, `${path} should be excluded`);
    }
  });

  it('validates booking enquiries before they reach Firestore', async () => {
    const response = await fetch(`${base}/api/booking-enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType: 'airport-transfer', email: 'not-valid' }),
    });
    const json = await response.json();
    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(json.error.details));
  });
});
