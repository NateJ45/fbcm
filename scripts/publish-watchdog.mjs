// Foundation, edit with care.
//
// The publish watchdog (2026-10-05). Run every 15 minutes by
// .github/workflows/publish-watchdog.yml. It answers one question: has
// everything the editor published in Sanity reached the live site, and if not,
// can it be fixed without a human?
//
// WHY IT EXISTS. The site is statically built, so a Sanity publish goes live
// only when a rebuild runs. The rebuild is fired by a Sanity webhook that POSTs a
// GitHub repository_dispatch (`sanity-publish`) to deploy.yml. On 2026-10-05 a
// bulk publish at 20:31 UTC fired about 29 dispatches in 8 seconds (one per
// document). The concurrency group cancelled all but two, by design; the two
// survivors then waited 15 and 5 minutes for a GitHub-hosted runner (an Actions
// incident that day) for a two-second gate job, and the surviving deploy was
// cancelled by a newer queued run. The content went live 52 minutes after the
// publish and nobody was told. Had the newest run never started, the site would
// have stayed stale until the next scheduled rebuild, a few mornings a week.
//
// THE DECISION (decide(), pure, tested in scripts/lib/publish-watchdog.test.mjs):
//   unserved = the newest published change is newer than the START of the last
//              successful Deploy run (the build reads the dataset shortly after
//              it starts, so a publish before that start is in that build).
//   age      = now minus the newest published change.
//   age <= 10 min                 wait: the webhook deploy is probably starting.
//   a Deploy run is in flight     wait: it will pick the content up.
//   already retriggered twice     stop: something other than a lost run is wrong.
//   otherwise                     retrigger deploy.yml.
//   age > 30 min (and unserved)   ALSO alert: open one GitHub issue, comment on it
//                                 at most hourly, close it the first tick the site
//                                 is caught up.
//
// Note the 10 minutes is measured from the PUBLISH, not from the last deploy's
// start. Measuring publish minus last-deploy-start would never heal a lost run
// whose predecessor started only a few minutes before the publish.
//
// RETRIGGER ROUTE. `gh workflow run deploy.yml --ref <default branch>`, which is a
// workflow_dispatch. GITHUB_TOKEN cannot start workflow runs through ordinary
// events, but workflow_dispatch and repository_dispatch are the documented
// exceptions. workflow_dispatch needs only `actions: write`; repository_dispatch
// (what the webhook sends) would need `contents: write`, so the dispatch is the
// narrower grant. deploy.yml already has the trigger, nothing else in it reads
// the event name except IndexNow (skipped only for `schedule`), so the build
// is identical. The ref is ALWAYS the default branch: running the watchdog by
// hand from a feature branch must never deploy that branch to production.
//
// NO LOOP. A retrigger starts a run after the publish, so the next tick sees
// lastGoodStart > latestPublish and is caught up. If the retriggered run fails,
// the retrigger count (workflow_dispatch runs created since the publish) stops
// it at MAX_RETRIGGERS and the alert covers the rest.
//
// A WATCHDOG MUST NEVER GO RED FROM A BLIP. Any failed read (Sanity, GitHub)
// logs a warning and exits 0; the next tick tries again.
//
// Env: GITHUB_REPOSITORY (owner/name), PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET
// (default production), GH_TOKEN (the gh CLI reads it), DRY_RUN=1 (print every
// mutating gh command instead of running it), WATCHDOG_FAKE_PUBLISH_AGE_MIN
// (only with DRY_RUN: pretend the newest publish is that many minutes old, the last
// good deploy an hour older and nothing in flight, to rehearse the stale path).

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const GRACE_MIN = 10;
export const ALERT_MIN = 30;
export const MAX_RETRIGGERS = 2;
export const COMMENT_EVERY_MIN = 60;
export const ISSUE_TITLE = 'Publish is not reaching the live site';

const MIN = 60_000;
const IN_FLIGHT = new Set(['queued', 'in_progress', 'pending', 'waiting', 'requested']);

/** Milliseconds for an ISO string, or NaN. Date.parse accepts nothing else we send. */
function ms(iso) {
  return typeof iso === 'string' ? Date.parse(iso) : NaN;
}

/**
 * The decision. Pure: no clock, no network.
 *
 * @param {{ now: number|string, latestPublish?: string|null, lastGoodStart?: string|null,
 *   inFlight?: number, retriggers?: number }} input
 * @returns {{ action: 'skip'|'caught-up'|'wait-grace'|'wait-in-flight'|'capped'|'retrigger',
 *   alert: boolean, ageMin: number|null, lagMin: number|null, reason: string }}
 */
