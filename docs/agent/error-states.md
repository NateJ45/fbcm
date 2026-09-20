# Error and empty states

> Patterns for 404, form-submission failure, empty collections, and unresolved Sanity references.

## Error and empty states

Patterns for the moments when things go sideways or content hasn't landed yet.

### 404

`src/pages/404.astro` uses BaseLayout, sets a clear "That page wandered off." headline, and gives the visitor a few paths back (home, contact, or another useful destination). Eyebrow, headline, body, and CTA labels + hrefs are all Sanity-editable via the `notFoundPage` singleton -- every field has a hardcoded fallback that matches the prior look so the page works even before the doc exists in Sanity.

Don't link "Search" (there isn't one). Don't dump a list of random pages.

### Form submission failure

This site has no form of its own, so there is no submission to fail: every form a visitor meets is a Church Center form on the church's own Church Center site, which owns its error states. Plan 2b removed the starter's contact form, its `/api/contact` endpoint and the Web3Forms fallback. The rule that outlived them is worth keeping for anything that does post: never show "Oops!" or "Something went wrong." Always tell the visitor what to do next.

### Empty collection states

Some pages or sections pull content from Sanity collections that may be empty during setup or early in a new project:

- **Journal index** -- renders a placeholder state when no `journalEntry` documents exist. Content: brief explanation that posts are coming, link to Contact, link to Services. Keep the page live rather than hiding it -- it builds expectation and gives search engines something to crawl.
- **Featured sections** -- `FeaturedJournal.astro` suppresses itself entirely when no entries exist. This is intentional. No content = no section, no placeholder, no visual gap.
- **Services grid** -- `ServiceCard.astro` falls back gracefully when a service has no `featuredImage`. The card renders without the visual; it never breaks.

The pattern: **auto-populating sections suppress themselves when empty; pages that are always routed stay live with a placeholder state.**

### Sanity reference resolution

Several queries reference other documents (e.g., `homePage.featuredTestimonial` pointing at a testimonial document). If the referenced document gets unpublished or deleted, the query returns `null`. Every component that consumes a referenced document must handle null gracefully -- render the section without it, or skip the section entirely. Don't crash; don't show "undefined."

### Sanity content not yet seeded

During setup, some `siteSettings` or page fields may be empty while an editor completes them. Every component reading from Sanity falls back to a sensible default (see `Footer.astro` and `Header.astro` for the pattern: `siteSettings?.field ?? site.staticDefault`). The site stays presentable even with empty content.

The `sanityFetch(query, params, fallback)` wrapper returns the fallback when no Sanity project is configured at all. This is what makes a fresh-clone build succeed with zero content: every query returns its fallback, pages render in empty-state, and the build completes. Swap in real env vars when the project is ready.

### The "coming soon" discipline

The module system is built on this discipline: a module that is not yet enabled leaves no trace. When a toggle is off, its section is removed from the nav, footer, homepage, and its own route redirects home. This means a new project can launch with only the core pages live while module content is drafted, without visitors ever seeing an empty placeholder page for a module that isn't ready.

The same discipline applies to individual sections within a page: if a section's content isn't ready, suppress the section cleanly rather than shipping a partially-filled one. The `value !== false` rule in `sectionVisibility.ts` enforces this at the toggle level; component-level null checks enforce it at the content level.
