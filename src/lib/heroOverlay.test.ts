import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldOverlayHeader } from './heroOverlay.ts';

const photo = { asset: { _ref: 'image-x' } };

test('a full hero with a photograph overlays the header', () => {
  assert.equal(shouldOverlayHeader([{ _type: 'heroSection', frames: [photo] }]), true);
  assert.equal(
    shouldOverlayHeader([{ _type: 'heroSection', layout: 'full', backgroundImage: photo }]),
    true,
  );
});

test('split and window heroes keep the paper bar, photographs or not', () => {
  for (const layout of ['split', 'window']) {
    assert.equal(
      shouldOverlayHeader([{ _type: 'heroSection', layout, frames: [photo, photo, photo] }]),
      false,
    );
  }
});

test('no hero, or a hero with no image, keeps the paper bar', () => {
  assert.equal(shouldOverlayHeader([{ _type: 'heroSection' }]), false);
  assert.equal(shouldOverlayHeader([{ _type: 'richTextSection' }]), false);
  assert.equal(shouldOverlayHeader([]), false);
});