export function decide({ now, latestPublish, lastGoodStart, inFlight = 0, retriggers = 0 }) {
  const nowMs = typeof now === 'number' ? now : ms(now);
  const pub = ms(latestPublish);
  const good = ms(lastGoodStart);
  if (!Number.isFinite(nowMs) || !Number.isFinite(pub) || !Number.isFinite(good)) {
    const missing = [
      !Number.isFinite(pub) && 'latest publish',
      !Number.isFinite(good) && 'last good deploy',
      !Number.isFinite(nowMs) && 'clock',
    ].filter(Boolean);
    return {
      action: 'skip',
      alert: false,
      ageMin: null,
      lagMin: null,
      reason: `missing or unreadable input (${missing.join(', ')}), trying again next tick`,
    };
  }
  // Positive lag means the publish is newer than the last good deploy's start.
  const lagMin = Math.round((pub - good) / MIN);
  if (pub <= good) {
    return { action: 'caught-up', alert: false, ageMin: null, lagMin, reason: 'no action' };
  }
  // A publish "in the future" is clock skew between Sanity and GitHub. Treat it
  // as brand new rather than as a reason to act.
  const rawAge = (nowMs - pub) / MIN;
  const ageMin = Math.max(0, Math.round(rawAge));
  const skew = rawAge < 0;
  const alert = ageMin > ALERT_MIN;
  if (ageMin <= GRACE_MIN) {
    return {
      action: 'wait-grace',
      alert,
      ageMin,
      lagMin,
      reason: skew
        ? `publish is ${Math.round(-rawAge)} min in the future (clock skew), waiting`
        : `publish is ${ageMin} min old, inside the ${GRACE_MIN} min grace`,
    };
  }
  if (inFlight > 0) {
    return {
      action: 'wait-in-flight',
      alert,
      ageMin,
      lagMin,
      reason: `${inFlight} Deploy run(s) queued or running, waiting for them`,
    };
  }
  if (retriggers >= MAX_RETRIGGERS) {
    return {
      action: 'capped',
      alert,
      ageMin,
      lagMin,
      reason: `already retriggered ${retriggers} time(s) since this publish, not again`,
    };
  }
  return {
    action: 'retrigger',
    alert,
    ageMin,
    lagMin,
    reason: `publish is ${ageMin} min old and nothing is queued or running`,
  };
}

/** "2026-10-05 20:31Z" for logs and issues. */
export function stamp(iso) {
  const t = ms(iso);
  return Number.isFinite(t)
    ? new Date(t).toISOString().slice(0, 16).replace('T', ' ') + 'Z'
    : 'unknown';
}

/** The one-line log summary. */
export function summaryLine({ latestPublish, lastGoodStart, inFlight, decision }) {
  const lag =
    decision.lagMin === null
      ? 'lag unknown'
      : decision.lagMin > 0
        ? `unserved (publish ${decision.lagMin} min after that start, ${decision.ageMin} min old)`
        : 'lag 0, caught up';
  return (
    `latest publish ${stamp(latestPublish)}, last good deploy start ${stamp(lastGoodStart)}, ` +
    `${lag}, ${inFlight} in flight, ${decision.action}: ${decision.reason}`
  );
}

/** Title, body and run table for the alert issue. Pure. */
export function buildIssue({ repo, latestPublish, lastGoodStart, ageMin, runs }) {
  const rows = (runs || [])
    .slice(0, 5)
    .map((r) => `- [${stamp(r.created_at)} ${r.event}, ${r.conclusion || r.status}](${r.html_url})`)
    .join('\n');
  const body = [
    `The newest change published in Sanity has not reached the live site for ${ageMin} minutes.`,
    '',
    `- Newest publish: ${stamp(latestPublish)}`,
    `- Last good Deploy run started: ${stamp(lastGoodStart)}`,
    `- Deploy workflow: https://github.com/${repo}/actions/workflows/deploy.yml`,
    '',
    'Latest Deploy runs:',
    rows || '- none found',
    '',
    'The publish watchdog retriggers the deploy by itself (at most twice per publish), so a lag this long',
    'usually means a deploy is failing or GitHub Actions is down. Look at the newest Deploy run first, and',
    'at https://www.githubstatus.com. To push the content out now: `gh workflow run deploy.yml`.',
    '',
    'This issue closes itself on the first watchdog run after the site catches up.',
    'To silence it, disable the "Publish watchdog" workflow (docs/agent/deployment.md).',
  ].join('\n');
  return { title: ISSUE_TITLE, body };
}

// ---------------------------------------------------------------- I/O below

function gh(args, { input } = {}) {
  return execFileSync('gh', args, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] });
}

function ghJson(args) {
  return JSON.parse(gh(args));
}

