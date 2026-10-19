// Safe to edit by hand
// =============================================================================
// The church's own icon art for the Studio (starter PORTS.md card 119)
// =============================================================================
// NOT PORTABLE. The registry in src/sanity/brandIcons.tsx draws every meaning
// with @sanity/icons; each meaning listed here is drawn with one of four icons
// made from the site's own goal glyphs (src/components/church/BuildingGlyph.astro:
// the lancet window, the door, the lamp on a stand, the basin and towel),
// redrawn heavier for 16 to 24px in the church's indigo with one gold line
// (src/assets/brand/studio-icon-*.svg), plus the wordmark's tower for the church
// itself (written by scripts/gen-studio-art.mjs). artIcon() only places them in Sanity's
// 1em icon box; nothing recolours them.
//
// Which document type, field group or tool means what: brand/brand.config.json
// `studio.icons`. Meanings with no glyph (settings, help, the Trash, the
// guide...) keep the starter's @sanity/icons. The Studio is light by default;
// in dark appearance the list-row tile is a warm stone (studio.icons.tile.dark)
// so the indigo lines stay visible.
// =============================================================================

import type { BrandIconKey } from '../lib/studio-icons';
import { artIcon, type BrandIcon } from './artIcon';
import windowUrl from '../assets/brand/studio-icon-window.svg?url';
import doorUrl from '../assets/brand/studio-icon-door.svg?url';
import lampUrl from '../assets/brand/studio-icon-lamp.svg?url';
import basinUrl from '../assets/brand/studio-icon-basin.svg?url';
import towerUrl from '../assets/brand/studio-icon-tower.svg?url';

const Window = artIcon(windowUrl, 'Lancet window');
const Door = artIcon(doorUrl, 'Church door');
const Lamp = artIcon(lampUrl, 'Lamp on a stand');
const Basin = artIcon(basinUrl, 'Basin and towel');
// The tower from the church's wordmark (the favicon without its navy plate),
// already drawn for 16px: it is the browser-tab icon. Small inset, because the
// tower is tall and narrow and would otherwise sit smaller than its neighbours.
const Tower = artIcon(towerUrl, 'Church tower', 0.02);

export const BRAND_ICON_ART: Partial<Record<BrandIconKey, BrandIcon>> = {
  // The church itself: the Home tool and the home page. (Not 'settings': that
  // meaning is also every document's Settings tab, where a tower would mislead.)
  home: Tower,
  // Worship: the building's window for the pages and the sections they are built from.
  pages: Window,
  page: Window,
  sections: Window,
  savedSection: Window,
  // Sunday's sermon preview (Quick update, 2026-10-19): worship, so the window.
  scripture: Window,
  // The Way: the door for the church's address and plan-a-visit.
  place: Door,
  // Witness: the lamp for the banner, the blog and its posts.
  notice: Lamp,
  post: Lamp,
  journal: Lamp,
  // Work: the basin and towel for the people who serve and the ministries.
  person: Basin,
  people: Basin,
  service: Basin,
};
