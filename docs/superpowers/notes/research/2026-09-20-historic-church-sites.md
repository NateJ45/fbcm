# Historic, mainline and architecturally significant church sites: design research

Facet: historic / mainline / liturgical churches, cathedrals and chapels, plus university chapels,
museums and historic houses. Prepared for the First Baptist Church Muncie rebuild, 2026-09-20.

Method: each site was loaded live. Where the rendered markdown gave no typography, the raw HTML and
the linked stylesheets were pulled with curl and grepped for `font-family`, `@font-face` sources,
Google Fonts and Typekit kit ids, and hex values. Typekit kit ids were resolved against
`use.typekit.net/<kit>.css`. Everything in the "evidence" column below was read out of the live
source, not inferred.

---

## 1. Sites loaded

30 sites loaded. Rating is my own 1 to 5 for design quality in this register (5 = a site a good
studio would put in a portfolio).

| # | Site | City | Tradition | URL | Designer / agency credited | Rating |
|---|------|------|-----------|-----|---------------------------|--------|
| 1 | Trinity Church Wall Street | New York NY | Episcopal | trinitychurchnyc.org (301 from trinitywallstreet.org) | none credited; custom Drupal theme named `gesso` | 5 |
| 2 | Washington National Cathedral | Washington DC | Episcopal | cathedral.org | none credited; custom WordPress theme `primary` | 5 |
| 3 | The Frick Collection | New York NY | museum / Gilded Age house | frick.org | none credited | 5 |
| 4 | Westminster Abbey | London | Church of England | westminster-abbey.org | "Designed by M&C Experience Design", "Developed by Pixel to Code" (Umbraco) | 4.5 |
| 5 | St Paul's Cathedral | London | Church of England | stpauls.co.uk | none credited | 4.5 |
| 6 | Saint Thomas Church Fifth Avenue | New York NY | Episcopal (Anglo-Catholic) | saintthomaschurch.org | none credited; WordPress | 4 |
| 7 | Coventry Cathedral | Coventry UK | Church of England | coventrycathedral.org.uk | "Website created by Suru Partners" | 4 |
| 8 | Southwark Cathedral | London | Church of England | cathedral.southwark.anglican.org | "Web design Liverpool by Glow" | 4 |
| 9 | Sir John Soane's Museum | London | historic house museum | soane.org | "Un.titled" | 4 |
| 10 | King's Chapel | Boston MA | Unitarian Universalist (1686) | kings-chapel.org | "Made by Chris Walton Design" | 4 |
| 11 | Grace Cathedral | San Francisco CA | Episcopal | gracecathedral.org | none credited (403 to fetcher, HTML read via curl) | 4 |
| 12 | The Riverside Church | New York NY | interdenominational | trcnyc.org | none credited | 3.5 |
| 13 | Park Street Church | Boston MA | Congregational / evangelical | parkstreet.org | none credited; Divi + Adobe Fonts kit `icg4bfd` | 3.5 |
| 14 | Second Presbyterian Church | Indianapolis IN | Presbyterian (PCUSA) | secondchurch.org | none credited; Adobe Fonts kit `jjr3yrw` | 3.5 |
| 15 | Wilshire Baptist Church | Dallas TX | Baptist (CBF) | wilshirebc.org | "© Digital Congregations" | 3.5 |
| 16 | First Baptist Greenville | Greenville SC | Baptist (CBF) | firstbaptistgreenville.com | "Designed by Digital Congregations" | 3.5 |
| 17 | National Trust, Red House | Bexleyheath UK | historic house | nationaltrust.org.uk/visit/london/red-house | none credited; bespoke face `NationalTrustTT` | 3.5 |
| 18 | Old South Church | Boston MA | UCC | oldsouth.org | none credited | 3 |
| 19 | Cathedral of St John the Divine | New York NY | Episcopal | stjohndivine.org | "Site by Bandwidth Productions" | 3 |
| 20 | Duke University Chapel | Durham NC | university chapel | chapel.duke.edu | none credited; Duke Drupal design system (`--sp-font-*` tokens) | 3 |
| 21 | St Martin-in-the-Fields | London | Church of England | stmartin-in-the-fields.org | none credited | 3 |
| 22 | Fourth Presbyterian Church | Chicago IL | Presbyterian | fourthchurch.org | none credited | 3 |
| 23 | St Bartholomew's | New York NY | Episcopal | stbarts.org | "Ekklesia 360" (CMS/dev) | 3 |
| 24 | Myers Park Baptist | Charlotte NC | Baptist | myersparkbaptist.org | "Ekklesia 360"; Proxima Nova webfont kit | 3 |
| 25 | Rockefeller Memorial Chapel | Chicago IL | university chapel | rockefeller.uchicago.edu | none credited | 3 |
| 26 | Tabernacle Presbyterian | Indianapolis IN | Presbyterian | tabpres.org | none credited | 3 |
| 27 | St James's Piccadilly | London | Church of England | sjp.org.uk | none credited | 3 |
| 28 | Broadway Baptist | Fort Worth TX | Baptist | broadwaybc.org | "Designed by RW Marketing & Design" | 2.5 |
| 29 | Christ Church Cathedral | Indianapolis IN | Episcopal | cccindy.org | "© 2026 Circle City Web Design" | 2 |
| 30 | Calvary Baptist | Washington DC | Baptist | calvarydc.org | none credited | 1.5 |

