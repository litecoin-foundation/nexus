import React, {useContext, useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

// a pill-shaped segmented switch: a thumb slides behind the active segment.
// `glass` (white thumb) sits on the gradient card (the Nexus Shop header),
// `light` (blue thumb) on the light main-screen cards.

export const SEGMENTED_PILLS_HEIGHT_RATIO = 0.048;
const PADDING_RATIO = 0.004;
const SEGMENT_SPRING = {mass: 0.4, damping: 16, stiffness: 200};
// a press released this far outside the pill still counts
const PRESS_SLOP = 24;

export interface Segment {
  key: string;
  title?: string;
  textKey?: string;
  textDomain?: string;
}

interface Props {
  segments: Segment[];
  activeIndex: number;
  onSelect: (index: number) => void;
  width: number;
  height?: number;
  tone?: 'glass' | 'light';
  style?: React.ComponentProps<typeof Animated.View>['style'];
}

const SegmentedPills: React.FC<Props> = props => {
  const {
    segments,
    activeIndex,
    onSelect,
    width,
    height: heightProp,
    tone = 'glass',
    style,
  } = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const height = heightProp ?? SCREEN_HEIGHT * SEGMENTED_PILLS_HEIGHT_RATIO;
  const padding = SCREEN_HEIGHT * PADDING_RATIO;
  const styles = useMemo(
    () => getStyles(SCREEN_HEIGHT, width, height, padding, tone),
    [SCREEN_HEIGHT, width, height, padding, tone],
  );

  const segmentCount = segments.length;
  const segmentWidth = (width - padding * 2) / segmentCount;
  const thumbX = useSharedValue(activeIndex * segmentWidth);
  // re-syncs the thumb when the owner doesn't take up a selection
  const [selectionAttempt, setSelectionAttempt] = useState(0);
  useEffect(() => {
    thumbX.value = withSpring(activeIndex * segmentWidth, SEGMENT_SPRING);
  }, [activeIndex, segmentWidth, selectionAttempt, thumbX]);
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{translateX: thumbX.value}],
    width: segmentWidth,
  }));

  const select = (index: number) => {
    onSelect(index);
    setSelectionAttempt(n => n + 1);
  };

  const pressHandled = useSharedValue(false);
  const pressGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      'worklet';
      pressHandled.value = false;
    })
    .onTouchesUp(e => {
      'worklet';
      const touch = e.changedTouches[0];
      // one selection per press, whatever a second finger does
      if (!touch || pressHandled.value) {
        return;
      }
      pressHandled.value = true;
      if (
        touch.x < -PRESS_SLOP ||
        touch.x > width + PRESS_SLOP ||
        touch.y < -PRESS_SLOP ||
        touch.y > height + PRESS_SLOP
      ) {
        return;
      }
      const index = Math.min(
        Math.max(Math.floor((touch.x - padding) / segmentWidth), 0),
        segmentCount - 1,
      );
      // move on the UI thread now rather than after the owner re-renders
      thumbX.value = withSpring(index * segmentWidth, SEGMENT_SPRING);
      runOnJS(select)(index);
    });

  return (
    <GestureDetector gesture={pressGesture}>
      <Animated.View style={[styles.container, style]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
        {segments.map((segment, index) => {
          const textStyle =
            index === activeIndex ? styles.textActive : styles.text;
          return (
            <View key={segment.key} style={styles.segment}>
              {segment.title ? (
                <TranslateText
                  textValue={segment.title}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                  textStyle={textStyle}
                  numberOfLines={1}
                />
              ) : (
                <TranslateText
                  textKey={segment.textKey}
                  domain={segment.textDomain}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.016}
                  textStyle={textStyle}
                  numberOfLines={1}
                />
              )}
            </View>
          );
        })}
      </Animated.View>
    </GestureDetector>
  );
};

const TONES = {
  glass: {
    track: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(238, 235, 235, 0.45)',
    thumb: '#ffffff',
    text: 'rgba(255, 255, 255, 0.85)',
    textActive: '#2E2E2E',
  },
  light: {
    track: 'rgba(116, 126, 135, 0.08)',
    border: 'rgba(216, 210, 210, 0.75)',
    thumb: '#2C72FF',
    text: '#747E87',
    textActive: '#ffffff',
  },
};

const getStyles = (
  screenHeight: number,
  width: number,
  height: number,
  padding: number,
  tone: 'glass' | 'light',
) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      width,
      height,
      padding,
      borderRadius: height / 2,
      borderCurve: 'continuous',
      backgroundColor: TONES[tone].track,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: TONES[tone].border,
    },
    thumb: {
      position: 'absolute',
      left: padding,
      top: padding,
      bottom: padding,
      borderRadius: height / 2,
      borderCurve: 'continuous',
      backgroundColor: TONES[tone].thumb,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: TONES[tone].text,
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      fontSize: screenHeight * 0.015,
    },
    textActive: {
      color: TONES[tone].textActive,
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      fontSize: screenHeight * 0.015,
    },
  });

export default SegmentedPills;
