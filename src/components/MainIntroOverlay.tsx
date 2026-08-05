import React, {useContext, useEffect, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import FoldedSkinView from './FoldedSkinView';
import {
  getMainSheetPoints,
  MAIN_SHEET_BACKGROUND_COLOR,
  MAIN_SHEET_TOP_RADIUS_RATIO,
} from '../animations/mainTransition';
import {ScreenSizeContext} from '../context/screenSize';

const REVEAL_TOP_DELAY_MS = 200;
const REVEAL_SHEET_DELAY_MS = 320;
const REVEAL_FADE_MS = 380;

let introRequested = false;
export const requestMainIntro = () => {
  introRequested = true;
};
export const consumeMainIntro = () => {
  const requested = introRequested;
  introRequested = false;
  return requested;
};

interface Props {
  online: boolean;
  onDone: () => void;
}

const MainIntroOverlay: React.FC<Props> = ({online, onDone}) => {
  const insets = useSafeAreaInsets();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const {FOLD_SHEET_POINT} = getMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const styles = getStyles(SCREEN_HEIGHT, FOLD_SHEET_POINT);

  const topOpacity = useSharedValue(1);
  const sheetOpacity = useSharedValue(1);

  useEffect(() => {
    topOpacity.value = withDelay(
      REVEAL_TOP_DELAY_MS,
      withTiming(0, {
        duration: REVEAL_FADE_MS,
        easing: Easing.out(Easing.quad),
      }),
    );
    sheetOpacity.value = withDelay(
      REVEAL_SHEET_DELAY_MS,
      withTiming(
        0,
        {duration: REVEAL_FADE_MS, easing: Easing.out(Easing.quad)},
        finished => {
          if (finished) {
            runOnJS(onDone)();
          }
        },
      ),
    );
    // Play once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topStyle = useAnimatedStyle(() => ({opacity: topOpacity.value}));
  const sheetStyle = useAnimatedStyle(() => ({opacity: sheetOpacity.value}));
  const blockGesture = useMemo(() => Gesture.Tap(), []);

  return (
    <GestureDetector gesture={blockGesture}>
      <View style={styles.overlay} onStartShouldSetResponder={() => true}>
        <Animated.View style={[StyleSheet.absoluteFill, topStyle]}>
          <FoldedSkinView online={online} />
        </Animated.View>
        <Animated.View style={[styles.sheet, sheetStyle]} />
      </View>
    </GestureDetector>
  );
};

const getStyles = (screenHeight: number, foldedSheetPoint: number) => {
  const sheetRadius = screenHeight * MAIN_SHEET_TOP_RADIUS_RATIO;
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 5,
    },
    sheet: {
      position: 'absolute',
      top: foldedSheetPoint,
      left: 0,
      right: 0,
      height: screenHeight - foldedSheetPoint + sheetRadius * 2,
      borderTopLeftRadius: sheetRadius,
      borderTopRightRadius: sheetRadius,
      backgroundColor: MAIN_SHEET_BACKGROUND_COLOR,
    },
  });
};

export default React.memo(MainIntroOverlay);