Did not load, for the record: First Presbyterian NYC, Princeton University Chapel, Stanford Memorial
Church, First Baptist Church of the City of Washington DC, HTB. Grace Cathedral, Park Street,
St Martin-in-the-Fields and Duke Chapel returned HTTP 403 to the markdown fetcher and were read as
raw HTML and CSS via curl instead, so my notes on those four are typography and structure only, not
a full page read.

---

## 2. The best eight, in detail

### 2.1 Trinity Church Wall Street (trinitychurchnyc.org) — rating 5

**Typefaces, read from `css_R-CKX...css` on the `gesso` theme:**

```
font-family:Canela,Georgia,serif
font-family:Martina Plantijn,Georgia,serif
font-family:Community Gothic,Arial,sans-serif
font-family:Community Gothic Condensed,Arial,sans-serif
```

This is the single most important finding in the whole sweep. Trinity is not using a Google font. It
licensed **Canela** (Commercial Type, a high-contrast serif with flared stems that reads as carved
stone), **Martina Plantijn** (Commercial Type, a warm Dutch old-style book face) for running text, and
**Community Gothic** plus its condensed cut for labels and navigation. A Gothic church bought a type
programme with three voices: a display serif for the big statements, a reading serif for the long
prose, and a condensed grotesque for the functional furniture. That three-voice split is exactly what
a page-builder site usually lacks, and it is why Trinity does not read as a template.

**Colour, counted out of the same stylesheet (most frequent six-digit hex values):**

```
135  #f7f7f7   paper off-white
104  #121212   near-black ink
 42  #f03d26   vermilion accent
 37  #d0d0d0   rule / hairline grey
 29  #0053a2   link blue
 27  #717171   secondary grey
```

The palette is paper and ink plus **one hot accent**. There is no beige, no gold, no "churchy" brown
anywhere in the top of the frequency list. The heritage comes entirely from the photography and the
typeface; the chrome is a modern editorial neutral.

**Building and photography.** Exterior Gothic Revival shots, the steeple, the churchyard, St Paul's
Chapel, Trinity Commons and the uptown cemetery are used as a row of large "location" cards. The
building is treated as **a set of places you can go**, not as a logo.

**Service times.** The hero is literally "Welcome" over "Join us for Sunday worship / 8am, 9am,
11:15am" with a link to the full schedule. Three lines. No card, no icon, no table.

**Navigation grammar.** Four top items only: "Worship & Congregation", "Music & Events",
"Community", "Visit & History". Note that heritage is not its own silo: it is bolted to Visit,
because the people who care about the history are the people who are about to walk in.

### 2.2 Washington National Cathedral (cathedral.org) — rating 5

