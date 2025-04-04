import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import TranslateText from './TranslateText';

interface Props {
  children: JSX.Element | JSX.Element[];
}

const ChangeAddress: React.FC<Props> = ({children}) => {
  const [visible, setVisible] = useState(false);

  const translateY = useSharedValue(-10);
  const opacity = useSharedValue(0);
  const rotateArrowAnim = useSharedValue(0);

  const toggleVisibility = () => {
    setVisible(!visible);
    translateY.value = withTiming(visible ? -10 : 0, {duration: 300});
    opacity.value = withTiming(visible ? 0 : 1, {duration: 300});
    rotateArrowAnim.value = withTiming(visible ? 0 : 1, {duration: 300});
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  const animatedArrowStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateArrowAnim.value, [0, 1], [-180, -90]);
    return {
      transform: [{rotate: `${rotate}deg`}],
    };
  });

  return (
    <View>
      <TouchableOpacity onPress={toggleVisibility} style={styles.button}>
        <TranslateText
          textKey="view_change"
          domain="modals"
          maxSizeInPixels={22}
          textStyle={styles.buttonText}
        />
        <Animated.View style={[styles.boxArrow, animatedArrowStyle]}>
          <Image
            tintColor="#747e87"
            style={styles.boxArrowIcon}
            source={require('../assets/images/back-icon.png')}
          />
        </Animated.View>
      </TouchableOpacity>
      {visible && (
        <Animated.View style={[animatedStyle]}>{children}</Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingTop: 9,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  buttonText: {
    fontSize: 16,
    color: '#747e87',
    fontFamily: 'Satoshi Variable',
    fontWeight: '600',
  },
  boxArrow: {
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginLeft: 8,
  },
  boxArrowIcon: {
    height: '100%',
    objectFit: 'contain',
  },
});

export default ChangeAddress;
