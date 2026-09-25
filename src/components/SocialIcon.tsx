// Safe to edit by hand
// The one platform-to-icon map (2026-09-24, feat/social-links). The footer,
// the mobile menu and the Contact page's "Follow along" group each draw the
// church's accounts from socialLinksOf() (src/lib/social-links.ts), and each
// draws the icon through this component, so a platform cannot get one icon in
// the footer and another in the menu. It is a React component because the
// mobile menu is a React island; Footer.astro and Hours.astro render it on
// the server as static SVG, with no JavaScript shipped for them.
//
// The icon is always decorative (aria-hidden): the link around it carries the
// name, either as visible text or as an aria-label.
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandLinktree,
  IconBrandPinterest,
  IconBrandThreads,
  IconBrandTiktok,
  IconBrandX,
  IconBrandYoutube,
  IconLink,
} from '@tabler/icons-react';

interface Props {
  /** A socialLinksOf() platform: 'Facebook', 'Instagram', 'YouTube', ... */
  platform: string;
  size?: number;
  className?: string;
}

function iconFor(platform: string) {
  switch (platform) {
    case 'Facebook':
      return IconBrandFacebook;
    case 'Instagram':
      return IconBrandInstagram;
    case 'YouTube':
      return IconBrandYoutube;
    case 'LinkedIn':
      return IconBrandLinkedin;
    case 'Pinterest':
      return IconBrandPinterest;
    case 'TikTok':
      return IconBrandTiktok;
    case 'X':
      return IconBrandX;
    case 'Threads':
      return IconBrandThreads;
    case 'Linktree':
      return IconBrandLinktree;
    // Tabler has no Houzz brand icon; the generic link icon covers it and
    // every "Other" entry.
    default:
      return IconLink;
  }
}

export default function SocialIcon({ platform, size = 20, className }: Props) {
  const Icon = iconFor(platform);
  return (
    <Icon size={size} stroke={1.5} aria-hidden="true" focusable="false" className={className} />
  );
}
