import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Pressable, View} from 'react-native';
import {Group, Paragraph, RoundedRect, vec} from '@shopify/react-native-skia';
import type {SharedValue} from 'react-native-reanimated';
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {buildFittedParagraph, useSatoshiFontMgr} from '../GlassBalanceGraphics';
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

export const useUnderGlassBlueButton = (
  cardRootRef: React.RefObject<View | null>,
  label: string,
  onPress: () => void,
  disabled: boolean,
  opacity?: SharedValue<number>,
) => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const fontMgr = useSatoshiFontMgr();
  const ref = useRef<View>(null);
  const [frame, setFrame] = useState<Frame | null>(null);

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
      (x, y, width, height) =>
        setFrame(prev =>
          prev &&
          prev.x === x &&
          prev.y === y &&
          prev.width === width &&
          prev.height === height
            ? prev
            : {x, y, width, height},
        ),
      () => {},
    );
  }, [cardRootRef]);
  // onLayout misses ancestor reflows (a note appearing under the button
  // shifts it without its own layout changing), so re-measure every commit
  useEffect(() => {
    measure();
  });

  const ghost = (
    <Pressable
      ref={ref}
      style={ghostStyle(SCREEN_HEIGHT)}
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
    if (!frame || !fontMgr) {
      return null;
    }
    // shrinks to fit like TranslateText did, then centered manually
    const paragraph = buildFittedParagraph(
      fontMgr,
      label,
      SCREEN_HEIGHT * 0.02,
      700,
      '#FFFFFF',
      frame.width,
      frame.width - SCREEN_HEIGHT * 0.05,
    );
    const inner = (
      <Group
        origin={vec(frame.x + frame.width / 2, frame.y + frame.height / 2)}
        transform={pressTransform}>
        <Group opacity={disabled ? 0.5 : 1}>
          <RoundedRect
            x={frame.x}
            y={frame.y}
            width={frame.width}
            height={frame.height}
            r={SCREEN_HEIGHT * 0.012}
            color="#2C72FF"
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
  }, [frame, fontMgr, label, disabled, SCREEN_HEIGHT, pressTransform, opacity]);

  return {ghost, graphics};
};

// same box as BlueButton's big variant
const ghostStyle = (screenHeight: number) => ({
  width: '100%' as const,
  height: screenHeight * 0.06,
});
