import React, {useEffect, useContext} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  amount: string;
  active: boolean;
  handlePress: () => void;
  setMax?: () => void;
}

const ConvertField: React.FC<Props> = props => {
  const {amount, active, handlePress, setMax} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  // animation
  const borderColor = useSharedValue('#e5e5e5');
  const borderWidth = useSharedValue(1);

  // max button animations
  const maxButtonScaler = useSharedValue(1);
  const maxButtonBg = useSharedValue(1);
  const maxButtonX = useSharedValue(100);
  const activeOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      borderColor.value = withTiming('#2C72FF', {duration: 200});
      borderWidth.value = withTiming(3, {duration: 200});

      // Show max button if setMax function is provided
      if (setMax) {
        maxButtonX.value = 0;
        activeOpacity.value = withTiming(1, {duration: 500});
      }
    } else {
      borderColor.value = withTiming('#e5e5e5', {duration: 200});
      borderWidth.value = withTiming(1, {duration: 200});

      // Hide max button
      if (setMax) {
        maxButtonX.value = 100;
        activeOpacity.value = withTiming(0, {duration: 230});
      }
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    borderWidth: borderWidth.value,
  }));

  const maxButtonContainerMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {scale: maxButtonScaler.value},
        {translateX: withSpring(maxButtonX.value, {stiffness: 50})},
      ],
      backgroundColor: interpolateColor(
        maxButtonBg.value,
        [0, 1],
        ['#C5C5C5', '#f7f7f7'],
      ),
      opacity: activeOpacity.value,
    };
  });

  const onPressIn = (button: string) => {
    if (button === 'maxButton') {
      maxButtonScaler.value = withSpring(0.9, {mass: 1});
      maxButtonBg.value = withTiming(0);
    }
  };

  const onPressOut = (button: string) => {
    if (button === 'maxButton') {
      maxButtonScaler.value = withSpring(1, {mass: 0.7});
      maxButtonBg.value = withTiming(1);
    }
  };

  // Calculate font size based on amount length
  const getFontSize = () => {
    const baseSize = SCREEN_HEIGHT * 0.028;
    const length = amount.length;
    if (length > 10) return baseSize * 0.7;
    if (length > 8) return baseSize * 0.8;
    if (length > 6) return baseSize * 0.9;
    return baseSize;
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View
          style={[
            styles.amountsContainer,
            setMax && active && {paddingRight: 46},
          ]}>
          <Text
            adjustsFontSizeToFit={true}
            numberOfLines={1}
            style={[
              styles.amountText,
              {
                fontSize: getFontSize(),
                color: active ? '#2C72FF' : '#747E87',
              },
            ]}>
            {amount}
          </Text>
        </View>

        {setMax && (
          <Animated.View
            style={[styles.maxButton, maxButtonContainerMotionStyle]}>
            <TouchableOpacity
              style={styles.maxButtonContainer}
              onPress={setMax}
              onPressIn={() => onPressIn('maxButton')}
              onPressOut={() => onPressOut('maxButton')}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'white',
      borderRadius: 11,
      flexDirection: 'row',
      paddingLeft: 10,
      paddingRight: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      height: screenHeight * 0.055,
      marginVertical: 4,
      overflow: 'hidden',
    },
    amountText: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.028,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    amountsContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    maxButton: {
      position: 'absolute',
      right: 10,
      height: 36,
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: screenHeight * 0.007,
    },
    maxButtonContainer: {
      height: '100%',
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    maxButtonText: {
      color: '#2E2E2E',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
    },
  });

export default ConvertField;
