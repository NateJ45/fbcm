import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doorPlace, doorPlan, doorPinId, doorRowId } from './door-plan.ts';

// The Visit page's three doors, as scripts/pages/visit.mjs seeds them.
const VISIT_DOORS = [
  {
    name: 'Adams Street circular drive',
    body: 'Our wheelchair accessible entrance is off our circular drive, on the Adams street side of the building.',
  },
  {
    name: 'The wooden front doors',
    body: 'The large wooden front doors which go into the sanctuary.',
  },
  {
    name: 'Jefferson Street side doors',
    body: 'The Jefferson Street side doors which enter our main hallway near the church offices.',
  },
];
const VISIT_ITEMS = [
  {
    label: 'Find us',
    big: '309 East Adams',
    body: 'Our parking lot is located on the Adams Street side.',
  },
  { label: 'Assisted Listening', body: 'please ask one of our greeters' },
];

test('each Visit door is placed by its own words', () => {
  assert.deepEqual(VISIT_DOORS.map(doorPlace), ['drive', 'front', 'jefferson']);
});

test('the Visit band gets a plan with three pins and the parking lot', () => {
  assert.deepEqual(doorPlan(VISIT_DOORS, VISIT_ITEMS), {
    pins: [
      { n: 1, place: 'drive' },
      { n: 2, place: 'front' },
      { n: 3, place: 'jefferson' },
    ],
    parking: true,
  });
});

test('pins keep the list numbers when the order changes', () => {
  const plan = doorPlan([VISIT_DOORS[2], VISIT_DOORS[0]], []);
  assert.deepEqual(plan?.pins, [
    { n: 1, place: 'jefferson' },
    { n: 2, place: 'drive' },
  ]);
  assert.equal(plan?.parking, false);
});

test('a door whose words say nothing is listed but not pinned', () => {
  const plan = doorPlan([VISIT_DOORS[0], { name: 'The fellowship hall door' }, VISIT_DOORS[2]]);
  assert.deepEqual(
    plan?.pins.map((p) => p.n),
    [1, 3],
  );
});

test('fewer than two placed doors, no plan', () => {
  assert.equal(doorPlan([VISIT_DOORS[0]]), null);
  assert.equal(doorPlan([{ name: 'North door' }, { name: 'South door' }]), null);
  assert.equal(doorPlan([]), null);
});

test('two doors pointing at one place get one pin', () => {
  const plan = doorPlan([VISIT_DOORS[1], { name: 'Sanctuary doors' }, VISIT_DOORS[2]]);
  assert.deepEqual(
    plan?.pins.map((p) => `${p.n}:${p.place}`),
    ['1:front', '3:jefferson'],
  );
});

test('stega markers do not hide the words (preview)', () => {
  const stega = String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff).repeat(8);
  assert.equal(doorPlace({ name: `Adams Street circular${stega} drive` }), 'drive');
  assert.equal(doorPlace({ name: `Adams Street circular drive${stega}` }), 'drive');
});

test('anchor ids', () => {
  assert.equal(doorRowId('page-3', 2), 'page-3-door-2');
  assert.equal(doorPinId('page-3', 2), 'page-3-pin-2');
});
