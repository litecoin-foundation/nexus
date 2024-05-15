import React, {useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import {
  Gesture,
  GestureDetector,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SNAP_POINTS_FROM_TOP = [150, 350];
const FULLY_OPEN_SNAP_POINT = SNAP_POINTS_FROM_TOP[0];
const CLOSED_SNAP_POINT = SNAP_POINTS_FROM_TOP[SNAP_POINTS_FROM_TOP.length - 1];

interface Props {
  children: React.ReactNode;
  headerComponent: React.ReactNode;
  translationY: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  handleSwipeDown: () => void;
}

const BottomSheet: React.FC<Props> = props => {
  const {
    children,
    headerComponent,
    translationY,
    scrollOffset,
    handleSwipeDown,
  } = props;
  const panGestureRef = useRef(Gesture.Pan());
  const blockScrollUntilAtTheTopRef = useRef(Gesture.Tap());
  const [snapPoint, setSnapPoint] = useState(CLOSED_SNAP_POINT);
  const bottomSheetTranslateY = useSharedValue(CLOSED_SNAP_POINT);

  const onHandlerEndOnJS = (point: number) => {
    setSnapPoint(point);
    // check if BottomSheet is being swiped away
    // if true, close open tab and show tx history!
    // TODO: fix slowdown
    if (point === 350) {
      runOnJS(handleSwipeDown)();
    }
  };
  const onHandlerEnd = ({velocityY}: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.05;
    const endOffsetY =
      bottomSheetTranslateY.value + translationY.value + velocityY * dragToss;

    // calculate nearest snap point
    let destSnapPoint = FULLY_OPEN_SNAP_POINT;

    if (
      snapPoint === FULLY_OPEN_SNAP_POINT &&
      endOffsetY < FULLY_OPEN_SNAP_POINT
    ) {
      return;
    }

    for (const snapPointComputed of SNAP_POINTS_FROM_TOP) {
      const distFromSnap = Math.abs(snapPointComputed - endOffsetY);
      if (distFromSnap < Math.abs(destSnapPoint - endOffsetY)) {
        destSnapPoint = snapPointComputed;
      }
    }

    // lsohy

    // update current translation to be able to animate withSpring to snapPoint
    bottomSheetTranslateY.value =
      bottomSheetTranslateY.value + translationY.value;
    translationY.value = 0;

    bottomSheetTranslateY.value = withSpring(destSnapPoint, {
      mass: 0.5,
    });
    runOnJS(onHandlerEndOnJS)(destSnapPoint);
  };
  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      // when bottom sheet is not fully opened scroll offset should not influence
      // its position (prevents random snapping when opening bottom sheet when
      // the content is already scrolled)
      if (snapPoint === FULLY_OPEN_SNAP_POINT) {
        translationY.value = e.translationY - scrollOffset.value;
      } else {
        translationY.value = e.translationY;
      }
    })
    .onEnd(onHandlerEnd)
    .withRef(panGestureRef);

  const blockScrollUntilAtTheTop = Gesture.Tap()
    .maxDeltaY(snapPoint - FULLY_OPEN_SNAP_POINT)
    .maxDuration(100000)
    .simultaneousWithExternalGesture(panGesture)
    .withRef(blockScrollUntilAtTheTopRef);

  const headerGesture = Gesture.Pan()
    .onUpdate(e => {
      translationY.value = e.translationY;
    })
    .onEnd(onHandlerEnd);

  const scrollViewGesture = Gesture.Native().requireExternalGestureToFail(
    blockScrollUntilAtTheTop,
  );

  const bottomSheetAnimatedStyle = useAnimatedStyle(() => {
    const translateY = bottomSheetTranslateY.value + translationY.value;

    const minTranslateY = Math.max(FULLY_OPEN_SNAP_POINT, translateY);
    const clampedTranslateY = Math.min(CLOSED_SNAP_POINT, minTranslateY);
    return {
      transform: [{translateY: clampedTranslateY}],
    };
  });

  return (
    <GestureDetector gesture={blockScrollUntilAtTheTop}>
      <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]}>
        <GestureDetector gesture={headerGesture}>
          {headerComponent}
        </GestureDetector>
        <GestureDetector
          gesture={Gesture.Simultaneous(panGesture, scrollViewGesture)}>
          {children}
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});

export default BottomSheet;
