import React, {useContext, useEffect, useMemo, useState} from 'react';
import {StyleSheet} from 'react-native';
import {
  BackdropFilter,
  Canvas,
  Group,
  Image,
  ImageFilter,
  Picture,
  Rect,
  RoundedRect,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';
import {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ProgressiveEdgeBlur from './ProgressiveEdgeBlur';
import {useCardUnderlayValue} from './cardUnderlay';
import {getCapsuleShadowImage} from './capsuleShadowImage';
import {
  getShopListTop,
  getShopRowLayout,
  ShopRowModels,
} from './GiftCardShop/GlassShopRows';
import {shopRowCallbacks, useShopRowContext} from './GiftCardShop/ShopSkiaRows';
import type {ShopLogoImages} from './GiftCardShop/shopLogoImages';
import {glassTabShader, makeGlassTabFilter} from './glassTabShader';
import {
  DRAG_STRIP_HEIGHT_RATIO,
  GlassTxRowModels,
  GLASS_TX_LIST_TOP_RATIO,
  SHEET_BACKGROUND,
} from './GlassTxRows';
import {
  BAND_BLUR_SIGMA,
  BAR_HEIGHT_RATIO,
  BAR_WIDTH_RATIO,
  getBottomOffset,
  getTabBarBandHeight,
  getTabBarHideDistance,
  SCROLLING_SCALE,
} from './glassTabBarLayout';
import {glassTxRowCallbacks, useGlassTxRowContext} from './GlassTxSkiaRows';
import {getNewMainSheetPoints} from '../animations/useNewMainAnims';
import {ScreenSizeContext} from '../context/screenSize';
import {useSkiaList} from './SkiaList';

// A Skia BackdropFilter can only sample pixels drawn in its own canvas, so
// everything the tab bar's glass refracts has to live here: this one
// screen-fixed canvas draws the transaction rows, frosts the bottom band, and
// applies the glass. Drawing the rows in a second canvas inside the sheet
// would double every row's paragraph shaping and rasterisation, so the sheet
// has no canvas of its own — the rows are positioned from the sheet's
// translation instead, on the UI thread, and clipped to the list viewport.

const GLASS_DARKEN = 0.63;
const GLASS_BLUR_SIGMA = 1;

// drawn past the screen bottom so layout rounding can't leave a hairline gap
const BOTTOM_OVERSCAN = 4;

// stable identity keeps the Skia list row cache intact
const EMPTY_ROWS: GlassTxRowModels['models'] = [];
const EMPTY_SHOP_ROWS: ShopRowModels['models'] = [];

// open-ended clip height; the outer canvas-space clips bound it
const BOTTOMLESS = 1e9;

// The spring that snaps the sheet open has no clamp, so a hard flick can carry
// it above UNFOLD_SHEET_POINT for a frame or two. The canvas starts that much
// higher than the resting list top; nothing can be drawn above its own edge,
// and without the margin the first row would be sliced during the overshoot.
export const SHEET_OVERSHOOT_RATIO = 0.1;

// canvas top: above the higher of the tx list (with overshoot) and the shop
// list; shared so the tx detail modal can mirror the same viewport
export const getGlassCanvasTop = (screenHeight: number, topInset: number) => {
  const {UNFOLD_SHEET_POINT} = getNewMainSheetPoints(screenHeight, topInset);
  return Math.min(
    UNFOLD_SHEET_POINT +
      screenHeight * GLASS_TX_LIST_TOP_RATIO -
      screenHeight * SHEET_OVERSHOOT_RATIO,
    getShopListTop(screenHeight, topInset) - screenHeight * 0.01,
  );
};

// Canvas y of the first row: the sheet's position, plus the chrome above the
// list, plus the pinned sync header. The row transform and the clip must agree
// on this, so they share it — but they have to pass the values in rather than
// read them here. Reanimated derives a mapper's inputs from the updater's OWN
// closure and does not look inside a function it captures, so a shared value
// read in here would never mark the mapper dirty.
export const rowsTopInCanvas = (
  sheetY: number,
  listTopInSheet: number,
  canvasTop: number,
  headerOffset: number,
) => {
  'worklet';
  return sheetY + listTopInSheet - canvasTop + headerOffset;
};

interface Props {
  rowModels: GlassTxRowModels;
  // Sheet position and list scroll, both written on the UI thread.
  mainSheetsTranslationY: SharedValue<number>;
  txListScrollY: SharedValue<number>;
  listHeaderOffset: SharedValue<number>;
  // False while a card is open — the band shows the card's underlay instead.
  showTxList: boolean;
  // Shop screen rows, drawn in place of the tx list while the shop is open.
  // The whole shop layer slides with shopTransition (0 offscreen, 1 open).
  showShop: boolean;
  shopRowModels: ShopRowModels;
  shopScrollY: SharedValue<number>;
  shopMorphFrom: SharedValue<number>;
  shopLogos: ShopLogoImages;
  shopTransition: SharedValue<number>;
  // Row expansion: the models stay collapsed; rows below `split` slide down
  // by progress*extras while the panel overlay is revealed. Idle: split
  // huge, extras 0, progress 1.
  shopExpandSplit: SharedValue<number>;
  shopExpandExtras: SharedValue<number>;
  shopExpandProgress: SharedValue<number>;
  shopExpandChevronLift: SharedValue<number>;
  // panel-local overlay content and the spinning chevron cover
  shopPanel?: React.ReactNode;
  shopChevron?: React.ReactNode;
  // The card swap fade, shared with the native card views.
  cardSwapOpacity: SharedValue<number>;
  // Tab bar shrink (content activity) and press feedback.
  contentActivity: SharedValue<number>;
  pressScale: SharedValue<number>;
  // 0 resting, 1 hidden; drives the capsule, shadow and frost
  hideProgress: SharedValue<number>;
  // The bar's border, thumb and icons, in bar-local coords. Drawn here rather
  // than in their own <Canvas>: every extra canvas costs a per-frame
  // setJsiProperty hand-off on the UI thread (~4ms), regardless of content.
  barChrome?: React.ReactNode;
}

const GlassTxCanvas: React.FC<Props> = props => {
  const {
    rowModels,
    mainSheetsTranslationY,
    txListScrollY,
    listHeaderOffset,
    showTxList,
    showShop,
    shopRowModels,
    shopScrollY,
    shopMorphFrom,
    shopLogos,
    shopTransition,
    shopExpandSplit,
    shopExpandExtras,
    shopExpandProgress,
    shopExpandChevronLift,
    shopPanel,
    shopChevron,
    cardSwapOpacity,
    contentActivity,
    pressScale,
    hideProgress,
    barChrome,
  } = props;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  // The canvas is pinned just above the higher of its two list viewports —
  // the tx list at the unfolded sheet, or the shop list under its shorter
  // gradient header — and runs to the screen bottom, so it spans the rows
  // and the tab bar band in every mode.
  const listTopInSheet = SCREEN_HEIGHT * GLASS_TX_LIST_TOP_RATIO;
  const canvasTop = getGlassCanvasTop(SCREEN_HEIGHT, insets.top);
  const canvasHeight = SCREEN_HEIGHT - canvasTop;

  const bandHeight = getTabBarBandHeight(SCREEN_HEIGHT, insets.bottom);
  const bandTop = canvasHeight - bandHeight;
  const bandBottom = canvasHeight + BOTTOM_OVERSCAN;
  const bottomOffset = getBottomOffset(SCREEN_HEIGHT, insets.bottom);
  const barWidth = SCREEN_WIDTH * BAR_WIDTH_RATIO;
  const barHeight = SCREEN_HEIGHT * BAR_HEIGHT_RATIO;
  const barTop = canvasHeight - bottomOffset - barHeight;
  const barShadow = getCapsuleShadowImage(
    barWidth,
    barHeight,
    barHeight / 2,
    6,
    'rgba(0, 0, 0, 0.1)',
  );

  // rows fade + drift in when returning home, fade out before the incoming
  // card becomes visible
  const [rowsMounted, setRowsMounted] = useState(showTxList);
  const rowsOpacity = useSharedValue(showTxList ? 1 : 0);
  const rowsDrift = useSharedValue(0);
  useEffect(() => {
    if (showTxList) {
      setRowsMounted(true);
      if (!rowsMounted) {
        rowsOpacity.value = 0;
        rowsDrift.value = 12;
        rowsDrift.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      }
      rowsOpacity.value = withTiming(1, {duration: 250});
      return;
    }
    if (rowsMounted) {
      rowsOpacity.value = withTiming(0, {duration: 120}, finished => {
        if (finished) {
          runOnJS(setRowsMounted)(false);
        }
      });
    }
  }, [showTxList, rowsMounted, rowsOpacity, rowsDrift]);

  // the wallet rows crossfade with the shop hand-off: they sink and fade as
  // the shop arrives and return with it, composed into the existing opacity
  // and scroll transform so the hot path gains no layers
  const walletShopFade = useDerivedValue(() =>
    interpolate(shopTransition.value, [0.1, 0.5], [1, 0], Extrapolation.CLAMP),
  );
  const walletRowsOpacity = useDerivedValue(
    () => rowsOpacity.value * walletShopFade.value,
  );

  // records visible rows into a UI-thread picture while scrolling
  // tx details retain declarative static rows
  const rowContext = useGlassTxRowContext();
  const rowsReady = rowsMounted && rowContext !== null;
  const skiaList = useSkiaList({
    ...glassTxRowCallbacks,
    data: rowsReady ? rowModels.models : EMPTY_ROWS,
    context: rowContext,
    scrollY: txListScrollY,
    headerOffset: listHeaderOffset,
    viewportHeight: canvasHeight,
    enabled: rowsReady,
  });

  // both draw passes reuse the recorded picture
  const rowsNode: React.ReactNode = rowsReady ? (
    <Picture picture={skiaList.picture} />
  ) : null;

  // shop rows in the same canvas; the surface's slide carries this layer, so
  // there is no fade of its own — just the delayed unmount from showShop
  const shopHeaderOffset = useSharedValue(0);
  const shopContext = useShopRowContext(shopLogos);
  const shopReady = showShop && shopContext !== null;
  const shopList = useSkiaList({
    ...shopRowCallbacks,
    data: shopReady ? shopRowModels.models : EMPTY_SHOP_ROWS,
    context: shopContext,
    scrollY: shopScrollY,
    headerOffset: shopHeaderOffset,
    viewportHeight: canvasHeight,
    enabled: shopReady,
  });
  const shopNode: React.ReactNode = shopReady ? (
    <Picture picture={shopList.picture} />
  ) : null;

  // rows crossfade with the wallet's inside the sheet region while the
  // cover fades ([0.2, 0.6]); their travel comes from riding the container
  // boundary below, not a fade-drift of their own
  const shopLayerOpacity = useDerivedValue(() =>
    interpolate(
      shopTransition.value,
      [0.15, 0.45],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  );

  // The shop list top never moves; only its scroll offset does. Scrolling
  // drives ONE mapper — the scroll group's translate; everything inside is
  // in content coordinates and only recomputes during the expand animation.
  // Rows below the split slide DOWN by progress*extras while the panel is
  // revealed in the widening gap — the models stay collapsed, so the unfold
  // never re-records the list.
  const shopRowsTop = getShopListTop(SCREEN_HEIGHT, insets.top) - canvasTop;
  // how far the container boundary (the gradient card's bottom edge) still
  // is from its resting place: pinned at the wallet sheet's top through the
  // cover fade ([0, 0.35]), travelling home over [0.35, 1]. The rows ride
  // it, so the sheet and its content move as one container.
  const shopTravel = useDerivedValue(() => {
    const travelled = interpolate(
      shopTransition.value,
      [0.35, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return (shopMorphFrom.value - canvasTop - shopRowsTop) * (1 - travelled);
  });
  const shopScrollTransform = useDerivedValue(() => [
    {translateY: shopRowsTop - shopScrollY.value + shopTravel.value},
  ]);
  const shopTransformBelow = useDerivedValue(() => [
    {translateY: shopExpandProgress.value * shopExpandExtras.value},
  ]);
  const shopClipAbove = useDerivedValue(() =>
    Skia.XYWHRect(0, 0, SCREEN_WIDTH, Math.max(0, shopExpandSplit.value)),
  );
  const shopClipBelow = useDerivedValue(() => {
    const top =
      shopExpandSplit.value + shopExpandProgress.value * shopExpandExtras.value;
    return Skia.XYWHRect(0, top, SCREEN_WIDTH, BOTTOMLESS);
  });
  const shopPanelClip = useDerivedValue(() =>
    Skia.XYWHRect(
      0,
      shopExpandSplit.value,
      SCREEN_WIDTH,
      Math.max(0, shopExpandProgress.value * shopExpandExtras.value),
    ),
  );
  // the panel slides down into place under the tapped row
  const shopPanelTransform = useDerivedValue(() => [
    {
      translateY:
        shopExpandSplit.value -
        (1 - shopExpandProgress.value) * shopExpandExtras.value,
    },
  ]);
  // spinning cover over the tapped row's static chevron
  const shopLayout = getShopRowLayout(SCREEN_WIDTH, SCREEN_HEIGHT);
  const shopChevronX = shopLayout.chevronCx;
  const shopChevronTransform = useDerivedValue(() => [
    {translateX: shopChevronX},
    {translateY: shopExpandSplit.value - shopExpandChevronLift.value},
    {rotate: shopExpandProgress.value * Math.PI},
  ]);
  // canvas-space bounds for the content-space groups above
  // the clips follow the boundary: rows above it belong to the card's
  // territory and must never draw over it
  const shopMainClip = useDerivedValue(() => {
    const top = Math.max(0, shopRowsTop + shopTravel.value);
    return Skia.XYWHRect(0, top, SCREEN_WIDTH, Math.max(0, bandTop - top));
  });
  const shopBandClip = useDerivedValue(() => {
    const top = Math.max(0, shopRowsTop + shopTravel.value);
    return Skia.XYWHRect(0, top, SCREEN_WIDTH, Math.max(0, bandBottom - top));
  });

  // List-content coordinates -> canvas coordinates.
  const contentTransform = useDerivedValue(() => [
    {
      translateY:
        rowsTopInCanvas(
          mainSheetsTranslationY.value,
          listTopInSheet,
          canvasTop,
          listHeaderOffset.value,
        ) -
        txListScrollY.value +
        rowsDrift.value +
        (1 - walletShopFade.value) * 10,
    },
  ]);

  // Rows scrolled above that origin would paint over the pinned sync header
  // and the title row, and the band below draws its own copy, so the plain
  // pass covers neither.
  const listClip = useDerivedValue(() => {
    // fully faded behind the settled shop: collapse instead of alpha-0 draws
    if (walletShopFade.value <= 0) {
      return Skia.XYWHRect(0, 0, 0, 0);
    }
    const rowsTop = Math.max(
      0,
      rowsTopInCanvas(
        mainSheetsTranslationY.value,
        listTopInSheet,
        canvasTop,
        listHeaderOffset.value,
      ),
    );
    return Skia.XYWHRect(
      0,
      rowsTop,
      SCREEN_WIDTH,
      Math.max(0, bandTop - rowsTop),
    );
  });

  const bandClip = useMemo(
    () => Skia.XYWHRect(0, bandTop, SCREEN_WIDTH, bandBottom - bandTop),
    [bandTop, SCREEN_WIDTH, bandBottom],
  );
  const walletBandClip = useDerivedValue(() =>
    walletShopFade.value <= 0
      ? Skia.XYWHRect(0, 0, 0, 0)
      : Skia.XYWHRect(0, bandTop, SCREEN_WIDTH, bandBottom - bandTop),
  );

  // only the capsule and its shadow slide, the band stays put
  const hideDistance = getTabBarHideDistance(SCREEN_HEIGHT, insets.bottom);
  const hideTransform = useDerivedValue(() => [
    {translateY: hideProgress.value * hideDistance},
  ]);

  // frost arrives and leaves with the bar
  const frostOpacity = useDerivedValue(() =>
    interpolate(hideProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  );

  // open card's skia content, drawn here so the glass refracts it live
  const underlayEntry = useCardUnderlayValue();
  const underlay = underlayEntry?.node ?? null;
  const underlayCoversCard = underlayEntry?.coversCard === true;
  const cardTopInSheet = SCREEN_HEIGHT * DRAG_STRIP_HEIGHT_RATIO;
  // card coordinates -> canvas coordinates
  const underlayTransform = useDerivedValue(() => [
    {translateY: mainSheetsTranslationY.value + cardTopInSheet - canvasTop},
  ]);
  // stops at the band, which draws its own copy below; overlapping the two
  // would double-draw semi-transparent content (disabled buttons, fades)
  const underlayClip = useDerivedValue(() => {
    const top = Math.max(
      0,
      mainSheetsTranslationY.value + cardTopInSheet - canvasTop,
    );
    return Skia.XYWHRect(0, top, SCREEN_WIDTH, Math.max(0, bandTop - top));
  });
  const underlayContent = underlay ? (
    <Group opacity={cardSwapOpacity}>
      <Group transform={underlayTransform}>{underlay}</Group>
    </Group>
  ) : null;

  // Builder and blur child are hoisted; only uniforms change per frame.
  const shaderBuilder = useMemo(
    () => Skia.RuntimeShaderBuilder(glassTabShader),
    [],
  );
  const glassBlurChild = useMemo(
    () =>
      Skia.ImageFilter.MakeBlur(
        GLASS_BLUR_SIGMA,
        GLASS_BLUR_SIGMA,
        TileMode.Clamp,
      ),
    [],
  );
  const glassFilter = useDerivedValue(() => {
    const scale =
      pressScale.value *
      interpolate(
        contentActivity.value,
        [0, 1],
        [1, SCROLLING_SCALE],
        Extrapolation.CLAMP,
      );
    const width = barWidth * scale;
    const height = barHeight * scale;
    const x = (SCREEN_WIDTH - width) / 2;
    const y =
      barTop + (barHeight - height) / 2 + hideProgress.value * hideDistance;
    const capsule = [x, y, width, height];
    return makeGlassTabFilter(
      shaderBuilder,
      glassBlurChild,
      [capsule, capsule, capsule],
      height / 2,
      GLASS_DARKEN,
    );
  });

  // Same rect the glass filter uses, as a transform from bar-local coords.
  const barTransform = useDerivedValue(() => {
    const scale =
      pressScale.value *
      interpolate(
        contentActivity.value,
        [0, 1],
        [1, SCROLLING_SCALE],
        Extrapolation.CLAMP,
      );
    return [
      {translateX: (SCREEN_WIDTH - barWidth * scale) / 2},
      {
        translateY:
          barTop +
          (barHeight - barHeight * scale) / 2 +
          hideProgress.value * hideDistance,
      },
      {scale},
    ];
  });

  // the split passes and panel, in content coordinates; drawn in both the
  // main pass and the band copy inside their own scroll groups
  const shopSplitLayers = shopNode ? (
    <>
      <Group clip={shopClipAbove}>{shopNode}</Group>
      <Group clip={shopClipBelow}>
        <Group transform={shopTransformBelow}>{shopNode}</Group>
      </Group>
      {shopPanel ? (
        <Group clip={shopPanelClip}>
          <Group transform={shopPanelTransform}>{shopPanel}</Group>
        </Group>
      ) : null}
    </>
  ) : null;

  // the glass needs opaque pixels beneath it: rows on the wallet, the card's
  // underlay while a card is open. a full-card underlay gets a solid backing;
  // rows bring theirs inside the fade so it never pops; partial underlays
  // leave the band clear or they'd cover the native card sliding through it
  const fullCardUnderlay = underlay !== null && underlayCoversCard;
  const bandSource = (
    <>
      {fullCardUnderlay ? (
        <Rect
          x={0}
          y={bandTop}
          width={SCREEN_WIDTH}
          height={bandBottom - bandTop}
          color={SHEET_BACKGROUND}
        />
      ) : null}
      {rowsMounted && rowsNode ? (
        <Group clip={walletBandClip} opacity={walletRowsOpacity}>
          {!fullCardUnderlay ? (
            <Rect
              x={0}
              y={bandTop}
              width={SCREEN_WIDTH}
              height={bandBottom - bandTop}
              color={SHEET_BACKGROUND}
            />
          ) : null}
          <Group transform={contentTransform}>{rowsNode}</Group>
        </Group>
      ) : null}
      {shopNode ? (
        <Group opacity={shopLayerOpacity}>
          <Rect
            x={0}
            y={bandTop}
            width={SCREEN_WIDTH}
            height={bandBottom - bandTop}
            color={SHEET_BACKGROUND}
          />
          <Group clip={shopBandClip}>
            <Group transform={shopScrollTransform}>{shopSplitLayers}</Group>
          </Group>
        </Group>
      ) : null}
      {underlayContent}
    </>
  );

  const styles = getStyles(SCREEN_WIDTH, canvasTop, bandBottom);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {rowsNode ? (
        <Group clip={listClip}>
          <Group opacity={walletRowsOpacity}>
            <Group transform={contentTransform}>{rowsNode}</Group>
          </Group>
        </Group>
      ) : null}
      {shopNode ? (
        <Group opacity={shopLayerOpacity}>
          <Group clip={shopMainClip}>
            <Group transform={shopScrollTransform}>
              {shopSplitLayers}
              {shopChevron ? (
                <Group transform={shopChevronTransform}>{shopChevron}</Group>
              ) : null}
            </Group>
          </Group>
        </Group>
      ) : null}
      {underlayContent ? (
        <Group clip={underlayClip}>{underlayContent}</Group>
      ) : null}
      {!fullCardUnderlay ? (
        // flat stand-in behind the moving capsule, under the band content,
        // so the rim never samples transparency; rides offscreen with the
        // hidden bar instead of unmounting — a fresh node can draw one
        // frame before its animated transform binds
        <Group transform={hideTransform}>
          <RoundedRect
            x={(SCREEN_WIDTH - barWidth) / 2 - 3}
            y={barTop - 3}
            width={barWidth + 6}
            height={barHeight + 6}
            r={(barHeight + 6) / 2}
            color={SHEET_BACKGROUND}
          />
        </Group>
      ) : null}
      <Group clip={bandClip}>
        {bandSource}
        {rowsMounted || showShop || underlayContent ? (
          // frost is skipped over the flat band, blurred flat is flat
          <Group opacity={frostOpacity}>
            <ProgressiveEdgeBlur
              width={SCREEN_WIDTH}
              top={bandTop}
              bottom={bandBottom}
              blurHeight={bandHeight * 0.65}
              maxBlur={BAND_BLUR_SIGMA}>
              {bandSource}
            </ProgressiveEdgeBlur>
          </Group>
        ) : null}
        <Group transform={hideTransform}>
          {barShadow ? (
            <Image
              image={barShadow.image}
              x={(SCREEN_WIDTH - barWidth) / 2 - barShadow.pad}
              y={barTop + 2 - barShadow.pad}
              width={barWidth + barShadow.pad * 2}
              height={barHeight + barShadow.pad * 2}
              fit="fill"
            />
          ) : null}
        </Group>
      </Group>
      {/* Unclipped on purpose: the backdrop layer takes the current clip, and
          Skia measures a filter's coordinates from the layer's origin, so a
          clip here would shift the capsule. Outside the capsule the shader
          returns the sampled pixel untouched, so covering the whole canvas
          changes nothing visually. */}
      <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
      {barChrome ? <Group transform={barTransform}>{barChrome}</Group> : null}
    </Canvas>
  );
};

const getStyles = (screenWidth: number, top: number, height: number) =>
  StyleSheet.create({
    canvas: {
      position: 'absolute',
      top,
      left: 0,
      width: screenWidth,
      height,
      zIndex: 3,
    },
  });

// A parent render makes Skia rebuild this whole tree, so unrelated screen
// state must not reach the canvas when its own inputs are unchanged.
export default React.memo(GlassTxCanvas);
