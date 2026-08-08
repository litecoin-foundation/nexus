import {useContext, useMemo} from 'react';
import {
  BlendMode,
  ClipOp,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TextAlign,
  TileMode,
} from '@shopify/react-native-skia';
import type {
  SkCanvas,
  SkImage,
  SkPaint,
  SkParagraph,
  SkTypefaceFontProvider,
} from '@shopify/react-native-skia';

import {getShopRowLayout, ShopRowModel} from './GlassShopRows';
import type {ShopLogoImages} from './shopLogoImages';
import {
  GLASS_BUTTON_TINT,
  RIM_BAND,
  RIM_BAND_ALPHA,
  RIM_EDGE,
  RIM_EDGE_ALPHA,
} from '../Buttons/GlassButtonSurface';
import {buildParagraph, useSatoshiFontMgr} from '../GlassBalanceGraphics';
import {
  makeCachedSkiaIcons,
  MUTED_TEXT,
  ROW_BORDER,
  SHEET_BACKGROUND,
} from '../GlassTxRows';
import type {SkiaListCallbacks} from '../SkiaList';
import {ScreenSizeContext} from '../../context/screenSize';

// Imperative skia rows for the shop list; useSkiaList records these worklets
// into a picture on the UI thread, the same way the tx rows draw.

const TITLE_TEXT = '#484859';
const AMOUNT_TEXT = '#212124';
const TINT = GLASS_BUTTON_TINT;
const DISCOUNT_GREEN = '#1EBC73';
const STATUS_ORANGE = '#FF9500';
// logos come encoded on white, the tile must match for them to blend
const TILE_FILL = '#ffffff';
const SKELETON_FILL = '#EFF1F3';

type ShopRowLayout = ReturnType<typeof getShopRowLayout>;

export interface ShopRowContext {
  fontMgr: SkTypefaceFontProvider;
  logos: ShopLogoImages;
  icons: Record<string, SkImage | null>;
  screenWidth: number;
  screenHeight: number;
  layout: ShopRowLayout;
  paints: ShopRowPaints;
}

interface ShopRowPaints {
  rowBackground: SkPaint;
  headerBackground: SkPaint;
  border: SkPaint;
  tile: SkPaint;
  tileBorder: SkPaint;
  tint: SkPaint;
  skeleton: SkPaint;
  discount: SkPaint;
  status: SkPaint;
  fade: SkPaint;
  filterIdle: SkPaint;
  filterActive: SkPaint;
  image: SkPaint;
  chevron: SkPaint;
}

export interface ShopRowParagraphs {
  title?: SkParagraph;
  accessory?: SkParagraph;
  detail?: SkParagraph;
  amount?: SkParagraph;
  discount?: SkParagraph;
  initial?: SkParagraph;
  cta?: SkParagraph;
  status?: SkParagraph;
  message?: SkParagraph;
}

const makePaint = (color: string) => {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setAntiAlias(true);
  return paint;
};

const makeStroke = (color: string, width: number) => {
  const paint = makePaint(color);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  return paint;
};

// shared paints keep each recording to draw calls only
const makePaints = (screenHeight: number): ShopRowPaints => {
  const filterIdle = makeStroke('#2E2E2E', screenHeight * 0.002);
  const filterActive = makeStroke(TINT, screenHeight * 0.002);
  filterIdle.setStrokeCap(StrokeCap.Round);
  filterActive.setStrokeCap(StrokeCap.Round);
  const chevron = makeStroke('#A6ACB5', screenHeight * 0.0022);
  chevron.setStrokeCap(StrokeCap.Round);
  chevron.setStrokeJoin(StrokeJoin.Round);
  return {
    rowBackground: makePaint('#ffffff'),
    headerBackground: makePaint(SHEET_BACKGROUND),
    border: makePaint(ROW_BORDER),
    tile: makePaint(TILE_FILL),
    tileBorder: makeStroke('rgba(214, 216, 218, 0.5)', 1),
    tint: makePaint(TINT),
    skeleton: makePaint(SKELETON_FILL),
    discount: makePaint(DISCOUNT_GREEN),
    status: makePaint(STATUS_ORANGE),
    fade: makePaint('rgba(255, 255, 255, 0.45)'),
    filterIdle,
    filterActive,
    image: Skia.Paint(),
    chevron,
  };
};

