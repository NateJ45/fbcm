# Best-in-class church websites: field notes

Research date: 2026-09-20. Facet: award-recognised and best-in-class church websites, any tradition or size.

**Method and its limits.** I fetched 41 church homepages directly over HTTPS and read the raw HTML, the linked stylesheets, the Adobe Typekit kit manifests and the Google Fonts query strings. That gives hard evidence for typefaces, type scale, colour tokens and container widths, and it gives the real copy. It does **not** give me pixels. Where a site is rendered client-side (Webflow, Framer, Next.js, Sitetheory) I say so and I limit myself to what the markup and CSS actually prove. Anywhere I am inferring rather than reading, I mark it "inferred". Three sites would not load and are named at the bottom rather than described from memory.

---

## 1. The sites

Loaded means I retrieved the page and read its source. "Studio" is only filled where I found attribution (Awwwards credit, case study, or a visible build signature).

| # | Church | City | Tradition / size | URL | Platform / studio | Loaded |
|---|---|---|---|---|---|---|
| 1 | Washington National Cathedral | Washington DC | Episcopal, cathedral, 1907 Gothic | cathedral.org | Custom WordPress theme ("primary"), variable Bespoke Serif | Yes |
| 2 | St Bride's Fleet Street | London | Church of England, Wren 1672, small congregation, big music | stbrides.com | WordPress, custom (Noe Text licensed) | Yes |
| 3 | Coventry Cathedral | Coventry, UK | Church of England, ruins plus 1962 modernist nave | coventrycathedral.org.uk | Craft CMS plus Tailwind, custom build | Yes |
| 4 | Trinity Church Wall Street | New York | Episcopal, 1846 Gothic Revival, large endowment | trinitychurchnyc.org (from trinitywallstreet.org 301) | Drupal, custom theme | Yes |
| 5 | St Martin-in-the-Fields | London | Church of England, 1726 Gibbs church, concert venue | stmartin-in-the-fields.org | WordPress, Gotham plus Lora via Typekit | Yes |
| 6 | Knox Presbyterian Church | Toronto | Presbyterian, 1909 Gothic, downtown, mid-size | knoxtoronto.org | Squarespace, Crimson Text plus Karla | Yes |
| 7 | St Paul's Episcopal Church | Waco, Texas | Episcopal, historic downtown parish | stpaulswaco.org | WordPress/Elementor, LTC Goudy Oldstyle Pro. Brand and site by Sidekick Agency | Yes |
| 8 | Cornerstone Church | Athens, Georgia | Nondenominational, large | cornerstoneathens.cc | Custom, GSAP. Awwwards credit: Judah Holland | Yes |
| 9 | The Austin Stone Community Church | Austin, Texas | Baptist-rooted nondenominational, multisite | austinstone.org | Webflow, Proxima Nova plus Freight Text Pro plus MADE Sunflower | Yes |
| 10 | Passion City Church | Atlanta and Washington DC | Nondenominational megachurch | passioncitychurch.com | Custom Tailwind plus Alpine plus GSAP ("avalanche"). Awwwards credit: Whiteboard | Yes |
| 11 | Bridgetown Church | Portland, Oregon | Nondenominational, ~1500 | bridgetown.church | Squarespace | Yes |
| 12 | Holy Trinity Brompton (HTB) | London | Church of England, very large, 6 sites | htb.org | Squarespace with Typekit Montecatini Pro Ampio plus Roca | Yes |
| 13 | Gas Street Church | Birmingham, UK | Church of England church plant | gasstreet.church | Squarespace, Geist | Yes |
| 14 | Holy Sepulchre London | London | Church of England, 1137 foundation, National Musicians' Church | hsl.church | Squarespace, Roboto | Yes |
| 15 | City Church San Francisco | San Francisco | Reformed / progressive evangelical | citychurchsf.org | Sitetheory, Besley plus Alexandria | Yes |
| 16 | New Life Church | Oxnard, California | Pentecostal / nondenominational | newlifeoxnard.com | Custom, Bebas Neue plus DM Sans plus JetBrains Mono | Yes |
| 17 | Southland Christian Church | Lexington, Kentucky | Christian Church, megachurch | southland.church | Squarespace, Playfair Display SC plus Abhaya Libre plus Cormorant Garamond. Awwwards credit: tferguson | Yes |
| 18 | Generation Church | Mesa, Arizona | Nondenominational | generation.church | WordPress. Awwwards Honorable Mention 2022, Historic Agency | Yes |
| 19 | St Paul's Cathedral | London | Church of England, Wren cathedral | stpauls.co.uk | WordPress, Raleway | Yes |
| 20 | Salisbury Cathedral | Salisbury, UK | Church of England, 1258 Gothic | salisburycathedral.org.uk | Custom CMS, BEM-named component CSS | Yes |
| 21 | Southwark Cathedral | London | Church of England, Gothic | cathedral.southwark.anglican.org | CMS, template-ish | Yes |
| 22 | Church of the Resurrection | Wheaton, Illinois | Anglican (ACNA) | churchrez.org | WordPress/Astra, Typekit kit with 8 families | Yes |
| 23 | Fourth Presbyterian Church | Chicago | Presbyterian (PCUSA), 1914 Gothic, Michigan Avenue | fourthchurch.org | Client-rendered, 27KB shell | Yes (shell only) |
| 24 | Old South Church | Boston | United Church of Christ, 1875 Venetian Gothic | oldsouth.org | Drupal | Yes |
| 25 | Saint Thomas Church Fifth Avenue | New York | Episcopal, 1913 Gothic, choir school | saintthomaschurch.org | WordPress, Open Sans plus EB Garamond plus Merriweather plus Montserrat | Yes |
| 26 | Grace Church | New York | Episcopal, 1846 Gothic Revival | gracechurchnyc.org | WordPress, Alice plus PT Sans plus Inter | Yes |
| 27 | Reality SF | San Francisco | Nondenominational | realitysf.com | WordPress, Montserrat | Yes |
| 28 | Marble Collegiate Church | New York | Reformed Church in America, 1854 | marblechurch.org | WordPress, Rubik | Yes |
| 29 | Élan Church | (US) | Nondenominational | elan.church | Framer, Inter | Yes |
| 30 | Sonship Church | Bay Ridge, Brooklyn | Nondenominational | sonshipbayridge.church | WordPress, Caudex plus Raleway | Yes |

