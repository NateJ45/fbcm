// scripts/pages/blog.mjs
//
// The journalPage singleton: the /blog hero, the closing band, and the one
// editable zone on that page, which is the "#publications" document list.
//
// The archive itself is not seeded and cannot be: the featured six, this week's
// sermon preview, the twelve pages, the five category pages and the 196 tag
// pages are all DERIVED from the 142 journalEntry documents at build time
// (src/lib/blog-derive.ts). There is nothing here for an editor to keep true by
// hand, which is the point (CLAUDE.md rule 15).
//
// Four things about this file are deliberate.
//
// 1. THE PUBLICATIONS LIST IS THE OLD /publications PAGE, MOVED. The Wix site
//    had a whole page for The Visitor and the two books; spec 5.10 puts it at
//    the bottom of the blog instead, because a newsletter archive and a post
//    archive are the same errand. Every issue is uploaded from
//    ../fbcm-archive/files/ through the shared uploader, so the PDFs are served
//    from this site and the Wix URLs can die.
//
// 2. THE YEAR ON EACH ISSUE IS DERIVED FROM THE FILE, NOT TYPED. The capture
//    records each issue's MONTH (the button said "December") but not its year:
//    the years were headings in a Wix widget and the association did not
//    survive. So the year is read out of the PDF's own /CreationDate and
//    snapped to the nearest occurrence of the named month. A December issue
//    built on 2023-11-28 is December 2023; a January issue built on 2020-12-30
//    is January 2021. It is an inference, it is on the confirm list below, and
//    it is reproducible: the rule is twelve lines and it runs every seed.
//
// 3. NO MONTH OR YEAR IS INVENTED WHEN THE SOURCE DOES NOT CARRY ONE. One June
//    issue's PDF has no /CreationDate at all: it seeds undated, and
//    sortDocsByYearDesc puts undated rows last. The current issue's button
//    names no month, so it keeps the church's own heading, "Current Visitor",
//    rather than being given a month from its build date (a quarterly is
//    typeset the month before it is dated, so that guess would be wrong as
//    often as right).
//
//    The list is handed over newest first, year then month, and that ORDER IS
//    LOAD-BEARING: sortDocsByYearDesc keeps the given order inside a year, so
//    the twelve 2020 issues read December to January instead of alphabetically.
//
// 4. "Journey Down Jefferson Street" HAS NO LINK ON PURPOSE. The church's own
//    sentence says the copies are in the church library, and the capture gives
//    no URL for it. A row with no link renders as plain text in DocumentList,
//    which is the honest rendering of "come and borrow it".

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * The capture spells two Februaries "Feburary". That is a typo in a button
 * label, not a word of the church's own prose, so it is corrected here and
 * declared in `edits`.
 */
const SPELLING = { Feburary: 'February' };

/** The month index a link's text names, or -1 when it names no month. */
function monthIndexOf(text) {
  const fixed = SPELLING[text] ?? text;
  return MONTHS.indexOf(fixed);
}