const keyExtractor = (_model: ShopRowModel, index: number) => {
  'worklet';
  return `${index}`;
};

const measureItem = (model: ShopRowModel) => {
  'worklet';
  return model.height;
};

// paragraph shaping is cached per row
const buildItem = (
  model: ShopRowModel,
  _index: number,
  context: ShopRowContext | null,
): ShopRowParagraphs => {
  'worklet';
  const {fontMgr, layout, screenWidth, screenHeight} = context!;
  const primary = screenHeight * 0.016;
  const secondary = screenHeight * 0.014;
  const small = screenHeight * 0.012;
  // ellipsize before the right-side columns
  const clamp = {maxLines: 1, ellipsis: '…'};

  switch (model.kind) {
    case 'label': {
      const built: ShopRowParagraphs = {
        title: buildParagraph(
          fontMgr,
          model.title,
          secondary,
          700,
          MUTED_TEXT,
          screenWidth,
        ),
      };
      if (model.accessory) {
        built.accessory = buildParagraph(
          fontMgr,
          model.accessory,
          secondary,
          700,
          TINT,
          screenWidth,
        );
      }
      return built;
    }
    case 'brand': {
      const built: ShopRowParagraphs = {
        title: buildParagraph(
          fontMgr,
          model.title,
          primary,
          700,
          TITLE_TEXT,
          layout.titleMaxWidth,
          clamp,
        ),
        detail: buildParagraph(
          fontMgr,
          model.detail,
          secondary,
          700,
          MUTED_TEXT,
          layout.titleMaxWidth,
          clamp,
        ),
        initial: buildParagraph(
          fontMgr,
          model.initial,
          screenHeight * 0.02,
          700,
          '#8E8E93',
          screenWidth,
        ),
      };
      if (model.discount) {
        built.discount = buildParagraph(
          fontMgr,
          model.discount,
          small,
          700,
          '#FFFFFF',
          screenWidth,
        );
      }
      return built;
    }
    case 'giftcard':
    case 'pending': {
      const built: ShopRowParagraphs = {
        title: buildParagraph(
          fontMgr,
          model.title,
          primary,
          700,
          TITLE_TEXT,
          layout.titleMaxWidth,
          clamp,
        ),
        detail: buildParagraph(
          fontMgr,
          model.detail,
          secondary,
          700,
          MUTED_TEXT,
          layout.titleMaxWidth,
          clamp,
        ),
        amount: buildParagraph(
          fontMgr,
          model.amount,
          primary,
          700,
          AMOUNT_TEXT,
          screenWidth,
        ),
        initial: buildParagraph(
          fontMgr,
          model.initial,
          screenHeight * 0.02,
          700,
          '#8E8E93',
          screenWidth,
        ),
      };
      if (model.status) {
        built.status = buildParagraph(
          fontMgr,
          model.status,
          small,
          700,
          '#FFFFFF',
          screenWidth,
        );
      }
      return built;
    }
    case 'message': {
      const built: ShopRowParagraphs = {
        message: buildParagraph(
          fontMgr,
          model.message,
          screenHeight * 0.015,
          700,
          MUTED_TEXT,
          screenWidth * 0.8,
          {align: TextAlign.Center, maxLines: 4},
        ),
      };
      if (model.cta) {
        built.cta = buildParagraph(
          fontMgr,
          model.cta,
          screenHeight * 0.015,
          700,
          '#FFFFFF',
          screenWidth,
        );
      }
      return built;
    }
    default:
      return {};
  }
};

const disposeItem = (built: ShopRowParagraphs) => {
  'worklet';
  built.title?.dispose?.();
  built.accessory?.dispose?.();
  built.detail?.dispose?.();
  built.amount?.dispose?.();
  built.discount?.dispose?.();
  built.initial?.dispose?.();
  built.cta?.dispose?.();
  built.status?.dispose?.();
  built.message?.dispose?.();
};