Also loaded and used as counter-examples or supporting evidence: redeemer.com, mosaicva.com, cecb.church, pinestreet.org, immanuelnashville.com, incarnation.org, stbarts.org, citylife.church, theorchard.church, bedehuskirken.no, allsouls.org.

**Could not load:** theadventboston.org (HTTP 403 to a scripted client), emmanuelcovenant.org (DNS failure), craftchurch.com (returned a 114-byte empty body). I am not describing any of the three.

---

## 2. The strongest ten, in detail

### 2.1 Washington National Cathedral (cathedral.org)

This is the single most relevant reference in the set, because it is the only site I loaded where a Gothic limestone building is the client and the design is genuinely considered rather than merely competent.

**Type.** Two families, sharply divided by job. Display is `proxima-nova` at weight **800**. Prose is a self-hosted variable serif called **Bespoke Serif** (`BespokeSerif-Variable.woff2`, weight axis 300 to 800, plus a separate variable italic file). The split is unusual and worth copying: the sans does the shouting, the serif does the reading. Most church sites do the reverse and end up with a decorative serif headline over Inter body copy, which reads as a template.

**Scale.** The homepage H1 is `font-size: clamp(2.75rem, 0.66667rem + 6.6666666667vw, 5.75rem)` with `line-height: 1`. That is 44px on a phone and **92px on a wide desktop, set solid**. It is the biggest moment on the page by a wide margin and nothing else competes with it. Section H2s are `clamp(2rem, ..., 2.625rem)` at `line-height: 1.2857` and **weight 300**, so the hierarchy is 92px/800 down to 42px/300, a drop in both size and weight at once. Body prose is `clamp(1rem, ..., 1.0625rem)` at `line-height: 1.7058`, which is 17px at 29px leading: generous, editorial, not the 16/1.5 default.

**The lede device.** There is a dedicated `.typography .intro` rule: Bespoke Serif, **weight 300, style italic**, `clamp(1.375rem, ..., 1.75rem)`. A 28px light italic serif standfirst under the heading. This is a magazine move and it is the cheapest single thing on this list to steal.

**Colour.** The tokens are deep and specific, not a palette generator's output: `#5b000f` (oxblood), `#101946` (near-black navy), `#9f7610` (antique gold on hover), `#473599` (violet). No purple gradient, no teal accent. These read as stained glass and vestments.

**Hero structure.** The H1 is a compound: `<span class="home_feature_title_heading">Washington National Cathedral</span> A House of Prayer <span class="home_feature_heading_2">For All People</span>`. Three typographic registers inside one headline. It animates in with `opacity: 0; transform: translateY(-40px)` over `.75s` with a `.25s` delay. One CTA only: **"worship with us"**, lowercase.

**Navigation.** Two tiers, explicitly: a secondary strip (About, Congregation, Host Your Event, Support) and a main menu (Worship, Music, Visit & Tour, Learn & Discover, Calendar). Note that "Visit & Tour" is a first-class nav item and that the building's art and architecture get a top-level destination.

