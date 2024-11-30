import React, {useEffect, useState} from 'react';
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  title: string;
  onPress(): void;
  customFontStyles?: {};
  arrowSpinAnim: any;
  isOpen: boolean;
}

const fontSize = Math.round(Dimensions.get('screen').height * 0.018) - 1;
const arrowHeight = Math.round(Dimensions.get('screen').height * 0.012);
const boxHeight = Math.round(Dimensions.get('screen').height * 0.05);
const boxWidth =
  Dimensions.get('screen').width - Dimensions.get('screen').height * 0.04;

const ChooseWalletLargeButton: React.FC<Props> = props => {
  const {title, onPress, arrowSpinAnim, isOpen} = props;

  const height = useSharedValue(boxHeight);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  const handlePress = () => {
    height.value = withSpring(isOpen ? 500 : 200, {
      overshootClamping: true,
    });
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        onPress();
        handlePress();
      }}>
      <Animated.View style={[styles.buttonLargeBox, animatedStyle]}>
        <Text style={styles.boxText}>{title}</Text>
        <Animated.View style={[styles.boxArrow, arrowSpinAnim]}>
          <Image
            style={styles.boxArrowIcon}
            source={require('../../assets/images/back-icon.png')}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d3d8a',
    borderRadius: 10,
  },
  buttonLargeBox: {
    height: '100%',
    width: boxWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: Dimensions.get('screen').height * 0.02,
    paddingRight: Dimensions.get('screen').height * 0.02,
  },
  boxText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    color: '#fff',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: fontSize,
  },
  boxArrow: {
    height: arrowHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginLeft: 8,
  },
  boxArrowIcon: {
    height: '100%',
    objectFit: 'contain',
  },
  boxSvg: {
    position: 'absolute',
    height: boxHeight,
    width: boxWidth,
    zIndex: -1,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ChooseWalletLargeButton;
