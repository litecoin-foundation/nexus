import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  BackdropFilter,
  BlurMask,
  Canvas,
  Group,
  Image,
  ImageFilter,
  makeImageFromView,
  Rect,
  RoundedRect,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';
import type {SkImage} from '@shopify/react-native-skia';
import {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ProgressiveEdgeBlur from './ProgressiveEdgeBlur';
import {glassTabShader, makeGlassTabFilter} from './glassTabShader';
import {
  GlassTxRowModels,
  GLASS_TX_LIST_TOP_RATIO,
  SHEET_BACKGROUND,
  useGlassTxRowElements,
} from './GlassTxRows';
import {
  BAND_BLUR_SIGMA,
  BAR_HEIGHT_RATIO,
  BAR_WIDTH_RATIO,
  getBottomOffset,
  getTabBarBandHeight,
  SCROLLING_SCALE,
} from './glassTabBarLayout';
import {getNewMainSheetPoints} from '../animations/useNewMainAnims';
import {ScreenSizeContext} from '../context/screenSize';

// A Skia BackdropFilter can only sample pixels drawn in its own canvas, so
// everything the tab bar's glass refracts has to live here: this one
// screen-fixed canvas draws the transaction rows, frosts the bottom band, and
// applies the glass. Drawing the rows in a second canvas inside the sheet
// would double every row's paragraph shaping and rasterisation, so the sheet
// has no canvas of its own — the rows are positioned from the sheet's
// translation instead, on the UI thread, and clipped to the list viewport.

const GLASS_DARKEN = 0.63;
const GLASS_BLUR_SIGMA = 1;

// The spring that snaps the sheet open has no clamp, so a hard flick can carry
// it above UNFOLD_SHEET_POINT for a frame or two. The canvas starts that much
// higher than the resting list top; nothing can be drawn above its own edge,
// and without the margin the first row would be sliced during the overshoot.
export const SHEET_OVERSHOOT_RATIO = 0.1;

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
  // False while a card is open — the band shows a snapshot of it instead.
  showTxList: boolean;
  activeSheet: number;
  sheetCaptureRef: React.RefObject<View | null>;
  // Tab bar shrink (content activity) and press feedback.
  contentActivity: SharedValue<number>;
  pressScale: SharedValue<number>;
}

