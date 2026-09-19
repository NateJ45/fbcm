// Foundation, edit with care
// Mobile nav drawer. Uses shadcn Sheet (Radix Dialog under the hood).
//
// HYDRATED AT client:idle, NOT client:only (2026-09-18). This file said for a
// long time that the Sheet had to be client:only="react" because Radix's
// portal hook threw "Invalid hook call" during Astro's server render. That is
// not true of the versions this starter pins: a closed Sheet server-renders
// only its trigger button, the portal mounts nothing until the drawer opens,
// and every page prerenders without a complaint. Verified against the sibling
// stonesteps-50k build, which ships the identical ui/sheet.tsx at client:idle
// on the same react 19.2.7 / radix-ui 1.4.3 / astro 7.x set.
//
// What client:only cost was the hamburger: it skips SSR entirely, so the
// trigger was absent from the server HTML until React loaded. client:idle puts
// the button in the markup and defers the runtime behind requestIdleCallback.
//
// If a future island genuinely cannot server-render, the symptom is an
// "Invalid hook call" thrown during the build's server render, and
// client:only="react" is still the escape hatch. VisualEditingOverlay in
// PreviewLayout.astro uses it for that kind of reason.
//
// Layout (top to bottom inside the sheet), and it MIRRORS the desktop header
// (Plan 2a, Task 9): the same seven links, the same one button, the same two
// utility links. A phone visitor should not be offered a different site.
//   1. Brand accent stripe + "Menu" eyebrow
//   2. The Give button — the header's one button, gold with an indigo label
//   3. Tagline in display serif italic
//   4. Nav links — the seven; flat items are single rows, dropdown groups are
//      a heading row with indented sub-items underneath (always expanded on
//      mobile, no accordion needed: full-height drawers have plenty of room)
//   5. Spacer pushes the rest to the bottom
//   6. The utility pair the desktop header puts in its top row: the phone as a
//      tel: link, and Contact. ThemeToggle on the right.
//   7. Logo centered at the bottom of the panel
//
// The Instagram / Facebook buttons came out on 2026-09-19 along with the
// header's eyebrow strip. The church's public places are YouTube and Church
// Center, both of which the footer carries as named links, and the dataset has
// no Instagram or Facebook address behind those two buttons at all. The email
// row went with them: Contact is the one place the church asks people to write
// from, and it is now the drawer's second utility link.
//
// Data: tagline, phone and the menu all come from Sanity siteSettings via the
// Header, with sensible defaults so the menu renders cleanly before content is
// wired up.

import { useState } from 'react';
import { Menu, Phone, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
   * drawer no longer renders an email row. See the note at the top.
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
   * The drawer's primary button. Header.astro only passes this when the editor
   * has changed it in Site Settings, so an untouched site serializes no extra
   * island props.
   */
  cta?: { show: boolean; label: string; href: string };
}

/**
 * Built-in drawer button, matching FALLBACK_HEADER_CTA in
 * src/lib/siteSettings.ts. Header.astro compares against these exact two values
 * to decide whether to serialize a `cta` prop at all, so the two defaults must
 * stay identical.
 */
const DEFAULT_CTA = { show: true, label: 'Contact us', href: '/contact' };

// ---- Component --------------------------------------------------------------