const drawLogoTile = (
  canvas: SkCanvas,
  model: ShopRowModel,
  built: ShopRowParagraphs,
  context: ShopRowContext,
  x: number,
  cy: number,
) => {
  'worklet';
  const {logos, layout, screenHeight, paints} = context;
  const tileTop = cy - layout.tileHeight / 2;
  const radius = screenHeight * 0.012;
  const tileRect = Skia.RRectXY(
    Skia.XYWHRect(x, tileTop, layout.tileWidth, layout.tileHeight),
    radius,
    radius,
  );
  canvas.drawRRect(tileRect, paints.tile);
  canvas.drawRRect(tileRect, paints.tileBorder);

  const logo = model.logoKey ? (logos[model.logoKey] ?? null) : null;
  if (logo) {
    const boxW = layout.tileWidth * 0.76;
    const boxH = layout.tileHeight * 0.76;
    const scale = Math.min(boxW / logo.width(), boxH / logo.height());
    const drawWidth = logo.width() * scale;
    const drawHeight = logo.height() * scale;
    canvas.save();
    canvas.clipRRect(tileRect, ClipOp.Intersect, true);
    canvas.drawImageRect(
      logo,
      Skia.XYWHRect(0, 0, logo.width(), logo.height()),
      Skia.XYWHRect(
        x + (layout.tileWidth - drawWidth) / 2,
        cy - drawHeight / 2,
        drawWidth,
        drawHeight,
      ),
      paints.image,
    );
    canvas.restore();
  } else if (built.initial) {
    built.initial.paint(
      canvas,
      x + (layout.tileWidth - built.initial.getLongestLine()) / 2,
      cy - built.initial.getHeight() / 2,
    );
  }
};

const drawChevron = (
  canvas: SkCanvas,
  context: ShopRowContext,
  cx: number,
  cy: number,
  expanded: boolean,
) => {
  'worklet';
  const {layout, paints} = context;
  const s = layout.chevronSize;
  // stroked chevron, pointing down until the row opens
  const tipY = expanded ? cy - s / 4 : cy + s / 4;
  const endY = expanded ? cy + s / 4 : cy - s / 4;
  canvas.drawLine(cx - s / 2, endY, cx, tipY, paints.chevron);
  canvas.drawLine(cx, tipY, cx + s / 2, endY, paints.chevron);
};

// the glass blue capsule, trimmed to its rim for row scale
const drawGlassCta = (
  canvas: SkCanvas,
  context: ShopRowContext,
  cta: SkParagraph,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  'worklet';
  const {paints} = context;
  const r = height / 2;
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(x, y, width, height), r, r),
    paints.tint,
  );
  const white = (a: number) => Skia.Color(`rgba(255, 255, 255, ${a})`);
  const clear = Skia.Color('rgba(255, 255, 255, 0)');
  const rims: [number, number][] = [
    [RIM_BAND, RIM_BAND_ALPHA],
    [RIM_EDGE, RIM_EDGE_ALPHA],
  ];
  for (const [strokeWidth, alpha] of rims) {
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(strokeWidth);
    paint.setBlendMode(BlendMode.Plus);
    paint.setShader(
      Skia.Shader.MakeLinearGradient(
        {x: 0, y},
        {x: 0, y: y + height},
        [white(alpha), clear, white(alpha)],
        [0, 0.5, 1],
        TileMode.Clamp,
      ),
    );
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(
          x + strokeWidth / 2,
          y + strokeWidth / 2,
          width - strokeWidth,
          height - strokeWidth,
        ),
        r - strokeWidth / 2,
        r - strokeWidth / 2,
      ),
      paint,
    );
  }
  cta.paint(
    canvas,
    x + (width - cta.getLongestLine()) / 2,
    y + (height - cta.getHeight()) / 2,
  );
};