const GlassTxCanvas: React.FC<Props> = props => {
  const {
    rowModels,
    mainSheetsTranslationY,
    txListScrollY,
    listHeaderOffset,
    showTxList,
    activeSheet,
    sheetCaptureRef,
    contentActivity,
    pressScale,
  } = props;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const {UNFOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
  // The canvas is pinned just above where the list viewport starts when the
  // sheet is fully unfolded, and runs to the screen bottom, so it spans both
  // the list and the tab bar band.
  const listTopInSheet = SCREEN_HEIGHT * GLASS_TX_LIST_TOP_RATIO;
  const canvasTop =
    UNFOLD_SHEET_POINT + listTopInSheet - SCREEN_HEIGHT * SHEET_OVERSHOOT_RATIO;
  const canvasHeight = SCREEN_HEIGHT - canvasTop;

  const bandHeight = getTabBarBandHeight(SCREEN_HEIGHT, insets.bottom);
  const bandTop = canvasHeight - bandHeight;
  const bottomOffset = getBottomOffset(SCREEN_HEIGHT, insets.bottom);
  const barWidth = SCREEN_WIDTH * BAR_WIDTH_RATIO;
  const barHeight = SCREEN_HEIGHT * BAR_HEIGHT_RATIO;

  const rowElements = useGlassTxRowElements({
    rowModels,
    scrollY: txListScrollY,
    listHeaderOffset,
    viewportHeight: canvasHeight,
    enabled: showTxList,
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
        ) - txListScrollY.value,
    },
  ]);

  // Rows scrolled above that origin would paint over the pinned sync header
  // and the title row, and the band below draws its own copy, so the plain
  // pass covers neither.
  const listClip = useDerivedValue(() => {
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
    () => Skia.XYWHRect(0, bandTop, SCREEN_WIDTH, bandHeight),
    [bandTop, SCREEN_WIDTH, bandHeight],
  );

  // Native card views cannot be sampled by Skia, so they are captured and
  // redrawn into the band while a card is open.
  const [sheetSnapshot, setSheetSnapshot] = useState<SkImage | null>(null);
  const [sheetCaptureRevision, setSheetCaptureRevision] = useState(0);
  const captureGeneration = useRef(0);
  const refreshSheetSnapshot = useCallback(() => {
    setSheetCaptureRevision(revision => revision + 1);
  }, []);
  useAnimatedReaction(
    () => contentActivity.value,
    (current, previous) => {
      if (previous !== null && previous > 0.05 && current <= 0.05) {
        runOnJS(refreshSheetSnapshot)();
      }
    },
    [contentActivity],
  );
  useEffect(() => {
    // Only a card is ever snapshotted. On the way back to the wallet the rows
    // are still gated off while the card fades, and re-capturing there would
    // freeze a half-transparent copy of it into the band.
    if (showTxList || activeSheet === 0) {
      return;
    }

    const generation = ++captureGeneration.current;
    let cancelled = false;
    let latestRequest = 0;

    const captureSheet = async () => {
      const request = ++latestRequest;
      try {
        const image = await makeImageFromView(sheetCaptureRef);
        if (!image) {
          return;
        }
        if (
          cancelled ||
          generation !== captureGeneration.current ||
          request !== latestRequest
        ) {
          image.dispose();
          return;
        }
        setSheetSnapshot(image);
      } catch {
        // The view may be between native mounts during a card transition. The
        // settled capture below retries after the new card has mounted.
      }
    };

    const immediateCapture = setTimeout(captureSheet, 0);
    const settledCapture = setTimeout(captureSheet, 500);
    return () => {
      cancelled = true;
      clearTimeout(immediateCapture);
      clearTimeout(settledCapture);
    };
  }, [activeSheet, sheetCaptureRef, sheetCaptureRevision, showTxList]);

  useEffect(
    () => () => {
      sheetSnapshot?.dispose();
    },
    [sheetSnapshot],
  );

  const sheetSnapshotY = useDerivedValue(
    () => mainSheetsTranslationY.value - canvasTop,
  );

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
      canvasHeight - bottomOffset - barHeight + (barHeight - height) / 2;
    const capsule = [x, y, width, height];
    return makeGlassTabFilter(
      shaderBuilder,
      glassBlurChild,
      [capsule, capsule, capsule],
      height / 2,
      GLASS_DARKEN,
    );
  });

  // The band must be opaque everywhere: the glass shader reads displaced
  // samples, and transparent pixels come back as black.
  const bandSource = (
    <>
      <Rect
        x={0}
        y={bandTop}
        width={SCREEN_WIDTH}
        height={bandHeight}
        color={SHEET_BACKGROUND}
      />
      {showTxList ? (
        rowElements ? (
          <Group transform={contentTransform}>{rowElements}</Group>
        ) : null
      ) : sheetSnapshot ? (
        <Image
          image={sheetSnapshot}
          x={0}
          y={sheetSnapshotY}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fit="fill"
        />
      ) : null}
    </>
  );

  const styles = getStyles(SCREEN_WIDTH, canvasTop, canvasHeight);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {rowElements ? (
        <Group clip={listClip}>
          <Group transform={contentTransform}>{rowElements}</Group>
        </Group>
      ) : null}
      <Group clip={bandClip}>
        {bandSource}
        <ProgressiveEdgeBlur
          width={SCREEN_WIDTH}
          top={bandTop}
          bottom={canvasHeight}
          blurHeight={bandHeight * 0.65}
          maxBlur={BAND_BLUR_SIGMA}>
          {bandSource}
        </ProgressiveEdgeBlur>
        <RoundedRect
          x={(SCREEN_WIDTH - barWidth) / 2}
          y={canvasHeight - bottomOffset - barHeight + 2}
          width={barWidth}
          height={barHeight}
          r={barHeight / 2}
          color="rgba(0, 0, 0, 0.1)">
          <BlurMask blur={6} style="normal" />
        </RoundedRect>
      </Group>
      {/* Unclipped on purpose: the backdrop layer takes the current clip, and
          Skia measures a filter's coordinates from the layer's origin, so a
          clip here would shift the capsule. Outside the capsule the shader
          returns the sampled pixel untouched, so covering the whole canvas
          changes nothing visually. */}
      <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
    </Canvas>
  );
};

const getStyles = (
  screenWidth: number,
  canvasTop: number,
  canvasHeight: number,
) =>
  StyleSheet.create({
    canvas: {
      position: 'absolute',
      top: canvasTop,
      left: 0,
      width: screenWidth,
      height: canvasHeight,
      zIndex: 3,
    },
  });

export default GlassTxCanvas;
