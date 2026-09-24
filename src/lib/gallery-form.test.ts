// src/lib/gallery-form.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { galleryForm, hasLabel } from './gallery-form.ts';

// A real-shaped stega run: the U+200B prefix and base-4 digits in the four
// invisible characters, appended the way the preview client appends it.
const RUN = '​​​​‌‍﻿​‌‍﻿​';

test('every photo named: the rooms', () => {
  assert.equal(galleryForm([{ caption: 'Sanctuary' }, { caption: 'Kitchen' }]), 'rooms');
});

test('one photo unnamed: the arcade, and no half-labelled row', () => {
  assert.equal(galleryForm([{ caption: 'Sanctuary' }, {}]), 'arcade');
  assert.equal(galleryForm([{ caption: 'Sanctuary' }, { caption: null }]), 'arcade');
});

test('no photos, or no captions at all: the arcade', () => {
  assert.equal(galleryForm([]), 'arcade');
  assert.equal(galleryForm([{}, {}]), 'arcade');
});

test('a caption that is only whitespace does not count', () => {
  assert.equal(hasLabel({ caption: '   ' }), false);
  assert.equal(galleryForm([{ caption: 'Kitchen' }, { caption: ' ' }]), 'arcade');
});

test('stega-safe: an invisible run alone is not a name, and a named caption with a run is', () => {
  assert.equal(hasLabel({ caption: RUN }), false);
  assert.equal(hasLabel({ caption: ` ${RUN}` }), false);
  assert.equal(hasLabel({ caption: `Kitchen${RUN}` }), true);
  assert.equal(
    galleryForm([{ caption: `Sanctuary${RUN}` }, { caption: `Kitchen${RUN}` }]),
    'rooms',
  );
});

test('a null entry in the list reads as unnamed', () => {
  assert.equal(galleryForm([{ caption: 'Sanctuary' }, null]), 'arcade');
});
