// Safe to edit by hand
// The dated hero line. These four cases are the whole contract: a weekday names
// the coming Sunday, a Sunday says Today, and the STATIC form (the one the
// server renders, before any clock is consulted) never carries a date, whether
// the setting reads "Sundays at 10:45 am" or a bare "10:45 am".
import test from 'node:test';
import assert from 'node:assert/strict';
// The `.ts` extension is the repo's convention for these node:test suites (see
// heading-accent.test.ts): node's ESM resolver does not add one.
import {
  clockParts,
  datedSunday,
  formatLiveSunday,
  lineSundayIso,
  liveSundayLine,
  sermonParts,
  sermonText,
  shortSermonTitle,
  curlInnerQuotes,
  sermonTitleSpans,
  staticSunday,
  SERMON_LINE_MAX,
  SERMON_TITLE_MAX,
  SERMON_TITLE_MAX_SM,
  SERMON_TITLE_MAX_LG,
} from './live-sunday.ts';

test('a weekday names the coming Sunday', () => {
  assert.equal(
    formatLiveSunday(new Date(2026, 8, 23), 'Sundays at 10:45 am'),
    'This Sunday, September 27 · Worship at 10:45 am',
  );
});
test('a Sunday says Today', () => {
  assert.equal(
    formatLiveSunday(new Date(2026, 8, 27), 'Sundays at 10:45 am'),
    'Today · Worship at 10:45 am',
  );
});
test('the static form never carries a date', () => {
  assert.equal(staticSunday('Sundays at 10:45 am'), 'Sundays · Worship at 10:45 am');
});
test('a bare time is accepted', () => {
  assert.equal(staticSunday('10:45 am'), 'Sundays · Worship at 10:45 am');
});

// The footer's closing band sets the clock in the titling face (capitals only)
// and the meridiem in the reading face, so "am" reads lower case there too.
test('clockParts splits the meridiem off, lower-case and without dots', () => {
  assert.deepEqual(clockParts('10:45 am'), { clock: '10:45', meridiem: 'am' });
  assert.deepEqual(clockParts('10:45 AM'), { clock: '10:45', meridiem: 'am' });
  assert.deepEqual(clockParts('6:30 P.M.'), { clock: '6:30', meridiem: 'pm' });
  assert.deepEqual(clockParts('10am'), { clock: '10', meridiem: 'am' });
});
test('clockParts leaves a time with no meridiem whole', () => {
  assert.deepEqual(clockParts('10:45'), { clock: '10:45', meridiem: '' });
  assert.deepEqual(clockParts('Mid-morning'), { clock: 'Mid-morning', meridiem: '' });
});

// ── This Sunday's sermon (2026-09-24) ────────────────────────────────────────
// These dates are built with the local Date constructor on purpose: the line
// names the Sunday on the VISITOR's calendar, whatever machine runs the test.

test('lineSundayIso names the coming Sunday, or today on a Sunday', () => {
  assert.equal(lineSundayIso(new Date(2026, 8, 23, 9)), '2026-09-27'); // Wednesday
  assert.equal(lineSundayIso(new Date(2026, 8, 26, 23, 59)), '2026-09-27'); // Saturday, late
  assert.equal(lineSundayIso(new Date(2026, 8, 27, 0, 1)), '2026-09-27'); // Sunday, early
  assert.equal(lineSundayIso(new Date(2026, 8, 27, 23, 59)), '2026-09-27'); // Sunday, late
  assert.equal(lineSundayIso(new Date(2026, 8, 28, 0, 1)), '2026-10-04'); // Monday
  assert.equal(lineSundayIso(new Date(2026, 11, 29)), '2027-01-03'); // across a year
});

test('with a current sermon the line drops the service time', () => {
  assert.deepEqual(liveSundayLine(new Date(2026, 8, 23), 'Sundays at 10:45 am', '2026-09-27'), {
    text: 'This Sunday, September 27',
    sermon: true,
  });
  assert.deepEqual(liveSundayLine(new Date(2026, 8, 27, 9), '10:45 am', '2026-09-27'), {
    text: 'Today',
    sermon: true,
  });
});

test('a stale sermon is dropped and the service time comes back', () => {
  // Monday after the preview's Sunday: the site was not rebuilt.
  assert.deepEqual(liveSundayLine(new Date(2026, 8, 28), 'Sundays at 10:45 am', '2026-09-27'), {
    text: 'This Sunday, October 4 · Worship at 10:45 am',
    sermon: false,
  });
});

test('no sermon: exactly the line as it always was', () => {
  const now = new Date(2026, 8, 23);
  assert.deepEqual(liveSundayLine(now, 'Sundays at 10:45 am', ''), {
    text: formatLiveSunday(now, 'Sundays at 10:45 am'),
    sermon: false,
  });
});

test('the server names the day, true at any moment', () => {
  assert.equal(datedSunday('2026-09-27'), 'Sunday, September 27');
  assert.equal(datedSunday('2027-01-03'), 'Sunday, January 3');
});

test('a short title and reading fit one phone line together', () => {
  const q = sermonParts('Laborers', 'Matthew 20:1-16');
  assert.deepEqual(q, {
    title: '‘Laborers’',
    titleSm: '‘Laborers’',
    titleLg: '‘Laborers’',
    reading: 'Matthew 20:1-16',
    readingOnPhone: true,
  });
  assert.equal(sermonText(q!), '‘Laborers’ · Matthew 20:1-16');
  assert.ok(sermonText(q!).length <= SERMON_LINE_MAX);
});

