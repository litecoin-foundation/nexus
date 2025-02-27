import React, {useEffect, useContext} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  amount: string;
  active: boolean;
  handlePress: () => void;
}

const ConvertField: React.FC<Props> = props => {
  const {amount, active, handlePress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  // animation
  const borderColor = useSharedValue('#e5e5e5');
  const borderWidth = useSharedValue(1);

  useEffect(() => {
    if (active) {
      borderColor.value = withTiming('#2C72FF', {duration: 200});
      borderWidth.value = withTiming(3, {duration: 200});
    } else {
      borderColor.value = withTiming('#e5e5e5', {duration: 200});
      borderWidth.value = withTiming(1, {duration: 200});
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    borderWidth: borderWidth.value,
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.amountsContainer}>
          <Text
            adjustsFontSizeToFit={true}
            numberOfLines={1}
            style={[
              styles.amountText,
              active ? {color: '#2C72FF'} : {color: '#747E87'},
            ]}>
            {amount}
          </Text>
        </View>
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
      height: screenHeight * 0.055,
      marginVertical: 4,
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
  });

export default ConvertField;
