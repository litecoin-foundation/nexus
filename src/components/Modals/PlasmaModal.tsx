import React, {ReactNode, useEffect, useState, useRef} from 'react';
import {View, StyleSheet, Dimensions, Platform} from 'react-native';
import {
  Canvas,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

interface Props {
  isOpened: boolean;
  close: () => void;
  isFromBottomToTop: boolean,
  animDuration: number,
  gapInPixels: number,
  backSpecifiedStyle?: {};
  contentBodySpecifiedStyle?: {};
  renderBody: (isOpened: boolean, showAnim: boolean, animDelay: number, animDuration: number) => ReactNode;
}

const fontFamily =
  Platform.OS === 'ios' ? 'Satoshi Variable' : 'SatoshiVariable-Regular.ttf';
const fontStyle = {
  fontFamily,
  fontSize: 30,
  fontStyle: 'normal',
  fontWeight: '700',
};
const font = matchFont(fontStyle);

export default function PlasmaModal(props:Props) {
  const {isOpened, close, isFromBottomToTop, animDuration, gapInPixels, backSpecifiedStyle, contentBodySpecifiedStyle, renderBody} = props;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      height: '100%',
      width: '100%',
      flexDirection: 'column',
      justifyContent: isFromBottomToTop ? 'flex-end' : 'flex-start',
      margin: 0,
      zIndex: 10,
    },
    back: {
      position: 'absolute',
      top: 0,
      height: '100%',
      width: '100%',
      zIndex: 0,
    },
    gap: {
      flexBasis: gapInPixels,
      backgroundColor: '#1162E6',
      zIndex: 2,
    },
    contentBody: {
      flex: isFromBottomToTop ? 1 : 0,
      height: Dimensions.get('screen').height - gapInPixels,
      width: '100%',
      backgroundColor: '#0d3d8a',
      zIndex: 1,
    },
  });

  // const gapShrink = useSharedValue(0);
  // const contentBodyHeight = useSharedValue(0);
  const contentBodyYPos = useSharedValue(0);

  // const animatedGapShrinkStyle = useAnimatedStyle(() => {
  //   return {
  //     flexBasis: gapShrink.value,
  //   };
  // });
  // const animatedContentBodyHeightStyle = useAnimatedStyle(() => {
  //   return {
  //     height: contentBodyHeight.value,
  //   };
  // });
  const animatedContentBodyYPosStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: contentBodyYPos.value}],
    };
  });

  const [isVisible, setVisible] = useState(false);

  const contentBodyAnimDelay = animDuration - 50;
  const [startContentBodyAnim, setStartContentBodyAnim] = useState(true);

  const animTimeout = useRef();
  const contentBodyAnimTimeout = useRef();
  // let animTimeout: null | ReturnType<typeof setTimeout> = null;
  // let contentBodyAnimTimeout: null | ReturnType<typeof setTimeout> = null;

  useEffect(() => {
    if (isOpened) {
      setVisible(isOpened);

      // contentBodyAnimTimeout.current = setTimeout(() => {
      //   setStartContentBodyAnim(true);
      // }, 5000);
    } else {
      animTimeout.current = setTimeout(() => {
        setVisible(isOpened);
      }, animDuration);

      // setStartContentBodyAnim(true);
    }

    // if (isFromBottomToTop) {
    //   // contentBodyHeight.value = Dimensions.get('screen').height - gapInPixels;
    //   contentBodyYPos.value = 0;
    //   if (isOpened) {
    //     gapShrink.value = withTiming(gapInPixels,  { duration: animDuration });
    //   } else {
    //     // gapShrink.value = Dimensions.get('screen').height;
    //     gapShrink.value = withTiming(Dimensions.get('screen').height,  { duration: animDuration });
    //   }
    // } else {
    //   gapShrink.value = gapInPixels;
    //   if (isOpened) {
    //     // contentBodyHeight.value = withTiming(Dimensions.get('screen').height - gapInPixels,  { duration: animDuration });
    //     contentBodyYPos.value = withTiming(0,  { duration: animDuration });
    //   } else {
    //     // contentBodyHeight.value = 0;
    //     contentBodyYPos.value = withTiming((Dimensions.get('screen').height - gapInPixels) * -1,  { duration: animDuration });
    //   }
    // }

    if (isOpened) {
      contentBodyYPos.value = withTiming(0,  { duration: animDuration });
    } else {

      contentBodyYPos.value = withTiming((Dimensions.get('screen').height - gapInPixels) * (isFromBottomToTop ? 1 : -1),  { duration: animDuration });
    }

    return () => {
      clearTimeout(animTimeout.current);
      clearTimeout(contentBodyAnimTimeout.current);
    };
  }, [isOpened]);

  return (
    <>
      {isVisible ? (
        <View style={styles.container}>
          <View style={[styles.back, backSpecifiedStyle]} />
          <Animated.View style={[
              styles.gap,
              // animatedGapShrinkStyle,
            ]}
          />
          <Animated.View style={[
            styles.contentBody,
            contentBodySpecifiedStyle,
            // animatedContentBodyHeightStyle,
            animatedContentBodyYPosStyle,
            ]}>
            {renderBody(isOpened, startContentBodyAnim, contentBodyAnimDelay, animDuration - 50)}
          </Animated.View>
        </View>
      ) : (
        <></>
      )}
    </>
  );
}
