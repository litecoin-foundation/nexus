import {useContext, useMemo} from 'react';
import {
  BlendMode,
  PaintStyle,
  Skia,
  StrokeCap,
  TextAlign,
  TileMode,
} from '@shopify/react-native-skia';
import type {
  SkCanvas,
  SkImage,
  SkPaint,
  SkParagraph,
  SkPath,
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
const SKELETON_FILL = '#EFF1F3';
const CARD_EDGE = 'rgba(214, 216, 218, 0.5)';

// the sale sticker lifted from the old BrandCard: a hand-drawn blob, stretched
// to the badge box (the svg used preserveAspectRatio="none") and tilted -8deg
const DISCOUNT_BADGE_PATH =
  'M5,30 C0,15 13,11 28,9 C48,6 70,3 94,8 C111,11 122,15 118,27 C116,41 110,47 95,48 C72,52 47,53 25,49 C10,46 3,42 5,30 Z';
const DISCOUNT_BADGE_VIEW_WIDTH = 120;
const DISCOUNT_BADGE_VIEW_HEIGHT = 56;
const DISCOUNT_BADGE_TILT = -8;

type ShopRowLayout = ReturnType<typeof getShopRowLayout>;

export interface ShopRowContext {
  fontMgr: SkTypefaceFontProvider;
  logos: ShopLogoImages;
  icons: Record<string, SkImage | null>;
  screenWidth: number;
  screenHeight: number;
  layout: ShopRowLayout;
  paints: ShopRowPaints;
  discountBadge: SkPath;
}

interface ShopRowPaints {
  rowBackground: SkPaint;
  headerBackground: SkPaint;
  cardBorder: SkPaint;
  tint: SkPaint;
  skeleton: SkPaint;
  discount: SkPaint;
  status: SkPaint;
  fade: SkPaint;
  filterIdle: SkPaint;
  filterActive: SkPaint;
  image: SkPaint;
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
  return {
    rowBackground: makePaint('#ffffff'),
    headerBackground: makePaint(SHEET_BACKGROUND),
    cardBorder: makeStroke(CARD_EDGE, 1),
    tint: makePaint(TINT),
    skeleton: makePaint(SKELETON_FILL),
    discount: makePaint(DISCOUNT_GREEN),
    status: makePaint(STATUS_ORANGE),
    fade: makePaint('rgba(255, 255, 255, 0.45)'),
    filterIdle,
    filterActive,
    image: Skia.Paint(),
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
      const line = {maxLines: 1, lineHeight: layout.labelLineHeight};
      const built: ShopRowParagraphs = {
        title: buildParagraph(
          fontMgr,
          model.title,
          layout.labelFontSize,
          700,
          MUTED_TEXT,
          screenWidth,
          line,
        ),
      };
      if (model.accessory) {
        built.accessory = buildParagraph(
          fontMgr,
          model.accessory,
          layout.labelFontSize,
          700,
          TINT,
          screenWidth,
          line,
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
          layout.brandTitleMaxWidth,
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

// each cell is its own rounded card on the sheet, inset from the screen
// edges; the row's height carries the gap that separates it from the next
const drawCard = (canvas: SkCanvas, context: ShopRowContext, top: number) => {
  'worklet';
  const {layout, paints, screenWidth} = context;
  const card = Skia.RRectXY(
    Skia.XYWHRect(
      layout.cardInset,
      top,
      screenWidth - layout.cardInset * 2,
      layout.cellHeight,
    ),
    layout.cardRadius,
    layout.cardRadius,
  );
  canvas.drawRRect(card, paints.rowBackground);
  canvas.drawRRect(card, paints.cardBorder);
  return card;
};

// the bare logo, fitted to the whole logo box; logos come encoded on white,
// so they blend straight into the card
const drawLogo = (
  canvas: SkCanvas,
  model: ShopRowModel,
  built: ShopRowParagraphs,
  context: ShopRowContext,
  x: number,
  cy: number,
) => {
  'worklet';
  const {logos, layout, paints} = context;
  const logo = model.logoKey ? (logos[model.logoKey] ?? null) : null;
  if (logo) {
    const width = logo.kind === 'svg' ? logo.width : logo.image.width();
    const height = logo.kind === 'svg' ? logo.height : logo.image.height();
    const scale = Math.min(
      layout.logoWidth / width,
      layout.logoHeight / height,
    );
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    const left = x + (layout.logoWidth - drawWidth) / 2;
    const top = cy - drawHeight / 2;
    if (logo.kind === 'svg') {
      // drawn at its own size, then scaled as vectors into the box
      canvas.save();
      canvas.translate(left, top);
      canvas.scale(scale, scale);
      canvas.drawSvg(logo.svg, width, height);
      canvas.restore();
    } else {
      canvas.drawImageRect(
        logo.image,
        Skia.XYWHRect(0, 0, width, height),
        Skia.XYWHRect(left, top, drawWidth, drawHeight),
        paints.image,
      );
    }
  } else if (built.initial) {
    built.initial.paint(
      canvas,
      x + (layout.logoWidth - built.initial.getLongestLine()) / 2,
      cy - built.initial.getHeight() / 2,
    );
  }
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
    const textTop = y + layout.labelPadTop;
    if (built.title) {
      built.title.paint(canvas, layout.pad, textTop);
    }
    if (model.showFilter) {
      // three shrinking lines, the shop's filter glyph
      const stroke = model.filterActive
        ? paints.filterActive
        : paints.filterIdle;
      const glyph = screenHeight * 0.02;
      const gx = screenWidth - layout.pad - glyph;
      const gy =
        textTop + layout.labelTextHeight / 2 - glyph / 2 + screenHeight * 0.001;
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
          textTop,
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
    const skeletonTop = y + layout.cardGap / 2;
    drawCard(canvas, context!, skeletonTop);
    const cy = skeletonTop + layout.cellHeight / 2;
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(
          layout.logoLeft,
          cy - layout.logoHeight / 2,
          layout.logoWidth,
          layout.logoHeight,
        ),
        layout.logoRadius,
        layout.logoRadius,
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
  const cardTop = y + layout.cardGap / 2;
  const card = drawCard(canvas, context!, cardTop);

  const cellCy = cardTop + layout.cellHeight / 2;
  const cellPadV = layout.cellPadV;
  drawLogo(canvas, model, built, context!, layout.logoLeft, cellCy);

  if (model.kind === 'brand') {
    if (built.title) {
      built.title.paint(canvas, layout.textLeft, cardTop + cellPadV);
    }
    if (built.detail) {
      built.detail.paint(
        canvas,
        layout.textLeft,
        cardTop + layout.cellHeight - cellPadV - built.detail.getHeight(),
      );
    }
    if (built.discount) {
      // green sticker straddling the logo's top-left corner, where the old card
      // pinned it; only the blob tilts, the label stays upright, exactly as the
      // old svg badge sat in its container
      const badgeH = screenHeight * 0.032;
      const badgeW = built.discount.getLongestLine() + screenWidth * 0.055;
      const badgeCx = layout.logoLeft + badgeW / 2;
      const badgeCy = Math.max(
        cellCy - layout.logoHeight / 2 + screenHeight * 0.006,
        cardTop + badgeH / 2 + screenHeight * 0.004,
      );
      canvas.save();
      canvas.translate(badgeCx, badgeCy);
      canvas.rotate(DISCOUNT_BADGE_TILT, 0, 0);
      canvas.scale(
        badgeW / DISCOUNT_BADGE_VIEW_WIDTH,
        badgeH / DISCOUNT_BADGE_VIEW_HEIGHT,
      );
      canvas.translate(
        -DISCOUNT_BADGE_VIEW_WIDTH / 2,
        -DISCOUNT_BADGE_VIEW_HEIGHT / 2,
      );
      canvas.drawPath(context!.discountBadge, paints.discount);
      canvas.restore();
      built.discount.paint(
        canvas,
        badgeCx - built.discount.getLongestLine() / 2,
        badgeCy - built.discount.getHeight() / 2,
      );
    }
    if (model.heart !== 0) {
      const heart =
        (model.heart === 2 ? icons.heartActive : icons.heartInactive) ?? null;
      if (heart) {
        const size = layout.heartSize;
        canvas.drawImageRect(
          heart,
          Skia.XYWHRect(0, 0, heart.width(), heart.height()),
          Skia.XYWHRect(layout.heartLeft, cellCy - size / 2, size, size),
          paints.image,
        );
      }
    }
    return;
  }

  // giftcard / pending shared cell: name, date, amount right
  if (built.title) {
    built.title.paint(canvas, layout.textLeft, cardTop + cellPadV);
  }
  if (built.detail) {
    built.detail.paint(
      canvas,
      layout.textLeft,
      cardTop + layout.cellHeight - cellPadV - built.detail.getHeight(),
    );
  }
  if (built.amount) {
    built.amount.paint(
      canvas,
      screenWidth - layout.pad - built.amount.getLongestLine(),
      cardTop + cellPadV,
    );
  }

  if (model.kind === 'pending' && built.status) {
    const pillH = screenHeight * 0.024;
    const pillW = built.status.getLongestLine() + screenWidth * 0.035;
    const pillX = screenWidth - layout.pad - pillW;
    const pillY = cardTop + layout.cellHeight - cellPadV - pillH;
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

  if (model.kind === 'giftcard' && model.faded) {
    canvas.drawRRect(card, paints.fade);
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
  // parsed once; the draw worklet only transforms it into the badge box
  const discountBadge = useMemo(
    () => Skia.Path.MakeFromSVGString(DISCOUNT_BADGE_PATH) ?? Skia.Path.Make(),
    [],
  );
  // computed once; the draw worklets read it off the context per row
  const layout = useMemo(
    () => getShopRowLayout(screenWidth, screenHeight),
    [screenWidth, screenHeight],
  );

  return useMemo(() => {
    if (!fontMgr) {
      return null;
    }
    return {
      fontMgr,
      logos,
      icons,
      screenWidth,
      screenHeight,
      layout,
      paints,
      discountBadge,
    };
  }, [
    fontMgr,
    logos,
    icons,
    screenWidth,
    screenHeight,
    layout,
    paints,
    discountBadge,
  ]);
};