**Typefaces, from `@font-face` sources in `themes/primary/.../css/site.css`:**

```
../fonts/BespokeSerif-Variable.woff2
../fonts/BespokeSerif-VariableItalic.woff2
../fonts/ProximaNova-Regular.woff2
../fonts/ProximaNova-Semibold.woff2
../fonts/ProximaNova-Extrabold.woff2
```

**Bespoke Serif variable** (Indian Type Foundry) for display, **Proxima Nova** for text and UI. Again
self-hosted, again a variable display serif, again a neutral workhorse sans underneath.

**Colour, counted from the same file:**

```
211  #111820   near-black with a blue cast
170  #473599   violet
135  #bbacfe   pale lilac
 90  #5b000f   deep oxblood
 79  #eed974   pale gold
 46  #21338d   ultramarine
```

That is a stained-glass palette used as a **brand** palette. Violet, lilac, oxblood, gold and
ultramarine are the colours of the west rose window and the Space Window, lifted out of the glass and
applied to progress bars, buttons and section bands. This is the answer to "how do you use glass
colour without looking like 1998 clip art": you sample the glass, you keep the ink near-black, and you
apply the samples as flat brand colour on modern components, not as gradients or borders.

**Photography.** The hero is **video of the west towers**, not a still. Below it: the nave with a
choir procession, close crops of the west rose window and the Space Window, the St Mary's Chapel
reredos, and tower-climb imagery. The building is shot at three distances in one page: whole
silhouette, room, and detail. Nothing is a thumbnail in a box.

**Service times and visiting.** Presented as a live calendar row with time, room and admission type
side by side: "Sep 20 - 11:15 am Nave + Online", each row marked Free or Ticketed. Sightseeing status
is stated as a fact of today: self-guided is unavailable, "next availability Monday 8:00am - 9:00am".
The site answers "can I come in right now" before it answers anything else.

**Music.** A full season block naming the works, not the ensembles: Handel's *Messiah*, *The Planets*,
a Mozart cathedral choir programme, Women of Jazz. Titles are the hook, not "our music ministry".

**Navigation.** "Worship, Music, Visit & Tour, Learn & Discover, Calendar" with About, Congregation,
Host Your Event and Support demoted to a secondary row. Music is a top-level peer of Worship.

### 2.3 The Frick Collection (frick.org) — rating 5, the transferable museum model

**Typefaces:** `font-family:Hermann,serif` with self-hosted `Hermann-Regular.woff2` and
`Hermann-Italic.woff2`, paired with `font-family:Soehne,sans-serif` (also `sohne, Arial, sans-serif`).
Hermann is a contemporary high-contrast serif; Söhne is the Swiss-grotesque workhorse. Tokens are
abstracted as `--font-family-primary` / `--font-family-secondary`.

**Opening line, verbatim:** "Your home for art from the Renaissance to the late nineteenth century,
displayed in one of New York City's last great Gilded Age mansions."

That sentence is worth copying as a pattern: **what you will find, then where you will find it, in one
breath**, with the building named as the setting rather than as the subject. An FBCM equivalent would
name what happens on Sunday first and the 1929 limestone second, in the same sentence.

**Layout grammar.** Modular grid, very generous white space, large images with overlaid type, secondary
nav expanding horizontally under the primary. Twelve top-level items, of which four are transactional
(Tickets, Shop, Donate, Join) and kept visually separate from the eight editorial ones.

**Tickets.** Stated as a permission rather than a requirement: timed tickets "recommended but not
required", and "Members visit free, with no reservations!" A church equivalent is telling a visitor
what they do not have to do.

### 2.4 Westminster Abbey (westminster-abbey.org) — rating 4.5

**Typeface:** self-hosted `Lato-Regular.woff2` / `.woff`, with Bootstrap Glyphicons still in the
bundle. The type is the weakest part of an otherwise strong site, which is instructive: Lato is a
competent neutral and the site still reads as serious, because the photography and the writing carry
it.

