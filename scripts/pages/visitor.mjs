// scripts/pages/visitor.mjs
//
// The Visitor gets a page of its own at /visitor (2026-09-24, feat/the-visitor;
// Nathan's decision). Until now every issue sat in the "#publications" list at
// the foot of /blog (scripts/pages/blog.mjs); the issues move here, the two
// books follow them in a smaller list below, and /blog keeps one line pointing
// at this page, anchored "publications" so an old /blog#publications link
// still lands on it.
//
// Five things about this file are deliberate.
//
// 1. TWO DOCUMENT LISTS, NO NEW SCHEMA. The page is two documentListSection
//    blocks. The first holds only issues, each titled with its month, dated
//    with its year and carrying its PDF, and that shape is what makes
//    DocumentList draw it as The Visitor's page (the latest issue large, then
//    a wall of covers by year; src/lib/visitor-issues.ts isIssueList). Nothing
//    is flagged: add an issue in the Studio the same way (month, year, PDF) and
//    it is the latest the moment it is the newest.
//
// 2. THE LATEST ISSUE IS DERIVED, NEVER STORED (CLAUDE.md rule 15). The old
//    list carried a "Current Visitor" row with a note, "The latest issue";
//    here the latest is whichever issue is newest, and the label "Latest
//    issue" is drawn by the component. The file the Wix site called "Download
//    Latest Issue" is titled with the month its own cover prints.
//
// 3. EACH ISSUE'S DATE COMES FROM THE CHURCH'S OWN MATERIAL. The button's
//    month, the file's build date and the month and year printed on the
//    cover, combined by scripts/lib/visitor-dates.mjs (read its header). The
//    cover is read here from the archived PDF with pdfjs. This settles the two
//    questions blog.mjs had to leave open (the latest issue's month and the
//    undated June's year) and turns up one disagreement, which is on the
//    confirm list below with the rest of the dates.
//
// 4. COVERS ARE NOT UPLOADED. The covers on the page are drawn from each PDF
//    at build time (scripts/visitor-covers.mjs), keyed by the file's asset id,
//    so this module writes exactly what the old list wrote: month, year, file.
//
// 5. "Journey Down Jefferson Street" HAS NO LINK ON PURPOSE. The church's own
//    sentence says the copies are in the church library, and the capture gives
//    no URL for it. A row with no link renders as plain text in DocumentList,
//    which is the honest rendering of "come and borrow it".

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MONTHS,
  monthIndexOf,
  pdfCreated,
  coverDate,
  resolveIssueDate,
} from '../lib/visitor-dates.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const archive = resolve(root, '..', 'fbcm-archive', 'files');

