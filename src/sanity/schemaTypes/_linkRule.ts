// Foundation, edit with care
// =============================================================================
// _linkRule - the validation every link box shares, so it can hold a link
// placeholder such as {giving} (feat/church-links, 2026-09-24)
// =============================================================================
// A link box can hold either an address or one of the church-system link
// placeholders from src/lib/church-links.ts ({giving}, {connect}, {sermons}...),
// which the site fills from Site settings > Church systems at build time.
//
// WHY `uri({ allowRelative: true })` IS PART OF IT. Sanity gives every `url`
// field a hidden default rule, "an absolute http or https address", and a
// custom rule alone cannot lift it: the default is only dropped when the field
// declares its OWN uri rule (omitLeakedDefaultUri in sanity's validation). A
// relative uri rule accepts "{giving}", because the URL parser reads it as a
// relative path. The custom half then does the real work: a braced word must
// be a known placeholder, and a box that used to demand a full address still
// does, unless it holds a placeholder.
//
// Every field that uses this was checked against the live dataset on
// 2026-09-24: nothing valid before becomes invalid, because each rule is
// at least as wide as the one it replaces.
// =============================================================================
import type { UrlRule } from 'sanity';
import { checkLinkBox } from '../../lib/church-links.ts';

type Scheme = 'http' | 'https' | 'mailto' | 'tel';

/**
 * Validation for a link box that may hold a link placeholder.
 * `absoluteOnly`: the box took only a full address before (a menu's "Web
 * address", a document's link), so a relative path still is not allowed.
 */
export function linkRule(
  opts: { absoluteOnly?: boolean; scheme?: Scheme[] } = {},
): (R: UrlRule) => UrlRule {
  const scheme = opts.scheme ?? ['http', 'https', 'mailto', 'tel'];
  return (R) =>
    R.uri({ allowRelative: true, scheme }).custom((value) =>
      checkLinkBox(value, opts.absoluteOnly ?? false),
    );
}

/** The sentence every link box's description ends with. */
export const LINK_TOKEN_HINT =
  'You can also type a church link placeholder like {giving} or {connect}; see Help, "Links to giving, forms and sermons".';