**Hero copy, verbatim:** "Welcome to Westminster Abbey" over "Coronations, royal weddings, kings,
queens, statesmen and soldiers; poets, heroes and villains - history happens here and it's all waiting
to be discovered."

Note the construction: a **list of concrete nouns**, then a present-tense claim, then an invitation.
No adjectives about atmosphere. This is the antidote to "a place of peace and reflection".

**Services.** Each service row carries time, place inside the building, **the music being sung**, and
the preacher: "11.00am A Service of Thanksgiving and Rededication on Battle of Britain Sunday / Abbey
attendance by ticket only". Naming the anthem on the service listing is the cheapest way to make a
music programme visible without a separate page.

**Navigation:** "Visit, Worship and music, Events, Learning, Support, History, About, Institute, Shop".
Worship and music are a single item. Heritage is a peer item called simply "History".

### 2.5 St Paul's Cathedral, London (stpauls.co.uk) — rating 4.5

**Typeface:** `fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900` loaded as a
variable font, used across the whole site. A single-family site, carried by weight contrast rather
than by family contrast. It works because the photography is exceptional.

**Hero headline, verbatim:** "Our 18th century doors are open."

This is the best single line in the sweep. It does three jobs at once: it dates the building, it tells
you the place is open today, and it is warm without being sentimental. Compare it to "Welcome to
[church name]", which four of the thirty sites use.

**Photography.** Explicitly light-led. Source image descriptions include "the cathedral with the
evening light catching it", "the Quire and organ with light flare" and "dome sky sunlight dawn sunset".
Dusk and low-angle sun are being used deliberately, because limestone at golden hour is warm and
limestone at noon is grey.

**Prices stated plainly:** "£27 per adult and £10.50 per child". No hedging.

**Music:** "our world-famous Grand Organ", "Our choirs", "Our musicians", plus a named recital series,
"Legacy of Legends". The instrument is treated as a character.

### 2.6 Saint Thomas Fifth Avenue (saintthomaschurch.org) — rating 4

**Typefaces, from the Google Fonts call in the head:** `EB Garamond` at
`ital,wght@0,400;0,500;0,600;0,700;0,800;1,400...` together with `Open+Sans:400,700,300`. EB Garamond
is the free Claude Garamond revival and is the single most convincing "free" choice for a Gothic
church I saw: it is a genuine old-style with real italics, and at large sizes it holds up beside
licensed faces.

**Hero, verbatim, and it is not an image:** "Welcome - today the church will be open from
7:15 a.m.-6:30 p.m."

A **state-of-the-building line where the hero headline normally sits**. This is the church equivalent
of a museum's opening-hours banner, and it is the warmest thing on the page precisely because it is
factual.

**Services.** A calendar interface, plus the boast stated as prose: "Saint Thomas Fifth Avenue offers
at least one mass every single day of the year." The 9am is described as family-suitable and the 11am
and 4pm as choral, so a visitor self-selects on liturgical temperature, not on time alone.

**Photography.** Interior and liturgical close work: the reredos, the chantry chapel, stained glass
details, vested clergy, choristers in procession, and still lives of crosses and communion vessels.
Almost no wide exterior. The lesson is that **detail crops of your own objects photograph better than
the whole room**, because a wide interior shot of any church is mostly empty pews.

**Music.** The choir is named and qualified: "the world-renowned Saint Thomas Choir of Men and Boys",
alongside the Noble Singers children's choir and named organists, with a "Friends of Music" supporter
route.

### 2.7 Coventry Cathedral (coventrycathedral.org.uk) — rating 4

**Typeface:** `font-family:MADESunflower` for display, on a Tailwind base. Accents in the form CSS are
`#597f72` (a green-grey) and `#ab0033` (a deep red), against body `#2d2d2d`. Images are served through
Cloudinary.

**The hero is the ruins**, full-bleed, with "Welcome to Coventry Cathedral" over it and immediately
below it "What's on at Coventry Cathedral today:". Photographs are individually credited to named
photographers ("Con McHugh", "Joseph Witcombe"), which quietly signals that the imagery was commissioned.

