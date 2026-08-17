import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyFileSignature, sanitiseSvg } from '../middleware/upload.js';
import spamGuard from '../middleware/spamGuard.js';
import ApiError from '../utils/ApiError.js';

describe('upload signatures', () => {
  it('accepts a JPEG magic number', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    assert.equal(verifyFileSignature(jpeg, 'image/jpeg'), true);
  });

  it('rejects a renamed executable', () => {
    const exe = Buffer.from('MZ\0\0\0\0\0\0\0\0\0\0');
    assert.equal(verifyFileSignature(exe, 'image/jpeg'), false);
  });

  it('strips script tags from SVG', () => {
    const dirty = Buffer.from('<svg><script>alert(1)</script><circle /></svg>');
    const cleaned = sanitiseSvg(dirty).toString('utf8');
    assert.doesNotMatch(cleaned, /<script>/i);
    assert.match(cleaned, /<circle/);
  });
});

describe('spam guard', () => {
  const run = (body) =>
    new Promise((resolve) => {
      const middleware = spamGuard({ textFields: ['message'] });
      middleware({ body, originalUrl: '/api/contact', ip: '127.0.0.1' }, {}, (error) => resolve(error));
    });

  it('allows a genuine submission', async () => {
    const error = await run({
      message: 'Please quote Heathrow to Mayfair tomorrow morning.',
      _hp: '',
      _ts: Date.now() - 5000,
    });
    assert.equal(error, undefined);
  });

  it('blocks a filled honeypot', async () => {
    const error = await run({ message: 'hello', _hp: 'bot', _ts: Date.now() - 5000 });
    assert.ok(error instanceof ApiError);
    assert.equal(error.statusCode, 400);
  });

  it('blocks a form submitted too quickly', async () => {
    const error = await run({ message: 'hello there friend', _hp: '', _ts: Date.now() });
    assert.ok(error instanceof ApiError);
    assert.match(error.message, /too quickly/i);
  });
});
