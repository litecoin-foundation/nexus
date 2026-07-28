import React, {useContext, useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Canvas,
  ColorMatrix,
  FillType,
  Group,
  Image,
  Path,
  RoundedRect,
  Skia,
  useImage,
} from '@shopify/react-native-skia';
import type {SkImage, SkPath} from '@shopify/react-native-skia';

import GlassTxCanvas from './GlassTxCanvas';
import {GlassTxRowModels} from './GlassTxRows';
import {
  BAR_HEIGHT_RATIO,
  BAR_WIDTH_RATIO,
  getBottomOffset,
  PRESSED_SCALE,
  SCROLLING_SCALE,
  THUMB_HEIGHT_RATIO,
  THUMB_SPRING,
  THUMB_WIDTH_RATIO,
} from './glassTabBarLayout';
import {ScreenSizeContext} from '../context/screenSize';

// Screen-fixed tab bar. The glass itself is drawn by GlassTxCanvas, which sits
// just below this overlay and owns every pixel the glass refracts; this
// component is only the hairline, thumb, icons and gestures on top of it.

export {getTabBarClearance} from './glassTabBarLayout';

type IconKind = 'wallet' | 'shop' | 'card';

const SECTIONS: {kind: IconKind; disabled: boolean}[] = [
  {kind: 'wallet', disabled: false},
  {kind: 'shop', disabled: false},
  {kind: 'card', disabled: true},
];

const WHITE_ICON_MATRIX = [
  0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0,
];

const buildWalletPaths = (cx: number, cy: number, s: number) => {
  const bodyW = s;
  const bodyH = s * 0.72;
  const r = s * 0.14;
  const rrect = Skia.RRectXY(
    Skia.XYWHRect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH),
    r,
    r,
  );
  const claspCx = cx + bodyW * 0.26;
  const claspR = s * 0.09;
  const filled = Skia.Path.Make();
  filled.addRRect(rrect);
  filled.addCircle(claspCx, cy, claspR);
  filled.setFillType(FillType.EvenOdd);
  const outline = Skia.Path.Make();
  outline.addRRect(rrect);
  outline.addCircle(claspCx, cy, claspR);
  return {filled, outline};
};

const buildCardPaths = (cx: number, cy: number, s: number) => {
  const w = s;
  const h = s * 0.68;
  const r = s * 0.12;
  const rrect = Skia.RRectXY(Skia.XYWHRect(cx - w / 2, cy - h / 2, w, h), r, r);
  const stripeY = cy - h / 2 + h * 0.24;
  const stripeH = s * 0.1;
  const filled = Skia.Path.Make();
  filled.addRRect(rrect);
  filled.addRect(Skia.XYWHRect(cx - w / 2, stripeY, w, stripeH));
  filled.setFillType(FillType.EvenOdd);
  const outline = Skia.Path.Make();
  outline.addRRect(rrect);
  outline.moveTo(cx - w / 2, stripeY + stripeH / 2);
  outline.lineTo(cx + w / 2, stripeY + stripeH / 2);
  return {filled, outline};
};

interface TabIconProps {
  kind: IconKind;
  cx: number;
  cy: number;
  size: number;
  disabled: boolean;
  image?: SkImage | null;
  thumbCenter: SharedValue<number>;
  slotSpacing: number;
}

