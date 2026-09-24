// scripts/lib/indexnow.mjs
//
// The pure half of scripts/indexnow.mjs (2026-09-24, the local search pass):
// reading a sitemap, deciding whether the production host is ready, and
// shaping the submission. No network and no disk here, so
// scripts/lib/indexnow.test.mjs can prove the gate that keeps the script
// silent until the cutover.

/** Every <loc> in a sitemap or sitemap index, in order, entities decoded. */
export function sitemapLocs(xml) {
  return [...String(xml ?? '').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) =>
    m[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'"),
  );
}

/** True when a sitemap document is an index (its <loc>s are other sitemaps). */
export const isSitemapIndex = (xml) => /<sitemapindex[\s>]/.test(String(xml ?? ''));

/**
 * THE GATE. The production host is ready for IndexNow only when its key file
 * answers 200 with exactly the key. Before the cutover www.fbcmuncie.org is
 * still Wix, which answers 404 (or a 200 page of HTML for an unknown path), so
 * this is false and nothing is submitted.
 * @param {{ status: number, body: string } | null} response null = it could not be fetched
 * @param {string} key
 * @returns {{ ready: boolean, why: string }}
 */
export function keyGate(response, key) {
  if (!response) return { ready: false, why: 'the key file could not be fetched' };
  if (response.status !== 200)
    return { ready: false, why: `the key file answered ${response.status}, not 200` };
  if (String(response.body ?? '').trim() !== key)
    return { ready: false, why: 'the key file answered 200 but its body is not the key' };
  return { ready: true, why: 'the production host serves the key' };
}

/**
 * The URLs a submission may carry: absolute, on the site's own host, each
 * once, in order. IndexNow refuses a batch that mixes hosts.
 */
export function urlsForHost(urls, siteUrl) {
  const host = new URL(siteUrl).host;
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    let parsed;
    try {
      parsed = new URL(u);
    } catch {
      continue;
    }
    if (parsed.host !== host || seen.has(parsed.href)) continue;
    seen.add(parsed.href);
    out.push(parsed.href);
  }
  return out;
}

/** IndexNow takes at most 10,000 URLs per request. */
export const BATCH = 10_000;

/** The JSON bodies to POST to https://api.indexnow.org/indexnow. */
export function submissions(urls, siteUrl, key) {
  const host = new URL(siteUrl).host;
  const keyLocation = `${siteUrl.replace(/\/$/, '')}/${key}.txt`;
  const bodies = [];
  for (let i = 0; i < urls.length; i += BATCH) {
    bodies.push({ host, key, keyLocation, urlList: urls.slice(i, i + BATCH) });
  }
  return bodies;
}
