import {BRAND_ICONS, BRAND_ICON_SVGS} from '../../assets/brand-icons';
import type {BrandIconName} from '../../assets/brand-icons';
import {BRAND_ICON_ALIASES} from '../../assets/brand-icons/aliases';

// Our own brand icons, bundled from src/assets/brand-icons; where one exists
// for a brand's slug (directly or through aliases.ts) it replaces the brand's
// remote logo_url. Raster icons are bundled assets, SVG icons inline markup.

export type BundledBrandIcon =
  | {kind: 'image'; module: number}
  | {kind: 'svg'; markup: string};

const BUNDLED_PREFIX = 'bundled:';

const VIEW_BOX =
  /<svg\b[^>]*\sviewBox\s*=\s*["']\s*[-+\d.eE]+[\s,]+[-+\d.eE]+[\s,]+([-+\d.eE]+)[\s,]+([-+\d.eE]+)/i;

// an svg's viewBox width and height: the shape it keeps when scaled to fit
export const svgViewBoxSize = (
  markup: string,
): {width: number; height: number} | undefined => {
  const box = VIEW_BOX.exec(markup);
  const width = box ? Number(box[1]) : 0;
  const height = box ? Number(box[2]) : 0;
  return width > 0 && height > 0 ? {width, height} : undefined;
};

// own-property lookups: a slug such as "constructor" must not hit the prototype
const has = (record: object, key: string) =>
  Object.prototype.hasOwnProperty.call(record, key);

const isIconName = (name: string): name is BrandIconName =>
  has(BRAND_ICONS, name) || has(BRAND_ICON_SVGS, name);

// slug -> icon name: its alias when it has one, else the slug itself
const iconName = (slug: string | undefined): BrandIconName | undefined => {
  if (!slug) {
    return undefined;
  }
  const name: string = has(BRAND_ICON_ALIASES, slug)
    ? BRAND_ICON_ALIASES[slug]
    : slug;
  return isIconName(name) ? name : undefined;
};

const iconByName = (name: string): BundledBrandIcon | undefined => {
  if (has(BRAND_ICONS, name)) {
    return {
      kind: 'image',
      module: BRAND_ICONS[name as keyof typeof BRAND_ICONS],
    };
  }
  if (has(BRAND_ICON_SVGS, name)) {
    return {
      kind: 'svg',
      markup: BRAND_ICON_SVGS[name as keyof typeof BRAND_ICON_SVGS],
    };
  }
  return undefined;
};

export const bundledBrandIcon = (
  slug: string | undefined,
): BundledBrandIcon | undefined => {
  const name = iconName(slug);
  return name === undefined ? undefined : iconByName(name);
};

// the shop list's logo key: the bundled icon when there is one, else the
// remote url, else '' (the row then draws the brand's initial). Keyed by icon
// name, so slugs sharing an icon decode it once.
export const shopLogoKey = (
  slug: string | undefined,
  logoUrl: string | undefined,
): string => {
  const name = iconName(slug);
  return name !== undefined ? `${BUNDLED_PREFIX}${name}` : (logoUrl ?? '');
};

// the bundled icon behind a logo key, or undefined for a remote url
export const bundledIconForKey = (key: string): BundledBrandIcon | undefined =>
  key.startsWith(BUNDLED_PREFIX)
    ? iconByName(key.slice(BUNDLED_PREFIX.length))
    : undefined;