export default {
  id: 'page-visitor',
  type: 'page',
  slug: 'visitor',

  // Every sentence on this page that is not the church's own.
  newCopy: [
    'Two books (heading of the books list)',
    'Latest issue (label over the newest issue, drawn by the page, not stored)',
    'Read this issue (the newest issue’s button, drawn by the page)',
    'Past issues (heading over the wall of covers, drawn by the page)',
    'The Visitor · September 2026 issue · Read it (the home page’s slim band, drawn by code from the newest issue; the month and year change with it)',
    'The Visitor, the newsletter of First Baptist Church Muncie since 1946: features, church life, and articles from church members and pastoral staff. (search description, not shown on the page)',
  ],

  edits: [
    'Cut: the church’s introduction on the publications page ("Below you can find “The Visitor,” our church newsletter filled with features, information about church life, and articles from both church members and pastoral staff. It has been published since 1946.") is carried on the page as the short line over the heading, "Our church newsletter since 1946". The words are theirs; the rest of the paragraph is in the search description.',
    'Corrected: the two issues the Wix buttons label "Feburary" are titled "February". It is a typo in a button label, not a word of the church’s own prose.',
    'Dropped: the "Other Updates" block from publications.txt (Church Connect sign-up and "see our Blog"). The first belongs on a page about the app, and the blog links here, not the other way round.',
    'Renamed: the "Download Latest Issue" button becomes an issue like the others, titled with the month and year printed on its own cover. The page labels whichever issue is newest "Latest issue".',
  ],

  confirm: [
    'Which month and year each issue of The Visitor is. The Wix page gave each file a month ' +
      'but not a year. Each issue is now dated from three things the church made: the ' +
      'button’s month, the PDF’s own build date, and the month and year printed on its cover ' +
      '(scripts/lib/visitor-dates.mjs). Every cover agrees with the button except one: the ' +
      'file the button calls "August" (2024) prints "September 2024" on page 1, beside a separate ' +
      'September 2024 issue; it stays August 2024 until the church says otherwise. The file ' +
      'the Wix site called "Download Latest Issue" prints September 2026 on its cover, so it is ' +
      'now titled September 2026 and is the latest issue, and the June with no build date prints ' +
      'June 2022. Please check the years on the page.',
  ],

  // Covers of a newsletter, drawn from the church's own PDFs. The cover
  // photographs are the church's own publication; no new photograph is placed.
  photoConsent: [],

  async build(ctx) {
    const { copy } = ctx;
    const { decodeEntities } = copy;

    // -- The issues --------------------------------------------------------
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

    // pdfjs only for the cover's masthead: page 1's text. Imported here, not
    // at the top, so listing the modules never loads it.
    const { withPdf, pageText } = await import('../lib/pdf-pages.mjs');

    const issues = [];
    const dating = [];
    for (const link of pdfLinks) {
      const text = decodeEntities(String(link.text ?? '')).trim();
      const localFile = localFor.get(link.href);
      if (!localFile) {
        throw new Error(
          `visitor.mjs: ${link.href} is linked from publications but is not in ` +
            'scripts/data/files-manifest.json, so there is no archived copy to upload.',
        );
      }
      const bytes = readFileSync(resolve(archive, localFile));
      const created = pdfCreated(bytes);
      let cover = null;
      try {
        cover = coverDate(await withPdf(bytes, (doc) => pageText(doc, 1)));
      } catch (err) {
        // A PDF pdfjs cannot open is dated by its button and build date alone.
        dating.push(`  ! ${localFile}: pdfjs could not read page 1 (${err.message})`);
      }
      const named = monthIndexOf(text);
      const date = resolveIssueDate({ named, created, cover });
      if (date.month === undefined || date.year === undefined) {
        throw new Error(
          `visitor.mjs: "${text}" (${localFile}) cannot be dated: ${date.basis}. An issue is ` +
            'never given a month or year nobody printed.',
        );
      }
      dating.push(
        `  ${`${MONTHS[date.month]} ${date.year}`.padEnd(15)} button "${text}", built ${
          created ? `${created.year}-${String(created.month + 1).padStart(2, '0')}` : 'never'
        }, cover ${cover ? `${MONTHS[cover.month]} ${cover.year}` : 'unread'} (${date.basis})`,
      );
      if (date.conflict) dating.push(`    ! ${date.conflict}`);
      issues.push({ month: date.month, year: date.year, localFile });
    }

    if (issues.length === 0) {
      throw new Error(
        'visitor.mjs: no issues of The Visitor are linked from scripts/data/pages/publications.json.',
      );
    }

    // Two files for one month would be two "June 2026" doors; stop and say so.
    const seen = new Map();
    for (const i of issues) {
      const k = `${i.year}-${i.month}`;
      if (seen.has(k)) {
        throw new Error(
          `visitor.mjs: ${MONTHS[i.month]} ${i.year} is both ${seen.get(k)} and ${i.localFile}.`,
        );
      }
      seen.set(k, i.localFile);
    }

    // Newest first. The page sorts by date itself (visitor-issues.ts), so this
    // order is only what an editor sees in the Studio: the newest at the top.
    issues.sort((a, b) => b.year - a.year || b.month - a.month);

    console.log(`  The Visitor, ${issues.length} issues, dated:`);
    for (const line of dating) console.log(line);

    // The uploader caches asset ids in scripts/.asset-map.json by path, so every
    // issue re-uses the asset blog.mjs uploaded and nothing is uploaded again.
    const { client, makeUploader } = await import('../lib/sanity-lib.mjs');
    const { uploadClient } = await import('../lib/dry-run-upload.mjs');
    const uploadPdf = async (file) => {
      const path = `../fbcm-archive/files/${file}`;
      return {
        _type: 'file',
        asset: {
          _type: 'reference',
          _ref: await makeUploader(uploadClient(client, 'visitor.mjs', path)).uploadFile(path),
        },
      };
    };

    const issueDocs = [];
    for (const issue of issues) {
      issueDocs.push({
        _type: 'listedDocument',
        _key: `issue-${issue.year}-${String(issue.month + 1).padStart(2, '0')}`,
        title: MONTHS[issue.month],
        year: issue.year,
        file: await uploadPdf(issue.localFile),
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
          `visitor.mjs: "${phrase}" is not in scripts/data/pages/publications.txt any more`,
        );
      }
      return decodeEntities(found).trim();
    };
    lineWith('The Story Project');
    lineWith('Journey Down Jefferson Street');
    lineWith('It has been published since 1946');

    const clayLink = (capture.links ?? []).find((l) =>
      /amazon|bookshop|lulu|barnesandnoble/i.test(l.href ?? ''),
    );

    const books = [
      {
        _type: 'listedDocument',
        _key: 'book-clay',
        title: 'We Are the Clay: God Molding Lives at First Baptist Church',
        year: 2019,
        ...(clayLink ? { url: clayLink.href } : {}),
        note: 'Testimonies written by church members, edited by Julie Downey Davis',
      },
      {
        _type: 'listedDocument',
        _key: 'book-journey',
        title:
          'Journey Down Jefferson Street: A History of the First Baptist Church of Muncie, Indiana',
        note: 'By Dr. William G. Eidson. Several copies are in the church library',
      },
    ];

    return {
      title: 'The Visitor',
      slug: { _type: 'slug', current: 'visitor' },
      // Nathan, 2026-09-24: not in the main menu. The footer lists it, through
      // this page's own "Show in the footer" switch (Footer.astro reads it), so
      // no Site settings write is needed.
      addToMainNav: false,
      addToFooter: true,

      pageBuilder: [
        // 1. The issues. Opens the page, so its heading is the page's h1
        //    (SectionRenderer openingLevel). The short line over it is the
        //    church's own description, cut (edits above).
        {
          _type: 'documentListSection',
          _key: 'visitor-issues',
          anchor: { _type: 'slug', current: 'issues' },
          eyebrow: 'Our church newsletter since 1946',
          heading: 'The Visitor',
          docs: issueDocs,
        },
        // 2. The two books, smaller: two rows, the ruled-list form.
        {
          _type: 'documentListSection',
          _key: 'visitor-books',
          anchor: { _type: 'slug', current: 'books' },
          heading: 'Two books',
          docs: books,
        },
      ],

      seoTitle: 'The Visitor | First Baptist Church Muncie',
      seoDescription:
        'The Visitor, the newsletter of First Baptist Church Muncie since 1946: features, church life, and articles from church members and pastoral staff.',
    };
  },
};
