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
    'Two teens singing into microphones in front of the youth group',
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
    'The family room, with rocking chairs and toys',
    "The pastor's study",
    "The children's wing hallway",
    'The party room set for a shower',
    '',
  ]) {
    assert.equal(photoSubject(alt), 'place', alt);
  }
  assert.equal(photoSubject(null), 'place');
  assert.equal(photoSubject(undefined), 'place');
});

test('a name and a role is a person (a staff portrait, 2026-09-25)', () => {
  assert.equal(photoSubject("Ella Mae Lemen, the church's wedding coordinator"), 'people');
  assert.equal(photoSubject('Cynthia Smith, Worship Arts Director'), 'people');
  assert.equal(photoSubject('A portrait of the church secretary'), 'people');
  assert.equal(photoSubject("The director's office"), 'place');
  assert.equal(photoSubject("The secretary's office, with the copier"), 'place');
});

test('a room word does not hide people who are really there', () => {
  assert.equal(photoSubject('Two girls laughing in the family room'), 'people');
  assert.equal(photoSubject("Children playing in the children's wing"), 'people');
});

test('the subject is read on the stega-cleaned alt', () => {
  assert.equal(photoSubject('Two girls in front of a window' + STEGA), 'people');
  assert.equal(photoSubject('The tower' + STEGA), 'place');
});
