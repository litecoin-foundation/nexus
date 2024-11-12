import React, {ReactNode, useEffect, useState, useRef} from 'react';
import {View, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  ReduceMotion,
} from 'react-native-reanimated';

import {useAppSelector} from '../../store/hooks';

interface Props {
  isOpened: boolean;
  close: () => void;
  isFromBottomToTop: boolean;
  animDuration: number;
  gapInPixels: number;
  backSpecifiedStyle?: {};
  gapSpecifiedStyle?: {};
  contentBodySpecifiedStyle?: {};
  renderBody: (
    isOpened: boolean,
    showAnim: boolean,
    animDelay: number,
    animDuration: number,
  ) => ReactNode;
}

export default function PlasmaModal(props: Props) {
  const {
    isOpened,
    close,
    isFromBottomToTop,
    animDuration,
    gapInPixels,
    backSpecifiedStyle,
    gapSpecifiedStyle,
    contentBodySpecifiedStyle,
    renderBody,
  } = props;

  const isInternetReachable = useAppSelector(
    state => state.info.isInternetReachable,
  );

  const contentBodyYPos = useSharedValue(0);

  const animatedContentBodyYPosStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: contentBodyYPos.value}],
    };
  });

  const [isVisible, setVisible] = useState(false);

  const contentBodyAnimDelay = animDuration - 50;
  const [startContentBodyAnim, setStartContentBodyAnim] = useState(true);

  const animTimeout = useRef<NodeJS.Timeout>();
  const contentBodyAnimTimeout = useRef();

  useEffect(() => {
    if (isOpened) {
      setVisible(isOpened);
    } else {
      animTimeout.current = setTimeout(() => {
        setVisible(isOpened);
      }, animDuration);
    }

    if (isOpened) {
      contentBodyYPos.value = withTiming(0, {
        duration: animDuration + 200,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      });
    } else {
      contentBodyYPos.value = withTiming(
        (Dimensions.get('screen').height - gapInPixels) *
          (isFromBottomToTop ? 1 : -1),
        {duration: animDuration},
      );
    }

    return () => {
      clearTimeout(animTimeout.current);
      clearTimeout(contentBodyAnimTimeout.current);
    };
  }, [animDuration, contentBodyYPos, gapInPixels, isFromBottomToTop, isOpened]);

  return (
    <>
      {isVisible ? (
        <View
          style={[
            styles.container,
            {justifyContent: isFromBottomToTop ? 'flex-end' : 'flex-start'},
          ]}>
          <View style={[styles.back, backSpecifiedStyle]} />
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
              animatedContentBodyYPosStyle,
              {
                flex: isFromBottomToTop ? 1 : 0,
                height: Dimensions.get('screen').height - gapInPixels,
                backgroundColor: isInternetReachable ? '#0d3d8a' : '#e06852',
              },
              contentBodySpecifiedStyle,
            ]}>
            {renderBody(
              isOpened,
              startContentBodyAnim,
              contentBodyAnimDelay,
              animDuration - 50,
            )}
          </Animated.View>
        </View>
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
    overflow: 'hidden',
    zIndex: 1,
  },
});
