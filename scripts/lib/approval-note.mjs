// scripts/lib/approval-note.mjs
//
// Pure rendering for docs/superpowers/notes/2026-09-19-copy-for-church-approval.md.
// Extracted out of scripts/seed-pages.mjs so it can be unit-tested without
// touching disk, Sanity, or the CLI's --only filtering, and so the CHROME
// SECTIONS below have exactly one definition.
//
// THE BUG THIS FILE FIXES (2026-09-24): seed-pages.mjs's approval-note writer
// only ever knew about page modules (scripts/pages/*.mjs) and the constant
// FACTS_TO_CONFIRM. "Site footer (every page)" and "Header and mobile menu
// (every page)" carry copy that belongs to NO page module (the footer credit,
// the "Watch live" / "Live now" labels: UI strings, not a page's pageBuilder),
// so nobody generated them. They were typed straight into the committed note
// by hand across three commits, and the note is regenerated from scratch on
// EVERY run (dry or wet, --only or full, per the "ONE APPROVAL NOTE"
// guarantee in seed-pages.mjs's header) — so the next run of ANYTHING wiped
// them silently. It was never actually about --only: a bare `node
// scripts/seed-pages.mjs` with no flags reproduces the same 17-line loss.
//
// THE FIX. CHROME_SECTIONS below is a code constant, the same move already
// used for FACTS_TO_CONFIRM: copy that has no Sanity document behind it lives
// here, in the generator, instead of surviving only as hand-typed prose in a
// generated file. It costs nothing to keep current (no network, no Sanity
// project needed) and it is now impossible for a run to "forget" it, because
// renderApprovalNote() always emits it, independent of which page modules the
// caller passed in. That is also why this file takes `mods` as a plain array
// rather than reading scripts/pages/ itself: seed-pages.mjs already computes
// `all` (every non-hidden page module, regardless of --only) once, and this
// function trusts that input rather than re-deriving it, so there is exactly
// one place that decides "all page modules" and one place that decides
// "chrome copy", and neither can partially update without the other noticing
// in a test.
export const CHROME_SECTIONS = [
  {
    heading: 'Site footer (every page)',
    newCopy: [
      'An American Baptist congregation in downtown Muncie since 1859. (the footer\'s bottom line, under Praise & Proclaim; built from "We Are American Baptists" on Beliefs, and "Founded in 1859" and "downtown Muncie" on History)',
      '"Designed by Nixon Creative Studio" (the base rail\'s credit, always shown; Site settings\' footer credit overrides it). Approved by Nathan 2026-09-24.',
    ],
    // No `edits` key at all: the footer section has never carried an "Edits
    // to the church's own text" heading (there is no church text in it to
    // edit), and that is a real difference from a page module, whose edits
    // section prints even when empty (a "(none: ...)" fallback line). Adding
    // one here would be a cosmetic change to a note this file must reproduce
    // byte-for-byte, not a fix.
  },
  {
    heading: 'Header and mobile menu (every page)',
    newCopy: [
      '"Watch live", and "Live now" during the Sunday service (the link to the live stream beside Give). UI labels, approved by Nathan 2026-09-24.',
    ],
    edits: ["(none: the goals' names and small lines are Who We Are's own)"],
  },
  // The next two were typed into the note by hand on 2026-09-24 (the
  // craft-details and scripture-search branches) and the next seed-pages run
  // wiped them, the same loss the header of this file describes. Moved here
  // the same day (the local search pass), word for word: the Visit sketch is a
  // component, not page-module copy, and the search and scripture index are
  // routes and UI with no page module behind them.
  {
    heading: 'Visit: "Which door?" and the share cards (2026-09-24, craft-details pass)',
    newCopy: [
      '"Choose a door to see where it is." (under the street-side sketch before a door is chosen)',
      '"A sketch of the street side, not to scale. North is up." (the sketch\'s note)',
      'The sketch\'s labels: "Adams Street", "Jefferson Street", "Offices", "Sanctuary", "Parking".',
      'The sketch\'s description for screen readers: "The church stands on the corner of Adams Street\n  and Jefferson Street. Door 1, Adams Street circular drive, is on the Adams Street side, at the\n  circular drive. Door 2, The wooden front doors, is on the Adams Street side, at the foot of\n  the tower. Door 3, Jefferson Street side doors, is on the Jefferson Street side. The parking\n  lot is on the Adams Street side."',
      '"Sermon previews, news and writing from the church" (the /blog share card\'s line).',
    ],
    edits: ["(none: each door's words under the sketch are the list's own)"],
  },
  {
    heading: 'Scripture index and site search (2026-09-24, `feat/scripture-search`)',
    newCopy: [
      '/blog/scripture: the page title "Scripture index"; the lede "Every passage preached in a sermon preview, from Genesis to Revelation: 106 passages from 24 books, each with the Sunday it was preached." (the counts are derived and change as previews are added); the headings "Old Testament", "New Testament" and, only when a reading cannot be read, "Other readings"; the empty state "The first sermon previews are on their way."; the meta description "Every Bible passage preached at First Baptist Church Muncie, book by book, with the sermon preview for each."',
      'The blog\'s browse row: "By passage".',
      'The search: "Search the site" (the header button\'s name, the mobile menu row and the dialog\'s label), the box\'s placeholder "Sermons, passages, pages", "12 results for “Jeremiah”" / "1 result for ..." / "Nothing found for “...”.", "More results", "Close", "Search is not available right now." and the foot link "Every passage preached, book by book". UI labels.',
      'Search result rows say "Page" in the date column for a page (a post shows its Sunday or posted date).',
    ],
  },
  {
    // src/lib/llms-text.ts. Everything else in the file is Site settings, each
    // page's own title and search description, and the Visit page's own
    // questions and answers.
    heading: '/llms.txt, the summary for AI assistants (2026-09-24, the local search pass)',
    newCopy: [
      'An American Baptist church in downtown Muncie, Indiana. (the opening line, before the tagline)',
      'The headings "Sundays", "What to expect", "Contact", "Pages", "Elsewhere" and "About this file", and the labels "Worship", "Where", "Directions", "Watch online", "Plan a visit", "Phone", "Email", "Office hours", "Give", "Church Center (calendar and giving)" and "Church Trac (newsletters and the app)".',
      "Generated from the site's own content every time the site is built, so it always matches the pages.",
      'Sermon previews and church news are at https://www.fbcmuncie.org/blog, each post at /post/<slug>, with a feed at https://www.fbcmuncie.org/blog/rss.xml.',
      "A longer companion with more of the site's text: https://www.fbcmuncie.org/llms-full.txt",
    ],
  },
  {
    // src/lib/social-links.ts and the three places that draw it: the footer,
    // the mobile menu, and the Contact page's office door (Hours.astro). UI
    // labels in code, not a page module's copy, so they live here.
    heading: 'Social links: footer, mobile menu and Contact (2026-09-24, `feat/social-links`)',
    newCopy: [
      '"Follow along" (the heading of the Facebook, Instagram and YouTube links on the Contact page’s office hours band, and the name a screen reader hears for the same row of icons at the foot of the mobile menu).',
      '"First Baptist Church Muncie on Facebook", "... on Instagram" and "... on YouTube" (what a screen reader says for each round icon button in the footer and the mobile menu; nothing on screen).',
    ],
  },
  {
    // src/components/JournalPortableText.tsx (LectionPassageText),
    // src/components/blog/PostTools.astro, src/scripts/post-tools.ts and
    // src/lib/worship-ics.ts. UI labels and generated text, not a page's copy.
    heading:
      'Sermon previews: the passage, Read aloud, Share and Add to calendar (2026-09-24, `feat/scripture-text`)',
    newCopy: [
      '"Read Romans 13:11-14" (the line that opens a sermon preview’s reading into the passage itself; the reference is the post’s own). The passage is the Berean Standard Bible, credited under it as "Berean Standard Bible, public domain". If the church later licenses the NIV, the credit becomes Biblica’s required notice, word for word: "Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide."',
      'The tools under a post’s order: "Read aloud", "Stop", "Share", "Add to calendar" (on a sermon preview, until its Sunday has passed). What a screen reader hears for the calendar link: "Add to calendar: Sunday worship, November 30". After Share copies the link: "Link copied", or "Copy the link from the address bar" when the browser will not let it copy.',
      'The calendar event a sermon preview’s "Add to calendar" makes: the title "Sunday worship at First Baptist Church Muncie", and the note "This Sunday’s sermon: <the post’s title> (<its reading>).", "Sermon preview: <the post’s address>" and "Watch live: <the livestream address>". The date, time, length and address come from the post and Site settings.',
    ],
  },
  {
    // src/components/home/LastSunday.astro, src/components/visit/SundayWeather.astro
    // (with src/lib/sunday-weather.ts), HeroFacts.astro and src/lib/sunday-ics.ts.
    // Code, not a page module: the recording, the forecast and the service time
    // are all read, never typed.
    heading: 'Last Sunday, Sunday weather and the Sunday calendar (2026-09-24, `feat/last-sunday`)',
    newCopy: [
      'Home: the band heading "Last Sunday"; the buttons "Watch on YouTube" and, when the church posted a sermon preview for that Sunday, "Read the sermon preview". The date ("Sunday, September 20"), the sermon title, the reading and the preacher are the YouTube video’s own title and description; the series name is followed by the word "series" ("Kingdom Come series").',
      'Visit: "Add Sundays to your calendar" (under the hero’s Sundays, Where and How long).',
      'Home: the hero’s fourth fact "Preaching", with the name of the coming Sunday’s preacher (2026-09-25, `feat/preacher-and-feel`). The name is the church’s own: the sermon preview’s author when the church posted one for that Sunday, else the "Preaching:" line of the YouTube broadcast scheduled for it. It shows only until that Sunday has passed, and not at all when neither names anyone.',
      'Visit: the weather line, Wednesday to Sunday noon, "Sunday: 58°, light rain." (the forecast words are the National Weather Service’s own, in lower case; a chance of rain reads "45% chance of rain showers").',
      'The calendar file: the event is named "Sunday worship, First Baptist Church Muncie" and its note reads "What to expect on Sunday: https://www.fbcmuncie.org/visit".',
    ],
  },
  // Two more typed into the note by hand on 2026-09-25 (the cloud What's On
  // branch and feat/church-app), moved here word for word on 2026-09-26 before
  // a seed-pages run could wipe them. approval-note.test.mjs now fails on any
  // section in the note that this file does not produce.
  {
    // src/pages/events.astro, src/components/home/WhatsOnBand.astro, the Church Trac form band
    // (src/components/sections/ChurchTracForm.astro) and src/components/newsletter/Newsletter.astro. Code, not page-module copy.
    heading:
      "What's On, Church Trac forms and the ministry newsletters (2026-09-25, `claude/kind-heisenberg-jf34rt`)",
    newCopy: [
      '/events: the page name "What\'s On", the small line "Church calendar", and "Events, classes and gatherings at First Baptist, from the church calendar." (also on Home\'s What\'s On band, under "Coming up"). The door "The full calendar: Every published event, month by month, on Church Trac. Open the calendar". The bands "Coming up" and "Every week", the button "Everything on the calendar" (Home), and "Add to calendar" on each event. When the calendar cannot be read: "The calendar could not be read just now. See every event on the church calendar." With nothing ahead: "Nothing is on the calendar in the months ahead yet. Our weekly gatherings are below." The events\' own titles, times, rooms and descriptions are Church Trac\'s, as typed there.',
      'The Church Trac form band: "Open the form in a new tab" under every form. The heading and the words beside a form are the staff\'s own, typed in the Studio.',
      '/kids-corner and /youth-news: the small lines "Children’s newsletter" and "Youth newsletter"; under the name, "News from the Children’s Ministry, nursery through 5th grade." and "News from the Youth Ministry, 6th through 12th grade."; the closing band "About this newsletter": "<The newsletter’s name> is written by the ministry in Church Trac, and this page follows it each day. It is in the church app too.", with "Open it on Church Trac" and "Get the church app". When Church Trac cannot be read: "<name> could not be loaded here just now. It is always on Church Trac." and "Read <name> on Church Trac". Everything else on those pages is the ministry’s own newsletter, as published in Church Trac.',
      'Ministries: under the Children and Youth bands, "Read The Kid\'s Corner, the children’s newsletter." and "Read The Moose\'s Message, the youth newsletter."',
    ],
  },
  {
    // src/components/home/ChurchAppBand.astro, src/components/church/AppButtons.astro and the
    // footer's app block. Code, not page-module copy.
    heading: 'The church app (2026-09-25, `feat/church-app`)',
    newCopy: [
      'Home, the band "The Church App": the small line "Free for iPhone and Android"; "Church Trac\'s free app keeps First Baptist on your phone: the calendar, the prayer list and news from the ministries."; the buttons "Get the app", "For iPhone / App Store" and "For Android / Google Play"; "Install code", and "Found the app in the store yourself? Enter this code when it asks, and it opens on First Baptist."',
      'The four things the app is for: "What\'s On: The church calendar, and your own events once you sign in."; "Ministry news: The Kid\'s Corner and The Moose\'s Message, from the Children\'s and Youth ministries."; "Church updates: Notices from the church, sent straight to your phone." The fourth, "Prayer List: Seeking the Lord for and alongside your church family.", is the church\'s own line from its Church Connect site.',
      'Footer, every page: "The church app", the same two store buttons, and "Install code 8PG6ZJ" (the code is read from the app link in Site settings).',
    ],
  },
  {
    // src/components/privacy/PrivacyDerived.astro: derived at build time from
    // src/lib/analytics-config.ts and Site settings, so only the sentences the
    // current configuration selects are on the page.
    heading: 'Privacy: cookies, measurement, Google Search and how to reach us (2026-09-26)',
    newCopy: [
      'Before Google Analytics is switched on: "This site sets no cookies and runs no analytics. Visits are not counted, and nothing is stored on your device for measurement."',
      'Once Google Analytics is on (go-live): "Page visits are measured with Google Analytics. Google Analytics sets cookies on your device (named _ga and _ga_ followed by a stream id) so returning visits are recognised as the same session. It records which pages are opened, roughly where in the world the visit came from, and what kind of device was used. It is not used for advertising, and the data is not sold or shared beyond Google\'s own processing. These are the only cookies this site sets." and "You can block these cookies in your browser settings, with any tracker-blocking extension, or with Google\'s Analytics opt-out add-on, and the site will work exactly the same. Google explains how it uses information from sites that use its services."',
      'Google Search: "The church uses Google Search Console to see how this site appears in Google search results: which searches show it and how often it is chosen. Search Console works from Google\'s own search data. It sets nothing on your device and adds nothing to this site."',
      'How to reach us: "Questions about this policy, or about anything on this site, can go to the church office. Email <the office email> or call <the office phone>." (from Site settings)',
    ],
  },
];

