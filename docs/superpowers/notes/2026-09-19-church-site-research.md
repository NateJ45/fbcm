# Church website research — for First Baptist Church Muncie redesign

Date: 2026-09-19. Method: live fetch/render of each site (WebFetch + browser), not memory. Screenshots were not saved to disk (browser tools here don't expose a save-to-path action) — findings below are from rendered text/DOM and one live screenshot (Park Street).

Sites surveyed (6, all loaded): Redeemer Presbyterian NYC, Trinity Church Wall Street (now trinitychurchnyc.org), Washington National Cathedral, Church of the Highlands, Passion City Church, Park Street Church Boston.
Not reachable / substituted: Bridgetown Church and Fourth Presbyterian were not fetched (time budget spent on the above mix, which already covers historic-downtown + megachurch-contemporary). "Best church website 2025/2026" search turned up no independently-verified Awwwards/Webby religion winners — WebAward's "Best Faith-based" 2026 category exists but no public winner page was found; industry roundups (ReachRight, OurChurch.com) instead surface VOUS Church, Fairhaven Church, and Passion City Church as repeat "best-of" picks. Treat those roundups as marketing content, not juried awards.

---

## 1. Redeemer (redeemer.com)

1. **Above fold**: Hero carousel of background photos behind headline "A Family of Churches and Ministries for the Good of the City." 3 carousel-card CTAs (Center for Faith & Work event, a Tim Keller message, the Redeemer Network vision). No service time or address visible without scrolling — because redeemer.com is a network hub for multiple congregations, not a single parish site.
2. **Nav**: 5 items — Redeemer Network, Churches, Ministries, Generosity, Central Services. "Give" exists but lives inside "Generosity," not as its own top-level word.
3. **Photography**: Full-bleed carousel, subject unclear from markup but city/ministry themed.
4. **Type**: Sans-serif, clean hierarchy, generous whitespace — feels corporate/institutional rather than warm.
5. **Visit page**: Could not locate a single "plan a visit" page — by design, since Redeemer is an umbrella brand and each member church (e.g., Redeemer East Side, West Side) has its own separate visit flow. This is a structural lesson, not a page-level one.
6. **Borrow**: nothing — this is a multi-campus network site, not a model for a single-building parish. **Avoid**: don't copy the "network hub" structure; a single church needs one unambiguous visit path, not a portfolio of ministries competing for the front door.

## 2. Trinity Church (trinitychurchnyc.org, redirected from trinitywallstreet.org)

1. **Above fold**: Large photo/video of the churchyard with headline "Welcome." Service times ARE visible without scrolling: "8am, 9am, 11:15am" plus a "See Schedule" link — the only one of the six sites that puts times above the fold on the homepage itself. Address not shown above the fold (footer).
2. **Nav**: 5 items — Worship & Congregation, Music & Events, Community, Visit & History, plus search/toggle. "Donate" is relegated to the footer, styled as a plain text link — notably underplayed for money.
3. **Photography**: Mixed full-bleed and contained; both architecture and candid community shots; warm, natural, slightly muted tones. Roughly 40-50% of the page is image.
4. **Type**: Serif for headlines and body — the only one of the six using serif as the dominant display face. Medium-to-bold weight, generous whitespace, reads as contemplative rather than corporate.
5. **Visit page**: "Visit & History" is a combined nav item — visiting and heritage are treated as one story, not two.
6. **Borrow**: serif type + service times visible on the homepage without scrolling — directly relevant for a 160-year-old landmark. **Avoid**: burying "Give" in the footer works for a wealthily-endowed historic parish; a Baptist church funded by congregational giving cannot afford to make giving that invisible.

## 3. Washington National Cathedral (cathedral.org)

1. **Above fold**: Full-bleed hero photo/video of the cathedral exterior (towers against sky), headline "Washington National Cathedral — A House of Prayer For All People." 2 CTAs: "Sunday Holy Eucharist," "Full Calendar." No service time or address visible without scrolling (both are one click away).
2. **Nav**: 6 top items — Worship, Music, Visit & Tour, Learn & Discover, Calendar, plus a secondary menu (About, Congregation, Host Your Event, Support). "Donate" sits as a distinctly colored button, upper right — clearly the most prominent Give treatment of the six.
3. **Photography**: Full-bleed architectural hero (~35-40% of the viewport), rich natural color, building-first not people-first.
4. **Type**: Sans-serif throughout, mixed regular/semibold, generous whitespace — surprisingly modern for a Gothic building.
5. **Visit page** (cathedral.org/visit): Answers, in order: sightseeing options (self-guided/guided/tower tours) → current exhibitions → what's closed for restoration → practical info hub (location/parking/entrance/FAQ). Has a map (address + Google Maps link), parking (linked, not described inline), a dedicated "Visiting With Kids" page, service times (linked). No what-to-wear guidance. Functions as a navigation hub to deeper pages rather than one all-in-one page.
6. **Borrow**: the prominent, high-contrast "Donate" button and the dedicated "Visiting With Kids" page. **Avoid**: the visit info being spread across five linked-out pages — for 12 visits/day, a single self-contained visit page will serve FBCM users better than a hub-and-spoke structure built for a tourist attraction handling thousands of visitors.

## 4. Church of the Highlands (churchofthehighlands.com)

1. **Above fold**: Full-bleed photo of a worship service, headline "Welcome Home." 3 CTAs: "New to Highlands?", "Plan Your Visit / Find a Location", "Recent Messages / Watch Now." No address/service time above the fold (multi-campus, so location-dependent).
2. **Nav**: 7 items — New to Highlands?, About, Locations, Next Steps, Watch, News, Give. "Give" is styled identically to every other nav word — no special treatment.
3. **Photography**: Full-bleed, people-in-worship, warm/vibrant color. ~70-75% of the above-fold is image — the most photo-dominant of the six.
4. **Type**: Sans-serif, generous letter/line-spacing, mixed regular/bold weights, moderate-to-heavy headline weight.
5. **Visit page**: The real visitor flow runs through a pop-up/embedded form (ChurchSpring-style "Plan Your Visit" widget) rather than a static content page — could not retrieve static content because the flow is JS-driven and campus-specific.
6. **Borrow**: "New to Highlands?" as literally the first nav word — puts the first-timer's question ahead of every ministry program. **Avoid**: 70%+ imagery and a multi-campus "Locations" nav item are wrong for one landmark building with one Sunday service — that architecture solves a problem (which of 20+ campuses do I go to?) FBCM doesn't have.

## 5. Passion City Church (passioncitychurch.com)

1. **Above fold**: Full-bleed photo with headline/tagline "For God. For People. For the City. For the World." 2 CTA types: "Learn More" and city-selection cards (Atlanta / Washington DC). No service time or address above the fold (again, multi-city).
2. **Nav**: 5 items — About, Atlanta, Washington DC, Give, Locations (dropdown: 515, Cumberland, Trilith, Washington DC). "Give" is a full top-level nav word here, styled the same as everything else — present but not visually shouted.
3. **Photography**: Full-bleed, people/energy-focused, warm vibrant color, ~40-50% of above-fold.
4. **Type**: Sans-serif, open spacing, bold headline weight vs. lighter body — high-energy brand feel.
5. **Visit page**: The `/im-new` guess 404'd; visitor info is folded into location-specific pages rather than one global "I'm new" page.
6. **Borrow**: tagline-as-headline pattern ("For God. For People. For the City. For the World.") shows how a short mission statement can replace a generic "Welcome" — FBCM could use its own compact statement of identity. **Avoid**: the tagline is abstract mission language, not a concrete invitation — a small church's headline should be more concrete ("Join us Sundays at 10:45") since it can't rely on brand recognition the way a large network can.

## 6. Park Street Church, Boston (parkstreet.org)

Historic (est. 1809), downtown, landmark steeple, evangelical/Congregational-tradition — the closest structural comparison to FBCM of anything surveyed.

1. **Above fold** (confirmed via live screenshot): full-bleed photo of the sanctuary interior mid-service (organ pipes, balcony, congregation), overlaid with "JESUS ABOVE ALL" kicker, headline "Sunday Worship," and **times directly under the headline: "8:30 & 11 am."** 2 CTAs: "Watch Live" and "Sunday Bulletin." Address not shown above the fold. This is the clearest, most concrete above-fold pattern of all six sites.
2. **Nav**: 6 items — About Us, Ministries, Missions, Events, Sermons, Give. "Give" is a full top-level word, plain text, no distinguishing button color.
3. **Photography**: Full-bleed, people mid-worship inside the historic sanctuary (architecture and people combined in one shot — pipe organ, ornate ceiling, congregation), warm gold/amber tones rather than cool. Roughly 50% of the visible first screen is photo.
4. **Type**: Serif small caps for the kicker ("JESUS ABOVE ALL"), a light/elegant serif for "Sunday Worship," sans-serif for UI/buttons — a deliberate serif-for-soul / sans-for-utility split.
5. **Visit page**: There is no dedicated "Plan a Visit" nav item at all. Visitor welcome runs the traditional way: a "Connect card" placed in the pew, an usher or offering-plate drop-off, an in-person Welcome Center one floor below the sanctuary with a printed Welcome booklet, and an invitation to a Newcomers Lunch. The digital "ask" is minimal (a QR code and a URL) because the primary conversion path is still physical, on a Sunday.
6. **Borrow**: exactly this above-fold pattern — full-bleed real sanctuary photo (not stock), a short kicker line, one headline word, times immediately visible, two calm CTAs — is the single closest template for FBCM. **Avoid**: skipping a digital visit page entirely. Park Street can rely on pew cards and an usher because it already has steady foot traffic and staff; a smaller church trying to grow from ~12 visits/day should not remove the online on-ramp just because a historic peer did.

---

## Patterns

| Pattern | Who does it | Notes |
|---|---|---|
| Full-bleed photo, not stock-feeling, as the entire hero | All 6 | Even the tourist-attraction-scale sites (Cathedral) use a real photo of the building/people, not an illustration or plain color block. |
| Short headline (1-4 words) + one supporting line | Trinity ("Welcome"), Park Street ("Sunday Worship" + times), Cathedral (name + tagline) | The traditional/historic sites keep it shortest; the multi-campus contemporary sites use longer mission-statement headlines because they can't lead with a single time/place. |
| 2-3 CTAs max above the fold, never more | All 6 | Nobody puts more than 3 buttons in the hero. Typical pair: a "watch/learn" CTA + a "visit/give" CTA. |
| "Give"/"Donate" always present in primary or footer nav, but treatment varies widely | All 6 | Cathedral = high-contrast button (institution funded partly by tourism/philanthropy). Highlands/Passion = plain nav word. Trinity = footer only (large endowment). Park Street = plain nav word. No traditional-and-small church buried it entirely. |
| Nav item count clusters at 5-7 | All 6 | Nobody goes past 7 top-level items; historic sites (Trinity, Park Street) trend toward 5-6, contemporary multi-campus toward 6-7 (extra item for Locations). |
| Serif type appears only on the two historic/traditional sites | Trinity, Park Street | Contemporary megachurches (Highlands, Passion, Cathedral) are sans-serif despite Cathedral's Gothic building — a deliberate choice to read as current, not just old. |
| Visitor-question ordering, when a dedicated page exists | Cathedral, (Highlands via form) | Practical logistics (what to expect, when, where, what closed/changed) before doctrine/history. |
| Multi-campus/network sites cannot put service time or address above the fold | Redeemer, Highlands, Passion | Structural constraint that does NOT apply to FBCM — a single-building single-service church should exploit this and always show time + address above the fold, which none of the multi-campus sites can do but Trinity and Park Street both do. |

## For a historic downtown Baptist church (FBCM)

**Recommendations:**
1. Above the fold, use a real photograph of your own sanctuary or steeple during an actual Sunday service (not stock), paired with a short kicker + one-word or few-word headline and the service time directly beneath it — model this on Park Street's "Sunday Worship / 8:30 & 11 am" and Trinity's "Welcome / 8am, 9am, 11:15am." With one service (10:45am) and one address, FBCM can do what none of the multi-campus sites can: put both above the fold without a click.
2. Keep the hero to 2 CTAs, one oriented to first-timers ("Plan Your Visit" or "New Here?") and one to media ("Watch a Recent Message" or similar), following the Highlands/Park Street pattern.
3. Use serif type for headline/display copy (following Trinity and Park Street) to signal the 160-year history honestly, but keep UI chrome (buttons, nav, forms) in a clean sans-serif so the site still reads as current, not dated — the serif/sans split Park Street already uses.
4. Build one self-contained "Plan a Visit" page, not a hub-and-spoke like the Cathedral's. At ~12 visits/day, a visitor should get everything (what to expect, service time, address + embedded map, parking, dress code, kids' info) in a single scroll, not a click-through maze meant for high tourist volume.
5. Put "Give" in the primary nav as its own word (as Highlands, Passion, and Park Street do) rather than folding it into another menu (as Redeemer does) or hiding it in the footer (as Trinity does) — a congregation-funded Baptist church cannot afford Trinity's low-key treatment.
6. Keep total nav items to 6 or fewer (About, Ministries/Grow, Events/Calendar, Sermons/Media, Visit, Give) — every surveyed historic/traditional site (Trinity, Park Street) stayed at 5-6, and FBCM has no multi-campus reason to need more.
7. Photograph real people from the actual congregation in the actual sanctuary, warm/amber tones rather than cool, echoing Park Street's interior shot — this communicates "come as you are to a real, living congregation" rather than a stock/generic feel, and differentiates from a purely architectural postcard shot (Cathedral's exterior-only hero, which reads more like a landmark ad than an invitation).
8. Still build a dedicated online visit page even though it's the "traditional" thing to skip (see Park Street) — a landmark building with only 12 visits/day needs the digital on-ramp more than an institution with constant foot traffic already does.

