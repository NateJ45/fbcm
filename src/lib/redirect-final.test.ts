// src/lib/redirect-final.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finalizeRedirects } from './redirect-final.ts';

const r = (destination: string) => ({ status: 301 as const, destination });

test('targets gain the slash and keep their fragment or query', () => {
  const out = finalizeRedirects({
    '/a': r('/visit'),
    '/b': r('/visit#accessibility'),
    '/c': r('/blog?category=x'),
    '/d': r('https://example.org/x'),
    '/e': r('/files/guide.pdf'),
  });
  assert.equal(out['/a'].destination, '/visit/');
  assert.equal(out['/b'].destination, '/visit/#accessibility');
  assert.equal(out['/c'].destination, '/blog/?category=x');
  assert.equal(out['/d'].destination, 'https://example.org/x');
  assert.equal(out['/e'].destination, '/files/guide.pdf');
});

test('a target that is another redirect lands where that one ends', () => {
  const out = finalizeRedirects({
    '/staff': r('/ministers'),
    '/team/jane': r('/staff#jane'),
    '/team/joe': r('/staff'),
  });
  assert.equal(out['/team/jane'].destination, '/ministers/#jane');
  assert.equal(out['/team/joe'].destination, '/ministers/');
});

test('a cycle stops and does not hang', () => {
  const out = finalizeRedirects({ '/a': r('/b'), '/b': r('/a') });
  assert.match(out['/a'].destination, /^\/[ab]\/$/);
});
