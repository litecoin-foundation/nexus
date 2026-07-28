import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  InteractionManager,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {BlurView} from 'expo-blur';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  BackdropFilter,
  Canvas,
  Group,
  Image as SkiaImage,
  ImageFilter,
  LinearGradient as SkiaLinearGradient,
  Rect,
  RoundedRect,
  Skia,
  TileMode,
  makeImageFromView,
  vec,
} from '@shopify/react-native-skia';
import type {SkImage} from '@shopify/react-native-skia';

import {glassModalShader, makeGlassModalFilter} from './glassModalShader';
import {SWIPE_CARDS_ANIM_DURATION} from './PlasmaModal';
import GlassTxDetailContent from './GlassTxDetailContent';
import {
  GLASS_TX_LIST_TOP_RATIO,
  SHEET_BACKGROUND,
  useGlassTxRowElements,
} from '../GlassTxRows';
import type {GlassTxRowModels} from '../GlassTxRows';
import {rowsTopInCanvas, SHEET_OVERSHOOT_RATIO} from '../GlassTxCanvas';
import {
  BORDER_GRADIENT_COLORS,
  BORDER_GRADIENT_POSITIONS,
} from '../LiquidGlassBackdrop';
import {getTabBarBandHeight} from '../glassTabBarLayout';
import {getNewMainSheetPoints} from '../../animations/useNewMainAnims';
import {IDisplayedTx} from '../../reducers/transaction';
import {ScreenSizeContext} from '../../context/screenSize';

// The tx detail sheet is real liquid glass: a full-screen canvas re-renders
// the content behind the card (a one-shot page snapshot as base, with the
// transaction rows drawn live over it), and a BackdropFilter refracts it with
// the sheet's box uniform driven per-frame by the open/drag animations. The
// live page keeps showing, dimmed, outside the card — the canvas is
// transparent there except for the dim layer.
const GLASS_DARKEN = 1.0;
const GLASS_BLUR_SIGMA = 14.9;
const DIM_COLOR = 'rgba(0, 0, 0, 0.25)';
// Backing ring around the card: refraction pulls samples inward, so outside
// reads are only the rim anti-aliasing and the blur footprint.
const RING_OUTSET = 24;
// Bottom-aligned cumulative blur layers for the progressive fade. Layer k
// switches on at depth sqrt(k/N) of the strip, so the cumulative blur ramps
// in quadratically — zero slope at the start (the strip's top has genuinely
// no blur, and no layer boundary is a visible line) and densest at the
// bottom edge. The whole stack is static, so the styles are built once.
const FADE_LAYER_COUNT = 9;
const FADE_LAYER_INTENSITY = 3;
const FADE_LAYER_STYLES = Array.from(
  {length: FADE_LAYER_COUNT},
  (_, i): {position: 'absolute'; bottom: 0; left: 0; width: '100%'; height: `${number}%`} => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: `${Math.round(
      (1 - Math.sqrt((i + 1) / (FADE_LAYER_COUNT + 1))) * 100,
    )}%` as `${number}%`,
  }),
);
const FADE_GRADIENT_COLORS = [
  'rgba(234, 235, 237, 0)',
  'rgba(234, 235, 237, 0.06)',
  'rgba(234, 235, 237, 0.25)',
  'rgba(234, 235, 237, 0.55)',
  'rgba(234, 235, 237, 0.85)',
];
const FADE_GRADIENT_LOCATIONS = [0, 0.35, 0.6, 0.8, 1];

interface Props {
  isOpened: boolean;
  close: () => void;
  transaction: IDisplayedTx;
  txsNum: number;
  setTransactionIndex: (txIndex: number) => void;
  swipeToPrevTx: () => void;
  swipeToNextTx: () => void;
  // Screen-covering view with collapsable={false} to snapshot as the glass
  // backdrop base.
  contentViewRef: React.RefObject<View | null>;
  // Live row pipeline shared with GlassTxCanvas.
  rowModels: GlassTxRowModels;
  mainSheetsTranslationY: SharedValue<number>;
  txListScrollY: SharedValue<number>;
  listHeaderOffset: SharedValue<number>;
}

