import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Pressable, View} from 'react-native';
import {Group, Paragraph, vec} from '@shopify/react-native-skia';
import type {SharedValue} from 'react-native-reanimated';
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import GlassButtonSurface from './GlassButtonSurface';
import {
  buildFittedParagraph,
  buildParagraph,
  useSatoshiFontMgr,
} from '../GlassBalanceGraphics';
import {ScreenSizeContext} from '../../context/screenSize';

// blue button that lives under the glass band: an invisible native ghost
// keeps the card's flex layout and touch handling, and a skia twin draws in
// the shared glass canvas at the ghost's measured position

interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

// capsule hugging its label, per the SendBtn artboard
const HEIGHT_RATIO = 0.06;
const FONT_RATIO = 0.02;
const PADDING_RATIO = 0.4;

export const useUnderGlassBlueButton = (
  cardRootRef: React.RefObject<View | null>,
  label: string,
  onPress: () => void,
  disabled: boolean,
  opacity?: SharedValue<number>,
) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const fontMgr = useSatoshiFontMgr();
  const ref = useRef<View>(null);
  const [frame, setFrame] = useState<Frame | null>(null);

  const height = SCREEN_HEIGHT * HEIGHT_RATIO;
  const fontSize = SCREEN_HEIGHT * FONT_RATIO;
  const padding = height * PADDING_RATIO;

  const scale = useSharedValue(1);
  const pressTransform = useDerivedValue(() => [{scale: scale.value}]);

  // position relative to the card root, immune to the sheet translation
  const measure = useCallback(() => {
    const node = ref.current;
    const root = cardRootRef.current;
    if (!node || !root) {
      return;
    }
    node.measureLayout(
      root,
      (x, y, w, h) =>
        setFrame(prev =>
          prev &&
          prev.x === x &&
          prev.y === y &&
          prev.width === w &&
          prev.height === h
            ? prev
            : {x, y, width: w, height: h},
        ),
      () => {},
    );
  }, [cardRootRef]);
  // onLayout misses ancestor reflows (a note appearing under the button
  // shifts it without its own layout changing), so re-measure every commit
  useEffect(() => {
    measure();
  });

  // the ghost hugs the label; maxWidth lets the container clamp a long one
  // and the drawn paragraph then shrinks to whatever width it measured at
  const labelWidth = useMemo(
    () =>
      fontMgr
        ? buildParagraph(
            fontMgr,
            label,
            fontSize,
            700,
            '#FFFFFF',
            SCREEN_WIDTH,
          ).getLongestLine()
        : 0,
    [fontMgr, label, fontSize, SCREEN_WIDTH],
  );
  const ghostStyle = useMemo(
    () => ({
      alignSelf: 'center' as const,
      maxWidth: '100%' as const,
      height,
      width: labelWidth ? Math.ceil(labelWidth + padding * 2) : undefined,
    }),
    [height, labelWidth, padding],
  );

  const ghost = (
    <Pressable
      ref={ref}
      style={ghostStyle}
      onLayout={measure}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96, {mass: 1});
      }}
      onPressOut={() => {
        scale.value = withSpring(1, {mass: 0.7});
      }}
      onPress={onPress}
    />
  );

  const graphics = useMemo(() => {
    if (!frame || !fontMgr || frame.width <= 0 || frame.height <= 0) {
      return null;
    }
    // shrinks to fit like TranslateText did, then centered manually
    const paragraph = buildFittedParagraph(
      fontMgr,
      label,
      fontSize,
      700,
      '#FFFFFF',
      frame.width,
      Math.max(1, frame.width - padding * 2),
    );
    const inner = (
      <Group
        origin={vec(frame.x + frame.width / 2, frame.y + frame.height / 2)}
        transform={pressTransform}>
        <Group opacity={disabled ? 0.5 : 1}>
          <GlassButtonSurface
            x={frame.x}
            y={frame.y}
            width={frame.width}
            height={frame.height}
          />
          <Paragraph
            paragraph={paragraph}
            x={frame.x + (frame.width - paragraph.getLongestLine()) / 2}
            y={frame.y + (frame.height - paragraph.getHeight()) / 2}
            width={frame.width}
          />
        </Group>
      </Group>
    );
    return opacity ? <Group opacity={opacity}>{inner}</Group> : inner;
  }, [
    frame,
    fontMgr,
    label,
    disabled,
    fontSize,
    padding,
    pressTransform,
    opacity,
  ]);

  return {ghost, graphics};
};
