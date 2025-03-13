import React, {useEffect, useContext} from 'react';
import {Image, StyleSheet} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  value: number;
}

const PriceIndicatorButton: React.FC<Props> = props => {
  const {value} = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  const isPriceNegative = Math.sign(value) === -1;

  const triangleSpinValue = useSharedValue(isPriceNegative ? 0 : 1);

  const spinTriangle = () => {
    triangleSpinValue.value = withTiming(isPriceNegative ? 0 : 1, {
      duration: 200,
    });
  };

  useEffect(() => {
    spinTriangle();
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [isPriceNegative, triangleSpinValue]);

  const triangleSpinStyle = useAnimatedStyle(() => {
    const spinIterpolation = interpolate(
      triangleSpinValue.value,
      [0, 1],
      [180, 0],
    );
    return {
      transform: [{rotate: `${spinIterpolation}deg`}],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        isPriceNegative ? styles.negative : null,
        triangleSpinStyle,
      ]}>
      <Image
        style={styles.triangle}
        source={require('../../assets/images/up-triangle.png')}
      />
    </Animated.View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: '#20BB74',
      height: screenHeight * 0.02,
      width: screenHeight * 0.02,
      borderRadius: screenHeight * 0.01,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: 'rgb(82,84,103);',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
      shadowOffset: {
        height: 0,
        width: 0,
      },
      position: 'relative',
    },
    triangle: {
      height: '65%',
      objectFit: 'scale-down',
    },
    negative: {
      backgroundColor: '#f25246',
    },
  });

export default PriceIndicatorButton;