**The mission line is three fragments:** "Healing wounds. Living with difference. Building justice and
peace." Short declarative fragments outperform one long sentence in every site in this set that used
them.

**Opening hours are a plain text block**, "Mon-Sat: 10:00am-4:00pm / Sun: 12:00pm-3:30pm", with no
table and no icons.

### 2.8 King's Chapel, Boston (kings-chapel.org) — rating 4, the closest scale match

Adobe Fonts kit `ik...` (kit not resolvable without the full id).

**Hero headline, verbatim:** "Deep Connections, Diverse Beliefs, Since 1686."

A historic congregation of roughly FBCM's size leading with **a date in the headline** and with what
the community is like, not what the building is. The date earns the Gothic photography that follows
rather than being a museum label.

**Two parallel doors, side by side.** "Sundays at 9:00 and 11:00" as one call-to-action block, and
"Monday through Saturday, 10:00-5:00" for tours as a second, each with descriptive text underneath.
This is the cleanest solution I saw to the historic-church problem of having two different audiences:
worshippers and visitors. It does not make either one guess which door is theirs.

**Building imagery.** The 1754 structure appears as two banner images, desktop and mobile versions cut
separately, plus a **pediment detail crop** credited to a named photographer. Separate art direction
for the mobile crop is rare and it matters: a wide Gothic exterior cropped to a phone is a wall.

**Music.** Its own top-level nav item with three children: "Music at King's Chapel", "Concert Series",
"Tuesday Recitals", with recital times stated inline, "Tuesdays at 12:15 pm".

**Navigation, all five items:** "Worship, Music, History & Tours, Our Community, About Us". Five items,
music second, history and tours fused into one. For a 150-person church with a real music programme,
this is close to the ideal information architecture.

### 2.9 Honourable mentions worth a look

- **Old South Church, Boston** labels each service with a **temperature adjective pair**: First
  Worship 9:00am "informal & vibrant", Festival Worship 11:00am "grand & expressive", Thursday Night
  Church 6:00pm "warm & full-hearted", Vespers 5:00pm "gentle & tender". That is the single best
  service-time pattern I found, and it costs nothing to implement. A visitor picks a service by how it
  will feel.
- **First Baptist Greenville** has the best Baptist hero copy: "We are a Baptist church" / "but not the
  kind most people expect." / "Every person-whatever your background or identity-is welcome here. Not
  as an exception, but as part of who we are." Type is `Sorts Mill Goudy` via Elementor, a Goudy
  Oldstyle revival, which is a defensible free choice for an American church of this period.
- **Wilshire Baptist**: "Be you. Belong." over "An inclusive community." Playfair Display + Source
  Serif Pro + Inter on Divi. Three type families is one too many, and the site reads busier than
  Greenville's.
- **Second Presbyterian Indianapolis** runs Adobe Fonts kit `jjr3yrw`: **Utopia Std** with its
  dedicated `utopia-std-headline` and `utopia-std-subhead` optical sizes, plus **Nexa**. Using the
  headline and subhead cuts of an optical-size family, rather than one weight scaled up, is a
  professional move and worth stealing conceptually even with a free family.
- **Park Street Church Boston** runs Adobe Fonts kit `icg4bfd`: **Adobe Caslon Pro**, **Brandon
  Grotesque** and **Drummond Variable**. Caslon is the correct historical face for a Boston
  Congregational church and they paid for it.
- **National Trust** ships a bespoke serif, `NationalTrustTT` (regular, bold, italic), with the stack
  `NationalTrustTT,Georgia,serif`. Even the giant heritage brand falls back to Georgia, which is a
  reminder that a well-set Georgia is not a failure state.
- **Sir John Soane's Museum** is the counter-example that proves the point: designed by Un.titled,
  excellent photography of the Library-Dining Room and Drawing Office, and the type is
  `open_sansregular` / `open_sansbold` throughout. The site survives on photography and on curatorial
  writing. It still reads as one notch less special than the Frick.

---

## 3. Moves that make heritage feel alive rather than stuffy