test('the reading drops on a phone before the title is ever shortened for it', () => {
  // "‘When God Shows Up’ · Jeremiah 29:10-12" is 39 characters: wide screens
  // keep the reading, a phone drops it, the title stays whole.
  const p = sermonParts('When God Shows Up', 'Jeremiah 29:10-12');
  assert.deepEqual(p, {
    title: '‘When God Shows Up’',
    titleSm: '‘When God Shows Up’',
    titleLg: '‘When God Shows Up’',
    reading: 'Jeremiah 29:10-12',
    readingOnPhone: false,
  });
});

test('a title that already names its reading does not repeat it', () => {
  const p = sermonParts('Unequal Grace - Matthew 20:1-16', 'Matthew 20:1-16');
  assert.equal(p?.reading, '');
  assert.equal(p?.readingOnPhone, false);
});

test('no reading at all', () => {
  assert.deepEqual(sermonParts('Hope', ''), {
    title: '‘Hope’',
    titleSm: '‘Hope’',
    titleLg: '‘Hope’',
    reading: '',
    readingOnPhone: false,
  });
});

test('a long title loses its trailing parenthesis first', () => {
  assert.equal(shortSermonTitle('Proclaim (The Way [Discipleship] Goal 2025-2026)'), 'Proclaim');
  assert.equal(shortSermonTitle('Praise (Worship Goal 2025-2026)'), 'Praise');
  // Short enough already: the parenthesis stays.
  assert.equal(shortSermonTitle('Ps (short)'), 'Ps (short)');
});

test('a title still too long is cut at a word, with an ellipsis', () => {
  const t = shortSermonTitle('Ecclesiastes - faith when everything is not enough');
  assert.equal(t, 'Ecclesiastes - faith…');
  assert.ok(t.length <= SERMON_TITLE_MAX);
  // A trailing connective is not left hanging before the ellipsis.
  assert.equal(
    shortSermonTitle('Faith, Hope & Charity: the Greatest Is Love'),
    'Faith, Hope & Charity…',
  );
  // One enormous word is cut mid-word rather than overflowing.
  assert.equal(shortSermonTitle('A'.repeat(40)).length, SERMON_TITLE_MAX);
});

test('quotes around a title are replaced, apostrophes are curled', () => {
  assert.equal(shortSermonTitle(`"God's Power to Rebuild"`), 'God’s Power to Rebuild');
  assert.equal(sermonParts('“Hope”', '')?.title, '‘Hope’');
});

test('a word quoted inside a title takes double quotes; an apostrophe stays one', () => {
  // The line wraps the title in ‘…’, so the inner quotes are “…” (fix/sunday-title-length).
  assert.equal(shortSermonTitle(`Let Your 'Yes' Be Yes`), 'Let Your “Yes” Be Yes');
  assert.equal(shortSermonTitle(`Your 'No,' No`), 'Your “No,” No');
  assert.equal(curlInnerQuotes(`God's 'Don't Worry' Word`), 'God’s “Don’t Worry” Word');
  assert.equal(curlInnerQuotes(`The Disciples' Prayer`), 'The Disciples’ Prayer');
  assert.equal(curlInnerQuotes(`Say "Amen" Twice`), 'Say “Amen” Twice');
});

test('the real YouTube title, at each width', () => {
  const raw = `How to Let Your 'Yes' Be Yes and Your 'No,' No`;
  const p = sermonParts(raw, 'Matthew 21:23-32');
  assert.equal(p?.title, '‘How to Let Your “Yes”…’');
  assert.equal(p?.titleSm, '‘How to Let Your “Yes” Be Yes and Your…’');
  assert.equal(p?.titleLg, '‘How to Let Your “Yes” Be Yes and Your “No,” No’');
  assert.ok((p?.titleSm.length ?? 0) - 2 <= SERMON_TITLE_MAX_SM);
  assert.ok((p?.titleLg.length ?? 0) - 2 <= SERMON_TITLE_MAX_LG);
});

test('a cut never leaves an inner quote open', () => {
  // Cut at 24 this would end "Pray “Thy Kingdom…"; it backs off to before the quote.
  assert.equal(shortSermonTitle(`We Pray 'Thy Kingdom Come, Thy Will Be Done'`), 'We Pray…');
});

test('the title spans: one copy when every width agrees, else one per band', () => {
  const one = sermonParts('Hope', '')!;
  assert.deepEqual(sermonTitleSpans(one), [{ text: '‘Hope’', band: 'all' }]);
  const three = sermonParts(`How to Let Your 'Yes' Be Yes and Your 'No,' No`, '')!;
  assert.deepEqual(
    sermonTitleSpans(three).map((s) => s.band),
    ['phone', 'sm', 'lg'],
  );
  // 30 characters: cut on a phone, whole from 640.
  const two = sermonParts('Faith, Hope and Love Abide Now', '')!;
  assert.deepEqual(sermonTitleSpans(two), [
    { text: '‘Faith, Hope and Love…’', band: 'phone' },
    { text: '‘Faith, Hope and Love Abide Now’', band: 'smUp' },
  ]);
  // The phone and 640 cuts agree, only 1024 differs: two spans, split at lg.
  const lgOnly = { title: '‘A’', titleSm: '‘A’', titleLg: '‘AB’' };
  assert.deepEqual(
    sermonTitleSpans(lgOnly).map((s) => s.band),
    ['belowLg', 'lg'],
  );
});

test('an empty title yields no sermon', () => {
  assert.equal(sermonParts('   ', 'John 3:16'), null);
});
