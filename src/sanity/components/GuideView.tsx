// Safe to edit by hand (the drawing is the kit's: src/sanity/kit/guide/GuidePage.tsx)
// =============================================================================
// GuideView: one Site Guide entry, read-only, in the Site Guide tool and in the
// "Help for this page" panel
// =============================================================================
// PORTS.md card 41 (the guides as repo data), redrawn with card 128: the page
// is the kit's GuidePage, in the church's own design language (banner, gold
// rule and marker per section, numbered stones for steps, callouts, button
// copies, cards), set by brand/brand.config.json `studio.look`. This file only
// binds a guide slug to it and hands in the Studio's router, so "Where in the
// Studio" links go somewhere.
//
// The guides live only in the Site Guide tool here (not in a desk list), and
// both places that draw a guide (GuideTool and HelpPanel) pass `onOpen`, so a
// "See also" card opens the next guide in place.
//
// One instance per guide (bound to a slug at structure-build time via
// makeGuideView). The guides are DATA in ../guides/content.ts.
// =============================================================================

import type { ComponentType } from 'react';
import { Box, Text } from '@sanity/ui';
import { useWorkspace } from 'sanity';
import { guides, SITE } from '../guides/content';
import { GuidePage } from '../kit/guide/GuidePage';
import { useStudioLink } from '../kit/shared';
import type { GuideViewProps } from '../kit/types';

export function makeGuideView(slug: string): ComponentType<GuideViewProps> {
  return function GuideView({ variant = 'page', onOpen }: GuideViewProps) {
    const linkTo = useStudioLink();
    const { title } = useWorkspace();
    const guide = guides.find((g) => g.slug === slug);
    if (!guide) {
      return (
        <Box padding={4}>
          <Text>Guide not found.</Text>
        </Box>
      );
    }
    return (
      <Box padding={variant === 'panel' ? 3 : [3, 4, 5]}>
        <Box style={{ maxWidth: 820, margin: '0 auto' }}>
          <GuidePage
            guide={guide}
            guides={guides}
            helper={SITE.contactName}
            siteName={title}
            variant={variant}
            linkTo={linkTo}
            onOpen={onOpen}
          />
        </Box>
      </Box>
    );
  };
}
