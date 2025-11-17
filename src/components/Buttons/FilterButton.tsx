import React, {useContext, useEffect} from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  active: boolean;
  title?: string;
  textKey?: string;
  textDomain?: string;
  onPress: () => void;
  imageSource: ImageSourcePropType;
  tint?: boolean;
}

const FilterButton: React.FC<Props> = props => {
  const {active, title, textKey, textDomain, onPress, imageSource, tint} =
    props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, tint);

  const scaleValue = useSharedValue(1);
  const backgroundValue = useSharedValue(active ? 2 : 0);

  const motionStyle = useAnimatedStyle(() => {
    const bgIterpolation = interpolateColor(
      backgroundValue.value,
      [0, 1, 2],
      ['transparent', '#0a429b80', '#0a429b'],
    );

    return {
      transform: [{scale: scaleValue.value}],
      backgroundColor: bgIterpolation,
    };
  });

  const onPressIn = () => {
    scaleValue.value = withSpring(0.9, {mass: 1});
    backgroundValue.value = withSpring(1, {mass: 1});
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1, {mass: 0.7});
    backgroundValue.value = 2;
    onPress();
  };

  useEffect(() => {
    if (!active) {
      backgroundValue.value = 0;
    }
  }, [active, backgroundValue]);

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.button, motionStyle]}>
        <Image style={styles.image} source={imageSource} />
        {title ? (
          <Text style={styles.text}>{title}</Text>
        ) : textKey && textDomain ? (
          <TranslateText
            textKey={textKey}
            domain={textDomain}
            maxSizeInPixels={SCREEN_HEIGHT * 0.012}
            textStyle={styles.text}
            numberOfLines={1}
          />
        ) : (
          <></>
        )}
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (screenWidth: number, screenHeight: number, tint?: boolean) =>
  StyleSheet.create({
    button: {
      height: screenHeight * 0.065,
      width: screenWidth * 0.16,
      borderRadius: screenHeight * 0.01,
      backgroundColor: undefined,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: screenHeight * 0.01,
    },
    text: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#fff',
      fontSize: screenHeight * 0.012,
    },
    image: {
      height: screenHeight * 0.025,
      width: screenHeight * 0.025,
      objectFit: 'scale-down',
      tintColor: tint ? '#fff' : '',
    },
  });

export default FilterButton;