/** `manifest[key].alt`, following `.same` chains, matching seed-pages.mjs's altFor. */
function altFor(manifest, key) {
  const entry = manifest?.[key];
  if (!entry) return '(not in scripts/data/page-images.json)';
  if (entry.alt) return entry.alt;
  if (entry.same) return altFor(manifest, entry.same);
  return '(no alt text)';
}

/**
 * Render the full approval-note markdown from a list of page modules (already
 * filtered to "every non-hidden module", independent of any --only the CLI
 * was given) and the page-images manifest. Pure: no fs, no Sanity, no
 * randomness, so the same inputs always produce the same string.
 * @param {Array<{slug:string,newCopy?:string[],edits?:string[],confirm?:string[],photoConsent?:string[]}>} mods
 * @param {Record<string, {alt?:string, same?:string}>} manifest
 * @param {string[]} factsToConfirm
 */
export function renderApprovalNote(mods, manifest, factsToConfirm) {
  const lines = [];
  lines.push('# Copy for the church to approve');
  lines.push('');
  lines.push(
    'Sentences on the new site that did not exist on the Wix site, for the church to approve or replace. Everything else is the church’s own text, edited only by cutting. Generated by scripts/seed-pages.mjs; do not edit by hand.',
  );
  lines.push('');

  for (const mod of mods) {
    lines.push(`## /${mod.slug}`);
    lines.push('');
    lines.push('### New sentences');
    lines.push('');
    const newCopy = mod.newCopy ?? [];
    if (newCopy.length === 0)
      lines.push('- (none: every sentence on this page is the church’s own)');
    else for (const s of newCopy) lines.push(`- ${s}`);
    lines.push('');
    lines.push('### Edits to the church’s own text');
    lines.push('');
    const edits = mod.edits ?? [];
    if (edits.length === 0) lines.push('- (none: their text is cut, never reworded)');
    else for (const e of edits) lines.push(`- ${e}`);
    lines.push('');
    const confirm = mod.confirm ?? [];
    if (confirm.length > 0) {
      lines.push('### Facts to confirm from this page');
      lines.push('');
      for (const c of confirm) lines.push(`- ${c}`);
      lines.push('');
    }
    lines.push('### Photos of children');
    lines.push('');
    const photos = mod.photoConsent ?? [];
    if (photos.length === 0) lines.push('- (none)');
    else for (const k of photos) lines.push(`- ${k}: ${altFor(manifest, k)}`);
    lines.push('');
  }

  // Chrome copy: always emitted, regardless of which page modules `mods`
  // carries, because none of it is a page module's to lose.
  for (const section of CHROME_SECTIONS) {
    lines.push(`## ${section.heading}`);
    lines.push('');
    lines.push('### New sentences');
    lines.push('');
    for (const s of section.newCopy ?? []) lines.push(`- ${s}`);
    lines.push('');
    if (section.edits) {
      lines.push('### Edits to the church’s own text');
      lines.push('');
      for (const e of section.edits) lines.push(`- ${e}`);
      lines.push('');
    }
  }

  lines.push('## Facts the church must confirm');
  lines.push('');
  factsToConfirm.forEach((fact, i) => lines.push(`${i + 1}. ${fact}`));
  lines.push('');

  return lines.join('\n');
}