function GlassTxDetailModal(props: Props) {
  const {
    isOpened,
    close,
    transaction,
    txsNum,
    setTransactionIndex,
    swipeToPrevTx,
    swipeToNextTx,
    contentViewRef,
    rowModels,
    mainSheetsTranslationY,
    txListScrollY,
    listHeaderOffset,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  // Card geometry (Apple Pay sheet proportions): one equal gap on the left,
  // right and bottom edges, like the iOS sheet.
  const edgeMargin = Math.max(10, SCREEN_WIDTH * 0.03);
  const sideMargin = edgeMargin;
  const cardTop = SCREEN_HEIGHT * 0.43;
  const bottomMargin = edgeMargin;
  const cardWidth = SCREEN_WIDTH - 2 * sideMargin;
  const cardHeight = SCREEN_HEIGHT - cardTop - bottomMargin;
  const cornerRadius = Math.min(SCREEN_HEIGHT * 0.055, 48);
  const offscreenTy = SCREEN_HEIGHT - cardTop;

  // Same list viewport the page canvas uses, so both windows (and the shared
  // paragraph cache) stay identical.
  const {UNFOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const listTopInSheet = SCREEN_HEIGHT * GLASS_TX_LIST_TOP_RATIO;
  const elementsViewportHeight =
    SCREEN_HEIGHT -
    (UNFOLD_SHEET_POINT +
      listTopInSheet -
      SCREEN_HEIGHT * SHEET_OVERSHOOT_RATIO);
  const bandTopScreen =
    SCREEN_HEIGHT - getTabBarBandHeight(SCREEN_HEIGHT, insets.bottom);

  const [snapshot, setSnapshot] = useState<SkImage | null>(null);
  const snapshotRef = useRef<SkImage | null>(null);
  const [isMounted, setMounted] = useState(false);
  // Mirror for worklets: the component stays mounted while the modal is
  // closed, and the scroll-dependent derived values below must cost nothing
  // on the list's hot path then.
  const mountedSV = useSharedValue(false);
  useEffect(() => {
    mountedSV.value = isMounted;
  }, [isMounted, mountedSV]);
  const revealed = useRef(false);
  const animTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const swipeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const captureTask = useRef<{cancel: () => void} | undefined>(undefined);
  const captureRaf = useRef<number | undefined>(undefined);

  // Card slide (shared by the shader box, the clips and the RN card).
  const ty = useSharedValue(offscreenTy);
  // Keyboard lift: the whole glass sheet (shader box included) rises above
  // the keyboard, since a KeyboardAvoidingView inside the fixed card would
  // just collapse the scroll area to nothing.
  const kbShift = useSharedValue(0);
  // Content entrance: the glass arrives first, the content settles onto it a
  // beat later (0 = hidden/offset, 1 = resting).
  const contentIntro = useSharedValue(0);
  // Horizontal content slide between transactions; the glass never moves.
  const contentX = useSharedValue(0);
  // Scroll offset of the content ScrollView — the dismiss drag only arms at 0.
  const contentScrollY = useSharedValue(0);
  // translationY at the moment the dismiss drag armed, so a scroll that runs
  // past its top hands over without a jump. -1 = not armed.
  const dragBase = useSharedValue(-1);
  // Where the content sat when a horizontal pan began (interrupted swipes).
  const contentXStart = useSharedValue(0);
  // True while a finger is in a horizontal pan — the swipe finalizer must not
  // yank content the user has re-grabbed.
  const horizontalActive = useSharedValue(false);
  // The content ScrollView is wrapped in a GestureDetector with this native
  // gesture: a bare reanimated ref has no RNGH handlerTag, so passing it to
  // simultaneousWithExternalGesture would be a silent no-op and the dismiss
  // drag could never arm over scrollable content.
  const nativeScrollGesture = useMemo(() => Gesture.Native(), []);

  useEffect(() => {
    let cancelled = false;
    if (isOpened) {
      clearTimeout(animTimeout.current);
      if (isMounted) {
        // Reopened while the close animation or its finalizer was pending.
        // The overlay is still mounted, so a fresh capture would include our
        // own dim layer — reuse the existing snapshot and re-arm the reveal
        // (which springs ty back from wherever the close left it). The
        // ScrollView kept its offset, so contentScrollY stays untouched.
        revealed.current = false;
        contentX.value = 0;
      } else {
        // Defer until the native view tree is attached — calling
        // makeImageFromView during a mount burst throws an uncatchable native
        // "Could not find view with tag" crash — and capture BEFORE mounting
        // the overlay so the glass refracts the real screen, not our own dim
        // layer.
        captureTask.current = InteractionManager.runAfterInteractions(() => {
          captureRaf.current = requestAnimationFrame(async () => {
            if (cancelled) {
              return;
            }
            try {
              const img = await makeImageFromView(contentViewRef);
              if (cancelled) {
                img?.dispose?.();
                return;
              }
              snapshotRef.current = img;
              setSnapshot(prev => {
                if (prev && prev !== img) {
                  prev.dispose?.();
                }
                return img;
              });
            } catch {
              if (cancelled) {
                return;
              }
              setSnapshot(null);
            }
            setMounted(true);
          });
        });
      }
    } else if (isMounted) {
      ty.value = withTiming(offscreenTy, {duration: 250});
      animTimeout.current = setTimeout(() => {
        setMounted(false);
        snapshotRef.current = null;
        setSnapshot(prev => {
          prev?.dispose?.();
          return null;
        });
        revealed.current = false;
        contentX.value = 0;
        contentScrollY.value = 0;
        kbShift.value = 0;
      }, 300);
    }
    return () => {
      cancelled = true;
      captureTask.current?.cancel();
      if (captureRaf.current !== undefined) {
        cancelAnimationFrame(captureRaf.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened]);

  // Reveal only once mounted with the snapshot in hand, so the first visible
  // frame already refracts. No hard reset of ty here: after a completed close
  // it already rests offscreen, and after an interrupted close the spring
  // picks up from the card's current position.
  useEffect(() => {
    if (isOpened && isMounted && !revealed.current) {
      revealed.current = true;
      // Slightly under-damped so the glass settles with a soft liquid
      // overshoot; the refraction tracks the box uniform through it.
      ty.value = withSpring(0, {
        duration: 520,
        dampingRatio: 0.85,
        mass: 0.5,
        reduceMotion: ReduceMotion.Never,
      });
      contentIntro.value = 0;
      contentIntro.value = withDelay(100, withTiming(1, {duration: 320}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened, isMounted]);

  useEffect(() => {
    return () => {
      clearTimeout(animTimeout.current);
      clearTimeout(swipeTimeout.current);
      snapshotRef.current?.dispose?.();
      snapshotRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Subscribe only while the overlay is up: the component stays mounted
    // with the modal closed, and a keyboard elsewhere on the screen must not
    // animate kbShift (it feeds the per-frame glass filter mappers).
    if (!isMounted) {
      return;
    }
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    // Never lift the card's top past the safe area.
    const maxLift = cardTop - (insets.top + 8);
    const showSub = Keyboard.addListener(showEvent, e => {
      const overlap = e.endCoordinates.height - bottomMargin + 8;
      kbShift.value = withSpring(-Math.min(Math.max(overlap, 0), maxLift), {
        duration: 420,
        dampingRatio: 0.9,
        reduceMotion: ReduceMotion.Never,
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      kbShift.value = withSpring(0, {
        duration: 420,
        dampingRatio: 0.9,
        reduceMotion: ReduceMotion.Never,
      });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, bottomMargin, cardTop, insets.top]);

  const rowElements = useGlassTxRowElements({
    rowModels,
    scrollY: txListScrollY,
    listHeaderOffset,
    viewportHeight: elementsViewportHeight,
    enabled: isMounted,
  });

  // Hoisted builder + blur child: per frame only the box uniform changes.
  const shaderBuilder = useMemo(
    () => Skia.RuntimeShaderBuilder(glassModalShader),
    [],
  );
  const blurChild = useMemo(
    () =>
      Skia.ImageFilter.MakeBlur(
        GLASS_BLUR_SIGMA,
        GLASS_BLUR_SIGMA,
        TileMode.Clamp,
      ),
    [],
  );

  // The card's animated top edge in canvas coordinates — the single source
  // every glass/clip/bezel consumer tracks.
  const cardY = useDerivedValue(() => cardTop + ty.value + kbShift.value);

  // Box uniform in canvas coordinates, tracking the card per frame. The
  // filter must stay UNCLIPPED: the runtime shader's fragCoord is not rebased
  // to a clip's origin (verified empirically — a ring-clipped filter with
  // layer-local uniforms rendered the glass near the screen top, static), so
  // clipping it would desync the box from the card.
  const glassFilter = useDerivedValue(() =>
    makeGlassModalFilter(
      shaderBuilder,
      blurChild,
      [sideMargin, cardY.value, cardWidth, cardHeight],
      cornerRadius,
      GLASS_DARKEN,
    ),
  );

  const ringClip = useDerivedValue(() =>
    Skia.XYWHRect(
      sideMargin - RING_OUTSET,
      cardY.value - RING_OUTSET,
      cardWidth + 2 * RING_OUTSET,
      cardHeight + 2 * RING_OUTSET,
    ),
  );

  const cardRRect = useDerivedValue(() =>
    Skia.RRectXY(
      Skia.XYWHRect(sideMargin, cardY.value, cardWidth, cardHeight),
      cornerRadius,
      cornerRadius,
    ),
  );

  // Live rows in screen coordinates (this canvas starts at y = 0). rowsTop is
  // derived once so the clip and the row transform can never desync; while
  // the modal is closed it pins to 0 so scrolling the list costs nothing here.
  const rowsTop = useDerivedValue(() =>
    mountedSV.value
      ? rowsTopInCanvas(
          mainSheetsTranslationY.value,
          listTopInSheet,
          0,
          listHeaderOffset.value,
        )
      : 0,
  );

  const emptyRect = useMemo(() => Skia.XYWHRect(0, 0, 0, 0), []);
  const liveListClip = useDerivedValue(() => {
    if (!mountedSV.value) {
      return emptyRect;
    }
    const top = Math.max(0, rowsTop.value);
    return Skia.XYWHRect(0, top, SCREEN_WIDTH, Math.max(0, bandTopScreen - top));
  });

  const identityTransform = useMemo(() => [{translateY: 0}], []);
  const liveContentTransform = useDerivedValue(() => {
    if (!mountedSV.value) {
      return identityTransform;
    }
    return [{translateY: rowsTop.value - txListScrollY.value}];
  });

  const dimOpacity = useDerivedValue(() =>
    interpolate(ty.value, [0, offscreenTy], [1, 0], Extrapolation.CLAMP),
  );

  // Bezel: the house glass edge — gradient stroke, brightest along the top.
  const bezelY = useDerivedValue(() => cardY.value + 0.6);
  const bezelGradientStart = useDerivedValue(() => vec(0, cardY.value));
  const bezelGradientEnd = useDerivedValue(() =>
    vec(0, cardY.value + cardHeight),
  );

  const animateClose = useCallback(() => {
    Keyboard.dismiss();
    close();
  }, [close]);

  // Once the old content has slid out: step the transaction and slide the new
  // content in from the other side. Stepping only now keeps the outgoing
  // transaction on screen for the whole slide-out instead of hard-cutting it.
  const finishSwipe = useCallback(
    (isPrev: boolean) => {
      clearTimeout(swipeTimeout.current);
      swipeTimeout.current = setTimeout(() => {
        if (horizontalActive.value) {
          // The user re-grabbed the content mid-transition; their gesture's
          // own onEnd owns what happens next.
          return;
        }
        if (isPrev) {
          swipeToPrevTx();
        } else {
          swipeToNextTx();
        }
        contentX.value = isPrev ? -cardWidth : cardWidth;
        contentX.value = withSpring(0, {
          duration: 460,
          dampingRatio: 0.85,
          reduceMotion: ReduceMotion.Never,
        });
      }, SWIPE_CARDS_ANIM_DURATION);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swipeToPrevTx, swipeToNextTx, cardWidth],
  );

  const swipeTriggerHeightRange = SCREEN_HEIGHT * 0.15;
  const swipeTriggerWidthRange = SCREEN_WIDTH * 0.15;
  const isSwiperActive = txsNum > 1;

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const panYGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetY(10)
      .simultaneousWithExternalGesture(nativeScrollGesture)
      .onBegin(() => {
        'worklet';
        dragBase.value = -1;
      })
      .onUpdate(e => {
        'worklet';
        if (
          contentX.value === 0 &&
          contentScrollY.value <= 0 &&
          e.translationY > 0
        ) {
          if (dragBase.value < 0) {
            dragBase.value = e.translationY;
            runOnJS(dismissKeyboard)();
          }
          ty.value = Math.max(0, e.translationY - dragBase.value);
        }
      })
      .onEnd(() => {
        'worklet';
        if (contentX.value !== 0) {
          return;
        }
        if (ty.value > 0) {
          if (ty.value > swipeTriggerHeightRange) {
            runOnJS(animateClose)();
          } else {
            ty.value = withSpring(0, {
              duration: 420,
              dampingRatio: 0.75,
              reduceMotion: ReduceMotion.Never,
            });
          }
        }
      });
    if (isSwiperActive) {
      pan.failOffsetX([-15, 15]);
    }
    return pan;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSwiperActive, swipeTriggerHeightRange, animateClose, dismissKeyboard]);

  const panXGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isSwiperActive)
        .activeOffsetX([-15, 15])
        .failOffsetY([-15, 15])
        .onBegin(() => {
          'worklet';
          horizontalActive.value = true;
          contentXStart.value = contentX.value;
        })
        .onUpdate(e => {
          'worklet';
          if (ty.value === 0) {
            contentX.value = contentXStart.value + e.translationX;
          }
        })
        .onEnd(e => {
          'worklet';
          if (ty.value !== 0) {
            return;
          }
          if (e.translationX > swipeTriggerWidthRange) {
            contentX.value = withTiming(cardWidth, {
              duration: SWIPE_CARDS_ANIM_DURATION,
            });
            runOnJS(finishSwipe)(true);
          } else if (e.translationX < -swipeTriggerWidthRange) {
            contentX.value = withTiming(-cardWidth, {
              duration: SWIPE_CARDS_ANIM_DURATION,
            });
            runOnJS(finishSwipe)(false);
          } else {
            contentX.value = withSpring(0, {
              duration: 420,
              dampingRatio: 0.8,
              reduceMotion: ReduceMotion.Never,
            });
          }
        })
        .onFinalize(() => {
          'worklet';
          horizontalActive.value = false;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSwiperActive, swipeTriggerWidthRange, cardWidth, finishSwipe],
  );

  const cardGestures = useMemo(
    () => Gesture.Simultaneous(panXGesture, panYGesture),
    [panXGesture, panYGesture],
  );

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: ty.value + kbShift.value}],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: contentX.value},
      {translateY: (1 - contentIntro.value) * 14},
    ],
    opacity:
      contentIntro.value *
      interpolate(
        Math.abs(contentX.value),
        [0, cardWidth],
        [1, 0.3],
        Extrapolation.CLAMP,
      ),
  }));

  const activeBulletNum = (transaction?.renderIndex ?? 0) + 1;

  // iOS page-control pill: fixed at the card's bottom, does not slide with
  // the content. Max five dots with a sliding window over larger lists.
  const renderPagination = () => {
    if (txsNum <= 1) {
      return null;
    }
    const maxBulletsNum = 5;
    const bulletsNum = txsNum > maxBulletsNum ? maxBulletsNum : txsNum;

    const middleRightOffset =
      txsNum > maxBulletsNum ? Math.ceil(maxBulletsNum / 2) - 1 : 0;
    let leftOffset =
      activeBulletNum > maxBulletsNum - middleRightOffset
        ? activeBulletNum - maxBulletsNum + middleRightOffset
        : 0;
    if (activeBulletNum > txsNum - middleRightOffset) {
      leftOffset = txsNum - maxBulletsNum;
    }

    const dots = [];
    for (let i = 1 + leftOffset; i <= bulletsNum + leftOffset; i++) {
      dots.push(
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setTransactionIndex(i - 1)}
          style={styles.dotTouch}
          key={`bullet-${i}`}>
          <View
            style={[styles.dot, i === activeBulletNum ? styles.dotActive : null]}
          />
        </TouchableOpacity>,
      );
    }

    return (
      <View style={styles.paginationWrap} pointerEvents="box-none">
        <View style={styles.paginationPill}>{dots}</View>
      </View>
    );
  };

  if (!isMounted) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      {/* Composite backdrop + glass. Layers: snapshot base and live rows
          (clipped to the card + sampling ring), the glass filter (unclipped —
          a clip would not rebase fragCoord and the shader's cheap-exit already
          skips off-card pixels), then the dim over the real page outside the
          card's rounded rect. */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Group clip={ringClip}>
          {snapshot ? (
            <SkiaImage
              image={snapshot}
              x={0}
              y={0}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              fit="fill"
            />
          ) : (
            <Rect
              x={0}
              y={0}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              color={SHEET_BACKGROUND}
            />
          )}
          <Group clip={liveListClip}>
            <Rect
              x={0}
              y={0}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              color={SHEET_BACKGROUND}
            />
            {rowElements ? (
              <Group transform={liveContentTransform}>{rowElements}</Group>
            ) : null}
          </Group>
        </Group>
        <BackdropFilter filter={<ImageFilter filter={glassFilter} />} />
        <Group clip={cardRRect} invertClip>
          <Rect
            x={0}
            y={0}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            color={DIM_COLOR}
            opacity={dimOpacity}
          />
        </Group>
        <RoundedRect
          x={sideMargin + 0.6}
          y={bezelY}
          width={cardWidth - 1.2}
          height={cardHeight - 1.2}
          r={cornerRadius - 0.6}
          style="stroke"
          strokeWidth={1.2}>
          <SkiaLinearGradient
            start={bezelGradientStart}
            end={bezelGradientEnd}
            colors={BORDER_GRADIENT_COLORS}
            positions={BORDER_GRADIENT_POSITIONS}
          />
        </RoundedRect>
      </Canvas>

      {/* Tapping anywhere off the card closes; the card sits above this. */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={animateClose}
      />

      <GestureDetector gesture={cardGestures}>
        <Animated.View
          style={[
            styles.card,
            {
              top: cardTop,
              left: sideMargin,
              width: cardWidth,
              height: cardHeight,
              borderRadius: cornerRadius,
            },
            cardAnimatedStyle,
          ]}>
          <Animated.View style={[styles.cardContent, contentAnimatedStyle]}>
            <GlassTxDetailContent
              transaction={transaction}
              contentScrollY={contentScrollY}
              nativeScrollGesture={nativeScrollGesture}
            />
          </Animated.View>
          {/* Progressive blur into the card's bottom edge, under the page
              control. Native blur views cannot take a gradient mask, so the
              gradient is built by ACCUMULATION: FADE_LAYER_COUNT low-intensity
              layers all bottom-aligned at decreasing heights — each boundary
              only adds a small delta, and the stack deepens smoothly toward
              the edge. A soft sheet-grey ramp feathers what remains. */}
          <View style={styles.bottomFade} pointerEvents="none">
            {FADE_LAYER_STYLES.map(layerStyle => (
              <BlurView
                key={layerStyle.height}
                intensity={FADE_LAYER_INTENSITY}
                tint="light"
                style={layerStyle}
              />
            ))}
            <LinearGradient
              colors={FADE_GRADIENT_COLORS}
              locations={FADE_GRADIENT_LOCATIONS}
              style={StyleSheet.absoluteFill}
            />
          </View>
          {/* Chrome pinned to the card, outside the sliding content: the
              close button and the page control never move with pagination
              gestures. */}
          <TouchableOpacity style={styles.closeButton} onPress={animateClose}>
            <Image
              style={styles.closeIcon}
              source={require('../../assets/images/close.png')}
            />
          </TouchableOpacity>
          {renderPagination()}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
    },
    card: {
      position: 'absolute',
      overflow: 'hidden',
    },
    cardContent: {
      flex: 1,
    },
    closeButton: {
      position: 'absolute',
      top: screenHeight * 0.02,
      right: screenWidth * 0.05,
      height: screenHeight * 0.042,
      width: screenHeight * 0.042,
      borderRadius: screenHeight * 0.021,
      backgroundColor: 'rgba(120, 120, 128, 0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeIcon: {
      opacity: 0.75,
    },
    bottomFade: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: screenHeight * 0.1,
    },
    paginationWrap: {
      position: 'absolute',
      bottom: screenHeight * 0.016,
      left: 0,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    paginationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(120, 120, 128, 0.16)',
      borderRadius: screenHeight * 0.014,
      height: screenHeight * 0.028,
      paddingHorizontal: screenHeight * 0.008,
    },
    dotTouch: {
      height: '100%',
      paddingHorizontal: screenHeight * 0.005,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dot: {
      height: screenHeight * 0.0095,
      width: screenHeight * 0.0095,
      borderRadius: screenHeight * 0.00475,
      backgroundColor: 'rgba(60, 60, 67, 0.24)',
    },
    dotActive: {
      backgroundColor: '#ffffff',
    },
  });

// Memoized: NewMain re-renders on every store tick and the modal is always
// mounted; with stable props the closed modal skips reconciliation entirely.
export default React.memo(GlassTxDetailModal);
