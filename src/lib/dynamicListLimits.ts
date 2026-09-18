// Foundation, edit with care
// The dynamicListSection "how many to show" field (src/sanity/schemaTypes/richSections.ts)
// and the GROQ slice bound that fetches candidates for it (src/lib/queries.ts) are
// the SAME NUMBER for the SAME REASON: an editor can ask for up to this many items,
// and the query has to fetch at least that many or a high `limit` would quietly
// under-serve. GROQ slice bounds cannot be field references (`[0...limit]` where
// `limit` is a document field is a parse error that Sanity returns for the WHOLE
// query, not just this section -- see queries.ts for the incident), so the query
// fetches a fixed batch of DYNAMIC_LIST_MAX candidates and DynamicList.astro trims
// that batch down to the editor's actual `limit` at render time.
//
// One exported constant, used in both places, so the schema's cap and the query's
// batch size cannot drift apart. See dynamicListLimits.test.ts for the drift gate.
export const DYNAMIC_LIST_MAX = 12;
