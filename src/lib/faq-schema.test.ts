// scaffold-file: church
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faqEntries, faqPageNode, portableTextToPlain, type SectionIn } from './faq-schema.ts';
import { validateNode, validatePage } from './schema-vocab.ts';

// A stega run as the preview client appends it (the same run hymn-board.test.ts
// uses): a U+200B prefix and base-4 digits in U+200B/C/D and U+FEFF, which
// matches \s, so an uncleaned string would carry it into the JSON-LD.
const STEGA = '​​​​' + '‌‍﻿​'.repeat(40);

const block = (text: string, extra: Record<string, unknown> = {}) => ({
  _type: 'block',
  style: 'normal',
  children: [{ _type: 'span', text }],
  markDefs: [],
  ...extra,
});

// Two of the Visit page's own questions (scripts/data/pages/faq-entries.json,
// the "What To Expect" category), as the build reads them.
const VISIT: SectionIn[] = [
  { _type: 'heroSection' },
  {
    _type: 'faqSection',
    items: [
      {
        question: 'What should I wear?',
        answer: [
          block(
            'Casual dress is welcome. People wear a variety of styles of clothes from short sleeves (especially in the summer), to suit jackets and “Sunday dresses.”',
          ),
        ],
      },
      {
        question: 'Am I allowed to take the Lord’s Supper (communion?)',
        answer: [
          block(
            'We believe it is the Lord’s table, and all who believe in him and have been baptized may partake.',
          ),
        ],
      },
    ],
  },
];

const URL = 'https://www.fbcmuncie.org/visit';

test('portableTextToPlain joins spans, separates paragraphs and keeps list items together', () => {
  const answer = [
    { _type: 'block', children: [{ text: 'We have ' }, { text: 'a wheelchair-accessible door.' }] },
    block('An elevator', { listItem: 'bullet' }),
    block('Two accessible bathrooms', { listItem: 'bullet' }),
    { _type: 'image', asset: { _ref: 'image-x' } },
    block('   '),
    block('Ask a greeter.'),
  ];
  assert.equal(
    portableTextToPlain(answer),
    'We have a wheelchair-accessible door.\n\n- An elevator\n- Two accessible bathrooms\n\nAsk a greeter.',
  );
  assert.equal(portableTextToPlain(null), '');
  assert.equal(portableTextToPlain([]), '');
});

test('faqPageNode builds one FAQPage from the page’s own question band, and it validates', () => {
  const node = faqPageNode(VISIT, URL);
  assert.ok(node);
  assert.equal(node['@type'], 'FAQPage');
  assert.equal(node['@id'], `${URL}#faq`);
  const qs = node.mainEntity as Array<Record<string, any>>;
  assert.equal(qs.length, 2);
  assert.equal(qs[0].name, 'What should I wear?');
  assert.equal(qs[0].acceptedAnswer['@type'], 'Answer');
  assert.match(qs[0].acceptedAnswer.text, /^Casual dress is welcome\./);
  assert.deepEqual(validateNode(node), []);
  assert.deepEqual(validatePage([node]), []);
});

test('a page with no question band, or only empty questions, gets no FAQPage', () => {
  assert.equal(faqPageNode([{ _type: 'heroSection' }], URL), null);
  assert.equal(faqPageNode(null, URL), null);
  assert.equal(
    faqPageNode(
      [
        {
          _type: 'faqSection',
          items: [
            { question: 'Unanswered?', answer: [] },
            { question: '', answer: [block('x')] },
          ],
        },
      ],
      URL,
    ),
    null,
  );
});

test('two question bands make ONE FAQPage, in page order, a repeated question kept once', () => {
  const second: SectionIn = {
    _type: 'faqSection',
    items: [
      { question: 'what should I wear?', answer: [block('A second copy.')] },
      { question: 'Can children bring an offering?', answer: [block('Absolutely!')] },
    ],
  };
  const entries = faqEntries([...VISIT, second]);
  assert.deepEqual(
    entries.map((e) => e.question),
    [
      'What should I wear?',
      'Am I allowed to take the Lord’s Supper (communion?)',
      'Can children bring an offering?',
    ],
  );
  assert.equal(entries[0]?.answer.startsWith('Casual dress'), true);
});

test('stega markers never reach the JSON-LD (a preview read)', () => {
  const stega: SectionIn[] = [
    {
      _type: 'faqSection',
      items: [
        {
          question: 'What should I wear?' + STEGA,
          answer: [block('Casual dress is ' + STEGA + 'welcome.' + STEGA)],
        },
      ],
    },
  ];
  const [entry] = faqEntries(stega);
  assert.equal(entry?.question, 'What should I wear?');
  assert.equal(entry?.answer, 'Casual dress is welcome.');
});

test('the validator refuses an FAQPage Google would reject', () => {
  const bad = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Q?' },
      { '@type': 'Question', acceptedAnswer: { '@type': 'Answer' } },
    ],
  };
  const errors = validateNode(bad);
  assert.ok(errors.some((e) => e.includes('needs an acceptedAnswer')));
  assert.ok(errors.some((e) => e.includes('needs a name')));
  assert.ok(errors.some((e) => e.includes('an Answer needs text')));
});
