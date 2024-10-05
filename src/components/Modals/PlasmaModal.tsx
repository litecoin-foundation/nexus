import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions, Platform} from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Fill,
  Image,
  BackdropBlur,
  useImage,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  isVisible: boolean;
  isFromBottomToTop: boolean,
  close: () => void;
  gapInPixels: number,
  contentBodySpecifiedStyle?: {};
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
  const {children, isVisible, isFromBottomToTop, close, gapInPixels, contentBodySpecifiedStyle} = props;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      height: '100%',
      width: '100%',
      flexDirection: 'column',
      justifyContent: isFromBottomToTop ? 'flex-end' : 'flex-start',
      // justifyContent: 'flex-end',
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
      // flexBasis: gapInPixels,
    },
    contentBody: {
      // flex: 1,
      width: '100%',
      backgroundColor: '#0d3d8a',
    },
  });

  const gapShrink = useSharedValue(Dimensions.get('screen').height);
  const contentBodyHeight = useSharedValue(0);

  const animatedGapShrinkStyle = useAnimatedStyle(() => {
    return {
      flexBasis: gapShrink.value,
    };
  });

  const animatedContentBodyHeightStyle = useAnimatedStyle(() => {
    return isFromBottomToTop ? {
      flex: 1,
    } : {
      height: contentBodyHeight.value,
    };
  });

  useEffect(() => {
    if (isFromBottomToTop) {
      if (isVisible) {
        gapShrink.value = withTiming(gapInPixels,  { duration: 500 });
        contentBodyHeight.value = Dimensions.get('screen').height - gapInPixels;
      } else {
        gapShrink.value = Dimensions.get('screen').height;
        contentBodyHeight.value = 0;
      }
    } else {
      if (isVisible) {
        gapShrink.value = gapInPixels;
        contentBodyHeight.value = withTiming(Dimensions.get('screen').height - gapInPixels,  { duration: 500 });
      } else {
        gapShrink.value = Dimensions.get('screen').height;
        contentBodyHeight.value = 0;
      }
    }
  }, [isVisible, isFromBottomToTop]);

  return (
    <>
      {isVisible ? (
        <View style={styles.container}>
          <Canvas style={styles.back} >
            <BackdropBlur blur={10}>
              <Fill color="rgba(0, 0, 0, 0.2)" />
            </BackdropBlur>
          </Canvas>
          <Animated.View style={[
              styles.gap,
              animatedGapShrinkStyle,
            ]}
          />
          <Animated.View style={[
            styles.contentBody,
            contentBodySpecifiedStyle,
            animatedContentBodyHeightStyle,
            ]}>
            {children}
          </Animated.View>
        </View>
      ) : (
        <></>
      )}
    </>
  );
}
