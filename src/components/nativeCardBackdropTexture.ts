import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';
import type {SkImage, SkImageFilter} from '@shopify/react-native-skia';

export const GLASS_BACKDROP_BLUR = 1;

export type PreparedCardBackdrop = {
  image: SkImage;
  filter: SkImageFilter;
  width: number;
  height: number;
  pixelRatio: number;
};

// Run once on the UI thread while the card is settled. Upload and blur the
// native bitmap now, so moving glass only samples an existing GPU texture.
export const prepareNativeCardBackdrop = (
  source: SkImage,
  width: number,
  height: number,
  pixelRatio: number,
): PreparedCardBackdrop | null => {
  'worklet';
  const bounds = Skia.XYWHRect(
    0,
    0,
    Math.ceil(width * pixelRatio),
    Math.ceil(height * pixelRatio),
  );
  const surface = Skia.Surface.MakeOffscreen(bounds.width, bounds.height);
  if (!surface) {
    return null;
  }
  const paint = Skia.Paint();
  paint.setImageFilter(
    Skia.ImageFilter.MakeBlur(
      GLASS_BACKDROP_BLUR * pixelRatio,
      GLASS_BACKDROP_BLUR * pixelRatio,
      TileMode.Clamp,
    ),
  );
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  canvas.drawImageRect(
    source,
    Skia.XYWHRect(0, 0, source.width(), source.height()),
    bounds,
    paint,
  );
  surface.flush();
  const image = surface.makeImageSnapshot();
  surface.dispose();
  return {
    image,
    filter: Skia.ImageFilter.MakeImage(
      image,
      null,
      Skia.XYWHRect(0, 0, width * pixelRatio, height * pixelRatio),
      FilterMode.Linear,
      MipmapMode.None,
    ),
    width,
    height,
    pixelRatio,
  };
};
