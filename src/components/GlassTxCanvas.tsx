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
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ProgressiveEdgeBlur from './ProgressiveEdgeBlur';
import {CARD_SWAP_SETTLE_MS} from './GlassBottomSheet';
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
  getTabBarHideDistance,
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

// drawn past the screen bottom so layout rounding can't leave a hairline gap
const BOTTOM_OVERSCAN = 4;

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
  // 0 resting, 1 hidden; drives the capsule, shadow and frost
  hideProgress: SharedValue<number>;
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
    hideProgress,
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
  const bandBottom = canvasHeight + BOTTOM_OVERSCAN;
  const bottomOffset = getBottomOffset(SCREEN_HEIGHT, insets.bottom);
  const barWidth = SCREEN_WIDTH * BAR_WIDTH_RATIO;
  const barHeight = SCREEN_HEIGHT * BAR_HEIGHT_RATIO;
  const barTop = canvasHeight - bottomOffset - barHeight;

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

  // band mirror dissolves in step with the card fade-out
  const mirrorOpacity = useSharedValue(1);
  useEffect(() => {
    if (activeSheet === 0) {
      mirrorOpacity.value = withTiming(0, {duration: 150});
    } else {
      mirrorOpacity.value = 1;
    }
  }, [activeSheet, mirrorOpacity]);

  const rowElements = useGlassTxRowElements({
    rowModels,
    scrollY: txListScrollY,
    listHeaderOffset,
    viewportHeight: canvasHeight,
    enabled: rowsMounted,
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
        rowsDrift.value,
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
    () => Skia.XYWHRect(0, bandTop, SCREEN_WIDTH, bandBottom - bandTop),
    [bandTop, SCREEN_WIDTH, bandBottom],
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
  // whether the band was drawing live rows just before this run
  const hadLiveRows = useRef(showTxList);
  useEffect(() => {
    const wasShowingRows = hadLiveRows.current;
    hadLiveRows.current = showTxList;
    // no capture on the way home, the card is mid-fade and would freeze
    // half-transparent into the band
    if (showTxList || activeSheet === 0) {
      return;
    }
    // drop the previous card's snapshot when opening from the wallet
    if (wasShowingRows) {
      setSheetSnapshot(null);
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

    // no card to capture yet when opening from the wallet, and a capture
    // would stall the open animation
    const immediateCapture = wasShowingRows ? null : setTimeout(captureSheet, 0);
    const settledCapture = setTimeout(captureSheet, CARD_SWAP_SETTLE_MS);
    return () => {
      cancelled = true;
      if (immediateCapture) {
        clearTimeout(immediateCapture);
      }
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

  // the glass needs opaque pixels beneath it: rows on the wallet, the open
  // card's snapshot mirror, or the flat stand-in before the first capture
  const hasBandBacking = rowsMounted || sheetSnapshot !== null;
  const bandSource = hasBandBacking ? (
    <>
      <Rect
        x={0}
        y={bandTop}
        width={SCREEN_WIDTH}
        height={bandBottom - bandTop}
        color={SHEET_BACKGROUND}
      />
      {rowsMounted ? (
        rowElements ? (
          <Group opacity={rowsOpacity}>
            <Group transform={contentTransform}>{rowElements}</Group>
          </Group>
        ) : null
      ) : (
        <Group opacity={mirrorOpacity}>
          <Image
            image={sheetSnapshot}
            x={0}
            y={sheetSnapshotY}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            fit="fill"
          />
        </Group>
      )}
    </>
  ) : null;

  const styles = getStyles(SCREEN_WIDTH, canvasTop, bandBottom);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {rowElements ? (
        <Group clip={listClip}>
          <Group opacity={rowsOpacity}>
            <Group transform={contentTransform}>{rowElements}</Group>
          </Group>
        </Group>
      ) : null}
      <Group clip={bandClip}>
        {bandSource}
        {bandSource ? (
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
          <RoundedRect
            x={(SCREEN_WIDTH - barWidth) / 2}
            y={barTop + 2}
            width={barWidth}
            height={barHeight}
            r={barHeight / 2}
            color="rgba(0, 0, 0, 0.1)">
            <BlurMask blur={6} style="normal" />
          </RoundedRect>
        </Group>
      </Group>
      {!hasBandBacking ? (
        // flat stand-in behind the moving capsule, inflated so the rim
        // never samples transparency
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
      {/* Unclipped on purpose: the backdrop layer takes the current clip, and
          Skia measures a filter's coordinates from the layer's origin, so a
          clip here would shift the capsule. Outside the capsule the shader
          returns the sampled pixel untouched, so covering the whole canvas
          changes nothing visually. */}
      <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
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

export default GlassTxCanvas;
