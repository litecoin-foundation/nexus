import React, {ReactNode, useEffect, useState, useRef, useContext} from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {BlurView} from 'expo-blur';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  isOpened: boolean;
  close: () => void;
  originX: number;
  originY: number;
  growDirection: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  animDuration: number;
  gapVertical?: number;
  gapHorizontal?: number;
  backSpecifiedStyle?: {};
  contentBodySpecifiedStyle?: {};
  animatedRectSpecifiedStyle?: {};
  disableBlur?: boolean;
  renderBody: (
    isOpened: boolean,
    showAnim: boolean,
    animDelay: number,
    animDuration: number,
  ) => ReactNode;
}

export default function Plasma2Modal(props: Props) {
  const {
    isOpened,
    close,
    originX,
    originY,
    growDirection,
    animDuration,
    gapVertical = 0,
    gapHorizontal = 0,
    backSpecifiedStyle,
    contentBodySpecifiedStyle,
    animatedRectSpecifiedStyle,
    disableBlur,
    renderBody,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const rectScale = useSharedValue(0);
  const backOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const [isVisible, setVisible] = useState(false);

  const animTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const contentTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Rect spans from origin to the opposite screen edges.
  // anchorX/anchorY = the origin corner in element-local coordinates,
  // used to compute translation that simulates transformOrigin.
  const rectLayout = (() => {
    switch (growDirection) {
      case 'top-left':
        return {
          top: originY,
          left: originX,
          width: SCREEN_WIDTH - originX - gapHorizontal,
          height: SCREEN_HEIGHT - originY - gapVertical,
          anchorX: 0,
          anchorY: 0,
        };
      case 'top-right': {
        const w = originX - gapHorizontal;
        return {
          top: originY,
          left: gapHorizontal,
          width: w,
          height: SCREEN_HEIGHT - originY - gapVertical,
          anchorX: w,
          anchorY: 0,
        };
      }
      case 'bottom-left': {
        const h = originY - gapVertical;
        return {
          top: gapVertical,
          left: originX,
          width: SCREEN_WIDTH - originX - gapHorizontal,
          height: h,
          anchorX: 0,
          anchorY: h,
        };
      }
      case 'bottom-right': {
        const w = originX - gapHorizontal;
        const h = originY - gapVertical;
        return {
          top: gapVertical,
          left: gapHorizontal,
          width: w,
          height: h,
          anchorX: w,
          anchorY: h,
        };
      }
    }
  })();

  useEffect(() => {
    if (isOpened) {
      setVisible(true);

      rectScale.value = withTiming(1, {duration: animDuration});
      backOpacity.value = withTiming(1, {duration: animDuration});

      contentTimeout.current = setTimeout(() => {
        contentOpacity.value = withTiming(1, {duration: animDuration * 0.3});
      }, animDuration);
    } else {
      contentOpacity.value = withTiming(0, {duration: animDuration * 0.2});

      rectScale.value = withTiming(0, {duration: animDuration});
      backOpacity.value = withTiming(0, {duration: animDuration - 50});

      animTimeout.current = setTimeout(() => {
        setVisible(false);
      }, animDuration);
    }

    return () => {
      clearTimeout(animTimeout.current);
      clearTimeout(contentTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened]);

  // Simulate transformOrigin via translate + scale.
  // RN scales around center by default. To scale around (anchorX, anchorY),
  // offset from center: dx = anchorX - width/2, dy = anchorY - height/2.
  const {anchorX, anchorY} = rectLayout;
  const offsetX = anchorX - rectLayout.width / 2;
  const offsetY = anchorY - rectLayout.height / 2;
  const animatedRectStyle = useAnimatedStyle(() => {
    const s = rectScale.value;
    return {
      transform: [
        {translateX: offsetX * (1 - s)},
        {translateY: offsetY * (1 - s)},
        {scale: s},
      ],
    };
  });

  const animatedBackOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: backOpacity.value,
    };
  });

  const animatedContentOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  const contentBodyAnimDelay = animDuration;
  const contentBodyAnimDuration = animDuration - 50;

  return (
    <>
      {isVisible ? (
        <Animated.View style={styles.container}>
          <Animated.View
            style={[styles.back, backSpecifiedStyle, animatedBackOpacityStyle]}>
            <BlurView
              intensity={disableBlur ? 0 : 14}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.backdropTouch}
            onPress={close}
          />
          <Animated.View
            style={[
              styles.rectContainer,
              animatedRectSpecifiedStyle,
              {
                top: rectLayout.top,
                left: rectLayout.left,
                width: rectLayout.width,
                height: rectLayout.height,
              },
              animatedRectStyle,
            ]}>
            <Animated.View
              style={[
                styles.contentBody,
                contentBodySpecifiedStyle,
                animatedContentOpacityStyle,
              ]}>
              {renderBody(
                isOpened,
                true,
                contentBodyAnimDelay,
                contentBodyAnimDuration,
              )}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      ) : (
        <></>
      )}
    </>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      width: screenWidth,
      height: screenHeight,
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
    backdropTouch: {
      position: 'absolute',
      top: 0,
      height: '100%',
      width: '100%',
      zIndex: 1,
    },
    rectContainer: {
      position: 'absolute',
      zIndex: 2,
      backgroundColor: '#1162e6',
      overflow: 'hidden',
    },
    contentBody: {
      flex: 1,
      width: '100%',
      backgroundColor: 'transparent',
    },
  });