const drawItem = (
  canvas: SkCanvas,
  model: ShopRowModel,
  built: ShopRowParagraphs,
  _index: number,
  y: number,
  context: ShopRowContext | null,
) => {
  'worklet';
  const {icons, layout, screenWidth, screenHeight, paints} = context!;
  const height = model.height;

  if (model.kind === 'spacer') {
    return;
  }

  if (model.kind === 'label') {
    canvas.drawRect(
      Skia.XYWHRect(0, y, screenWidth, height),
      paints.headerBackground,
    );
    canvas.drawRect(
      Skia.XYWHRect(0, y + height - 0.5, screenWidth, 0.5),
      paints.border,
    );
    if (built.title) {
      built.title.paint(
        canvas,
        layout.pad,
        y + (height - built.title.getHeight()) / 2,
      );
    }
    if (model.showFilter) {
      // three shrinking lines, the shop's filter glyph
      const stroke = model.filterActive
        ? paints.filterActive
        : paints.filterIdle;
      const glyph = screenHeight * 0.02;
      const gx = screenWidth - layout.pad - glyph;
      const gy = y + height / 2 - glyph / 2 + screenHeight * 0.001;
      const rows: [number, number][] = [
        [0, 1],
        [0.5, 0.62],
        [1, 0.3],
      ];
      for (const [t, w] of rows) {
        const lineY = gy + t * glyph * 0.8 + glyph * 0.1;
        canvas.drawLine(
          gx + ((1 - w) / 2) * glyph,
          lineY,
          gx + ((1 - w) / 2) * glyph + w * glyph,
          lineY,
          stroke,
        );
      }
      if (built.accessory) {
        built.accessory.paint(
          canvas,
          gx - screenWidth * 0.02 - built.accessory.getLongestLine(),
          y + (height - built.accessory.getHeight()) / 2,
        );
      }
    }
    return;
  }

  if (model.kind === 'message') {
    if (built.message) {
      built.message.paint(
        canvas,
        screenWidth * 0.1,
        y + height * 0.5 - built.message.getHeight() - screenHeight * 0.01,
      );
    }
    if (model.cta && built.cta) {
      const ctaWidth = layout.messageCtaWidth;
      drawGlassCta(
        canvas,
        context!,
        built.cta,
        (screenWidth - ctaWidth) / 2,
        y + height * 0.5 + screenHeight * 0.01,
        ctaWidth,
        layout.messageCtaHeight,
      );
    }
    return;
  }

  if (model.kind === 'skeleton') {
    canvas.drawRect(
      Skia.XYWHRect(0, y, screenWidth, height),
      paints.rowBackground,
    );
    canvas.drawRect(
      Skia.XYWHRect(0, y + height - 1, screenWidth, 1),
      paints.border,
    );
    const cy = y + height / 2;
    const radius = screenHeight * 0.012;
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(
          layout.pad,
          cy - layout.tileHeight / 2,
          layout.tileWidth,
          layout.tileHeight,
        ),
        radius,
        radius,
      ),
      paints.skeleton,
    );
    const barRadius = screenHeight * 0.006;
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(
          layout.textLeft,
          cy - screenHeight * 0.019,
          screenWidth * 0.34,
          screenHeight * 0.015,
        ),
        barRadius,
        barRadius,
      ),
      paints.skeleton,
    );
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(
          layout.textLeft,
          cy + screenHeight * 0.005,
          screenWidth * 0.22,
          screenHeight * 0.012,
        ),
        barRadius,
        barRadius,
      ),
      paints.skeleton,
    );
    return;
  }

  // brand / giftcard / pending
  canvas.drawRect(
    Skia.XYWHRect(0, y, screenWidth, height),
    paints.rowBackground,
  );
  canvas.drawRect(
    Skia.XYWHRect(0, y + height - 1, screenWidth, 1),
    paints.border,
  );

  const cellCy = y + layout.cellHeight / 2;
  const cellPadV = layout.cellPadV;
  drawLogoTile(canvas, model, built, context!, layout.pad, cellCy);

  if (model.kind === 'brand') {
    if (built.title) {
      built.title.paint(canvas, layout.textLeft, y + cellPadV);
    }
    if (built.detail) {
      built.detail.paint(
        canvas,
        layout.textLeft,
        y + layout.cellHeight - cellPadV - built.detail.getHeight(),
      );
    }
    if (built.discount) {
      // green pill left of the heart
      const pillH = screenHeight * 0.022;
      const pillW = built.discount.getLongestLine() + screenWidth * 0.03;
      const pillX =
        screenWidth -
        layout.pad -
        layout.chevronZoneWidth -
        layout.heartZoneWidth -
        pillW;
      canvas.drawRRect(
        Skia.RRectXY(
          Skia.XYWHRect(pillX, cellCy - pillH / 2, pillW, pillH),
          pillH / 2,
          pillH / 2,
        ),
        paints.discount,
      );
      built.discount.paint(
        canvas,
        pillX + (pillW - built.discount.getLongestLine()) / 2,
        cellCy - built.discount.getHeight() / 2,
      );
    }
    if (model.heart !== 0) {
      const heart =
        (model.heart === 2 ? icons.heartActive : icons.heartInactive) ?? null;
      if (heart) {
        const size = layout.heartSize;
        const cx =
          screenWidth -
          layout.pad -
          layout.chevronZoneWidth -
          layout.heartZoneWidth / 2;
        canvas.drawImageRect(
          heart,
          Skia.XYWHRect(0, 0, heart.width(), heart.height()),
          Skia.XYWHRect(cx - size / 2, cellCy - size / 2, size, size),
          paints.image,
        );
      }
    }
    drawChevron(
      canvas,
      context!,
      screenWidth - layout.pad - layout.chevronZoneWidth / 2,
      cellCy,
      false,
    );
    return;
  }

  // giftcard / pending shared cell: name, date, amount right
  if (built.title) {
    built.title.paint(canvas, layout.textLeft, y + cellPadV);
  }
  if (built.detail) {
    built.detail.paint(
      canvas,
      layout.textLeft,
      y + layout.cellHeight - cellPadV - built.detail.getHeight(),
    );
  }
  if (built.amount) {
    built.amount.paint(
      canvas,
      screenWidth - layout.pad - built.amount.getLongestLine(),
      y + cellPadV,
    );
  }

  if (model.kind === 'pending' && built.status) {
    const pillH = screenHeight * 0.024;
    const pillW = built.status.getLongestLine() + screenWidth * 0.035;
    const pillX = screenWidth - layout.pad - pillW;
    const pillY = y + layout.cellHeight - cellPadV - pillH;
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(pillX, pillY, pillW, pillH),
        pillH / 2,
        pillH / 2,
      ),
      paints.status,
    );
    built.status.paint(
      canvas,
      pillX + (pillW - built.status.getLongestLine()) / 2,
      pillY + (pillH - built.status.getHeight()) / 2,
    );
  }

  if (model.kind === 'giftcard') {
    drawChevron(
      canvas,
      context!,
      screenWidth - layout.pad - layout.chevronZoneWidth / 2,
      y + layout.cellHeight - cellPadV - layout.chevronSize / 2,
      false,
    );
    if (model.faded) {
      canvas.drawRect(Skia.XYWHRect(0, y, screenWidth, height), paints.fade);
    }
  }
};

