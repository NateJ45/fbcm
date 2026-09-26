// Foundation, edit with care
// The mobile menu, redrawn 2026-09-20 (art-direction pass, task 4).
//
// It used to be a 380px drawer sliding in from the right with a hamburger icon
// in front of it. It is now a FULL-SCREEN indigo sheet that drops from the top,
// and the trigger reads the word "Menu" beside two hairlines. The spec's
// section 6 asks for the church's stained glass where the Stone Steps survey
// had trail iconography, so a window photograph sits masked behind the top 40%
// of the sheet and drifts very slowly, and the links are rows in the display
// face that rise in sequence when the sheet opens. (They were numbered 01 to
// 10 until 2026-09-24; the footer identity pass took the numbers off, because
// a menu is not a sequence: rollout plan rule 11.)
//
//   +-------------------------------------------+
//   | [wordmark]                      [ Close ×]|   <- 58px row, window behind
//   |                                            |
//   |  VISIT                                     |   <- rows, staggered
//   |  WHO WE ARE                                |
//   |  ...                                       |
//   |                                            |
//   |  Sundays            (219) ...              |   <- two-column foot
//   |  10:45 am           Contact                |
//   |  309 East Adams                            |
//   |  (*) Watch live                            |
//   |  [ GIVE ]                                  |
//   |  [win] [door] [rose] [basin]               |   <- the four goals
//   |  (f) (ig) (yt)                              |   <- accounts elsewhere
//   +-------------------------------------------+
//
// Five things about it are deliberate.
//
//   1. HYDRATED AT client:idle, NOT client:only. A closed Sheet
//      server-renders only its trigger button; the portal mounts nothing until
//      the sheet opens, so every page prerenders and the trigger is in the
//      server HTML before React arrives. client:only would skip SSR entirely
//      and leave the header with no trigger until the runtime loads. If a
//      future island genuinely cannot server-render, the symptom is an
//      "Invalid hook call" thrown during the build's server render, and
//      client:only="react" is still the escape hatch.
//   2. THE TRIGGER LIVES HERE, not in Header.astro. It IS the SheetTrigger, so
//      Radix owns its aria-expanded / aria-controls wiring and focus return.
//      It carries no colour of its own and inherits the header's `color`, so it
//      reads paper over an image hero and ink once the bar has scrolled.
//   3. IT MIRRORS THE DESKTOP HEADER (CLAUDE.md rule 17, and plan 2a task 9):
//      the same links from the same Sanity menu, the same one gold button. A
//      phone visitor is not offered a different site. The phone number and
//      the Contact link are here because task 3 took the header's utility
//      row off; this is where they went. "Watch live" sits above Give, as it
//      sits beside Give on the desktop bar (2026-09-24). The theme toggle
//      that used to sit in the foot came off when the site went light-only
//      the same day.
//   4. A DROPDOWN GROUP READS AS ONE BLOCK (2026-09-24, Nathan's review; it
//      used to flatten into a small grey caps label over ordinary rows). The
//      label ("Our Church") is set in the same display face and size as the
//      top-level rows, is not a link, and carries a small gold caret. Its
//      children are indented under it, one step smaller, with a thin gold
//      rule down their left edge, always open (no accordion). It is a nested
//      list named by the label (aria-labelledby), so a screen reader hears
//      "Our Church, list, 4 items" and the focus order is the reading order.
//   5. THE CURRENT PAGE ROW is marked aria-current="page", which locks
//      .nav-underline drawn (globals.css). It is read from
//      window.location.pathname at render, which is safe because the sheet's
//      contents only ever render in the browser.
//
// Data: the menu, the tagline, the phone, the service time and the street all
// come from Sanity siteSettings via Header.astro, which also pre-renders the
// window texture and the logo through Astro's image pipeline (a React island
// cannot call getImage() itself).
//
// THE FOUR GOALS at the foot are the island's CHILDREN: Header.astro renders
// GoalsRow (src/components/church/) into this island's default slot, so the
// building glyphs are drawn by the one Astro component that draws them
// everywhere else, never redrawn in JSX. Astro serialises the slot as static
// HTML; the wrapper here only closes the sheet when one of its links is
// followed, so a goal on the page the visitor is already on (Who We Are)
// does not leave the sheet open over it.

import { useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { telHref } from '@/lib/phone';
import { timeOnly } from '@/lib/live-sunday';
import { resolveLive } from '@/lib/live-service';
import { site } from '@/data/site';
import SocialIcon from '@/components/SocialIcon';

// ---- Types ------------------------------------------------------------------

interface FlatNavLink {
  kind: 'flat';
  label: string;
  href: string;
}

interface DropdownNavGroup {
  kind: 'dropdown';
  label: string;
  items: { label: string; href: string }[];
}

type NavItem = FlatNavLink | DropdownNavGroup;

interface MobileNavSiteSettings {
  tagline?: string;
  /**
   * Still accepted so the Header can keep passing the same object shape (and
   * keep honouring the "Show the email address in the menu" switch), but the
   * menu does not render an email row: Contact is the one place the church
   * asks people to write from.
   */
  email?: string;
  phone?: string;
}

interface Props {
  links: NavItem[];
  siteSettings?: MobileNavSiteSettings | null;
  /**
   * Optimized logo URLs pre-rendered by Astro's getImage() in the parent
   * Header.astro. A React island cannot call Astro's build-time image
   * pipeline itself, so the parent does the work once at build time and
   * passes the resulting URLs in as plain strings.
   */
  logoLightUrl?: string;
  logoDarkUrl?: string;
  /**
   * The menu's primary button. Header.astro only passes this when the editor
   * has changed it in Site Settings, so an untouched site serializes no extra
   * island props.
   */
  cta?: { show: boolean; label: string; href: string };
  /** siteSettings.serviceTime, cleaned of its stega payload by the Header. */
  serviceTime?: string;
  /** First line of siteSettings.address, split by the Header. */
  street?: string;
  /** Where "Watch live" goes (live stream, else channel), stega-cleaned by
   *  the Header. Absent means the row does not render. */
  watchUrl?: string;
  /** getImage() URL for src/assets/menu-window.jpg, 1200w, quality 70. */
  windowUrl?: string;
  /** URL of src/assets/menu-rendering-gold.webp: the footer's Hannaford line
   *  art pre-tinted gold, painted faintly along the sheet's foot. */
  renderingUrl?: string;
  /** The four goals row (GoalsRow.astro), slotted in by Header.astro. */
  children?: ReactNode;
  /**
   * The church's accounts elsewhere (src/lib/social-links.ts socialLinksOf,
   * the list the footer draws), cut down by Header.astro to what the row
   * needs: the platform for the icon, the address, and the accessible name
   * ("First Baptist Church Muncie on Facebook"). Absent means no row.
   */
  social?: { platform: string; url: string; label: string }[];
}

/**
 * Built-in menu button, matching FALLBACK_HEADER_CTA in
 * src/lib/siteSettings.ts. Header.astro compares against these exact two values
 * to decide whether to serialize a `cta` prop at all, so the two defaults must
 * stay identical.
 */
const DEFAULT_CTA = { show: true, label: 'Contact us', href: '/contact' };

/**
 * The stagger index for each top-level item, in reading order: a group's label
 * and each of its children count as a line, so the rows still rise one after
 * another straight down the sheet.
 */
function staggerStarts(links: NavItem[]): number[] {
  const starts: number[] = [];
  let i = 0;
  for (const item of links) {
    starts.push(i);
    i += item.kind === 'flat' ? 1 : 1 + item.items.length;
  }
  return starts;
}

/** A stable id for a group's label, so its list can be named by it. */
function groupId(label: string): string {
  return `menu-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * The path the visitor is on, or undefined during a server render. The sheet's
 * body only ever renders in the browser (the portal mounts nothing until it
 * opens), but the guard keeps the component honest if that ever changes.
 */
function currentPath(): string | undefined {
  return typeof window !== 'undefined' ? window.location.pathname : undefined;
}

/**
 * Strip a trailing slash so a menu href and a real address can be compared.
 * The site builds to /visit/index.html, so a visitor on that page reports
 * `/visit/` while the menu carries `/visit`, and a raw === never matches. The
 * root is left alone: '/' must not become ''.
 */
function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

// ---- Component --------------------------------------------------------------

export default function MobileNav({
  links,
  siteSettings,
  logoDarkUrl,
  cta = DEFAULT_CTA,
  serviceTime,
  street,
  watchUrl,
  windowUrl,
  renderingUrl,
  children,
  social,
}: Props) {
  const [open, setOpen] = useState(false);
  // Set once React has mounted, so a test (or anything else) can wait for the
  // trigger to be LIVE rather than merely visible: the server-rendered button
  // is on screen before hydration and ignores a click until then. It is not
  // in the server HTML, so no page's markup changes because of it.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const phone = siteSettings?.phone;
  const starts = staggerStarts(links);
  // The sheet's body only renders in the browser, when it opens, so this reads
  // the visitor's clock at that moment against the church's service window,
  // and (since 2026-09-24) the last answer from /api/live-status that
  // BaseLayout's live-service script left on window.__liveStatus: a fresh
  // answer from YouTube beats the clock, anything else leaves the clock in
  // charge (src/lib/live-service.ts resolveLive).
  const liveState =
    serviceTime && typeof window !== 'undefined'
      ? resolveLive(new Date(), serviceTime, window.__liveStatus)
      : { live: false };
  const live = liveState.live;
  const liveHref = liveState.href ?? watchUrl;
  const here = currentPath();
  const isCurrent = (href: string) =>
    here !== undefined && normalizePath(here) === normalizePath(href);

  // An outside address (Site settings' Online giving box, when it is filled)
  // opens the Give button in a new tab. An internal destination, such as the
  // /give fallback while that box is blank, stays in this one.
  const ctaIsExternal = /^https?:\/\//i.test(cta.href);

  const close = () => setOpen(false);
  // The slotted goals row is static HTML, so its links cannot carry onClick;
  // one listener on the wrapper closes the sheet when any of them is followed.
  const closeOnLink = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element | null)?.closest('a')) close();
  };
  // The goal glyphs carry data-reveal="draw" (BuildingGlyph.astro), and the
  // page's reveal observer only sees what is on the page when it runs. The
  // sheet's body mounts later, on each open, so nothing ever set .is-visible
  // and the glyphs stayed undrawn: blank above their names (2026-09-24,
  // Nathan's phone). They draw here instead, as the sheet opens: one frame
  // later, so the undrawn state paints first and the stroke has somewhere to
  // come from. Reduced motion has no draw rules, so this only adds classes.
  const drawGlyphs = (node: HTMLDivElement | null) => {
    if (!node) return;
    const glyphs = node.querySelectorAll<SVGElement>('[data-reveal]:not(.is-visible)');
    if (glyphs.length === 0) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        glyphs.forEach((g) => g.classList.add('is-visible'));
        setTimeout(() => glyphs.forEach((g) => g.classList.add('is-drawn')), 2000);
      }),
    );
  };

  return (
    <div
      className="absolute top-1/2 right-gutter -translate-y-1/2 lg:hidden"
      data-menu-ready={ready ? '' : undefined}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {/* Inherits `color` from the header, so it is paper over an image
              hero and ink on the ordinary bar. The vertical padding is what
              gets the hit area to 44px without making the word look padded. */}
          <button
            type="button"
            className="inline-flex items-center gap-2 py-3 font-ui text-ui font-semibold tracking-[0.02em] uppercase lg:hidden"
          >
            Menu <span aria-hidden className="menu-glyph" />
          </button>
        </SheetTrigger>

        <SheetContent
          side="top"
          showCloseButton={false}
          aria-describedby={undefined}
          className="h-dvh w-full max-w-none gap-0 overflow-y-auto border-0 bg-indigo-field p-0 text-bg data-[side=top]:h-dvh data-[side=top]:border-0"
        >
          {/* Radix needs a Title for the dialog's accessible name. The sheet
              says "Menu" on its trigger and reads as a menu on sight, so the
              title is for assistive tech only. */}
          <SheetTitle className="sr-only">Menu</SheetTitle>

          {/* shrink-0 (2026-09-24, feat/social-links): SheetContent is a flex
              column of fixed height, so without it this box shrank to the
              viewport and the sheet's content overflowed it: the pb-8 below
              the last row was lost (the last row sat on the screen's bottom
              edge at the end of the scroll) and the rendering, which is
              pinned to this box's bottom, floated mid-sheet on a short phone. */}
          <div className="relative flex min-h-full shrink-0 flex-col px-gutter pt-4 pb-8">
            {/* The church's own window, masked to the top 40% and drifting a
                few pixels over 40 seconds. Decorative: it carries no meaning
                the rows do not already carry, so it is aria-hidden and takes
                no alt text. */}
            {windowUrl && (
              <div
                aria-hidden
                className="menu-window pointer-events-none absolute inset-x-0 top-0 h-[40%]"
                style={{ backgroundImage: `url(${windowUrl})` }}
              />
            )}

            {/* The Hannaford rendering along the sheet's foot, the same faint
                gold line art as the footer's (Nathan, 2026-09-24: the window
                at the top, the building at the bottom). Decorative. */}
            {renderingUrl && (
              <div
                aria-hidden
                className="menu-rendering pointer-events-none absolute bottom-0 left-[-15%] w-[130%]"
                style={{ ['--menu-rendering' as string]: `url(${renderingUrl})` }}
              />
            )}

            {/* Top row: the wordmark, and the way out. The sheet is indigo in
                both themes, so the DARK (paper-lettered) logo is right here
                whatever the theme is. */}
            <div className="relative flex h-[58px] items-center justify-between">
              {logoDarkUrl && (
                <img
                  src={logoDarkUrl}
                  alt={site.name}
                  width={257}
                  height={100}
                  className="h-11 w-auto"
                  decoding="async"
                />
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="inline-flex items-center gap-2 rounded-sm bg-bg px-3 py-2 font-ui text-ui font-semibold text-indigo-field"
              >
                Close <span aria-hidden>&times;</span>
              </button>
            </div>

            {/* The rows. A plain list: a menu is not a sequence, so it
                carries no numbers (rollout plan rule 11). */}
            <nav aria-label="Primary mobile" className="relative mt-10 flex-1">
              <ul className="m-0 list-none p-0">
                {links.map((item, n) =>
                  item.kind === 'flat' ? (
                    <li
                      key={item.href}
                      className="menu-row border-b border-bg/15"
                      style={{ '--i': starts[n] } as CSSProperties}
                    >
                      <a
                        href={item.href}
                        onClick={close}
                        aria-current={isCurrent(item.href) ? 'page' : undefined}
                        className="group flex items-baseline py-4"
                      >
                        <span className="nav-underline font-display text-[clamp(1.75rem,6.4vw,2.75rem)] leading-none font-normal tracking-[0.02em] uppercase">
                          {item.label}
                        </span>
                      </a>
                    </li>
                  ) : (
                    <li key={`group-${item.label}`} className="border-b border-bg/15 pb-4">
                      {/* The label: the rows' own face and size, not a link,
                          with a small gold caret. It names the list below. */}
                      <p
                        id={groupId(item.label)}
                        className="menu-row m-0 flex items-baseline gap-3 py-4 font-display text-[clamp(1.75rem,6.4vw,2.75rem)] leading-none font-normal tracking-[0.02em] uppercase"
                        style={{ '--i': starts[n] } as CSSProperties}
                      >
                        {item.label}
                        <span aria-hidden className="text-[0.55em] text-gold">
                          &#9662;
                        </span>
                      </p>
                      <ul
                        aria-labelledby={groupId(item.label)}
                        className="m-0 ml-1 list-none border-l border-gold/70 p-0 pl-5"
                      >
                        {item.items.map((sub, k) => (
                          <li
                            key={sub.href}
                            className="menu-row"
                            style={{ '--i': (starts[n] ?? 0) + 1 + k } as CSSProperties}
                          >
                            <a
                              href={sub.href}
                              onClick={close}
                              aria-current={isCurrent(sub.href) ? 'page' : undefined}
                              className="group flex items-baseline py-2.5"
                            >
                              <span className="nav-underline font-display text-[clamp(1.375rem,5vw,2.125rem)] leading-none font-normal tracking-[0.02em] uppercase">
                                {sub.label}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ),
                )}
              </ul>
            </nav>

            {/* scaffold: journal */}
            {/* Search (2026-09-24), under the rows in the sheet's furniture
                face, a 44px tap target. The sheet closes first and hands its
                focus back; the search dialog (search-dialog.ts) waits for that
                before it opens, so the two never hold focus at once. */}
            <button
              type="button"
              onClick={() => {
                close();
                window.dispatchEvent(new CustomEvent('site-search:open'));
              }}
              aria-haspopup="dialog"
              className="relative mt-8 inline-flex min-h-[44px] items-center gap-3 self-start font-ui text-ui font-semibold tracking-[0.02em] text-bg underline-offset-4 hover:underline"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                aria-hidden="true"
                className="text-gold"
              >
                <circle cx="8.5" cy="8.5" r="6" />
                <path d="M13 13l5 5" />
              </svg>
              Search the site
            </button>
            {/* scaffold:end */}

            {/* The foot: when the church meets and where, then the ways to
                reach it. */}
            <div className="relative mt-10 grid grid-cols-2 gap-6 border-t border-bg/15 pt-6 font-ui text-sm">
              <div>
                <p className="mb-2 text-ui tracking-[0.14em] text-gold uppercase">Sundays</p>
                {/* The label above already says Sundays, so the value shows the
                    time alone: "Sundays / 10:45 am", not "Sundays / Sundays at
                    10:45 am". timeOnly() is the same helper the hero's dated
                    line uses, so the two can never phrase it differently. */}
                {serviceTime && <p>{timeOnly(serviceTime)}</p>}
                {street && <p className="text-bg/70">{street}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {phone && <a href={telHref(phone)}>{phone}</a>}
                <a href="/contact" onClick={close}>
                  Contact
                </a>
              </div>
            </div>

            {/* Watch live, the desktop bar's quiet link in the sheet's
                furniture face, above the one gold button. A 44px tap target.
                Inside the service window it reads "Live now" with the pulsing
                gold dot (data-live; the pulse stops under reduced motion).
                The dot is decorative; the words carry the state. */}
            {watchUrl && (
              <a
                href={liveHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                data-live={live ? '' : undefined}
                className="relative mt-6 inline-flex min-h-[44px] items-center gap-2 self-start font-ui text-ui font-semibold tracking-[0.02em] text-bg underline-offset-4 hover:underline"
              >
                <span className="live-dot" aria-hidden />
                <span>{live ? 'Live now' : 'Watch live'}</span>
              </a>
            )}

            {/* The one button, drawn exactly as the header's Give button and
                the give band draw it: gold fill, indigo-FIELD label (not
                text-indigo, which flips to paper under .dark), gold/indigo
                inset keyline. */}
            {cta.show && (
              <a
                href={cta.href}
                target={ctaIsExternal ? '_blank' : undefined}
                rel={ctaIsExternal ? 'noopener noreferrer' : undefined}
                onClick={close}
                className="relative mt-6 block rounded-sm bg-gold px-[1.6em] py-[1.05em] text-center font-ui text-ui font-semibold text-indigo-field shadow-[inset_0_0_0_3px_var(--color-gold),inset_0_0_0_4px_var(--color-indigo-field)]"
              >
                {cta.label}
              </a>
            )}

            {/* The four goals, each to its band on Who We Are. The click
                listener is delegation only: the links inside are the
                controls, and Enter on a link fires click too. */}
            {children && (
              <div
                ref={drawGlyphs}
                onClick={closeOnLink}
                className="relative mt-8 border-t border-bg/15 pt-4"
              >
                {children}
              </div>
            )}

            {/* The church's accounts elsewhere, the last row of the sheet: the
                footer's round icon buttons in the sheet's hairline, 44px
                targets. Icon-only, so each link's aria-label says whose
                account it is; the list is named for a screen reader, which
                hears "Follow along, list, 3 items" before them (the words the
                Contact page's group prints). */}
            {social && social.length > 0 && (
              <ul
                aria-label="Follow along"
                className="relative m-0 mt-6 flex list-none gap-3 border-t border-bg/15 p-0 pt-6"
              >
                {social.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      onClick={close}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bg/30 text-bg transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      <SocialIcon platform={link.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