async function latestPublishFromSanity(projectId, dataset) {
  // api.sanity.io, NOT apicdn: the CDN can lag a publish by seconds to minutes,
  // and this is exactly the number that must not lag. A public dataset reads
  // without a token.
  const query =
    '*[!(_id in path("drafts.**")) && !(_type match "system.*") && !(_type match "sanity.*")]' +
    ' | order(_updatedAt desc)[0]._updatedAt';
  const url =
    `https://${projectId}.api.sanity.io/v2025-02-19/data/query/${dataset}` +
    `?query=${encodeURIComponent(query)}&perspective=published`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Sanity answered HTTP ${res.status}`);
  const json = await res.json();
  return json.result ?? null;
}

async function main() {
  const dry = process.env.DRY_RUN === '1';
  const repo = process.env.GITHUB_REPOSITORY;
  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
  const warn = (m) => console.log(`::warning::publish-watchdog: ${m}`);
  if (!repo || !projectId) {
    warn('GITHUB_REPOSITORY or PUBLIC_SANITY_PROJECT_ID is not set, nothing to check');
    return;
  }
  const mutate = (args, opts) => {
    if (dry) {
      console.log(`DRY RUN would run: gh ${args.join(' ')}`);
      if (opts?.input) console.log(opts.input);
      return '';
    }
    return gh(args, opts);
  };

  let latestPublish;
  let runs;
  let lastGoodStart;
  let defaultBranch;
  try {
    latestPublish = await latestPublishFromSanity(projectId, dataset);
    runs = ghJson([
      'api',
      `repos/${repo}/actions/workflows/deploy.yml/runs?per_page=50`,
    ]).workflow_runs;
    lastGoodStart =
      ghJson(['api', `repos/${repo}/actions/workflows/deploy.yml/runs?status=success&per_page=1`])
        .workflow_runs?.[0]?.run_started_at ?? null;
    defaultBranch = ghJson(['api', `repos/${repo}`]).default_branch;
  } catch (e) {
    warn(`could not read the inputs (${String(e.message).split('\n')[0]}), trying again next tick`);
    return;
  }

  const now = Date.now();
  const fake = process.env.WATCHDOG_FAKE_PUBLISH_AGE_MIN;
  if (dry && fake) {
    // A stale scenario: the publish is that old, the last good deploy started
    // an hour before it, and nothing is queued or running. The real run list
    // is still read (and shown in the issue text), only the decision inputs
    // are overridden.
    latestPublish = new Date(now - Number(fake) * MIN).toISOString();
    lastGoodStart = new Date(now - (Number(fake) + 60) * MIN).toISOString();
    console.log(
      `DRY RUN: pretending the newest publish is ${fake} min old (${latestPublish}), ` +
        'the last good deploy started an hour before it, and nothing is in flight',
    );
  }

  const pubMs = ms(latestPublish);
  const simulated = dry && fake;
  const inFlight = simulated ? 0 : runs.filter((r) => IN_FLIGHT.has(r.status)).length;
  const retriggers = simulated
    ? 0
    : runs.filter((r) => r.event === 'workflow_dispatch' && ms(r.created_at) > pubMs).length;
  const decision = decide({ now, latestPublish, lastGoodStart, inFlight, retriggers });
  const line = summaryLine({ latestPublish, lastGoodStart, inFlight, decision });
  console.log(`publish-watchdog: ${line}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `**Publish watchdog:** ${line}\n`);
  }
  if (decision.action === 'skip') {
    warn(decision.reason);
    return;
  }

  if (decision.action === 'retrigger') {
    // The default branch, always. See the header.
    mutate(['workflow', 'run', 'deploy.yml', '--repo', repo, '--ref', defaultBranch]);
    console.log(`publish-watchdog: retriggered deploy.yml on ${defaultBranch}`);
  }

  // The issue: one open issue by exact title, never a duplicate.
  let open;
  try {
    open = ghJson([
      'issue',
      'list',
      '--repo',
      repo,
      '--state',
      'open',
      '--limit',
      '100',
      '--json',
      'number,title,updatedAt',
    ]).find((i) => i.title === ISSUE_TITLE);
  } catch (e) {
    warn(`could not list issues (${String(e.message).split('\n')[0]})`);
    return;
  }

  if (decision.action === 'caught-up') {
    if (open) {
      mutate([
        'issue',
        'close',
        String(open.number),
        '--repo',
        repo,
        '--reason',
        'completed',
        '--comment',
        `The site has caught up: the last good Deploy run started ${stamp(lastGoodStart)}, after the newest publish (${stamp(latestPublish)}). Closing.`,
      ]);
      console.log(`publish-watchdog: closed issue #${open.number}`);
    }
    return;
  }

  if (decision.alert) {
    const issue = buildIssue({ repo, latestPublish, lastGoodStart, ageMin: decision.ageMin, runs });
    if (!open) {
      let labels = [];
      try {
        // Use the `ops` label only if it already exists; create nothing.
        if (
          ghJson(['label', 'list', '--repo', repo, '--json', 'name']).some((l) => l.name === 'ops')
        ) {
          labels = ['--label', 'ops'];
        }
      } catch {
        /* no label is fine */
      }
      mutate([
        'issue',
        'create',
        '--repo',
        repo,
        '--title',
        issue.title,
        '--body',
        issue.body,
        ...labels,
      ]);
      console.log('publish-watchdog: opened the alert issue');
    } else if ((now - ms(open.updatedAt)) / MIN >= COMMENT_EVERY_MIN) {
      mutate([
        'issue',
        'comment',
        String(open.number),
        '--repo',
        repo,
        '--body',
        `Still stale, ${decision.ageMin} minutes after the publish.\n\n${issue.body}`,
      ]);
      console.log(`publish-watchdog: commented on issue #${open.number}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    // Never red: see the header.
    console.log(`::warning::publish-watchdog: unexpected error, ignored (${e?.message ?? e})`);
  });
}