Twelve techniques, each with the site it came from.

1. **Put today's state of the building where the headline goes.** Saint Thomas: "Welcome - today the
   church will be open from 7:15 a.m.-6:30 p.m." Washington National Cathedral does the same with
   "Self-guided sightseeing unavailable today / next availability Monday 8:00am". A live fact about
   today is the strongest possible signal that the institution is not a monument.

2. **Date the building in the headline, then get out of the way.** King's Chapel: "Deep Connections,
   Diverse Beliefs, Since 1686." St Paul's: "Our 18th century doors are open." The date buys you the
   right to run heritage photography for the rest of the page.

3. **Sample the glass for the brand palette, keep the ink near-black.** Washington National Cathedral's
   stylesheet is built on `#111820` plus `#473599` violet, `#bbacfe` lilac, `#5b000f` oxblood, `#eed974`
   gold and `#21338d` ultramarine. Grace Cathedral runs `#592b8a`. None of them uses beige or brown for
   chrome. The stone is in the photographs; the interface is paper, ink and one or two glass colours.

4. **One hot accent against paper and ink.** Trinity Wall Street: `#f7f7f7` paper, `#121212` ink,
   `#f03d26` vermilion. Forty-two uses of the accent against a hundred-plus of the neutrals. Restraint
   plus one loud note reads as confidence; five muted brand colours read as a template.

5. **Buy or borrow a display serif with real character, and run a plain sans underneath.** Trinity:
   Canela plus Martina Plantijn plus Community Gothic. Washington National Cathedral: Bespoke Serif
   variable plus Proxima Nova. Frick: Hermann plus Söhne. In every top-rated site the display face is
   distinctive and the text face is invisible. Where a site could not afford this, EB Garamond (Saint
   Thomas) and Sorts Mill Goudy (First Baptist Greenville) are the two free faces that came closest.

6. **Shoot the building at three distances on the same page.** Washington National Cathedral: west
   towers in motion, the nave as a room with people in it, then tight crops of the rose window and the
   Space Window. The detail crop is what stops the page reading as a real-estate listing.

7. **Shoot at dusk and at low sun on purpose.** St Paul's image set is explicitly "evening light
   catching it", "light flare" through the Quire, "dawn sunset". Limestone is grey at noon and gold at
   six. A Gothic tower photographed at 4pm in February looks like a courthouse.

8. **Put motion in the hero, not in a carousel.** Washington National Cathedral uses a short video of
   the towers. The sites that used rotating banners instead (St John the Divine, Old South, Christ
   Church Cathedral Indianapolis) all rated lower, because a carousel buries three messages where one
   would have landed.

9. **Give each service an adjective pair, not just a time.** Old South Church: "informal & vibrant",
   "grand & expressive", "warm & full-hearted", "gentle & tender". Saint Thomas does the liturgical
   version by marking the 9am family-suitable and the 11am and 4pm choral. A time alone asks the
   visitor to guess.

10. **Name the music, not the ministry.** Westminster Abbey lists the anthem on the service row.
    Washington National Cathedral names *Messiah* and *The Planets*. St Paul's calls the organ "our
    world-famous Grand Organ" and gives its recital series a title. "Music Ministry" as a nav label
    tells a visitor nothing; "Choral Evensong. World-class choral music. Free to attend. Open to all."
    (Southwark) tells them everything.

11. **Fuse heritage into Visit instead of giving it a museum silo.** Trinity: "Visit & History".
    King's Chapel: "History & Tours". The people reading your history page are mostly deciding whether
    to come, so the history should be on the way in, not in a basement.

12. **Two doors, stated side by side.** King's Chapel runs worship times and tour hours as two equal
    call-to-action blocks. A historic church has two audiences and pretending otherwise makes both of
    them feel like they are in the wrong place.

Bonus, and cheap: **credit your photographer on the image.** Coventry credits "Con McHugh" and "Joseph
Witcombe"; King's Chapel credits a pediment detail. A photo credit is a small signal that the picture
was commissioned rather than scraped, and it changes how the whole page is read.

