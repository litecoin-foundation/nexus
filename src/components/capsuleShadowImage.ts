import {BlurStyle, Skia} from '@shopify/react-native-skia';
import type {SkImage} from '@shopify/react-native-skia';

// BlurMask re-rasterizes the path and blurs it on the CPU on every canvas
// frame; pre-rendering the shadow once turns the per-frame cost into a plain
// textured quad. Entries live for the app's life — a handful of
// device-size-keyed images.
export type CapsuleShadow = {image: SkImage; pad: number};

const cache = new Map<string, CapsuleShadow | null>();

export const getCapsuleShadowImage = (
  width: number,
  height: number,
  radius: number,
  blurSigma: number,
  color: string,
): CapsuleShadow | null => {
  const key = `${width}:${height}:${radius}:${blurSigma}:${color}`;
  const hit = cache.get(key);
  if (hit !== undefined) {
    return hit;
  }
  const pad = Math.ceil(blurSigma * 3);
  const surface = Skia.Surface.Make(
    Math.ceil(width + pad * 2),
    Math.ceil(height + pad * 2),
  );
  if (!surface) {
    cache.set(key, null);
    return null;
  }
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setMaskFilter(
    Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blurSigma, true),
  );
  surface
    .getCanvas()
    .drawRRect(
      Skia.RRectXY(Skia.XYWHRect(pad, pad, width, height), radius, radius),
      paint,
    );
  const entry = {image: surface.makeImageSnapshot(), pad};
  surface.dispose();
  cache.set(key, entry);
  return entry;
};
