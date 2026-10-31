// Safe to edit by hand
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { churchFacts, officeLines } from './church-facts.ts';

const settings = {
  title: 'First Baptist Church',
  address: '1 Example Street\nMuncie, IN 47305',
  phone: '(765) 555-0100',
  email: 'office@example.org',
};

test('maps the Site settings strings into confirmed facts with no hours', () => {
  const f = churchFacts(settings, { latitude: 40.1, longitude: -85.3 });
  assert.equal(f.address?.street, '1 Example Street');
  assert.equal(f.address?.city, 'Muncie');
  assert.equal(f.address?.state, 'IN');
  assert.equal(f.address?.zip, '47305');
  assert.equal(f.address?.confirmed, true);
  assert.deepEqual(f.address?.geo, { lat: 40.1, lng: -85.3 });
  assert.equal(f.place, 'Muncie, IN');
  assert.equal(f.phone?.confirmed, true);
  assert.equal(f.phone?.href, 'tel:+17655550100');
  assert.equal(f.email?.confirmed, true);
  assert.equal(f.hasHours, false);
});

test('the office directions link wins over the built maps search, only when https', () => {
  const own = churchFacts({ ...settings, directionsUrl: 'https://maps.example.com/x' });
  assert.equal(own.address?.mapsUrl, 'https://maps.example.com/x');
  const bad = churchFacts({ ...settings, directionsUrl: 'javascript:alert(1)' });
  assert.match(bad.address?.mapsUrl ?? '', /^https:\/\/www\.google\.com\/maps/);
});

test('nothing typed gives no facts', () => {
  const f = churchFacts(null);
  assert.equal(f.address, null);
  assert.equal(f.phone, null);
  assert.equal(f.email, null);
});

test('office hours come back as the lines typed', () => {
  const block = (text: string, key: string) => ({
    _type: 'block',
    _key: key,
    children: [{ _type: 'span', text }],
  });
  assert.deepEqual(
    officeLines([
      block('Monday to Thursday: 9 am to 4 pm', 'a'),
      block('Closed on holidays.', 'b'),
    ]),
    ['Monday to Thursday: 9 am to 4 pm', 'Closed on holidays.'],
  );
  assert.deepEqual(officeLines(null), []);
});