export default function MobileNav({
  links,
  siteSettings,
  logoLightUrl,
  logoDarkUrl,
  cta = DEFAULT_CTA,
}: Props) {
  const [open, setOpen] = useState(false);

  // No hard-coded fallback: the church's real tagline is seeded into
  // siteSettings.tagline, and a second copy here is the one that goes stale.
  // With the field unset the block simply does not render.
  const tagline = siteSettings?.tagline;
  const phone = siteSettings?.phone;

  // Church Center is somebody else's site, so the Give button opens in a new
  // tab. An internal destination stays in this one.
  const ctaIsExternal = /^https?:\/\//i.test(cta.href);

  const close = () => setOpen(false);

  return (
    <div className="absolute top-1/2 right-m -translate-y-1/2 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
          >
            <Menu size={22} />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="flex w-[min(380px,90vw)] flex-col gap-0 overflow-y-auto border-t-4 border-t-primary bg-background p-0 sm:max-w-none"
        >
          {/* Eyebrow header. */}
          <SheetHeader className="pt-xl px-l pb-m">
            <SheetTitle className="font-mono text-[0.75rem] font-normal tracking-eyebrow text-muted-foreground uppercase">
              Menu
            </SheetTitle>
          </SheetHeader>

          {/* The one button, surfaced before the nav list. Gold fill, indigo
              label: the same pair the desktop header and the give band use. */}
          {cta.show && (
            <div className="px-l pb-l">
              <a
                href={cta.href}
                target={ctaIsExternal ? '_blank' : undefined}
                rel={ctaIsExternal ? 'noopener noreferrer' : undefined}
                onClick={close}
                className="block w-full rounded-sm bg-gold px-m py-m text-center text-xs font-semibold tracking-eyebrow text-indigo-field uppercase transition-colors hover:bg-gold/90"
              >
                {cta.label}
              </a>
            </div>
          )}

          {/* Tagline in display serif for editorial feel. */}
          {tagline && (
            <p className="px-l pb-l font-display text-h4 leading-snug text-foreground/85 italic">
              {tagline}
            </p>
          )}

          {/* Primary nav — flat items + group headers with indented sub-items. */}
          <nav className="border-t border-border-soft py-s" aria-label="Primary mobile">
            {links.map((item) => {
              if (item.kind === 'flat') {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="flex min-h-[44px] items-center px-l py-s font-display text-lg text-foreground transition-colors hover:bg-muted hover:text-link"
                  >
                    {item.label}
                  </a>
                );
              }

              // Dropdown group — always expanded in the drawer (no accordion
              // needed; the drawer has scroll and the groups are small).
              return (
                <div key={item.label}>
                  {/* Group heading — visually distinct from flat items. Not
                      a link itself; the sub-items carry the real hrefs. */}
                  <p className="px-l pt-m pb-xs font-mono text-[0.75rem] tracking-eyebrow text-muted-foreground uppercase">
                    {item.label}
                  </p>
                  {item.items.map((sub) => (
                    <a
                      key={sub.href}
                      href={sub.href}
                      onClick={close}
                      className="flex min-h-[44px] items-center gap-xs py-xs pr-l pl-[calc(theme(spacing.l)+0.5rem)] font-body text-base text-foreground transition-colors hover:bg-muted hover:text-link"
                    >
                      <ChevronRight
                        size={12}
                        className="shrink-0 text-foreground/40"
                        aria-hidden="true"
                      />
                      {sub.label}
                    </a>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Spacer pushes the contact + logo block to the bottom. */}
          <div className="flex-1" />

          {/* The desktop header's utility row, restated for the phone: the
              number, then Contact, with the theme control on the right. */}
          <div className="border-t border-border-soft px-l pt-m pb-s">
            <p className="mb-s font-mono text-[0.75rem] tracking-eyebrow text-muted-foreground uppercase">
              Get in touch
            </p>
            {phone && (
              <a
                href={telHref(phone)}
                className="flex min-h-[44px] items-center gap-s text-sm text-link hover:underline"
              >
                <Phone size={16} aria-hidden="true" />
                {phone}
              </a>
            )}
            <div className="flex items-center gap-s">
              <a
                href="/contact"
                onClick={close}
                className="flex min-h-[44px] items-center text-sm text-link hover:underline"
              >
                Contact
              </a>
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Logo at the bottom — brand-anchored close to the sheet's foot.
              URLs come from Astro's image pipeline via Header.astro's
              getImage() calls, so this is the same file (and the same cache
              entry) as the desktop header logo. */}
          {logoLightUrl && (
            <div className="flex justify-center border-t border-border-soft px-l py-l">
              <img
                src={logoLightUrl}
                alt={site.name}
                width={257}
                height={100}
                className="block h-12 w-auto dark:hidden"
                loading="lazy"
                decoding="async"
              />
              {logoDarkUrl && (
                <img
                  src={logoDarkUrl}
                  alt=""
                  aria-hidden="true"
                  width={257}
                  height={100}
                  className="hidden h-12 w-auto dark:block"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