export const shopRowCallbacks: SkiaListCallbacks<
  ShopRowModel,
  ShopRowParagraphs,
  ShopRowContext | null
> = {keyExtractor, measureItem, buildItem, drawItem, disposeItem};

// decoded once for the app's life, shared machinery with the tx rows
const useShopRowIcons = makeCachedSkiaIcons({
  heartActive: require('../../assets/images/heart-active.png'),
  heartInactive: require('../../assets/images/heart-inactive.png'),
});

// font loading gates list rendering
export const useShopRowContext = (
  logos: ShopLogoImages,
): ShopRowContext | null => {
  const {width: screenWidth, height: screenHeight} =
    useContext(ScreenSizeContext);
  const fontMgr = useSatoshiFontMgr();
  const icons = useShopRowIcons();
  const paints = useMemo(() => makePaints(screenHeight), [screenHeight]);
  // computed once; the draw worklets read it off the context per row
  const layout = useMemo(
    () => getShopRowLayout(screenWidth, screenHeight),
    [screenWidth, screenHeight],
  );

  return useMemo(() => {
    if (!fontMgr) {
      return null;
    }
    return {fontMgr, logos, icons, screenWidth, screenHeight, layout, paints};
  }, [fontMgr, logos, icons, screenWidth, screenHeight, layout, paints]);
};
