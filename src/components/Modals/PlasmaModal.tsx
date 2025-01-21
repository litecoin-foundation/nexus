import React, {ReactNode, useEffect, useState, useRef, useContext} from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
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
import {BlurView} from 'expo-blur';

import {useAppSelector} from '../../store/hooks';

import {ScreenSizeContext} from '../../context/screenSize';

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
  disableBlur?: boolean;
  renderBody: (
    isOpened: boolean,
    showAnim: boolean,
    animDelay: number,
    animDuration: number,
    cardTranslateAnim: any,
    cardOpacityAnim: any,
    prevNextCardOpacityAnim: any,
    paginationOpacityAnim: any,
  ) => ReactNode;
}

const SPRING_BACK_ANIM_DURATION = 100;
const SWIPE_CARDS_ANIM_DURATION = 200;

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
    disableBlur,
    renderBody,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  const swipeTriggerHeightRange = SCREEN_HEIGHT * 0.15;
  const swipeTriggerWidthRange = SCREEN_WIDTH * 0.15;
  const snapPoints = [
    isFromBottomToTop ? gapInPixels : SCREEN_HEIGHT,
    isFromBottomToTop
      ? gapInPixels + swipeTriggerHeightRange
      : SCREEN_HEIGHT - swipeTriggerHeightRange,
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
  const paginationOpacity = useSharedValue(1);

  function goPrevNextCard(isPrev: boolean) {
    bodyTranslateX.value = withTiming(
      isPrev ? SCREEN_WIDTH : SCREEN_WIDTH * -1,
      {duration: SWIPE_CARDS_ANIM_DURATION},
    );
    cardOpacity.value = withTiming(0, {duration: SWIPE_CARDS_ANIM_DURATION});
    prevNextCardOpacity.value = withTiming(1, {
      duration: SWIPE_CARDS_ANIM_DURATION,
    });
    cardScale.value = withTiming(0.7, {duration: SWIPE_CARDS_ANIM_DURATION});
    prevNextCardScale.value = withTiming(1, {
      duration: SWIPE_CARDS_ANIM_DURATION,
    });

    setTimeout(() => {
      bodyTranslateX.value = 0;
      cardOpacity.value = 1;
      prevNextCardOpacity.value = 0;
      cardScale.value = 1;
      prevNextCardScale.value = 0.7;
    }, SWIPE_CARDS_ANIM_DURATION);
  }

  const closeTrigger = ({
    translationY,
    velocityY,
  }: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.05;
    const destSnapPoint =
      translationY + bodyTranslateYStart.value + velocityY * dragToss;

    bodyTranslateY.value = withSpring(destSnapPoint, {
      mass: 0.1,
    });

    if (typeof rotateWalletButtonArrow === 'function') {
      runOnJS(rotateWalletButtonArrow)();
    }
    runOnJS(close)();
  };

  const swipeToPrevTxTrigger = ({
    translationX,
    velocityX,
  }: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.1;
    const destSnapPoint =
      translationX + bodyTranslateXStart.value + velocityX * dragToss;

    bodyTranslateX.value = withSpring(destSnapPoint, {
      mass: 0.1,
    });

    if (typeof swipeToPrevTx === 'function') {
      runOnJS(goPrevNextCard)(true);
      runOnJS(swipeToPrevTx)();
    }
  };

  const swipeToNextTxTrigger = ({
    translationX,
    velocityX,
  }: PanGestureHandlerEventPayload) => {
    'worklet';
    const dragToss = 0.1;
    const destSnapPoint =
      translationX + bodyTranslateXStart.value + velocityX * dragToss;

    bodyTranslateX.value = withSpring(destSnapPoint, {
      mass: 0.1,
    });

    if (typeof swipeToNextTx === 'function') {
      runOnJS(goPrevNextCard)(false);
      runOnJS(swipeToNextTx)();
    }
  };

  const panYGesture = Gesture.Pan()
    .onUpdate(e => {
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
    .onEnd(e => {
      if (bodyTranslateX.value === 0 || !isSwiperActive) {
        if (isFromBottomToTop) {
          if (e.translationY + fullyOpenSnapPoint > closedSnapPoint) {
            closeTrigger(e);
          } else {
            bodyTranslateY.value = withTiming(bodyTranslateYStart.value, {
              duration: SPRING_BACK_ANIM_DURATION,
            });
          }
        } else {
          if (e.translationY + fullyOpenSnapPoint < closedSnapPoint) {
            closeTrigger(e);
          } else {
            bodyTranslateY.value = withTiming(bodyTranslateYStart.value, {
              duration: SPRING_BACK_ANIM_DURATION,
            });
          }
        }
      }
    });

  const panXGesture = Gesture.Pan()
    .onUpdate(e => {
      if (bodyTranslateY.value === 0) {
        bodyTranslateX.value = e.translationX + bodyTranslateXStart.value;
        cardOpacity.value = interpolate(
          e.translationX,
          [SCREEN_WIDTH * -1, 0, SCREEN_WIDTH],
          [0, 1, 0],
        );
        prevNextCardOpacity.value = interpolate(
          e.translationX,
          [SCREEN_WIDTH * -1, 0, SCREEN_WIDTH],
          [1, 0, 1],
        );
        cardScale.value = interpolate(
          e.translationX,
          [SCREEN_WIDTH * -1, 0, SCREEN_WIDTH],
          [0.7, 1, 0.7],
        );
        prevNextCardScale.value = interpolate(
          e.translationX,
          [SCREEN_WIDTH * -1, 0, SCREEN_WIDTH],
          [1, 0.7, 1],
        );
      }
    })
    .onEnd(e => {
      if (bodyTranslateY.value === 0) {
        if (e.translationX > swipeTriggerWidthRange) {
          swipeToPrevTxTrigger(e);
        } else if (Math.abs(e.translationX) > swipeTriggerWidthRange) {
          swipeToNextTxTrigger(e);
        } else {
          bodyTranslateX.value = withTiming(bodyTranslateXStart.value, {
            duration: SPRING_BACK_ANIM_DURATION,
          });
          cardOpacity.value = withTiming(1, {
            duration: SPRING_BACK_ANIM_DURATION,
          });
          prevNextCardOpacity.value = withTiming(0, {
            duration: SPRING_BACK_ANIM_DURATION,
          });
          cardScale.value = withTiming(1, {
            duration: SPRING_BACK_ANIM_DURATION,
          });
          prevNextCardScale.value = withTiming(0.7, {
            duration: SPRING_BACK_ANIM_DURATION,
          });
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

  const animatedPaginationOpacityStyle = useAnimatedProps(() => {
    return {
      opacity: paginationOpacity.value,
    };
  });

  const [isVisible, setVisible] = useState(false);

  // Make content render after modal starts rendering
  const contentBodyAnimDelay = animDuration - 100;
  // Make conter render a bit faster than modal
  const contentBodyAnimDuration = animDuration - 50;

  const animTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Wait for animation to finish before hiding modal
    if (isOpened) {
      setVisible(isOpened);
    } else {
      animTimeout.current = setTimeout(() => {
        setVisible(isOpened);
      }, animDuration);
    }

    // Play opening/closing animation
    if (isOpened) {
      bodyTranslateY.value = withSpring(0, {
        duration: animDuration + 900,
        dampingRatio: 1,
        stiffness: 80,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
        reduceMotion: ReduceMotion.Never,
      });

      backOpacity.value = withTiming(1, {duration: animDuration});
      paginationOpacity.value = withTiming(1, {duration: animDuration});
    } else {
      bodyTranslateY.value = withTiming(
        (SCREEN_HEIGHT - gapInPixels) * (isFromBottomToTop ? 1 : -1),
        {duration: animDuration},
      );

      backOpacity.value = withTiming(0, {duration: animDuration - 50});
      paginationOpacity.value = withTiming(0, {duration: animDuration - 50});
    }

    return () => {
      clearTimeout(animTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bodyTranslateY,
    backOpacity,
    animDuration,
    gapInPixels,
    isFromBottomToTop,
    isOpened,
  ]);

  const containerJustifyContent = isFromBottomToTop ? 'flex-end' : 'flex-start';
  const gapBgColor = isInternetReachable ? '#1162e6' : '#f36f56';
  const contentBodyConditionStyle = {
    flex: isFromBottomToTop ? 1 : 0,
    height: SCREEN_HEIGHT - gapInPixels,
  };

  return (
    <>
      {isVisible ? (
        <GestureDetector
          gesture={
            isSwiperActive
              ? Gesture.Simultaneous(panYGesture, panXGesture)
              : panYGesture
          }>
          <Animated.View
            style={[
              styles.container,
              {justifyContent: containerJustifyContent},
            ]}>
            <AnimatedBlurView
              intensity={disableBlur ? 0 : 14}
              style={[
                styles.back,
                backSpecifiedStyle,
                animatedBackOpacityStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.gap,
                {
                  flexBasis: gapInPixels,
                  backgroundColor: gapBgColor,
                },
                gapSpecifiedStyle,
              ]}>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.closeArea}
                onPress={() => {
                  if (typeof rotateWalletButtonArrow === 'function') {
                    rotateWalletButtonArrow();
                  }
                  close();
                }}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.contentBody,
                contentBodyConditionStyle,
                contentBodySpecifiedStyle,
              ]}>
              {renderBody(
                isOpened,
                true,
                contentBodyAnimDelay,
                contentBodyAnimDuration,
                animatedContentBodyTranslateStyle,
                animatedCardOpacityStyle,
                animatedPrevNextCardOpacityStyle,
                animatedPaginationOpacityStyle,
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
  closeArea: {
    height: '100%',
    width: '100%',
  },
  contentBody: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});
