import React, {useContext, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {
  BackdropFilter,
  Canvas,
  Group,
  Image,
  ImageFilter,
  LinearGradient,
  RadialGradient,
  Rect,
  RoundedRect,
  Skia,
  TileMode,
  vec,
} from '@shopify/react-native-skia';
import {
  Extrapolation,
  interpolate,
  SharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../context/screenSize';
import {
  CARD_FOLD_RADIUS_RATIO,
  getFoldedTopHalfHeight,
  getNewMainSheetPoints,
  getNewMainTopHalfHeight,
} from '../animations/useNewMainAnims';
import {getCapsuleShadowImage} from './capsuleShadowImage';
import type {CapsuleShadow} from './capsuleShadowImage';
import {glassTabShader, makeGlassTabFilter} from './glassTabShader';
import {
  getGlassTabLayouts,
  glassTabRectAt,
  glassTabSplitProgressAt,
  GLASS_TAB_BUTTON_HEIGHT_RATIO,
  GLASS_TAB_CORNER_RADIUS,
  GLASS_TAB_IDS,
} from './glassTabLayout';
import {
  useGlassChartGraphics,
  useGlassChartCursorGraphics,
  getGlassChartGap,
  GLASS_CHART_HEIGHT_RATIO,
} from './GlassChart';
import {
  useGlassBalanceGraphics,
  useGlassDatePickerGraphics,
  GlassBalanceModel,
} from './GlassBalanceGraphics';

// Draw the top-half backdrop and tab glass in the same canvas so the
// BackdropFilter refracts live content during the fold/unfold morph.

// Also consumed by FoldedSkinView, which derives an RN-view version of
// this gradient for the lock screen and unlock overlay.
export const GRADIENT_COLORS = [
  '#000001',
  '#08208A',
  '#1249EA',
  '#60A2F9',
  '#8FBCFB',
];
export const GRADIENT_POSITIONS = [0, 0.285, 0.503, 0.756, 1];
export const GRADIENT_RY_RATIO = 1.0365;
const GRADIENT_RX_RATIO = 3.6453;

const GLASS_DARKEN = 1.0;

// Shared by the tx-detail glass sheet so every glass edge matches.
export const BORDER_GRADIENT_COLORS = [
  'rgba(238, 235, 235, 0.67)',
  'rgba(227, 223, 223, 0.06)',
  'rgba(216, 210, 210, 0.25)',
];
export const BORDER_GRADIENT_POSITIONS = [0, 0.49, 1];

const GRADIENT_LOCAL_ORIGIN = vec(0, 0);

interface Props {
  mainSheetsTranslationY: SharedValue<number>;
  activeTab: number;
  online: boolean;
  // Separate from `online`: no peers keeps the blue background but hides
  // the graph.
  showChart: boolean;
  chartTop: number;
  balance: GlassBalanceModel;
}

// All four lens rects share one mapper. Their child draw nodes then read the
// same result instead of independently deriving x, y and width.
type GlassTabRect = ReturnType<typeof glassTabRectAt>;

interface ButtonDrawProps {
  index: number;
  rects: SharedValue<GlassTabRect[]>;
  buttonHeight: number;
  cornerRadius: number;
  splitOpacity?: SharedValue<number>;
}

// Shadow under the refracted glass.
const GlassButtonShadow: React.FC<
  ButtonDrawProps & {shadow: CapsuleShadow; refWidth: number}
> = props => {
  const {index, rects, buttonHeight, splitOpacity, shadow, refWidth} = props;
  const {pad} = shadow;
  const padScale = pad / refWidth;
  // pre-blurred capsule stretched to the animated rect; the horizontal
  // stretch of a 7%-opacity soft shadow is imperceptible and the vertical
  // blur stays exact (height is static)
  const transform = useDerivedValue(() => {
    const rect = rects.value[index];
    return [
      {translateX: rect.x - rect.width * padScale},
      {translateY: rect.y + 2 - pad},
      {scaleX: rect.width / refWidth},
    ];
  });
  return (
    <Group transform={transform} opacity={splitOpacity}>
      <Image
        image={shadow.image}
        x={0}
        y={0}
        width={refWidth + pad * 2}
        height={buttonHeight + pad * 2}
        fit="fill"
      />
    </Group>
  );
};

// Hairline border over the glass, plus a subtle fill marking the active
// tab.
const GlassButtonAccent: React.FC<
  ButtonDrawProps & {active: boolean}
> = props => {
  const {index, rects, buttonHeight, cornerRadius, active, splitOpacity} =
    props;
  const transform = useDerivedValue(() => {
    const rect = rects.value[index];
    return [{translateX: rect.x}, {translateY: rect.y}];
  });
  const width = useDerivedValue(() => rects.value[index].width);
  const strokeWidth = useDerivedValue(() => Math.max(width.value - 0.5, 0));
  const fillRadius = useDerivedValue(() =>
    Math.min(cornerRadius, width.value / 2, buttonHeight / 2),
  );
  const strokeRadius = useDerivedValue(() =>
    Math.min(cornerRadius - 0.25, strokeWidth.value / 2),
  );
  const gradientEnd = useMemo(() => vec(0, buttonHeight), [buttonHeight]);
  return (
    <Group transform={transform} opacity={splitOpacity}>
      {active ? (
        <RoundedRect
          x={0}
          y={0}
          width={width}
          height={buttonHeight}
          r={fillRadius}
          color="rgba(255, 255, 255, 0.12)"
        />
      ) : null}
      <RoundedRect
        x={0.25}
        y={0.25}
        width={strokeWidth}
        height={buttonHeight - 0.5}
        r={strokeRadius}
        style="stroke"
        strokeWidth={0.5}>
        <LinearGradient
          start={GRADIENT_LOCAL_ORIGIN}
          end={gradientEnd}
          colors={BORDER_GRADIENT_COLORS}
          positions={BORDER_GRADIENT_POSITIONS}
        />
      </RoundedRect>
    </Group>
  );
};

const LiquidGlassBackdrop: React.FC<Props> = props => {
  const {
    mainSheetsTranslationY,
    activeTab,
    online,
    showChart,
    chartTop,
    balance,
  } = props;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  // The parent is fixed at the folded card height and clips, so a full-screen
  // canvas drew 40% of every full-canvas pass (gradient, backdrop layer, erase)
  // straight into the clip. Match the parent instead.
  const CANVAS_HEIGHT = getFoldedTopHalfHeight(SCREEN_HEIGHT, insets.top);
  const styles = getStyles(CANVAS_HEIGHT);

  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    SCREEN_HEIGHT,
    insets.top,
  );

  // The erase only ever has work to do below the card's highest edge, which is
  // where it sits unfolded. Rasterising from y=0 costs the whole canvas to
  // clear a strip.
  const ERASE_TOP = Math.max(
    0,
    getNewMainTopHalfHeight(
      UNFOLD_SHEET_POINT,
      SCREEN_HEIGHT,
      UNFOLD_SHEET_POINT,
      FOLD_SHEET_POINT,
    ) - SCREEN_HEIGHT * CARD_FOLD_RADIUS_RATIO,
  );
  const layouts = getGlassTabLayouts(SCREEN_WIDTH, SCREEN_HEIGHT);
  const buttonHeight = SCREEN_HEIGHT * GLASS_TAB_BUTTON_HEIGHT_RATIO;
  // The SDF radius can't exceed the box half-extents.
  const cornerRadius = Math.min(GLASS_TAB_CORNER_RADIUS, buttonHeight / 2);

  const rects = useDerivedValue(() =>
    layouts.map(layout =>
      glassTabRectAt(
        layout,
        mainSheetsTranslationY.value,
        UNFOLD_SHEET_POINT,
        FOLD_SHEET_POINT,
      ),
    ),
  );
  // Sell is the only control that splits into view.
  const splitOpacity = useDerivedValue(() =>
    interpolate(
      glassTabSplitProgressAt(
        mainSheetsTranslationY.value,
        UNFOLD_SHEET_POINT,
        FOLD_SHEET_POINT,
      ),
      [0.25, 0.85],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  );

  const shadowRefWidth = buttonHeight * 3;
  const capsuleShadow = getCapsuleShadowImage(
    shadowRefWidth,
    buttonHeight,
    Math.min(cornerRadius, buttonHeight / 2),
    4,
    'rgba(0, 0, 0, 0.07)',
  );

  // Match the RN chart overlay fade.
  const chartOpacity = useDerivedValue(() =>
    interpolate(
      mainSheetsTranslationY.value,
      [UNFOLD_SHEET_POINT, FOLD_SHEET_POINT],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  );
  const chartGraphics = useGlassChartGraphics({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * GLASS_CHART_HEIGHT_RATIO,
    chartTop,
    opacity: chartOpacity,
  });

  // Scrub crosshair. Lives here so it does not need a canvas of its own.
  const chartCursorGraphics = useGlassChartCursorGraphics({chartTop});

  const balanceGraphics = useGlassBalanceGraphics({
    model: balance,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    topInset: insets.top,
  });
  const datePickerGraphics = useGlassDatePickerGraphics({
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    top:
      chartTop +
      SCREEN_HEIGHT * GLASS_CHART_HEIGHT_RATIO +
      getGlassChartGap(SCREEN_HEIGHT),
    opacity: chartOpacity,
  });

  // Keep the gradient anchored to the animated bottom edge as height changes.
  const gradientRadiusY = useDerivedValue(
    () =>
      getNewMainTopHalfHeight(
        mainSheetsTranslationY.value,
        SCREEN_HEIGHT,
        UNFOLD_SHEET_POINT,
        FOLD_SHEET_POINT,
      ) * GRADIENT_RY_RATIO,
  );
  const gradientCenter = useDerivedValue(() =>
    vec(
      SCREEN_WIDTH / 2,
      getNewMainTopHalfHeight(
        mainSheetsTranslationY.value,
        SCREEN_HEIGHT,
        UNFOLD_SHEET_POINT,
        FOLD_SHEET_POINT,
      ),
    ),
  );
  const gradientTransform = useDerivedValue(() => {
    const radiusX = SCREEN_WIDTH * GRADIENT_RX_RATIO;
    return [
      {translateX: SCREEN_WIDTH / 2},
      {scaleX: radiusX / gradientRadiusY.value},
      {translateX: -SCREEN_WIDTH / 2},
    ];
  });

  // The card's rounded bottom edge. The container no longer animates its
  // height (that was a per-frame Yoga layout + shadow-tree commit); the fold
  // morph is erased in-canvas instead. The rect extends above the canvas so
  // only the bottom corners round.
  const foldClip = useDerivedValue(() => {
    const edge = getNewMainTopHalfHeight(
      mainSheetsTranslationY.value,
      SCREEN_HEIGHT,
      UNFOLD_SHEET_POINT,
      FOLD_SHEET_POINT,
    );
    const r = interpolate(
      mainSheetsTranslationY.value,
      [UNFOLD_SHEET_POINT, FOLD_SHEET_POINT],
      [0, SCREEN_HEIGHT * CARD_FOLD_RADIUS_RATIO],
      Extrapolation.CLAMP,
    );
    return Skia.RRectXY(Skia.XYWHRect(0, -r, SCREEN_WIDTH, edge + r), r, r);
  });

  // Builder and blur child are hoisted; per frame only the box uniforms
  // change with the fold/unfold morph.
  const shaderBuilder = useMemo(
    () => Skia.RuntimeShaderBuilder(glassTabShader),
    [],
  );
  const blurChild = useMemo(
    () => Skia.ImageFilter.MakeBlur(4, 4, TileMode.Clamp),
    [],
  );
  const glassFilter = useDerivedValue(() => {
    const splitProgress = glassTabSplitProgressAt(
      mainSheetsTranslationY.value,
      UNFOLD_SHEET_POINT,
      FOLD_SHEET_POINT,
    );
    const boxes = rects.value.map(rect => [
      rect.x,
      rect.y,
      rect.width,
      buttonHeight,
    ]);
    return makeGlassTabFilter(
      shaderBuilder,
      blurChild,
      boxes,
      cornerRadius,
      GLASS_DARKEN,
      splitProgress,
    );
  });

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {online ? (
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={CANVAS_HEIGHT}>
          <RadialGradient
            c={gradientCenter}
            r={gradientRadiusY}
            colors={GRADIENT_COLORS}
            positions={GRADIENT_POSITIONS}
            transform={gradientTransform}
          />
        </Rect>
      ) : (
        <Rect
          x={0}
          y={0}
          width={SCREEN_WIDTH}
          height={CANVAS_HEIGHT}
          color="#F36F56"
        />
      )}
      {online && showChart ? chartGraphics : null}
      {online && showChart ? datePickerGraphics : null}
      {online && showChart ? chartCursorGraphics : null}
      {balanceGraphics}
      {capsuleShadow
        ? layouts.map((_, i) => (
            <GlassButtonShadow
              key={`shadow-${i}`}
              index={i}
              rects={rects}
              buttonHeight={buttonHeight}
              cornerRadius={cornerRadius}
              splitOpacity={i === 1 ? splitOpacity : undefined}
              shadow={capsuleShadow}
              refWidth={shadowRefWidth}
            />
          ))
        : null}
      <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
      {layouts.map((_, i) => (
        <GlassButtonAccent
          key={`accent-${i}`}
          index={i}
          rects={rects}
          buttonHeight={buttonHeight}
          cornerRadius={cornerRadius}
          active={activeTab === GLASS_TAB_IDS[i]}
          splitOpacity={i === 1 ? splitOpacity : undefined}
        />
      ))}
      {/* erase everything outside the card's rounded edge LAST, so the
          glass above still sampled gradient below the edge — the same
          pixels the old animated view clip produced */}
      <Group clip={foldClip} invertClip>
        <Rect
          x={0}
          y={ERASE_TOP}
          width={SCREEN_WIDTH}
          height={CANVAS_HEIGHT - ERASE_TOP}
          blendMode="clear"
        />
      </Group>
    </Canvas>
  );
};

const getStyles = (canvasHeight: number) =>
  StyleSheet.create({
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      // Fixed height so the canvas never re-layouts during drags.
      height: canvasHeight,
    },
  });

export default React.memo(LiquidGlassBackdrop);
