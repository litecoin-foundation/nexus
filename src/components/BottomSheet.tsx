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
  withSpring,
} from 'react-native-reanimated';

const SNAP_POINTS_FROM_TOP = [250, 350];
const FULLY_OPEN_SNAP_POINT = SNAP_POINTS_FROM_TOP[0];
const CLOSED_SNAP_POINT = SNAP_POINTS_FROM_TOP[SNAP_POINTS_FROM_TOP.length - 1];

interface Props {
  txViewComponent: React.ReactNode;
  buyViewComponent: React.ReactNode;
  sellViewComponent: React.ReactNode;
  sendViewComponent: React.ReactNode;
  receiveViewComponent: React.ReactNode;
  headerComponent: React.ReactNode;
  translationY: SharedValue<number>;
  bottomSheetTranslateY: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  handleSwipeDown: () => void;
  activeTab: number;
}

const BottomSheet: React.FC<Props> = props => {
  const {
    txViewComponent,
    buyViewComponent,
    sellViewComponent,
    sendViewComponent,
    receiveViewComponent,
    headerComponent,
    translationY,
    bottomSheetTranslateY,
    scrollOffset,
    handleSwipeDown,
    activeTab,
  } = props;
  const panGestureRef = useRef(Gesture.Pan());
  const blockScrollUntilAtTheTopRef = useRef(Gesture.Tap());
  const [snapPoint, setSnapPoint] = useState(CLOSED_SNAP_POINT);

  const onHandlerEndOnJS = (point: number) => {
    setSnapPoint(point);
    // check if BottomSheet is being swiped away
    // if true, close open tab and show tx history!
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
        {activeTab === 0 ? (
          <GestureDetector
            gesture={Gesture.Simultaneous(panGesture, scrollViewGesture)}>
            {txViewComponent}
          </GestureDetector>
        ) : null}
        {activeTab === 1 ? (
          <GestureDetector
            gesture={Gesture.Simultaneous(panGesture, scrollViewGesture)}>
            {buyViewComponent}
          </GestureDetector>
        ) : null}
        {activeTab === 2 ? (
          <GestureDetector
            gesture={Gesture.Simultaneous(panGesture, scrollViewGesture)}>
            {sellViewComponent}
          </GestureDetector>
        ) : null}
        {activeTab === 4 ? (
          <GestureDetector
            gesture={Gesture.Simultaneous(panGesture, scrollViewGesture)}>
            {sendViewComponent}
          </GestureDetector>
        ) : null}
        {activeTab === 5 ? (
          <GestureDetector
            gesture={Gesture.Simultaneous(panGesture, scrollViewGesture)}>
            {receiveViewComponent}
          </GestureDetector>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f7f7f7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});

export default BottomSheet;
