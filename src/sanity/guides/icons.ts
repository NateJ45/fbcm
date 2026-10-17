// Safe to edit by hand
// The @sanity/icons component for each guide icon name in ./content.ts.
// Split out so content.ts stays plain data that a node unit test can import
// without pulling in React. The Record type makes a missing name a compile
// error, so a new name in GUIDE_ICON_NAMES cannot ship without an icon.
import type { ComponentType } from 'react';
import { ArrowRightIcon } from '@sanity/icons/ArrowRight';
import { BellIcon } from '@sanity/icons/Bell';
import { BulbOutlineIcon } from '@sanity/icons/BulbOutline';
import { ClockIcon } from '@sanity/icons/Clock';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { EditIcon } from '@sanity/icons/Edit';
import { HeartIcon } from '@sanity/icons/Heart';
import { HelpCircleIcon } from '@sanity/icons/HelpCircle';
import { ImageIcon } from '@sanity/icons/Image';
import { UsersIcon } from '@sanity/icons/Users';
import type { GuideIconName } from './content';

export const GUIDE_ICONS: Record<GuideIconName, ComponentType> = {
  bulb: BulbOutlineIcon,
  page: DocumentTextIcon,
  clock: ClockIcon,
  bell: BellIcon,
  edit: EditIcon,
  users: UsersIcon,
  heart: HeartIcon,
  image: ImageIcon,
  arrow: ArrowRightIcon,
  help: HelpCircleIcon,
};
