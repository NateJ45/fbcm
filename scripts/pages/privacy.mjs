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
// 1. COOKIES, MEASUREMENT, SEARCH AND THE CONTACT LINE ARE NOT HERE
//    (2026-09-26). They used to be seeded from .env at seed time, beside a
//    bullet saying the site sets no cookies; the day PUBLIC_GA_ID is set at
//    go-live, that stored text would have denied the Analytics cookies. They
//    are now derived when the site is built, from the same booleans that
//    decide whether each tag renders (src/components/privacy/PrivacyDerived.astro,
//    after this body on /privacy). This document holds only prose that does
//    not depend on configuration.
//
// 2. NOTHING IS RETYPED FROM SITE SETTINGS. The office email and phone, and
//    the Church Trac and YouTube addresses, are read off the
//    live siteSettings document. If any of those addresses change, the policy
//    follows on the next seed rather than drifting from the footer.
//
// 3. THIS SINGLETON DID NOT EXIST BEFORE THIS COMMIT (privacyPage was null in
//    the live dataset), so there are no other fields to preserve here. Every
//    field the schema defines is set fresh below.

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
    'This site links out to a few services the church uses for things this site itself does not do. (Links to other services, lead-in)',
    'Church Trac holds the church’s records and runs its calendar, forms and app. It has its own privacy policy, separate from this one. (Links to other services, Church Trac; 2026-09-26, Church Center retired)',
    'YouTube hosts our livestream and sermon recordings. It has its own privacy policy, separate from this one. (Links to other services, YouTube)',
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

    return {
      seoTitle: 'Privacy | First Baptist Church Muncie',
      seoDescription:
        'What this site does and does not do with your information, and where its linked services keep their own privacy policies.',

      heroEyebrow: 'This site, plainly.',
      heroHeadline: 'Privacy Policy',
      heroSubhead: '',

      lastUpdated: '2026-09-26',

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
          ],
          'priv-nodo',
        ),

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
      ],
    };
  },
};
