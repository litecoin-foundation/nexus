import {useContext, useMemo} from 'react';
import {PaintStyle, Skia} from '@shopify/react-native-skia';
import type {
  SkCanvas,
  SkImage,
  SkPaint,
  SkParagraph,
  SkTypefaceFontProvider,
} from '@shopify/react-native-skia';

import {buildParagraph, useSatoshiFontMgr} from './GlassBalanceGraphics';
import {
  GlassTxRowModel,
  MUTED_TEXT,
  ROW_BORDER,
  SHEET_BACKGROUND,
  useGlassTxIcons,
} from './GlassTxRows';
import type {SkiaListCallbacks} from './SkiaList';
import {ScreenSizeContext} from '../context/screenSize';

// Imperative Skia counterpart to GlassTxRows' declarative transaction rows.
// useSkiaList records these worklets into a picture on the UI thread.

export interface GlassTxRowContext {
  fontMgr: SkTypefaceFontProvider;
  icons: Record<string, SkImage | null>;
  screenWidth: number;
  screenHeight: number;
  paints: RowPaints;
}

interface RowPaints {
  rowBackground: SkPaint;
  headerBackground: SkPaint;
  border: SkPaint;
  circleSend: SkPaint;
  circleOther: SkPaint;
  ring: SkPaint;
  image: SkPaint;
}

export interface GlassTxRowParagraphs {
  title: SkParagraph;
  meta?: SkParagraph;
  crypto?: SkParagraph;
  fiat?: SkParagraph;
}

const SEND_CIRCLE = '#000000';
const RING_COLOR = '#1EBC73';
const CONFIRMED_AT = 6;

const makePaint = (color: string) => {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setAntiAlias(true);
  return paint;
};

// Shared paints keep each recording to draw calls only.
const makePaints = (screenHeight: number): RowPaints => {
  const ring = makePaint(RING_COLOR);
  ring.setStyle(PaintStyle.Stroke);
  ring.setStrokeWidth(screenHeight * 0.003);
  return {
    rowBackground: makePaint('#ffffff'),
    headerBackground: makePaint(SHEET_BACKGROUND),
    border: makePaint(ROW_BORDER),
    circleSend: makePaint(SEND_CIRCLE),
    circleOther: makePaint('#1162E6'),
    ring,
    image: Skia.Paint(),
  };
};

const keyExtractor = (_model: GlassTxRowModel, index: number) => {
  'worklet';
  return `${index}`;
};

const measureItem = (model: GlassTxRowModel) => {
  'worklet';
  return model.height;
};

// Paragraph shaping is cached for each row.
const buildItem = (
  model: GlassTxRowModel,
  _index: number,
  context: GlassTxRowContext | null,
): GlassTxRowParagraphs => {
  'worklet';
  // Context is present whenever the list has rows.
  const {fontMgr, screenWidth, screenHeight} = context!;
  const primarySize = screenHeight * 0.016;
  const secondarySize = screenHeight * 0.014;

  if (model.header) {
    return {
      title: buildParagraph(
        fontMgr,
        model.title,
        secondarySize,
        700,
        MUTED_TEXT,
        screenWidth,
      ),
    };
  }
  return {
    title: buildParagraph(
      fontMgr,
      model.title,
      primarySize,
      700,
      '#484859',
      screenWidth,
    ),
    meta: buildParagraph(
      fontMgr,
      model.meta,
      secondarySize,
      700,
      MUTED_TEXT,
      screenWidth,
    ),
    crypto: buildParagraph(
      fontMgr,
      model.crypto,
      primarySize,
      700,
      model.amountColor,
      screenWidth,
    ),
    fiat: buildParagraph(
      fontMgr,
      model.fiat,
      secondarySize,
      700,
      MUTED_TEXT,
      screenWidth,
    ),
  };
};

const disposeItem = (built: GlassTxRowParagraphs) => {
  'worklet';
  built.title.dispose?.();
  built.meta?.dispose?.();
  built.crypto?.dispose?.();
  built.fiat?.dispose?.();
};

