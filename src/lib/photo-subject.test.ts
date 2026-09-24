import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoSubject } from './photo-subject.ts';

const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);

test('a description that names a person is people', () => {
  for (const alt of [
    'Children sit on the chancel steps around Kendall as she reads to them',
    'The congregation standing to sing on a Sunday morning',
    'A sleeping newborn baby wrapped in a pink crocheted blanket.',
    'The handbell choir rehearsing',
    'A bride and groom kiss on the church steps',
    'Kendall Ellis smiles for a staff portrait',
    'Two teens speaking to the youth group on stage',
  ]) {
    assert.equal(photoSubject(alt), 'people', alt);
  }
});

test('a description of the building or a room is a place', () => {
  for (const alt of [
    'The limestone bell tower of First Baptist Church against a blue sky',
    'A pair of modern glass entry doors sit beneath a carved stone archway at the church entrance.',
    'The fellowship hall',
    'The youth center',
    'The bridal suite lounge',
    '',
  ]) {
    assert.equal(photoSubject(alt), 'place', alt);
  }
  assert.equal(photoSubject(null), 'place');
  assert.equal(photoSubject(undefined), 'place');
});

test('the subject is read on the stega-cleaned alt', () => {
  assert.equal(photoSubject('Two girls in front of a window' + STEGA), 'people');
  assert.equal(photoSubject('The tower' + STEGA), 'place');
});
