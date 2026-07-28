import React, {useContext, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {
  BackdropFilter,
  BlurMask,
  Canvas,
  Group,
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
  getNewMainSheetPoints,
  getNewMainTopHalfHeight,
} from '../animations/useNewMainAnims';
import {glassTabShader, makeGlassTabFilter} from './glassTabShader';
import {
  getGlassTabLayouts,
  glassTabRectAt,
  glassTabSplitProgressAt,
  GlassTabLayout,
  GLASS_TAB_BUTTON_HEIGHT_RATIO,
  GLASS_TAB_CORNER_RADIUS,
  GLASS_TAB_IDS,
} from './glassTabLayout';
import {
  useGlassChartGraphics,
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

// Also consumed by FoldedSkinView, which derives an RN-view fallback of
// this gradient for the lock screen and the unlock reveal overlay (plain
// views paint on the mount commit, Skia canvases a few frames later).
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

// Same interpolation as GlassTabButton's overlay, so glass and touch
// target stay aligned.
const useGlassTabRect = (
  layout: GlassTabLayout,
  mainSheetsTranslationY: SharedValue<number>,
  unfoldPoint: number,
  foldPoint: number,
) => {
  const rect = useDerivedValue(() =>
    glassTabRectAt(
      layout,
      mainSheetsTranslationY.value,
      unfoldPoint,
      foldPoint,
    ),
  );
  const x = useDerivedValue(() => rect.value.x);
  const y = useDerivedValue(() => rect.value.y);
  const width = useDerivedValue(() => rect.value.width);
  return {x, y, width};
};

interface ButtonDrawProps {
  layout: GlassTabLayout;
  mainSheetsTranslationY: SharedValue<number>;
  unfoldPoint: number;
  foldPoint: number;
  buttonHeight: number;
  cornerRadius: number;
  splitSecondary?: boolean;
}

const useSplitOpacity = (
  splitSecondary: boolean | undefined,
  mainSheetsTranslationY: SharedValue<number>,
  unfoldPoint: number,
  foldPoint: number,
) =>
  useDerivedValue(() => {
    if (!splitSecondary) {
      return 1;
    }
    const splitProgress = glassTabSplitProgressAt(
      mainSheetsTranslationY.value,
      unfoldPoint,
      foldPoint,
    );
    return interpolate(
      splitProgress,
      [0.25, 0.85],
      [0, 1],
      Extrapolation.CLAMP,
    );
  });

// Shadow under the refracted glass.
const GlassButtonShadow: React.FC<ButtonDrawProps> = props => {
  const {
    layout,
    mainSheetsTranslationY,
    unfoldPoint,
    foldPoint,
    buttonHeight,
    cornerRadius,
    splitSecondary,
  } = props;
  const {x, y, width} = useGlassTabRect(
    layout,
    mainSheetsTranslationY,
    unfoldPoint,
    foldPoint,
  );
  const shadowY = useDerivedValue(() => y.value + 2);
  const radius = useDerivedValue(() =>
    Math.min(cornerRadius, width.value / 2, buttonHeight / 2),
  );
  const opacity = useSplitOpacity(
    splitSecondary,
    mainSheetsTranslationY,
    unfoldPoint,
    foldPoint,
  );
  return (
    <RoundedRect
      x={x}
      y={shadowY}
      width={width}
      height={buttonHeight}
      r={radius}
      opacity={opacity}
      color="rgba(0, 0, 0, 0.07)">
      <BlurMask blur={4} style="normal" />
    </RoundedRect>
  );
};

// Hairline border over the glass, plus a subtle fill marking the active
// tab.
const GlassButtonAccent: React.FC<
  ButtonDrawProps & {active: boolean}
> = props => {
  const {
    layout,
    mainSheetsTranslationY,
    unfoldPoint,
    foldPoint,
    buttonHeight,
    cornerRadius,
    active,
    splitSecondary,
  } = props;
  const {x, y, width} = useGlassTabRect(
    layout,
    mainSheetsTranslationY,
    unfoldPoint,
    foldPoint,
  );
  const strokeX = useDerivedValue(() => x.value + 0.25);
  const strokeY = useDerivedValue(() => y.value + 0.25);
  const strokeWidth = useDerivedValue(() => Math.max(width.value - 0.5, 0));
  const fillRadius = useDerivedValue(() =>
    Math.min(cornerRadius, width.value / 2, buttonHeight / 2),
  );
  const strokeRadius = useDerivedValue(() =>
    Math.min(cornerRadius - 0.25, strokeWidth.value / 2),
  );
  const gradientStart = useDerivedValue(() => vec(0, y.value));
  const gradientEnd = useDerivedValue(() => vec(0, y.value + buttonHeight));
  const opacity = useSplitOpacity(
    splitSecondary,
    mainSheetsTranslationY,
    unfoldPoint,
    foldPoint,
  );
  return (
    <Group opacity={opacity}>
      {active ? (
        <RoundedRect
          x={x}
          y={y}
          width={width}
          height={buttonHeight}
          r={fillRadius}
          color="rgba(255, 255, 255, 0.12)"
        />
      ) : null}
      <RoundedRect
        x={strokeX}
        y={strokeY}
        width={strokeWidth}
        height={buttonHeight - 0.5}
        r={strokeRadius}
        style="stroke"
        strokeWidth={0.5}>
        <LinearGradient
          start={gradientStart}
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
  const styles = getStyles(SCREEN_HEIGHT);

  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    SCREEN_HEIGHT,
    insets.top,
  );
  const layouts = getGlassTabLayouts(SCREEN_WIDTH, SCREEN_HEIGHT);
  const buttonHeight = SCREEN_HEIGHT * GLASS_TAB_BUTTON_HEIGHT_RATIO;
  // The SDF radius can't exceed the box half-extents.
  const cornerRadius = Math.min(GLASS_TAB_CORNER_RADIUS, buttonHeight / 2);

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
    const boxes = layouts.map(layout => {
      const rect = glassTabRectAt(
        layout,
        mainSheetsTranslationY.value,
        UNFOLD_SHEET_POINT,
        FOLD_SHEET_POINT,
      );
      return [rect.x, rect.y, rect.width, buttonHeight];
    });
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
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
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
          height={SCREEN_HEIGHT}
          color="#F36F56"
        />
      )}
      {online && showChart ? chartGraphics : null}
      {online && showChart ? datePickerGraphics : null}
      {balanceGraphics}
      {layouts.map((layout, i) => (
        <GlassButtonShadow
          key={`shadow-${i}`}
          layout={layout}
          mainSheetsTranslationY={mainSheetsTranslationY}
          unfoldPoint={UNFOLD_SHEET_POINT}
          foldPoint={FOLD_SHEET_POINT}
          buttonHeight={buttonHeight}
          cornerRadius={cornerRadius}
          splitSecondary={i === 1}
        />
      ))}
      <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
      {layouts.map((layout, i) => (
        <GlassButtonAccent
          key={`accent-${i}`}
          layout={layout}
          mainSheetsTranslationY={mainSheetsTranslationY}
          unfoldPoint={UNFOLD_SHEET_POINT}
          foldPoint={FOLD_SHEET_POINT}
          buttonHeight={buttonHeight}
          cornerRadius={cornerRadius}
          active={activeTab === GLASS_TAB_IDS[i]}
          splitSecondary={i === 1}
        />
      ))}
    </Canvas>
  );
};

const getStyles = (screenHeight: number) =>
  StyleSheet.create({
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      // Full screen height so the canvas never re-layouts during drags.
      height: screenHeight,
    },
  });

export default LiquidGlassBackdrop;
