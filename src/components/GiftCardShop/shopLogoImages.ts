import {useEffect, useState} from 'react';
import {Image as RNImage} from 'react-native';
import {Skia} from '@shopify/react-native-skia';
import type {SkImage, SkSVG} from '@shopify/react-native-skia';

import {bundledIconForKey} from './brandIcons';

// brand logos are remote URIs or our own bundled icons, keyed by shopLogoKey;
// decode each once for the app's life and hand the skia list a stable record
// so its row cache only resets per batch

// a raster image, or an svg drawn as vectors with the size it has before
// scaling: its own width/height, else its viewBox's
export type ShopLogo =
  | {kind: 'image'; image: SkImage}
  | {kind: 'svg'; svg: SkSVG; width: number; height: number};

export type ShopLogoImages = Record<string, ShopLogo | null>;

const decoded = new Map<string, ShopLogo | null>();
const pending = new Set<string>();
const EMPTY_LOGOS: ShopLogoImages = {};

let flushTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const flushSoon = () => {
  if (flushTimer !== null) {
    return;
  }
  // batch arrivals so a burst of decodes costs one row-cache reset
  flushTimer = setTimeout(() => {
    flushTimer = null;
    listeners.forEach(listener => listener());
  }, 150);
};

const VIEW_BOX =
  /<svg\b[^>]*\sviewBox\s*=\s*["']\s*[-+\d.eE]+[\s,]+[-+\d.eE]+[\s,]+([-+\d.eE]+)[\s,]+([-+\d.eE]+)/i;

const svgLogo = (markup: string): ShopLogo | null => {
  const svg = Skia.SVG.MakeFromString(markup);
  if (!svg) {
    return null;
  }
  let width = svg.width();
  let height = svg.height();
  if (!(width > 0 && height > 0)) {
    // percentage sizes carry no intrinsic size; the viewBox has the shape
    const box = VIEW_BOX.exec(markup);
    width = box ? Number(box[1]) : 0;
    height = box ? Number(box[2]) : 0;
  }
  return width > 0 && height > 0 ? {kind: 'svg', svg, width, height} : null;
};

const loadLogo = async (key: string): Promise<ShopLogo | null> => {
  const bundled = bundledIconForKey(key);
  if (bundled?.kind === 'svg') {
    return svgLogo(bundled.markup);
  }
  // a bundled raster icon resolves to the packager in dev and the app bundle
  // in release, at the device's @2x / @3x scale
  const uri = bundled ? RNImage.resolveAssetSource(bundled.module).uri : key;
  const image = Skia.Image.MakeImageFromEncoded(await Skia.Data.fromURI(uri));
  return image ? {kind: 'image', image} : null;
};

const decodeLogo = (key: string) => {
  if (decoded.has(key) || pending.has(key)) {
    return;
  }
  pending.add(key);
  loadLogo(key)
    .catch(() => null)
    .then(logo => {
      pending.delete(key);
      decoded.set(key, logo);
      flushSoon();
    });
};

const snapshot = (keys: string[]): ShopLogoImages => {
  let any = false;
  const out: ShopLogoImages = {};
  for (const key of keys) {
    const logo = decoded.get(key);
    if (logo !== undefined) {
      out[key] = logo;
      any = true;
    }
  }
  return any ? out : EMPTY_LOGOS;
};

// a fresh-but-equal snapshot must keep its identity: the record is skia list
// context, and a new identity drops the whole row cache
const sameLogos = (a: ShopLogoImages, b: ShopLogoImages): boolean => {
  const aKeys = Object.keys(a);
  return (
    aKeys.length === Object.keys(b).length &&
    aKeys.every(key => a[key] === b[key])
  );
};

// keys come from shopLogoKey, the same keys the rows carry as logoKey
export const useShopLogoImages = (keys: string[]): ShopLogoImages => {
  const [logos, setLogos] = useState<ShopLogoImages>(() => snapshot(keys));

  useEffect(() => {
    keys.forEach(decodeLogo);
    const update = () =>
      setLogos(prev => {
        const next = snapshot(keys);
        return sameLogos(prev, next) ? prev : next;
      });
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, [keys]);

  return logos;
};