**The visit job.** Handled three ways at once, which is the clever part. (a) A "Sunday Holy Eucharist" card with a live date: "Sep 20 - 11:15 am Nave + Online". (b) A **"Today With the Cathedral"** band that lists everything happening on the current day, including whether self-guided sightseeing is open. (c) A "Discover the Cathedral" tile set: Worship, Music, Art & Architecture, Sightseeing & Tours, Programs. The site answers "can I come today, and what will I find" rather than posting a static times table.

**Not-a-template tells.** A licensed variable serif nobody else uses; a clamp-driven 92px hero; weight-300 section headings; an italic lede class; a today-dated worship card.

### 2.2 St Bride's Fleet Street (stbrides.com)

**Type.** `NoeText` (Schick Toikka's Noe Text, a high-contrast contemporary serif with sharp wedge serifs) plus a second face named `CentralAvenue`, with Open Sans only as a fallback. Noe is an editorial magazine serif. Using it on a Wren church is the move: it says "this place is serious about words" without dressing up as a manuscript.

**Hero.** The H1 is `Sublime Music [ornament] Inspiring Faith`, with a small image acting as a divider glyph between the two halves. Two three-syllable phrases balanced on an ornament. That is a wordmark, not a headline, and it is doing the job of a tagline while looking like typography.

**Copy voice.** The standfirst is "St Bride's, Fleet Street is a warm and welcoming Christian community, and one of the most famous and fascinating historic churches in London." It puts the congregation first and the tourism second, in one sentence. And the history band's heading is set as a full-width all-caps line: **"TO ENTER ST BRIDE'S DOORS IS TO STEP INTO 2000 YEARS OF HISTORY"**. That is one sentence doing the work of an entire About page.

**The visit job.** A **"TODAY AT ST BRIDE'S"** band, same pattern as the Cathedral: today's actual services with times and, for Choral Evensong, the actual musical programme listed. Plus a "Visit Us" band whose copy is "an oasis of calm amidst the bustle of Fleet Street" and "open and free to visit seven days a week". The word "free" is doing real work there.

**Navigation.** Worship & Music, What's On, About Us, News, Visit Us. Five items. "Worship & Music" as a single compound is a genuine editorial decision about what this church is.

### 2.3 Coventry Cathedral (coventrycathedral.org.uk)

**Type.** Three faces and each one has a reason: **MADE Sunflower** (a display serif, self-hosted with a legacy .eot fallback), **Omnes** (Darden Studio's humanist sans, self-hosted in four cuts including true italics at two weights), and Playfair Display for a supporting role. Omnes with real italics is a licensing decision, not a Google Fonts pick.

**Scale.** The hero H1 is Tailwind: `text-5xl sm:text-7xl md:text-8xl font-serif leading-tight`. That is 48px on mobile stepping to **96px** at md. A second H1 on the page reads `text-5xl text-center md:text-left sm:text-7xl font-serif text-white leading-tight mb-4` and its content is **"Healing wounds. Living with difference. Building justice and peace."** Three clauses, three verbs, no adjectives. It is the mission statement as the largest type on the page.

**Positioning.** The hero H1 is absolutely positioned: `absolute top-1/3 md:top-[max(50%,300px)] transform -translate-y-1/2`. So the headline sits at a third of the viewport on mobile and is vertically centred on desktop, over a full-bleed image, in white. Deliberate optical placement rather than a flexbox centre.

**Colour.** `#597f72` (a muted sage green) for buttons and `#ab0033` (a deep crimson) for submits, on a `#2d2d2d` ink. Sage and crimson is an unusual, confident pair and reads as the cathedral's own tapestry and glass rather than as a brand kit.

**Note on the register.** Coventry is the ruined-medieval-plus-modernist case, and its site leans modernist: Tailwind, big sans-adjacent display serif, activist copy. It proves a historic church does not have to go antiquarian.

### 2.4 Trinity Church Wall Street (trinitychurchnyc.org)

**Hero.** The H1 is simply **"Welcome"**. Under it, in an `<h4><em>`, "Join us for Sunday worship", then the times as plain text: "8am, 9am, 11:15am", then a button. That is the most restrained hero in the whole set and the most information-dense: one word, an italic invitation, three times, one link. It is worth noting how small the headline's ambition is and how completely the job gets done.

**Navigation.** Four compound items: Worship & Congregation, Music & Events, Community, **Visit & History**. Pairing "Visit" with "History" is the correct instinct for a landmark building: the tourist and the seeker use the same door.

**Sections.** What's New (a composer feature, a 9/11 art installation, a scriptural reflection), Calendar, a named discussion series ("Discovery: Fall 2026"), then "Love Your Neighbor" carrying a hard number, **"$522 million in charitable support"** since 2019, then **"Our history begins in 1697"**, then five place tiles (Trinity Church, St. Paul's Chapel, Trinity Commons, Trinity Retreat Center, Uptown Cemetery).

**Copy voice.** One line is worth quoting in full because it is the sharpest statement of welcome in the set: "Everyone, regardless of membership status, is invited to participate fully in our worship services, programs, and community life." It answers the actual anxiety ("am I allowed?") instead of asserting warmth.

**Weakness.** At 103KB of HTML on a Drupal theme, the typography is the least distinctive thing about it; I found no webfont link at all in the document head, so the type is either loaded from the aggregated CSS bundle or is system-stack. The site wins on information architecture and copy, not on type.

### 2.5 St Martin-in-the-Fields (stmartin-in-the-fields.org)

**Type.** Typekit kit `cqj6psa` serves **Gotham, Gotham Condensed, Gotham Narrow, Gotham XNarrow and Lora**. Four widths of Gotham is a real typographic system: it means headlines, tight nav, and event listings can each get the right width without changing voice.

**Positioning copy.** The welcome line is "A unique institution in which cultural, charitable and commercial initiatives are rooted in the life of a vibrant congregation". Note the order: culture, charity, commerce, then congregation as the root. That is an honest structural statement for a church that is also a concert hall, a cafe and a homelessness charity, and it resolves what would otherwise be a confused site.

**The visit job.** An **"On Today - Sun 20 sep"** band, again the live-dated pattern, and crucially each entry carries a plain-language descriptor: "Said Evening Prayer (Choral Evensong during term-times)" with the subtitle **"A beautiful 45-minute service"** and the time "4pm". Telling a stranger how long the service lasts is one of the highest-value, lowest-effort moves on any church site in this research, and almost nobody does it.

**Navigation.** Concert-venue-first: Box Office and a phone number in the utility bar, then What's On, Booking Information, then Visitor Information (How To Get Here, Things To Do & See, Accessibility, FAQs), then Congregation, Church Music, Venue Hire, Support Us, About Us. Explicit "Accessibility" and "FAQs" under visiting.

### 2.6 Knox Presbyterian Church, Toronto (knoxtoronto.org)

The closest analogue in the set to FBCM: a Gothic downtown Presbyterian church of moderate size, on Squarespace, and still not generic.

**Type.** `Crimson Text` (an old-style book serif in the Garamond tradition) for display plus `Karla` (a grotesque with slightly odd, characterful terminals) for UI. Two Google fonts, but a pairing with an argument: a reading serif and a sans that is not Inter and not Montserrat.

**Hero.** Centred, three lines, hard-broken with `<br>`: **"Following Jesus. / Loving the city. / Serving the world."** Under it, in an italic large-text class: "Wherever you are on your spiritual journey, you are welcome here." Three parallel verb phrases plus one italic welcome. Compare Coventry's three clauses. It is the same device.

**The visit job, done properly.** A single line carries the whole thing: "Worship with us Sundays at 11am" and "630 Spadina Ave, Downtown Toronto, Across from UofT". The location string is not an address, it is a **landmark**: "Across from UofT" tells a stranger more than a postcode. Two CTAs, "VISIT SUNDAY" pointing at a dedicated `/sunday` page, and "VIEW LIVESTREAM".

**Sections.** "What's Coming Up" (real dated events: Ministry Fair Sept 20, Student & Young Adult Welcome Lunch Sept 27, Walk with Refugees Oct 3) then "Take in Some Good News", whose copy is "Find encouragement through sermons preached at Knox through the past 60 years." Sixty years of sermons is a heritage claim made through an archive rather than through a history page.

**Navigation.** About, **Visit Us**, Join in, Resources. Four. Under Resources sit "Knox Library" and archived papers, which is exactly how a historic congregation turns its dusty assets into a reason to visit the site.

### 2.7 St Paul's Episcopal Church, Waco (stpaulswaco.org)

**Type.** Typekit kit `cqe6bbu` serves exactly one family: **LTC Goudy Oldstyle Pro**. A Lanston Type Company digitisation of Frederic Goudy's 1915 face. One historically correct typeface, licensed, used alone, with Open Sans only as the fallback in the Elementor variables. That restraint is the whole design decision.

**The documented approach.** Sidekick Agency's case study describes a two-day brand strategy process, then logo, print, guidelines, photography and site. The stated aim was to preserve the legacy while signalling "vitality and renewal", and the rector's line is worth keeping: "this process really did help us become more fully ourselves. We matured our brand to embrace the fullness of who we are and where we are going together."

**Caveat.** The build is WordPress plus Elementor, and the CSS is all `--e-global-typography-*` variables, so the underlying structure is a page builder. What lifts it out of template territory is the single licensed historic typeface and the photography commissioned as part of the brand work. That is the cheap version of the lesson: you do not need a bespoke build, you need one typeface nobody else has and pictures nobody else has.

### 2.8 Cornerstone Church, Athens (cornerstoneathens.cc)

The most recent Awwwards-recognised church site in the set (credited to Judah Holland).

**Type.** **Articulat CF** (CoFo/Connary Fagen's geometric grotesque, self-hosted as `Articulat_CF_Normal-860f_400.otf` and `Articulatcf-regular-7e0e_400.otf`, plus an `Articulat CF Demi Bold`) paired with **Apple Garamond Light and Apple Garamond Light Italic**. A crisp modern geometric against a light old-style italic is the exact opposite of the usual "serif headline, sans body" and it is why the page does not read as a template.

**Hero.** `<h1 class="hero-title gsap-slide-title">Making Jesus Known</h1>`. The class name tells you it is a GSAP slide-in. Three words. Under it, "Join Us Sunday!".

**The visit job.** "Sunday Worship" with 9 AM and 11 AM, and the detail that **Spanish translation is available at 11 AM**. A single concrete accommodation does more for perceived welcome than a paragraph about being welcoming.

**Copy voice.** "Our mission is simple: to love God and love people, grow in our relationship with Him and with each other, and find purpose in God's kingdom." It opens by promising simplicity and then delivers a three-clause sentence, which is a mild failure of nerve, but the nav is genuinely simple: Events, Giving, Watch, Visit, Prayer, About.

### 2.9 The Austin Stone (austinstone.org)

Webflow, but a Webflow build with a real type system.

**Type.** **Proxima Nova** (display and UI), **Freight Text Pro** (an editorial serif with a large range) and **MADE Sunflower** (display accent, the same face Coventry Cathedral self-hosts). Three families with three distinct jobs.

**Scale.** `.text-size-display { font-size: 5rem; line-height: 5.6rem; font-weight: 700; letter-spacing: -1px; }`. That is **80px on 89.6px leading with negative tracking**, a fixed value rather than a clamp. A modifier `.text-size-display.smaller` drops to `4rem / 4rem / weight 500`, so the second-tier display is 64px set solid at a lighter weight. Negative letter-spacing on the display is what stops 80px Proxima from looking like a slide deck.

**Hero.** An H1 reading simply **"We Are"**, immediately followed by an H2 inside a `hero-home---text-animation-container` with a `data-w-id` Webflow interaction. So the headline is "We Are" plus a rotating completion. A one-idea hero with movement carrying the rest.

**Container.** The Webflow CSS shows breakpoint maxima at 479, 767 and 991px and content maxima at 940px, 800px, 728px and 64rem (1024px). The prose column is being held near 728 to 800px, which is a reading measure, not a full-width band.

### 2.10 Passion City Church (passioncitychurch.com)

The megachurch register done at the top of its craft, credited on Awwwards to Whiteboard. I include it mainly as the register to avoid for FBCM, but its mechanics are instructive.

**Type.** Typekit kit `phk4ibw` serves exactly one family: **Owners** (Sharp Type). One licensed display family across the whole site, referenced in the markup as `font-headline-sans`.

**Scale.** The hero H1 class list is legible in the markup: `text-white font-headline-sans font-bold text-5xl lg:text-6xl xl:text-7xl tracking-tightest mb-3 !leading-custom`. So 48px to 60px to **72px** with a custom tightest tracking and a custom line-height token. Note it tops out at 72px, smaller than the Cathedral's 92px, because the hero is a video and the type has to stay out of the way.

**Hero content.** Four lines, hard-broken: "For God. / For People. / For the City. / For the World." Then a `max-w-sm` paragraph (so roughly a 24rem column, deliberately narrow against the huge headline): "Welcome to a place where the gospel is central and Jesus is always the lead story."

**Build.** Tailwind plus Alpine.js plus GSAP under an in-house framework called `avalanche`. The header is `fixed z-40 w-full transition` and becomes `bg-white/10 backdrop-blur-lg` on scroll, driven by a GSAP ScrollTrigger with `onLeaveBack`. Header items stagger in with `gsap.from(items, { opacity: 0, stagger: 0.2, delay: avalanche.delay.enter + 0.2, duration: 0.3 })`. There is a `demagnetize($refs.button)` call on mouseleave, so the buttons are magnetic on hover above the `lg` breakpoint and non-magnetic below it. That breakpoint-gated magnetism is a nice detail: the effect is disabled where it would be meaningless.

**Copy.** "Select a City" with "Our roots are in Atlanta and Washington DC though we consider the world our neighborhood." And on giving: "we believe percentages are a thing of the past, and obligation is the wrong approach." Confident, slightly brash. Correct for them, wrong for a 150-person Baptist congregation.

---

## 3. Patterns that recur among the best

1. **A live, dated "today" band instead of a static times table.** Washington National Cathedral ("Today With the Cathedral", listing the actual day's services and whether sightseeing is open), St Bride's ("TODAY AT ST BRIDE'S", with the Evensong music programme), St Martin-in-the-Fields ("On Today - Sun 20 sep"). This is the single strongest recurring move and it is the one most visibly absent from mediocre sites. It converts a brochure into a living building.

2. **Tell the stranger how long it lasts and what will happen.** St Martin's labels a service "A beautiful 45-minute service". Cornerstone Athens states Spanish translation at 11 AM. Trinity Wall Street writes "Everyone, regardless of membership status, is invited to participate fully". Specific accommodations beat generic warmth.

3. **Location as a landmark, not an address.** Knox Toronto: "630 Spadina Ave, Downtown Toronto, Across from UofT". Bridgetown puts the street address in the hero alongside "9 AM, 11 AM, & 5 PM". St Bride's: "an oasis of calm amidst the bustle of Fleet Street".

4. **One licensed typeface that nobody else has.** Washington National Cathedral (Bespoke Serif, variable, self-hosted), St Bride's (Noe Text), St Paul's Waco (LTC Goudy Oldstyle Pro, alone), Passion City (Owners, alone), Cornerstone Athens (Articulat CF), Coventry (MADE Sunflower plus Omnes with true italics), St Martin's (four widths of Gotham). The correlation between "one paid face" and "does not look like a template" is close to total in this sample.

5. **Invert the cliché pairing: sans display, serif prose.** Washington National Cathedral runs Proxima Nova 800 headlines over Bespoke Serif body at 17px/1.71. Cornerstone Athens runs geometric Articulat CF against Apple Garamond italic. The default church-site pairing is the reverse and it is a tell.

6. **A hero headline of three or four parallel clauses, hard-broken.** Knox Toronto ("Following Jesus. / Loving the city. / Serving the world."), Coventry ("Healing wounds. Living with difference. Building justice and peace."), Passion City ("For God. / For People. / For the City. / For the World."), Washington National Cathedral ("A House of Prayer / For All People"). Verbs and objects, no adjectives, and the line breaks are authored rather than fluid.

7. **A genuinely large single moment, set solid.** Cathedral: `clamp(2.75rem, ..., 5.75rem)` at `line-height: 1`, so 92px. Coventry: `md:text-8xl`, 96px. Austin Stone: `5rem / 5.6rem` with `-1px` tracking. Passion City: `xl:text-7xl` with `tracking-tightest`. In every case, exactly one element on the page is that big.

8. **Weight drop as well as size drop between tiers.** Washington National Cathedral goes from weight 800 display to **weight 300** section headings. Austin Stone goes from 700 at 80px to 500 at 64px. The hierarchy is carried by two axes, which is what keeps an 80px page from feeling like shouting.

9. **An italic serif lede, as its own class.** Washington National Cathedral's `.intro` is Bespoke Serif 300 italic at up to 28px. Knox Toronto's welcome line is `<em>` inside a `sqsrte-large` class. Trinity Wall Street's "Join us for Sunday worship" is `<h4><em>`. A standfirst in italic serif is the cheapest way to look edited rather than assembled.

10. **"Visit" is a top-level nav item, often compounded with something.** Trinity Wall Street: **"Visit & History"**. Washington National Cathedral: **"Visit & Tour"**. St Martin's: "Visitor Information" with children How To Get Here, Things To Do & See, Accessibility, FAQs. Knox: "Visit Us" pointing at a dedicated `/sunday` page. Compounding is what stops the historic building from being a separate museum silo.

11. **The building gets its own destination, framed as art rather than history.** Washington National Cathedral's discover tiles include "Art & Architecture" and "Sightseeing & Tours". St Bride's: "TO ENTER ST BRIDE'S DOORS IS TO STEP INTO 2000 YEARS OF HISTORY". Trinity: "Our history begins in 1697" plus five place tiles. History as a place you can stand in, not a timeline page.

12. **A hard number instead of an adjective.** Trinity Wall Street: "$522 million in charitable support" since 2019. Knox Toronto: sermons "through the past 60 years". HTB: "Ten services, six sites, one church". Washington National Cathedral's giving band: "Every gift made by midnight Sept. 24 will be doubled, up to $100,000" with a progress bar.

13. **Narrow measure held against wide bands.** Austin Stone caps content at 728 to 800px and 64rem inside full-bleed sections. Passion City sets the hero paragraph to `max-w-sm` (24rem) directly under a 72px headline. The contrast between a very wide band and a very narrow column is most of what "designed" looks like.

14. **Entrance motion that is one idea, not a carousel.** Washington National Cathedral: `opacity 0 -> 1` plus `translateY(-40px) -> 0` over 0.75s with a 0.25s delay, on the headline only. Cornerstone Athens: a single `gsap-slide-title` class on the H1. Passion City: a 0.2s stagger across header items on load. None of these sites open with a slideshow.

15. **Effects that switch themselves off at small sizes.** Passion City wraps its magnetic buttons in `avalanche.breakpoint(avalanche.screens.lg)` so the magnetism only exists on large screens, and `demagnetize()` on mouseleave. Coventry's hero headline moves from `top-1/3` on mobile to `top-[max(50%,300px)]` on desktop, so the optical placement is authored per breakpoint rather than inherited.

---

## 4. What the mediocre ones share

Every item here is something I read in the source of a site I actually loaded.

1. **Inter, or Roboto, or Raleway, or Montserrat, as the whole type system.** Élan Church: `Inter, Inter Placeholder, sans-serif` (Framer's default, unchanged). Mosaic Church VA: three separate Google Fonts requests all resolving to Inter and Open Sans. Holy Sepulchre London, a church founded in 1137 and known as the National Musicians' Church: `font-family: 'Roboto'`. St Paul's Cathedral London: Raleway. Reality SF: Montserrat with nine weight/style variants requested and no second family. Sonship Brooklyn: Raleway plus Caudex. Marble Collegiate: Rubik. When the only typeface is free and ubiquitous, no amount of photography rescues it.

2. **Four or more font families with no system.** Saint Thomas Church Fifth Avenue loads, in one Google Fonts request, **Open Sans (6 cuts) plus EB Garamond (16 cuts) plus Merriweather (6 cuts) plus Montserrat (2 cuts)**, and separately Open Sans again. Church of the Resurrection's Typekit kit carries eight families including `chainprinter`, `milka-brittle` and `lulo-one`. Many families is not a type system, it is an absence of one.

3. **The page-builder signature in the CSS.** St Paul's Waco is `--e-global-typography-primary-font-family` and five siblings, which is Elementor. Church of the Resurrection is the Astra theme. Immanuel Nashville has inline `style='font-size:3.5em;color:#cfa354;'` on its H1, which is a heading styled in a WYSIWYG rather than in a stylesheet, and the gold `#cfa354` is applied per-element. Mosaic VA's H1 contains `style="font-size: 3rem"` and `text-shadow: 3px 3px 5px black` inline, which is what happens when white text over a photo fails a contrast check and someone reaches for a shadow instead of a scrim.

4. **Text shadow used as a scrim.** Mosaic VA, twice in one hero (`text-shadow: 3px 3px 5px black`, then `2px 2px 5px black` on the subhead). Best-in-class sites use a gradient overlay or crop to a dark region; a drop shadow on a headline is the single most reliable tell of an untrained hand.

5. **The generic welcome H1.** "Welcome to Bridgetown Church", "Welcome to New Life", "Welcome Home" (Generation Church), "Welcome from our Dean" (Southwark Cathedral). Compare Trinity Wall Street's bare "Welcome" over three service times, which is the same word doing an entirely different job because of what surrounds it. "Welcome to [church name]" as an H1 says nothing the logo has not already said.

6. **Every band the same height and the same rhythm.** Not directly measurable from source, but its proxy is visible: Holy Sepulchre London's homepage H1s are, in order, "Services", "Upcoming Events & News", "Social Action in the Community", "News from our Socials". Four H1 elements, all `text-align:center`, all one-word-or-phrase section labels. A page whose every section is a centred label over a grid has no rhythm, and it has four H1s, which is also an accessibility problem.

7. **Stock or uncredited photography, detectable by absence.** The weak sites in this set carry no evidence of commissioned photography in their markup: no photographer credit, no consistent asset naming, no art direction metadata. The strong ones do the opposite. St Paul's Waco's case study lists photography as a deliverable of the brand engagement. This is the difference between pictures of a church and pictures of **this** church.

8. **Squarespace or Framer or Webflow defaults left untouched.** Squarespace's default Karla plus Poppins pairing survives unchanged in HTB's stylesheet (they layer Typekit over it, but the default is still shipping). Élan Church is Framer with `Inter Placeholder` still in the stack, which is literally the placeholder token. Being on a builder is fine. Shipping its defaults is the tell.

9. **The carousel, the icon triple, and the three-column "next steps" row.** City Church SF's markup carries a full carousel component with `slidesPerView`, `zoomOut`, `zoomIn`, `panRight`, `panLeft` image animations and `multi-item-carousel` classes, which is a Ken Burns slideshow kit sitting in a church's homepage. The Orchard loads Gotham Book, Gotham Medium, Montserrat, Roboto, Source Sans Pro and FontAwesome together, and FontAwesome at `!important` is what a row of icon cards looks like from the inside.

10. **Service times buried below the fold or only on a subpage.** Southwark Cathedral's first H1 is "Welcome from our Dean". Old South Church's first H1 is literally the word "Homepage" wrapped in a Drupal `field--name-title`. Fourth Presbyterian Chicago ships a 27KB client-rendered shell with no server-rendered headline at all, so the times are not in the document. Contrast Trinity, Bridgetown, Knox and Cornerstone, all of which put the times inside the first screen of markup.

11. **Four or five sans-serif greys and a single accent.** Where the weak sites do declare tokens, they are neutral to the point of anonymity: New Life Oxnard's whole palette is `--bg: #ffffff`, `--card-bg: #f4f4f4`, `--text-dark: #111111`, `--text-muted: #777777`, `--text-primary: #111111`. That is a wireframe palette. Compare Washington National Cathedral's oxblood, navy, gold and violet, or Coventry's sage and crimson.

12. **Copy that describes the church to itself.** "A unique institution in which..." works at St Martin's because it is resolving a genuinely complicated organisation. Elsewhere the same register produces mission statements with three abstract nouns and no verbs. The strong sites all use **verbs** in the hero (Following, Loving, Serving; Healing, Living, Building; Making Jesus Known) and the weak ones use nouns.

---

## 5. Which register suits a historic downtown Gothic congregation

**The right register: the cathedral-editorial one.** Washington National Cathedral, St Bride's Fleet Street, Trinity Wall Street, Knox Toronto and St Paul's Waco are the five to study, in that order. What they share is that the design behaves like a **printed programme or a good magazine**, not like a product landing page. Concretely, for a 150-person 1929 limestone church with an oak-and-glass nave and a 10:45 service:

- **One licensed serif for prose, set large and loose** (Washington National Cathedral's 17px at 1.71 leading is the number to aim at), with either a second serif or a quiet grotesque for UI. A variable serif such as Bespoke Serif, or a historically grounded old-style such as LTC Goudy Oldstyle Pro, is the correct genre. Crimson Text plus Karla (Knox) is the free-fonts version that still works.
- **One very large moment, set solid, once per page.** 80 to 92px on desktop, clamped down to 44 to 48px on a phone, weight high, tracking slightly negative. Then a hard drop to a weight-300 or weight-400 section heading at roughly 40px. Nothing else on the page is allowed near that size.
- **An italic serif lede class** under the headline. This is the historic register's signature and it costs one CSS rule.
- **Deep, specific colour taken from the building.** Oxblood, slate, antique gold, a bottle green. Washington National Cathedral's `#5b000f` / `#101946` / `#9f7610` is a direct model. Avoid any accent that could plausibly have come from a palette generator.
- **The building as art, not as history.** One destination that treats the limestone, the oak and the glass as things worth looking at, photographed properly, with the stained glass shot as the colour source for the whole palette. St Bride's "2000 years of history" line and Trinity's five place tiles are the pattern.
- **A live, dated band.** "Today at First Baptist", or at minimum "This Sunday, 10:45" with the date computed. With 150 people and one service this is easy to keep honest, and it is what makes a small church's site feel inhabited.
- **Say how long it lasts and what happens.** St Martin's "A beautiful 45-minute service" is the model. For an American Baptist congregation of 150, "About an hour. Hymns, a sermon, and coffee afterwards in the fellowship hall" would outperform any amount of welcoming adjectives.
- **Landmark location, not a postcode.** "309 East Adams Street, two blocks from the Delaware County courthouse" rather than the address alone.

**The wrong register: the megachurch video hero.** Passion City, Elevation, Southland and New Life Oxnard all open on full-bleed motion, 60 to 72px condensed or geometric sans, magnetic buttons, a "PLAN YOUR VISIT" button styled as a product CTA, and a multi-campus selector. Four reasons it would be wrong here. (a) The visual language promises production scale a 150-person congregation cannot deliver on Sunday, which is a bait-and-switch the visitor discovers in person. (b) A video hero wastes the single best asset, which is a 1929 limestone Gothic exterior and a stained-glass nave, both of which are far stronger as large still photographs than as footage. (c) The condensed-sans-and-tight-tracking register reads as 2019 conference branding and will date; a book serif will not. (d) The copy voice that goes with it ("percentages are a thing of the past, and obligation is the wrong approach") is wrong for an American Baptist congregation founded in 1859.

**Also wrong: the antiquarian register.** The opposite failure is worth naming. Blackletter, parchment textures, a scanned engraving of the building, sepia. None of the strong historic sites do this. Washington National Cathedral pairs a Gothic building with **Proxima Nova at weight 800**; Coventry sets a mission statement in 96px over a photograph. The rule the good ones follow is: let the building supply the age, and let the typography and layout be unmistakably of now. A historic church that designs historically looks dead. A historic church that designs cleanly looks alive and old, which is the thing worth being.

**One note on scale honesty.** FBCM has 142 imported posts and a real archive. Knox Toronto's "sermons preached at Knox through the past 60 years" shows how a small congregation turns depth of record into the thing a megachurch cannot fake. That, plus the building, plus one good typeface, is the whole portfolio-quality argument.