---

## 4. Mistakes historic churches make online, with the tells

Drawn from the weakest sites in this sweep, plus the patterns visible across all thirty.

1. **The building in a small box.** Christ Church Cathedral Indianapolis has a genuinely beautiful
   stained-glass nativity window and a Monument Circle exterior, and both sit inside a rotating banner
   widget at banner proportions. A National Register building that never goes full-bleed is being
   treated as decoration.

2. **Placeholder images left in production.** Calvary Baptist DC ships `blog-img-placeholder-thumb.jpg`
   repeatedly instead of sanctuary photography. Nothing says "nobody is tending this" faster.

3. **The bilingual carousel mission statement.** Christ Church Cathedral Indianapolis runs
   "Glorify God / Glorificar a Dios / Serve our Neighbors / Servir a nuestros Vecinos / Transform Our
   City / Transformar nuestra ciudad" as rotating slides. Six phrases across a carousel means none of
   them is read. The bilingual intent is right; the mechanism eats it.

4. **Phone number and service times crammed into the header bar.** Same site: "Service Times: 8 & 10
   a.m.; La Santa Eucaristía 1 p.m." as header microcopy. Service times are the single most-wanted fact
   on a church site and they deserve the hero, not the utility strip.

5. **A nav that is the committee structure.** Fourth Presbyterian Chicago's top level is twelve items
   including "Volunteer/VOMO" and "Education/Discipleship"; Old South Church backs its five-item menu
   with an A-Z index of over a hundred links. Both are org charts wearing a navigation costume. The
   best sites here run four to six top-level items (Trinity: four; King's Chapel: five; Washington
   National Cathedral: five).

6. **Slash-compound nav labels.** "About/Visitors", "Worship/Sermons", "Connecting/Joining" (Fourth
   Presbyterian). A slash in a nav label is an unresolved argument between two committees.

7. **A museum-quality building that is never photographed.** Fourth Presbyterian sits in a landmark
   Gothic complex on Michigan Avenue and the homepage describes its location only as "at Michigan
   Avenue" and "Across from the Hancock". Broadway Baptist has the famous Richards windows and leads
   with an anniversary banner. If you own the asset and do not show it, you have chosen to compete on
   the same ground as a storefront church.

8. **Deferring the first-visit question to a link called "New Here?"** and nothing else. Broadway
   Baptist and Myers Park both do this. The good version (First Baptist Greenville, Wilshire) answers
   the question in the hero copy itself and uses the link for depth.

9. **Three or more type families on one page.** Wilshire Baptist loads Playfair Display, Source Serif
   Pro and Inter. Park Street loads Adobe Caslon Pro, Brandon Grotesque, Drummond Variable and a
   display face called Tomato Pasta Bold. Both are Divi sites, and the plugin architecture is how a
   fourth family arrives without anyone deciding to add it.

10. **Red and gold, gradients, and bevelled "sacred" ornament.** Not present on any site above rating
    3 in this sweep. The top-rated sites use flat colour sampled from real glass, or no colour at all.

11. **The 2012 slideshow.** St John the Divine and Old South both lead with rotating banners.
    St John's is redeemed by the photography; Old South's carousel opens on an all-church retreat
    announcement, so the first thing a stranger sees is an internal notice.

12. **Committee prose where a fact belongs.** The failure mode is a paragraph beginning "First Baptist
    Church has been a presence in the community since..." where the page needed "Sunday at 10:45."
    Every top-rated site in this sweep leads with a verifiable fact about time, place or opening
    hours, and puts the narrative underneath it.

---

## 5. Recommendation for First Baptist Church Muncie

### The four models to work from

