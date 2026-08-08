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
import {SHEET_BACKGROUND} from './GlassTxRows';
import {SHEET_TOP_RADIUS_RATIO} from './GlassBottomSheet';
import {getNewMainSheetPoints} from '../animations/useNewMainAnims';
import {ScreenSizeContext} from '../context/screenSize';

// Empty skin of the folded Main screen, matching the lock screen's
// final frame. Mounts opaque under the nav cross-fade, then fades out
// (top half first) so the content appears to materialize in.
const REVEAL_TOP_DELAY_MS = 200;
const REVEAL_SHEET_DELAY_MS = 320;
const REVEAL_FADE_MS = 380;

// Module flag rather than a route param: the Main stack doesn't forward
// route params to MainScreen, and the overlay must be known at the Main
// screen's very first render. The Auth screen requests the intro right
// before navigating; NewMain consumes it in its state initializer.
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

const MainIntroOverlay: React.FC<Props> = props => {
  const {online, onDone} = props;

  const insets = useSafeAreaInsets();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const {FOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
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

  // Block taps on the invisible content beneath: the responder claim
  // covers RN touchables, and the no-op gesture makes this view RNGH's
  // touch target on Android.
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

const getStyles = (screenHeight: number, foldSheetPoint: number) => {
  const sheetRadius = screenHeight * SHEET_TOP_RADIUS_RATIO;
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      // Above the tab bar chrome (3), below the glass modals (10).
      zIndex: 5,
    },
    sheet: {
      position: 'absolute',
      top: foldSheetPoint,
      left: 0,
      right: 0,
      // Extends past the screen bottom so only the top corners round.
      height: screenHeight - foldSheetPoint + sheetRadius * 2,
      borderTopLeftRadius: sheetRadius,
      borderTopRightRadius: sheetRadius,
      backgroundColor: SHEET_BACKGROUND,
    },
  });
};

export default React.memo(MainIntroOverlay);