/** The PDF's own /CreationDate as { year, month } (month 0-11), or null. */
function pdfCreated(absPath) {
  const raw = readFileSync(absPath).toString('latin1');
  const m = raw.match(/\/CreationDate\s*\(D:(\d{4})(\d{2})/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1 };
}

/**
 * The year an issue named `monthIndex` belongs to, given the date its PDF was
 * built. A newsletter is typeset in the weeks around its own cover date, so the
 * answer is whichever occurrence of that month sits closest to the build date.
 * That is what turns a January issue built on 30 December into January of the
 * NEXT year, which is the case this rule exists for.
 */
export function issueYear(monthIndex, created) {
  if (!created || monthIndex < 0) return undefined;
  const candidates = [created.year - 1, created.year, created.year + 1];
  let best = candidates[1];
  let bestGap = Infinity;
  for (const year of candidates) {
    const gap = Math.abs((year - created.year) * 12 + (monthIndex - created.month));
    if (gap < bestGap) {
      bestGap = gap;
      best = year;
    }
  }
  return best;
}

export default {
  id: 'journalPage',
  type: 'journalPage',
  slug: 'blog',

  // Every sentence on this page that is not the church's own.
  newCopy: [
    'Writing from First Baptist. (hero headline)',
    'Sermon previews for the coming Sunday, news from around the church, and longer pieces from the pastors. (hero subhead, one sentence)',
    'The Visitor and two books (publications heading)',
    'Come and see for yourself. (closing band headline)',
    'Sermon previews, church news and writing from the pastors of First Baptist Church Muncie. (search description)',
  ],

  edits: [
    'Corrected: the two issues the Wix buttons label "Feburary" are seeded as "February". It is a typo in a button label, not a word of the church\'s own prose.',
    'Renamed: the "Download Latest Issue" button becomes an issue row like the others, titled with its month, under the church\'s own heading for it ("Current Visitor") on publications.txt line 9. The old label described the button, not the issue.',
    'Dropped: the "Other Updates" block from publications.txt (Church Connect sign-up and "see our Blog"). The first belongs on a page about the app and the second points at the page this list now lives on.',
  ],

  confirm: [
    'Which year each issue of The Visitor belongs to. The Wix capture records the MONTH of ' +
      'each issue (the button read "December") but not the year: the years were headings in a ' +
      'Wix widget and the association did not survive the capture. Each year here is derived ' +
      "from the PDF's own creation date, snapped to the nearest occurrence of the named month " +
      '(a December issue built on 2023-11-28 is December 2023; a January issue built on ' +
      '2020-12-30 is January 2021). One June issue carries no creation date at all and is ' +
      'seeded undated. Please check the years on the list, and tell us the year of the undated June.',
  ],

  // No photograph of people on this page: the hero is the sanctuary interior.
  photoConsent: [],

  async build(ctx) {
    const { copy, images, settings } = ctx;
    const { ctaInternal, decodeEntities } = copy;

    if (!settings) {
      throw new Error(
        'blog.mjs: siteSettings is not available. The closing band reads the service time and ' +
          'the address off it rather than retyping them (CLAUDE.md rule 15).',
      );
    }

    const hero = await images.image('hero-sanctuary');
    if (!hero) throw new Error('blog.mjs: no photo in the manifest for "hero-sanctuary"');

    const addressLines = String(settings.address ?? '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (addressLines.length < 2) {
      throw new Error('blog.mjs: siteSettings.address needs a street line and a city/state line.');
    }
    const [streetLine, cityLine] = addressLines;

    // -- The Visitor -------------------------------------------------------
    // Read from the capture, never from a list typed here: a file that stops
    // being linked from the church's own page stops being seeded.
    const capture = JSON.parse(
      readFileSync(resolve(root, 'scripts', 'data', 'pages', 'publications.json'), 'utf8'),
    );
    const manifest = JSON.parse(
      readFileSync(resolve(root, 'scripts', 'data', 'files-manifest.json'), 'utf8'),
    );
    const localFor = new Map(manifest.files.map((f) => [f.href, f.localFile]));

    const pdfLinks = (capture.links ?? []).filter((l) => /\.pdf(\?|$)/i.test(l.href ?? ''));
    const issues = [];
    for (const link of pdfLinks) {
      const text = decodeEntities(String(link.text ?? '')).trim();
      // "Download Latest Issue" is the current quarter's issue under the
      // church's own "Current Visitor" heading; its month comes from its file.
      const named = monthIndexOf(text);
      const localFile = localFor.get(link.href);
      if (!localFile) {
        throw new Error(
          `blog.mjs: ${link.href} is linked from publications but is not in ` +
            'scripts/data/files-manifest.json, so there is no archived copy to upload.',
        );
      }
      const created = pdfCreated(resolve(root, '..', 'fbcm-archive', 'files', localFile));
      if (named < 0) {
        // "Download Latest Issue" names no month, and the file's build date does
        // not either (a quarterly issue is typeset the month before it is
        // dated). So it keeps the church's OWN heading for it, publications.txt
        // line 9, and is not given a month nobody stated.
        if (!created) {
          throw new Error(
            `blog.mjs: "${text}" (${localFile}) names no month and its PDF carries no creation ` +
              'date, so there is nothing to title the row with.',
          );
        }
        issues.push({
          title: 'Current Visitor',
          year: created.year,
          month: 12,
          localFile,
          note: 'The latest issue',
        });
        continue;
      }
      issues.push({
        title: MONTHS[named],
        year: issueYear(named, created),
        month: named,
        localFile,
      });
    }

    if (issues.length === 0) {
      throw new Error(
        'blog.mjs: no issues of The Visitor are linked from scripts/data/pages/publications.json ' +
          'any more. If that is right, delete this check and seed the two books only.',
      );
    }

    // Newest first, year then month. This order is LOAD-BEARING: DocumentList
    // sorts by year and keeps the given order inside a year
    // (sortDocsByYearDesc), so December 2020 reading before January 2020 on the
    // page is decided right here.
    issues.sort(
      (a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity) || (b.month ?? -1) - (a.month ?? -1),
    );

    // The uploader caches asset ids in scripts/.asset-map.json by path, so a
    // second run re-uses every asset and uploads nothing. Imported lazily
    // because sanity-lib.mjs exits the process without a write token, and an
    // offline plan run must still be able to load this module. (An offline run
    // never reaches here: images.image() above has already thrown.)
    const { client, makeUploader } = await import('../lib/sanity-lib.mjs');
    const uploader = makeUploader(client);
    const uploadPdf = async (file) => ({
      _type: 'file',
      asset: {
        _type: 'reference',
        _ref: await uploader.uploadFile(`../fbcm-archive/files/${file}`),
      },
    });

    const docs = [];
    let n = 0;
    for (const issue of issues) {
      n += 1;
      docs.push({
        _type: 'listedDocument',
        _key: `visitor-${n}`,
        title: issue.title,
        ...(issue.year ? { year: issue.year } : {}),
        file: await uploadPdf(issue.localFile),
        ...(issue.note ? { note: issue.note } : {}),
      });
    }

    // -- The two books -----------------------------------------------------
    // Both sentences below are the church's own, read out of the capture by
    // anchor phrase so a rewrite fails the run instead of seeding silently.
    const lineWith = (phrase) => {
      const found = copy
        .textFile('publications')
        .split(/\r?\n/)
        .find((l) => l.includes(phrase));
      if (found === undefined) {
        throw new Error(
          `blog.mjs: "${phrase}" is not in scripts/data/pages/publications.txt any more`,
        );
      }
      return decodeEntities(found).trim();
    };
    // Confirms the two book sentences are still where this page reads them.
    lineWith('The Story Project');
    lineWith('Journey Down Jefferson Street');

    const clayLink = (capture.links ?? []).find((l) =>
      /amazon|bookshop|lulu|barnesandnoble/i.test(l.href ?? ''),
    );

    docs.push({
      _type: 'listedDocument',
      _key: 'book-clay',
      title: 'We Are the Clay: God Molding Lives at First Baptist Church',
      year: 2019,
      ...(clayLink ? { url: clayLink.href } : {}),
      note: 'Testimonies written by church members, edited by Julie Downey Davis',
    });
    docs.push({
      _type: 'listedDocument',
      _key: 'book-journey',
      title:
        'Journey Down Jefferson Street: A History of the First Baptist Church of Muncie, Indiana',
      note: 'By Dr. William G. Eidson. Several copies are in the church library',
    });

    return {
      heroEyebrow: 'Blog',
      heroHeadline: 'Writing from First Baptist.',
      heroSubhead:
        'Sermon previews for the coming Sunday, news from around the church, and longer pieces from the pastors.',
      heroImage: hero,

      additionalSections: [
        {
          _type: 'documentListSection',
          _key: 'blog-publications',
          anchor: { _type: 'slug', current: 'publications' },
          eyebrow: 'Publications',
          heading: 'The Visitor and two books',
          docs,
        },
      ],

      finalCtaHeadline: 'Come and see for yourself.',
      finalCtaSubhead: `${settings.serviceTime}. ${streetLine}, ${cityLine}.`,
      finalCta: ctaInternal('Plan a visit', 'visit'),

      seoTitle: 'Blog | First Baptist Church Muncie',
      seoDescription:
        'Sermon previews, church news and writing from the pastors of First Baptist Church Muncie.',
    };
  },
};