const drawItem = (
  canvas: SkCanvas,
  model: GlassTxRowModel,
  built: GlassTxRowParagraphs,
  _index: number,
  y: number,
  context: GlassTxRowContext | null,
) => {
  'worklet';
  const {icons, screenWidth, screenHeight, paints} = context!;
  const height = model.height;

  if (model.header) {
    canvas.drawRect(
      Skia.XYWHRect(0, y, screenWidth, height),
      paints.headerBackground,
    );
    canvas.drawRect(
      Skia.XYWHRect(0, y + height - 0.5, screenWidth, 0.5),
      paints.border,
    );
    // Paragraph was laid out by buildItem.
    built.title.paint(
      canvas,
      screenHeight * 0.02,
      y + (height - built.title.getHeight()) / 2,
    );
    return;
  }

  const pad = screenWidth * 0.05;
  const circleSize = screenHeight * 0.045;
  const textLeft = pad + circleSize + pad;
  const cellPadV = screenHeight * 0.02;
  const cy = y + height / 2;
  const pending = model.confs <= CONFIRMED_AT;
  const circleR = (circleSize * (pending ? 0.67 : 0.8)) / 2;

  canvas.drawRect(
    Skia.XYWHRect(0, y, screenWidth, height),
    paints.rowBackground,
  );
  canvas.drawRect(
    Skia.XYWHRect(0, y + height - 1, screenWidth, 1),
    paints.border,
  );
  canvas.drawCircle(
    pad + circleSize / 2,
    cy,
    circleR,
    model.circleColor === SEND_CIRCLE ? paints.circleSend : paints.circleOther,
  );

  const icon = icons[model.iconKey] ?? null;
  if (icon) {
    // Mirrors the declarative Image's contain fit.
    const box = circleR * 1.1;
    const iconWidth = icon.width();
    const iconHeight = icon.height();
    const scale = Math.min(box / iconWidth, box / iconHeight);
    const drawWidth = iconWidth * scale;
    const drawHeight = iconHeight * scale;
    canvas.drawImageRect(
      icon,
      Skia.XYWHRect(0, 0, iconWidth, iconHeight),
      Skia.XYWHRect(
        pad + circleSize / 2 - drawWidth / 2,
        cy - drawHeight / 2,
        drawWidth,
        drawHeight,
      ),
      paints.image,
    );
  }

  if (pending) {
    const ringR = (circleSize - 6) / 2;
    const sweep =
      (Math.min(Math.max(model.confs, 0), CONFIRMED_AT) / CONFIRMED_AT) * 360;
    const ring = Skia.Path.Make();
    ring.addArc(
      {
        x: pad + circleSize / 2 - ringR,
        y: cy - ringR,
        width: ringR * 2,
        height: ringR * 2,
      },
      -90,
      sweep,
    );
    canvas.drawPath(ring, paints.ring);
  }

  const meta = built.meta!;
  const crypto = built.crypto!;
  const fiat = built.fiat!;
  built.title.paint(canvas, textLeft, y + cellPadV);
  meta.paint(canvas, textLeft, y + height - cellPadV - meta.getHeight());
  crypto.paint(
    canvas,
    screenWidth - pad - crypto.getLongestLine(),
    y + cellPadV,
  );
  fiat.paint(
    canvas,
    screenWidth - pad - fiat.getLongestLine(),
    y + height - cellPadV - fiat.getHeight(),
  );
};

export const glassTxRowCallbacks: SkiaListCallbacks<
  GlassTxRowModel,
  GlassTxRowParagraphs,
  GlassTxRowContext | null
> = {keyExtractor, measureItem, buildItem, drawItem, disposeItem};

// Font loading gates list rendering.
export const useGlassTxRowContext = (): GlassTxRowContext | null => {
  const {width: screenWidth, height: screenHeight} =
    useContext(ScreenSizeContext);
  const fontMgr = useSatoshiFontMgr();
  const icons = useGlassTxIcons();
  const paints = useMemo(() => makePaints(screenHeight), [screenHeight]);

  // Preserve context identity until an image changes.
  const {Send, Receive, Convert, Buy, Sell} = icons;
  return useMemo(() => {
    if (!fontMgr) {
      return null;
    }
    return {
      fontMgr,
      icons: {Send, Receive, Convert, Buy, Sell},
      screenWidth,
      screenHeight,
      paints,
    };
  }, [
    fontMgr,
    Send,
    Receive,
    Convert,
    Buy,
    Sell,
    screenWidth,
    screenHeight,
    paints,
  ]);
};
