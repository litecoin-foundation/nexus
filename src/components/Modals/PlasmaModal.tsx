import React, {ReactNode, useEffect, useState, useRef} from 'react';
import {TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  ReduceMotion,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';

import {useAppSelector} from '../../store/hooks';

interface Props {
  isOpened: boolean;
  close: () => void;
  isFromBottomToTop: boolean;
  isSwiperActive?: boolean;
  animDuration: number;
  gapInPixels: number;
  backSpecifiedStyle?: {};
  gapSpecifiedStyle?: {};
  contentBodySpecifiedStyle?: {};
  rotateWalletButtonArrow?: () => void;
  swipeToPrevTx?: () => void;
  swipeToNextTx?: () => void;
  renderBody: (
    isOpened: boolean,
    showAnim: boolean,
    animDelay: number,
    animDuration: number,
    cardTranslateAnim: any,
    cardOpacityAnim: any,
    prevNextCardOpacityAnim: any,
  ) => ReactNode;
}

const SPRING_BACK_ANIM_DURATION = 100;
const SWIPE_CARDS_ANIM_DURATION = 200;
const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;

export default function PlasmaModal(props: Props) {
  const {
    isOpened,
    close,
    isFromBottomToTop,
    isSwiperActive,
    animDuration,
    gapInPixels,
    backSpecifiedStyle,
    gapSpecifiedStyle,
    contentBodySpecifiedStyle,
    rotateWalletButtonArrow,
    swipeToPrevTx,
    swipeToNextTx,
    renderBody,
  } = props;

  const swipeTriggerHeightRange = SCREEN_HEIGHT * 0.15;
  const swipeTriggerWidthRange = SCREEN_WIDTH * 0.15;
  const snapPoints = [
    isFromBottomToTop ? gapInPixels : SCREEN_HEIGHT,
    isFromBottomToTop ? gapInPixels + swipeTriggerHeightRange : SCREEN_HEIGHT - swipeTriggerHeightRange,
  ];
  const fullyOpenSnapPoint = snapPoints[0];
  const closedSnapPoint = snapPoints[snapPoints.length - 1];

  const isInternetReachable = useAppSelector(
    state => state.info.isInternetReachable,
  );

  const bodyTranslateY = useSharedValue(0);
  const bodyTranslateYStart = useSharedValue(0);
  const bodyTranslateX = useSharedValue(0);
  const bodyTranslateXStart = useSharedValue(0);
  const backOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const prevNextCardOpacity = useSharedValue(0);
  const prevNextCardScale = useSharedValue(0.7);

  function goPrevNextCard(isPrev: boolean) {
    bodyTranslateX.value = withTiming(isPrev ? SCREEN_WIDTH : SCREEN_WIDTH * -1, {duration: SWIPE_CARDS_ANIM_DURATION});
    cardOpacity.value = withTiming(0, {duration: SWIPE_CARDS_ANIM_DURATION});
    prevNextCardOpacity.value = withTiming(1, {duration: SWIPE_CARDS_ANIM_DURATION});
    cardScale.value = withTiming(0.7, {duration: SWIPE_CARDS_ANIM_DURATION});
    prevNextCardScale.value = withTiming(1, {duration: SWIPE_CARDS_ANIM_DURATION});

    // Error when using multiple withSequence so have to use setTimeout instead
    // cardOpacity.value = withSequence(withTiming(0, {duration: SWIPE_CARDS_ANIM_DURATION}), 1);
    // prevNextCardOpacity.value = withSequence(withTiming(1, {duration: SWIPE_CARDS_ANIM_DURATION}), 0);
    // cardScale.value = withSequence(withTiming(0.7, {duration: SWIPE_CARDS_ANIM_DURATION}), 1);
    // prevNextCardScale.value = withSequence(withTiming(1, {duration: SWIPE_CARDS_ANIM_DURATION}), 0.7);

    setTimeout(() => {
      bodyTranslateX.value = 0;
      cardOpacity.value = 1;
      prevNextCardOpacity.value = 0;
      cardScale.value = 1;
      prevNextCardScale.value = 0.7;
    }, SWIPE_CARDS_ANIM_DURATION);
  }

  const closeTrigger = ({translationY, velocityY}: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.05;
    const destSnapPoint = translationY + bodyTranslateYStart.value + velocityY * dragToss;

    bodyTranslateY.value = withSpring(destSnapPoint, {
      mass: 0.1,
    });

    if (typeof rotateWalletButtonArrow === 'function') {
      runOnJS(rotateWalletButtonArrow)();
    }
    runOnJS(close)();
  };

  const swipeToPrevTxTrigger = ({translationX, velocityX}: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.1;
    const destSnapPoint = translationX + bodyTranslateXStart.value + velocityX * dragToss;

    bodyTranslateX.value = withSpring(destSnapPoint, {
      mass: 0.1,
    });

    if (typeof swipeToPrevTx === 'function') {
      runOnJS(goPrevNextCard)(true);
      runOnJS(swipeToPrevTx)();
    }
  };

  const swipeToNextTxTrigger = ({translationX, velocityX}: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.1;
    const destSnapPoint = translationX + bodyTranslateXStart.value + velocityX * dragToss;

    bodyTranslateX.value = withSpring(destSnapPoint, {
      mass: 0.1,
    });

    if (typeof swipeToNextTx === 'function') {
      runOnJS(goPrevNextCard)(false);
      runOnJS(swipeToNextTx)();
    }
  };

  const panYGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (bodyTranslateX.value === 0 || !isSwiperActive) {
        if (isFromBottomToTop) {
          if (e.translationY > 0) {
            bodyTranslateY.value = e.translationY + bodyTranslateYStart.value;
          }
        } else {
          if (e.translationY < 0) {
            bodyTranslateY.value = e.translationY + bodyTranslateYStart.value;
          }
        }
      }
    })
    .onEnd((e) => {
      if (bodyTranslateX.value === 0 || !isSwiperActive) {
        if (isFromBottomToTop) {
          if (e.translationY + fullyOpenSnapPoint > closedSnapPoint) {
            closeTrigger(e);
          } else {
            bodyTranslateY.value = withTiming(bodyTranslateYStart.value, {duration: SPRING_BACK_ANIM_DURATION});
          }
        } else {
          if (e.translationY + fullyOpenSnapPoint < closedSnapPoint) {
            closeTrigger(e);
          } else {
            bodyTranslateY.value = withTiming(bodyTranslateYStart.value, {duration: SPRING_BACK_ANIM_DURATION});
          }
        }
      }
    });

  const panXGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (bodyTranslateY.value === 0) {
        bodyTranslateX.value = e.translationX + bodyTranslateXStart.value;
        cardOpacity.value = interpolate(e.translationX, [SCREEN_WIDTH * -1, 0, SCREEN_WIDTH], [0, 1, 0]);
        prevNextCardOpacity.value = interpolate(e.translationX, [SCREEN_WIDTH * -1, 0, SCREEN_WIDTH], [1, 0, 1]);
        cardScale.value = interpolate(e.translationX, [SCREEN_WIDTH * -1, 0, SCREEN_WIDTH], [0.7, 1, 0.7]);
        prevNextCardScale.value = interpolate(e.translationX, [SCREEN_WIDTH * -1, 0, SCREEN_WIDTH], [1, 0.7, 1]);
      }
    })
    .onEnd((e) => {
      if (bodyTranslateY.value === 0) {
        if (e.translationX > swipeTriggerWidthRange) {
          swipeToPrevTxTrigger(e);
        } else if (Math.abs(e.translationX) > swipeTriggerWidthRange) {
          swipeToNextTxTrigger(e);
        } else {
          bodyTranslateX.value = withTiming(bodyTranslateXStart.value, {duration: SPRING_BACK_ANIM_DURATION});
          cardOpacity.value = withTiming(1, {duration: SPRING_BACK_ANIM_DURATION});
          prevNextCardOpacity.value = withTiming(0, {duration: SPRING_BACK_ANIM_DURATION});
          cardScale.value = withTiming(1, {duration: SPRING_BACK_ANIM_DURATION});
          prevNextCardScale.value = withTiming(0.7, {duration: SPRING_BACK_ANIM_DURATION});
        }
      }
    })
    .simultaneousWithExternalGesture(panYGesture);

  const animatedContentBodyTranslateStyle = useAnimatedProps(() => {
    return {
      transform: [
        {translateX: bodyTranslateX.value},
        {translateY: bodyTranslateY.value},
      ],
    };
  });

  const animatedBackOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: backOpacity.value,
    };
  });

  const animatedCardOpacityStyle = useAnimatedProps(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{scale: cardScale.value}],
    };
  });

  const animatedPrevNextCardOpacityStyle = useAnimatedProps(() => {
    return {
      opacity: prevNextCardOpacity.value,
      transform: [{scale: prevNextCardScale.value}],
    };
  });

  const [isVisible, setVisible] = useState(false);

  const contentBodyAnimDelay = animDuration - 50;

  const animTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpened) {
      setVisible(isOpened);
    } else {
      animTimeout.current = setTimeout(() => {
        setVisible(isOpened);
      }, animDuration);
    }

    if (isOpened) {
      bodyTranslateY.value = withTiming(0, {
        duration: animDuration + 200,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      });

      backOpacity.value = withTiming(1, {duration: animDuration});
    } else {
      bodyTranslateY.value = withTiming(
        (Dimensions.get('screen').height - gapInPixels) *
          (isFromBottomToTop ? 1 : -1),
        {duration: animDuration},
      );

      backOpacity.value = withTiming(0, {duration: animDuration - 50});
    }

    return () => {
      clearTimeout(animTimeout.current);
    };
  }, [bodyTranslateY, backOpacity, animDuration, gapInPixels, isFromBottomToTop, isOpened]);

  return (
    <>
      {isVisible ? (
        <GestureDetector gesture={isSwiperActive ? Gesture.Simultaneous(panYGesture, panXGesture) : panYGesture}>
          <Animated.View
            style={[
              styles.container,
              {justifyContent: isFromBottomToTop ? 'flex-end' : 'flex-start'},
            ]}>
            <Animated.View style={[styles.back, backSpecifiedStyle, animatedBackOpacityStyle]} />
            <Animated.View
              style={[
                styles.gap,
                {
                  flexBasis: gapInPixels,
                  backgroundColor: isInternetReachable ? '#1162e6' : '#f36f56',
                },
                gapSpecifiedStyle,
              ]}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={{width: '100%', height: '100%'}}
                onPress={() => close()}
              />
            </Animated.View>
              <Animated.View
                style={[
                  styles.contentBody,
                  // animatedContentBodyTranslateStyle,
                  {
                    flex: isFromBottomToTop ? 1 : 0,
                    height: Dimensions.get('screen').height - gapInPixels,
                    backgroundColor: isInternetReachable ? '#0d3d8a' : '#e06852',
                  },
                  contentBodySpecifiedStyle,
                ]}>
                {renderBody(
                  isOpened,
                  true,
                  contentBodyAnimDelay,
                  animDuration - 50,
                  animatedContentBodyTranslateStyle,
                  animatedCardOpacityStyle,
                  animatedPrevNextCardOpacityStyle,
                )}
              </Animated.View>
          </Animated.View>
        </GestureDetector>
      ) : (
        <></>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '100%',
    flexDirection: 'column',
    margin: 0,
    zIndex: 10,
  },
  back: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '100%',
    backgroundColor: '#1162e6',
    zIndex: 0,
  },
  gap: {
    backgroundColor: '#1162e6',
    zIndex: 2,
  },
  contentBody: {
    width: '100%',
    backgroundColor: '#0d3d8a',
    zIndex: 1,
  },
});
