import {useEffect, useState} from 'react';
import {Skia} from '@shopify/react-native-skia';
import type {SkImage} from '@shopify/react-native-skia';

// brand logos are remote URIs; decode each once for the app's life and hand
// the skia list a stable record so its row cache only resets per batch

export type ShopLogoImages = Record<string, SkImage | null>;

const decoded = new Map<string, SkImage | null>();
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

const decodeUrl = (url: string) => {
  if (decoded.has(url) || pending.has(url)) {
    return;
  }
  pending.add(url);
  Skia.Data.fromURI(url)
    .then(data => Skia.Image.MakeImageFromEncoded(data))
    .catch(() => null)
    .then(image => {
      pending.delete(url);
      decoded.set(url, image ?? null);
      flushSoon();
    });
};

const snapshot = (urls: string[]): ShopLogoImages => {
  let any = false;
  const out: ShopLogoImages = {};
  for (const url of urls) {
    const image = decoded.get(url);
    if (image !== undefined) {
      out[url] = image;
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

export const useShopLogoImages = (urls: string[]): ShopLogoImages => {
  const [logos, setLogos] = useState<ShopLogoImages>(() => snapshot(urls));

  useEffect(() => {
    urls.forEach(decodeUrl);
    const update = () =>
      setLogos(prev => {
        const next = snapshot(urls);
        return sameLogos(prev, next) ? prev : next;
      });
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, [urls]);

  return logos;
};
