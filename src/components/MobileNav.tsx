// Foundation, edit with care
// The mobile menu, redrawn 2026-09-20 (art-direction pass, task 4).
//
// It used to be a 380px drawer sliding in from the right with a hamburger icon
// in front of it. It is now a FULL-SCREEN indigo sheet that drops from the top,
// and the trigger reads the word "Menu" beside two hairlines. The spec's
// section 6 asks for the church's stained glass where the Stone Steps survey
// had trail iconography, so a window photograph sits masked behind the top 40%
// of the sheet and drifts very slowly, and the seven links are numbered rows in
// the display face that rise in sequence when the sheet opens.
//
//   +-------------------------------------------+
//   | [wordmark]                      [ Close ×]|   <- 58px row, window behind
//   |                                            |
//   |  01  VISIT                                 |   <- numbered rows, staggered
//   |  02  WHO WE ARE                            |
//   |  ...                                       |
//   |                                            |
//   |  Sundays            (219) ...              |   <- two-column foot
//   |  10:45 am           Contact                |
//   |  309 East Adams     [theme]                |
//   |  [ GIVE ]                                  |
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
//      phone visitor is not offered a different site. The phone number, the
//      Contact link and the theme toggle are here because task 3 took the
//      header's utility row off; this is where they went.
//   4. DROPDOWN GROUPS FLATTEN. The church's menu is seven flat links today,
//      but an editor can add a group in Sanity without a code change, so the
//      shape still renders: the group label becomes a quiet non-link row and
//      its children carry on the numbering.
//   5. THE CURRENT PAGE ROW is marked aria-current="page", which locks
//      .nav-underline drawn (globals.css). It is read from
//      window.location.pathname at render, which is safe because the sheet's
//      contents only ever render in the browser.
//
// Data: the menu, the tagline, the phone, the service time and the street all
// come from Sanity siteSettings via Header.astro, which also pre-renders the
// window texture and the logo through Astro's image pipeline (a React island
// cannot call getImage() itself).

import { useState, type CSSProperties } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ThemeToggle from './ThemeToggle';
import { telHref } from '@/lib/phone';
import { site } from '@/data/site';

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
  /** getImage() URL for src/assets/menu-window.jpg, 1200w, quality 70. */
  windowUrl?: string;
}

/**
 * Built-in menu button, matching FALLBACK_HEADER_CTA in
 * src/lib/siteSettings.ts. Header.astro compares against these exact two values
 * to decide whether to serialize a `cta` prop at all, so the two defaults must
 * stay identical.
 */
const DEFAULT_CTA = { show: true, label: 'Contact us', href: '/contact' };

/**
 * One rendered line in the sheet. A `label` row is a dropdown group's heading:
 * it is not a link and takes no number, and the numbering carries straight on
 * through the child links underneath it.
 */
type MenuRow =
  { kind: 'label'; label: string } | { kind: 'link'; label: string; href: string; n: number };

/** Flatten the nav tree into the rows the sheet draws, numbering links only. */
function toRows(links: NavItem[]): MenuRow[] {
  const rows: MenuRow[] = [];
  let n = 0;
  for (const item of links) {
    if (item.kind === 'flat') {
      rows.push({ kind: 'link', label: item.label, href: item.href, n: ++n });
      continue;
    }
    rows.push({ kind: 'label', label: item.label });
    for (const sub of item.items) {
      rows.push({ kind: 'link', label: sub.label, href: sub.href, n: ++n });
    }
  }
  return rows;
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
  windowUrl,
}: Props) {
  const [open, setOpen] = useState(false);

  const phone = siteSettings?.phone;
  const rows = toRows(links);
  const here = currentPath();
  const isCurrent = (href: string) =>
    here !== undefined && normalizePath(here) === normalizePath(href);

  // Church Center is somebody else's site, so the Give button opens in a new
  // tab. An internal destination stays in this one.
  const ctaIsExternal = /^https?:\/\//i.test(cta.href);

  const close = () => setOpen(false);

  return (
    <div className="absolute top-1/2 right-gutter -translate-y-1/2 lg:hidden">
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

          <div className="relative flex min-h-full flex-col px-gutter pt-4 pb-8">
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

            {/* The rows. An ordered list because they are numbered and the
                numbers mean something: they are the order of the menu. */}
            <nav aria-label="Primary mobile" className="relative mt-10 flex-1">
              <ol className="m-0 list-none p-0">
                {rows.map((row, i) =>
                  row.kind === 'label' ? (
                    <li
                      key={`group-${row.label}`}
                      className="menu-row border-b border-bg/15"
                      style={{ '--i': i } as CSSProperties}
                    >
                      <p className="py-4 font-ui text-ui tracking-[0.14em] text-bg/60 uppercase">
                        {row.label}
                      </p>
                    </li>
                  ) : (
                    <li
                      key={row.href}
                      className="menu-row border-b border-bg/15"
                      style={{ '--i': i } as CSSProperties}
                    >
                      <a
                        href={row.href}
                        onClick={close}
                        aria-current={isCurrent(row.href) ? 'page' : undefined}
                        className="group flex items-baseline gap-5 py-4"
                      >
                        <span className="font-ui text-[0.75rem] tracking-[0.14em] text-gold">
                          {String(row.n).padStart(2, '0')}
                        </span>
                        <span className="nav-underline font-display text-[clamp(1.75rem,6.4vw,2.75rem)] leading-none font-normal tracking-[0.02em] uppercase">
                          {row.label}
                        </span>
                      </a>
                    </li>
                  ),
                )}
              </ol>
            </nav>

            {/* The foot: when the church meets and where, then the ways to
                reach it. The theme control sits here because task 3 took it
                off the header below lg. */}
            <div className="relative mt-10 grid grid-cols-2 gap-6 border-t border-bg/15 pt-6 font-ui text-sm">
              <div>
                <p className="mb-2 text-ui tracking-[0.14em] text-gold uppercase">Sundays</p>
                {serviceTime && <p>{serviceTime}</p>}
                {street && <p className="text-bg/70">{street}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {phone && <a href={telHref(phone)}>{phone}</a>}
                <a href="/contact" onClick={close}>
                  Contact
                </a>
                <ThemeToggle />
              </div>
            </div>

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
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