const TabIcon: React.FC<TabIconProps> = props => {
  const {kind, cx, cy, size, disabled, image, thumbCenter, slotSpacing} = props;

  const paths = useMemo((): {filled: SkPath | null; outline: SkPath} => {
    if (kind === 'wallet') {
      return buildWalletPaths(cx, cy, size);
    }
    if (kind === 'card') {
      return buildCardPaths(cx, cy, size);
    }
    return {filled: null, outline: Skia.Path.Make()};
  }, [kind, cx, cy, size]);

  // The icon under the thumb shows filled; everywhere else the outline.
  const filledOpacity = useDerivedValue(() =>
    disabled
      ? 0
      : interpolate(
          Math.abs(thumbCenter.value - cx),
          [0, slotSpacing * 0.5],
          [1, 0],
          Extrapolation.CLAMP,
        ),
  );
  const outlineOpacity = useDerivedValue(() =>
    disabled ? 0.35 : 1 - filledOpacity.value,
  );
  const iconOpacity = useDerivedValue(() => (disabled ? 0.35 : 1));

  if (kind === 'shop') {
    return (
      <Group opacity={iconOpacity}>
        <Image
          image={image ?? null}
          x={cx - size / 2}
          y={cy - size / 2}
          width={size}
          height={size}
          fit="contain">
          <ColorMatrix matrix={WHITE_ICON_MATRIX} />
        </Image>
      </Group>
    );
  }

  return (
    <>
      <Group opacity={outlineOpacity}>
        <Path
          path={paths.outline}
          style="stroke"
          strokeWidth={size * 0.085}
          strokeCap="round"
          strokeJoin="round"
          color="#ffffff"
        />
      </Group>
      <Group opacity={filledOpacity}>
        {paths.filled ? (
          <Path path={paths.filled} style="fill" color="#ffffff" />
        ) : (
          <Path
            path={paths.outline}
            style="stroke"
            strokeWidth={size * 0.16}
            strokeCap="round"
            strokeJoin="round"
            color="#ffffff"
          />
        )}
      </Group>
    </>
  );
};

interface Props {
  activeIndex: number;
  onSelectSection: (index: number) => void;
  contentActivity: SharedValue<number>;
  rowModels: GlassTxRowModels;
  mainSheetsTranslationY: SharedValue<number>;
  txListScrollY: SharedValue<number>;
  listHeaderOffset: SharedValue<number>;
  showTxList: boolean;
  activeSheet: number;
  sheetCaptureRef: React.RefObject<View | null>;
  shopDisabled: boolean;
}