**1. King's Chapel, Boston (kings-chapel.org) is the primary model.** It is the only site in the set
that matches FBCM's actual situation: a historic downtown congregation of roughly this size, with a
famous building, a real music programme, and no cathedral budget. Take from it: the five-item nav
("Worship, Music, History & Tours, Our Community, About Us"), the date-in-the-headline construction
("Deep Connections, Diverse Beliefs, Since 1686" becomes something like "A downtown congregation since
1859"), the two-doors layout of worship times beside visiting hours, and the separately art-directed
mobile crop of the building.

**2. Trinity Church Wall Street (trinitychurchnyc.org) is the model for the type and colour system.**
Not the scale, the system. Three type voices (display serif, reading serif, condensed sans for
furniture), a paper-and-ink neutral base, and exactly one saturated accent. If FBCM cannot license
Canela, the equivalent structure is a distinctive display serif, a separate text serif chosen for long
reading (because of the 140-plus posts), and a condensed or plain sans for nav and metadata. The
mistake to avoid is using one serif at three sizes and calling it a hierarchy.

**3. Washington National Cathedral (cathedral.org) is the model for using the glass.** Sample five or
six colours out of FBCM's own windows, build the palette from those plus a near-black like `#111820`,
and apply them as flat brand colour on buttons, section bands and links. Also copy its photography
discipline: one moving or full-bleed exterior, one room shot with people in it, and tight detail crops
of the glass and the oak.

**4. St Paul's Cathedral London (stpauls.co.uk) is the model for voice and light.** "Our 18th century
doors are open" is the sentence to write an Indiana version of. And its light discipline, evening and
dawn and flare through the interior, is directly applicable to Indiana limestone, which photographs
grey at midday and gold at six.

Secondary reference: **the Frick** for layout grammar (modular grid, generous white space, editorial
nav separated from transactional nav) and for the opening-sentence pattern that names what you will
find before it names the building.

### What has to be different for a 150-person Baptist congregation in Muncie

- **There is no ticket desk and no tourist funnel.** Everything the cathedrals do with opening hours,
  timed entry and admission types collapses into one thing for FBCM: "Sunday at 10:45", stated in the
  hero, plus a genuine answer to what happens when you arrive. The two-doors pattern still applies, but
  the second door is "see the building / read the history", not "buy a tour".

- **The congregation is the asset that Manhattan cannot buy.** Trinity and Saint Thomas photograph
  objects because their congregations are anonymous crowds. FBCM has staff portraits shot in front of
  the glass and a congregation of 150 where people are recognisable. Old South's people-first
  photography, and its adjective pairs for each service, are the right register here: **use the
  building as the setting for people, not as the subject**. A detail crop of the tower belongs on the
  page, but the photograph that does the work is a named person in front of that window.

- **Co-pastors are a feature, not an org chart.** None of the thirty sites handled a genuinely shared
  pastorate well. Riverside's "Get to Know Rev. Adriene Thorne" block is the closest pattern: one
  clergy person, given a real section with a photograph and a first-person voice, rather than a grid of
  seventeen headshots. FBCM should run a co-pastor block on the homepage with both of them in one
  photograph and one shared paragraph, and keep the seventeen-strong staff directory on its own page.

- **The 140-plus posts are the part no peer site has.** Not one of the thirty runs a real archive.
  That is an opportunity and a risk: it needs the second, quieter text serif and a properly set measure
  (roughly 65 to 75 characters), or it becomes the "wall of committee text" tell. Surface three posts
  on the homepage as an editorial row with real dates and real author names, in the Frick's grid
  grammar, and let the archive routes do the rest.

- **Music has to be named, not labelled.** FBCM's music programme is a genuine differentiator and the
  peer failure mode is a nav item reading "Music Ministry" pointing at a paragraph. Copy Westminster
  Abbey's move instead: put what is being sung on the service listing. Copy St Paul's: name the organ
  and give the recital or concert series a title. Copy King's Chapel: make Music the second nav item,
  with three children, and state the recital time inline.

- **Do not chase the cathedral palette into grandeur.** Washington National Cathedral can carry
  oxblood and gold because it is enormous. At 150 people the safer version is Trinity's: paper,
  near-black, one accent sampled from the strongest colour in FBCM's own glass, with the oak and the
  limestone appearing only in photographs. Warmth should come from the photography, the adjective
  pairs on the service times, and the fact that the people in the pictures have names.
