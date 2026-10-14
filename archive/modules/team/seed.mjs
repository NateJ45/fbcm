/**
 * modules/team/seed.mjs
 *
 * Idempotent seeder for the team module. Creates one `teamPage`
 * singleton and three neutral placeholder `teamMember` documents.
 *
 * Requirements:
 *   - A configured Sanity project (projectId + dataset in .env or shell).
 *   - A Sanity API write token (`SANITY_API_WRITE_TOKEN`) with Editor or above
 *     permissions. See https://sanity.io/docs/http-auth
 *
 * Usage:
 *   node modules/team/seed.mjs                 # dry run
 *   NCS_PRODUCTION_WRITE=yes node archive/modules/team/seed.mjs --apply   # write
 *
 * All documents use deterministic `_id` values so running the script more than
 * once does not create duplicates (`createOrReplace` is idempotent).
 * Image fields are intentionally left unset; add real headshots via the Studio.
 */

import { createClient } from '@sanity/client';
import { config } from 'dotenv';

// Load env vars from the project root .env file.
// The production second factor is read BEFORE config(): dotenv copies .env
// into process.env, and the factor must never come from .env (PORTS.md card 86).
const PRODUCTION_WRITE = process.env.NCS_PRODUCTION_WRITE === 'yes';
config();

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset   = process.env.PUBLIC_SANITY_DATASET ?? 'production';
const token     = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  console.error('Error: PUBLIC_SANITY_PROJECT_ID is not set. Add it to your .env file.');
  process.exit(1);
}
if (!token) {
  console.error('Error: SANITY_API_WRITE_TOKEN is not set. Add a write token to your .env file.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// DRY BY DEFAULT (2026-10-13, PORTS.md card 86). A bare run lists what it would
// write and writes nothing. Writing needs --apply, and on the `production`
// dataset also NCS_PRODUCTION_WRITE=yes in the same command, after a backup and a dry run:
//   NCS_PRODUCTION_WRITE=yes node archive/modules/team/seed.mjs --apply
const APPLY = process.argv.includes('--apply');
if (APPLY && dataset === 'production' && !PRODUCTION_WRITE) {
  console.error(
    'Refusing to write: --apply targets the production dataset, and --apply alone is not enough.\n' +
      'Set NCS_PRODUCTION_WRITE=yes in the same command, after a backup and a dry run.\n' +
      'Run without --apply to see the plan. PORTS.md card 86.',
  );
  process.exit(2);
}

// ---------------------------------------------------------------------------
// teamPage singleton
// ---------------------------------------------------------------------------

const teamPage = {
  _id: 'teamPage',
  _type: 'teamPage',
  seoTitle: 'Meet the Team',
  seoDescription: 'Meet the people behind the work. Our team brings experience, care, and a collaborative approach to every project.',
  heroEyebrow: 'The People.',
  heroHeadline: 'Meet the Team',
  heroSubhead: 'We are a small, focused team. Replace this with a sentence about what makes your team different.',
  intro: [
    {
      _type: 'block',
      _key: 'team-intro-p1',
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: 'team-intro-s1',
          text: 'Replace this placeholder text with a brief introduction to your team. A sentence or two about your studio\'s approach, how you work together, or what clients can expect is plenty.',
          marks: [],
        },
      ],
      markDefs: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// teamMember documents
// ---------------------------------------------------------------------------

const teamMembers = [
  {
    _id: 'seed-team-member-alex',
    _type: 'teamMember',
    name: 'Alex Morgan',
    slug: { _type: 'slug', current: 'alex-morgan' },
    role: 'Founder',
    bio: [
      {
        _type: 'block',
        _key: 'alex-bio-p1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'alex-bio-s1',
            text: 'Replace this with a short bio for Alex. One to two paragraphs works well. Focus on background, approach, and what they bring to the team.',
            marks: [],
          },
        ],
        markDefs: [],
      },
    ],
    displayOrder: 1,
  },
  {
    _id: 'seed-team-member-jordan',
    _type: 'teamMember',
    name: 'Jordan Lee',
    slug: { _type: 'slug', current: 'jordan-lee' },
    role: 'Project Lead',
    bio: [
      {
        _type: 'block',
        _key: 'jordan-bio-p1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'jordan-bio-s1',
            text: 'Replace this with a short bio for Jordan. Keep it concise and consistent in tone with the other bios.',
            marks: [],
          },
        ],
        markDefs: [],
      },
    ],
    displayOrder: 2,
  },
  {
    _id: 'seed-team-member-sam',
    _type: 'teamMember',
    name: 'Sam Rivera',
    slug: { _type: 'slug', current: 'sam-rivera' },
    role: 'Client Coordinator',
    bio: [
      {
        _type: 'block',
        _key: 'sam-bio-p1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'sam-bio-s1',
            text: 'Replace this with a short bio for Sam. Keep it concise and consistent in tone with the other bios.',
            marks: [],
          },
        ],
        markDefs: [],
      },
    ],
    displayOrder: 3,
  },
];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function seed() {
  console.log(`Seeding team module into project "${projectId}" / dataset "${dataset}"...`);

  const tx = client.transaction();

  tx.createOrReplace(teamPage);
  for (const member of teamMembers) {
    tx.createOrReplace(member);
  }

  if (!APPLY) {
    const ids = tx.serialize().map((m) => Object.values(m)[0]._id);
    console.log(`DRY RUN: would create or replace ${ids.length}: ${ids.join(', ')}`);
    console.log('Nothing was written. Re-run with --apply (production: NCS_PRODUCTION_WRITE=yes too).');
    return;
  }
  await tx.commit();

  console.log('Done. Created or replaced:');
  console.log('  teamPage (singleton)');
  for (const member of teamMembers) {
    console.log(`  teamMember: "${member.name}" (${member.role})`);
  }
  console.log('');
  console.log('Next steps:');
  console.log('  1. Replace placeholder names, roles, and bios in Studio (Team Members collection).');
  console.log('  2. Add headshot photos via the Studio.');
  console.log('  3. Optionally add email addresses and social links per member.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message ?? err);
  process.exit(1);
});
