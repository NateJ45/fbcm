// scripts/pages/privacy.mjs
//
// The Privacy Policy page. There is no source page in the Wix capture worth
// keeping: the old site's privacy text was the starter's own boilerplate,
// written for a business that takes a contact form and runs a newsletter.
// This church's site does neither, so the policy is rewritten from what this
// build actually does, not adapted from what it used to say. Every sentence
// below is `newCopy`.
//
// Three things about this file are deliberate.
//
// 1. THE ANALYTICS PARAGRAPH IS DERIVED, NOT ASSERTED (CLAUDE.md rule 15, the
//    same near-miss src/lib/analytics-config.ts documents). This module reads
//    PUBLIC_CF_ANALYTICS_TOKEN out of .env with the same loadEnv() the runner
//    itself uses, and branches on it with the exact same test
//    (`token.trim().length > 0`) that src/lib/analytics-config.ts uses to
//    decide whether the beacon script renders. A fork that sets the token
//    cannot end up with a seeded page that still says "no analytics", and one
//    that never sets it does not get a false promise about a cookie the site
//    never sets.
//
// 2. NOTHING IS RETYPED FROM SITE SETTINGS. The office email and phone, and
//    the Church Trac and YouTube addresses, are read off the
//    live siteSettings document. If any of those addresses change, the policy
//    follows on the next seed rather than drifting from the footer.
//
// 3. THIS SINGLETON DID NOT EXIST BEFORE THIS COMMIT (privacyPage was null in
//    the live dataset), so there are no other fields to preserve here. Every
//    field the schema defines is set fresh below.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Same parsing rules as scripts/lib/loadEnv.mjs, applied here so this module
 *  can read PUBLIC_CF_ANALYTICS_TOKEN without the runner having to thread env
 *  through ctx for one field. Mirrors src/lib/analytics-config.ts exactly:
 *  trim, then non-empty means configured. */
function readCfAnalyticsToken() {
  if (process.env.PUBLIC_CF_ANALYTICS_TOKEN !== undefined) {
    return process.env.PUBLIC_CF_ANALYTICS_TOKEN;
  }
  try {
    const raw = readFileSync(resolve(ROOT, '.env'), 'utf8');
    const line = raw.split('\n').find((l) => /^\s*PUBLIC_CF_ANALYTICS_TOKEN\s*=/.test(l));
    if (!line) return '';
    const m = line.match(/^\s*PUBLIC_CF_ANALYTICS_TOKEN\s*=\s*(.*?)\s*$/);
    if (!m) return '';
    const quoted = m[1].match(/^(["'])(.*)\1$/s);
    return quoted ? quoted[2] : m[1].replace(/\s+#.*$/, '').trim();
  } catch {
    return '';
  }
}

export default {
  id: 'privacyPage',
  type: 'privacyPage',
  slug: 'privacy',

  // Every sentence on this page is new: there is no Wix privacy page worth
  // carrying forward (see the top-of-file note).
  newCopy: [
    'This site is run by First Baptist Church Muncie to share what is happening at the church. This policy explains what the site itself does with information from anyone who visits it. (intro)',
    'This site has no contact form, sign-up form or account system of its own. (What this site does not do)',
    'It does not ask you to create an account or log in. (What this site does not do)',
    'It does not set any cookies of its own. (What this site does not do)',
    'This site runs no analytics at all. Visits are not counted, and nothing is stored on your device for measurement. (How visits are measured, when PUBLIC_CF_ANALYTICS_TOKEN is unset)',
    'Page visits are counted with Cloudflare Web Analytics, which sets no cookies and does not identify individual visitors. (How visits are measured, when PUBLIC_CF_ANALYTICS_TOKEN is set)',
    'This site links out to a few services the church uses for things this site itself does not do. (Links to other services, lead-in)',
    'Church Trac holds the church’s records and runs its calendar, forms and app. It has its own privacy policy, separate from this one. (Links to other services, Church Trac; 2026-09-26, Church Center retired)',
    'YouTube hosts our livestream and sermon recordings. It has its own privacy policy, separate from this one. (Links to other services, YouTube)',
    'Questions about this policy, or about anything on this site, can go to the church office. (How to reach us, lead-in)',
  ],

  edits: [],
  confirm: [],
  photoConsent: [],

  async build(ctx) {
    const { copy } = ctx;
    const { heading, paragraphs, bullets } = copy;
    const settings = ctx.settings;

    if (!settings) {
      throw new Error(
        'privacy.mjs: siteSettings is not available. The policy reads the office email and ' +
          'phone, and the Church Trac and YouTube addresses, off it rather than ' +
          'retyping them (CLAUDE.md rule 15).',
      );
    }
    for (const field of ['churchTracUrl', 'youtubeUrl', 'email']) {
      if (!settings[field]) {
        throw new Error(`privacy.mjs: siteSettings.${field} is not set.`);
      }
    }

    const hasCfAnalytics = readCfAnalyticsToken().trim().length > 0;

    const contactLine = settings.phone
      ? `Email [${settings.email}](mailto:${settings.email}) or call ${settings.phone}.`
      : `Email [${settings.email}](mailto:${settings.email}).`;

    return {
      seoTitle: 'Privacy | First Baptist Church Muncie',
      seoDescription:
        'What this site does and does not do with your information, and where its linked services keep their own privacy policies.',

      heroEyebrow: 'This site, plainly.',
      heroHeadline: 'Privacy Policy',
      heroSubhead: '',

      lastUpdated: '2026-09-20',

      body: [
        ...paragraphs(
          'This site is run by First Baptist Church Muncie to share what is happening at the church. This policy explains what the site itself does with information from anyone who visits it.',
          'priv-intro',
        ),

        heading('What this site does not do', 2, 'priv-h-nodo'),
        ...bullets(
          [
            'This site has no contact form, sign-up form or account system of its own.',
            'It does not ask you to create an account or log in.',
            'It does not set any cookies of its own.',
          ],
          'priv-nodo',
        ),

        heading('How visits are measured', 2, 'priv-h-analytics'),
        ...(hasCfAnalytics
          ? paragraphs(
              'Page visits are counted with Cloudflare Web Analytics, which sets no cookies and does not identify individual visitors.',
              'priv-analytics-on',
            )
          : paragraphs(
              'This site runs no analytics at all. Visits are not counted, and nothing is stored on your device for measurement.',
              'priv-analytics-off',
            )),

        heading('Links to other services', 2, 'priv-h-links'),
        ...paragraphs(
          'This site links out to a few services the church uses for things this site itself does not do.',
          'priv-links-intro',
        ),
        ...bullets(
          [
            `[Church Trac](${settings.churchTracUrl}) holds the church’s records and runs its calendar, forms and app. It has its own privacy policy, separate from this one.`,
            `[YouTube](${settings.youtubeUrl}) hosts our livestream and sermon recordings. It has its own privacy policy, separate from this one.`,
          ],
          'priv-links',
        ),

        heading('How to reach us', 2, 'priv-h-contact'),
        ...paragraphs(
          `Questions about this policy, or about anything on this site, can go to the church office. ${contactLine}`,
          'priv-contact',
        ),
      ],
    };
  },
};