**Avoid:**
1. Don't adopt a multi-campus/network structure (Redeemer's "Churches" nav item, Highlands'/Passion's "Locations" dropdown) — FBCM is one building, one service; that nav pattern would look confusing and inflated for a single congregation.
2. Don't make the hero 70%+ photography with minimal text (Highlands' pattern) — that works for a rotating stock of high-production worship photography from a media team; a small church without that pipeline will look thin trying to match it, and it buries the concrete facts (time, place) a first-time visitor most needs.
3. Don't use an abstract mission-statement headline in place of a concrete invitation (Passion's "For God. For People. For the City. For the World.") — a small church with no existing brand recognition should lead with the plain fact (when/where to show up), not a slogan.
4. Don't spread visit information across five linked pages the way the Cathedral does — that pattern exists to manage massive tourist volume and would make a 12-visits/day parish site feel bureaucratic and cold.
5. Don't bury "Give" in the footer the way Trinity does — that only works for an institution with Trinity's endowment; a Baptist congregation depends on visible, ordinary giving asks.

---

## Sources
- https://www.redeemer.com
- https://trinitychurchnyc.org/ (redirect target of trinitywallstreet.org)
- https://cathedral.org and https://cathedral.org/visit/
- https://www.churchofthehighlands.com and https://thehighlands.cc/about-us/plan-your-visit/ (search result only, page fetch 404'd)
- https://passioncitychurch.com
- https://parkstreet.org (live browser render + screenshot)
- https://reachrightstudios.com/blog/best-church-websites/ (industry roundup, not a juried award)
- https://www.ourchurch.com/best-church-websites-2026/ and https://www.webaward.org/category/Faith-based/best-faith-based-websites.html (referenced, no verifiable juried winner page found for religion/spirituality Webby or Awwwards 2025-2026)