const LiquidGlassTabBar: React.FC<Props> = props => {
  const {
    activeIndex,
    onSelectSection,
    contentActivity,
    rowModels,
    mainSheetsTranslationY,
    txListScrollY,
    listHeaderOffset,
    showTxList,
    activeSheet,
    sheetCaptureRef,
    shopDisabled,
  } = props;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const shopIcon = useImage(require('../assets/icons/shop.png'));
  const sections = useMemo(
    () =>
      SECTIONS.map(section =>
        section.kind === 'shop'
          ? {...section, disabled: shopDisabled}
          : section,
      ),
    [shopDisabled],
  );
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, insets.bottom);

  const barWidth = SCREEN_WIDTH * BAR_WIDTH_RATIO;
  const barHeight = SCREEN_HEIGHT * BAR_HEIGHT_RATIO;
  const thumbWidth = SCREEN_WIDTH * THUMB_WIDTH_RATIO;
  const thumbHeight = SCREEN_HEIGHT * THUMB_HEIGHT_RATIO;
  const thumbInsetY = (barHeight - thumbHeight) / 2;
  const iconSize = SCREEN_HEIGHT * 0.028;
  const slotSpacing = barWidth / sections.length;
  const slotCenters = sections.map((_, i) => slotSpacing * (i + 0.5));
  // Clamp must contain the resting slot centers.
  const minCenter = Math.min(slotCenters[0], thumbWidth / 2 + thumbInsetY);
  const maxCenter = Math.max(
    slotCenters[sections.length - 1],
    barWidth - thumbWidth / 2 - thumbInsetY,
  );

  const thumbCenter = useSharedValue(
    slotCenters[activeIndex] ?? slotCenters[0],
  );
  const dragStart = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const [selectionAttempt, setSelectionAttempt] = useState(0);

  // Re-sync after rejected selections and window resizes.
  useEffect(() => {
    thumbCenter.value = withSpring(
      slotCenters[activeIndex] ?? slotCenters[0],
      THUMB_SPRING,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, selectionAttempt, slotSpacing]);

  const selectSection = (index: number) => {
    // Re-selecting wallet can fold an open card home.
    onSelectSection(index);
    setSelectionAttempt(n => n + 1);
  };

  const nearestEnabledSlot = (x: number): number => {
    'worklet';
    let best = 0;
    let bestDist = Number.MAX_VALUE;
    for (let i = 0; i < slotCenters.length; i++) {
      if (sections[i].disabled) {
        continue;
      }
      const dist = Math.abs(x - slotCenters[i]);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      pressScale.value = withSpring(PRESSED_SCALE, THUMB_SPRING);
    })
    .onStart(() => {
      'worklet';
      dragStart.value = thumbCenter.value;
    })
    .onUpdate(e => {
      'worklet';
      thumbCenter.value = Math.min(
        Math.max(dragStart.value + e.translationX, minCenter),
        maxCenter,
      );
    })
    .onEnd(() => {
      'worklet';
      const target = nearestEnabledSlot(thumbCenter.value);
      thumbCenter.value = withSpring(slotCenters[target], THUMB_SPRING);
      runOnJS(selectSection)(target);
    })
    .onFinalize(() => {
      'worklet';
      pressScale.value = withSpring(1, THUMB_SPRING);
    });

  const tapGesture = Gesture.Tap().onEnd(e => {
    'worklet';
    // Taps on the disabled placeholder are ignored.
    const tapped = Math.min(
      Math.max(Math.floor(e.x / slotSpacing), 0),
      sections.length - 1,
    );
    if (sections[tapped].disabled) {
      return;
    }
    thumbCenter.value = withSpring(slotCenters[tapped], THUMB_SPRING);
    runOnJS(selectSection)(tapped);
  });

  const barGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedBarStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          pressScale.value *
          interpolate(
            contentActivity.value,
            [0, 1],
            [1, SCROLLING_SCALE],
            Extrapolation.CLAMP,
          ),
      },
    ],
  }));

  const thumbX = useDerivedValue(() => thumbCenter.value - thumbWidth / 2);

  return (
    <>
      <GlassTxCanvas
        rowModels={rowModels}
        mainSheetsTranslationY={mainSheetsTranslationY}
        txListScrollY={txListScrollY}
        listHeaderOffset={listHeaderOffset}
        showTxList={showTxList}
        activeSheet={activeSheet}
        sheetCaptureRef={sheetCaptureRef}
        contentActivity={contentActivity}
        pressScale={pressScale}
      />

      <View style={styles.wrapper} pointerEvents="box-none">
        <GestureDetector gesture={barGesture}>
          <Animated.View style={[styles.bar, animatedBarStyle]}>
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              <RoundedRect
                x={0.5}
                y={0.5}
                width={barWidth - 1}
                height={barHeight - 1}
                r={(barHeight - 1) / 2}
                style="stroke"
                strokeWidth={0.5}
                color="rgba(238, 235, 235, 0.67)"
              />
              <RoundedRect
                x={thumbX}
                y={thumbInsetY}
                width={thumbWidth}
                height={thumbHeight}
                r={thumbHeight / 2}
                color="rgba(74, 75, 76, 0.39)"
              />
              {sections.map((section, i) => (
                <TabIcon
                  key={section.kind}
                  kind={section.kind}
                  cx={slotCenters[i]}
                  cy={barHeight / 2}
                  size={iconSize}
                  disabled={section.disabled}
                  image={section.kind === 'shop' ? shopIcon : null}
                  thumbCenter={thumbCenter}
                  slotSpacing={slotSpacing}
                />
              ))}
            </Canvas>
          </Animated.View>
        </GestureDetector>
      </View>
    </>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  bottomInset: number,
) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: getBottomOffset(screenHeight, bottomInset),
      alignItems: 'center',
      zIndex: 3,
    },
    bar: {
      width: screenWidth * BAR_WIDTH_RATIO,
      height: screenHeight * BAR_HEIGHT_RATIO,
      borderRadius: (screenHeight * BAR_HEIGHT_RATIO) / 2,
    },
  });

export default LiquidGlassTabBar;
