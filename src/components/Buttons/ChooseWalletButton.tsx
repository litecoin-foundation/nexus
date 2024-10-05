import React, {useRef} from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Platform, Dimensions, Image, Animated} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface Props {
  value: string;
  onPress(): void;
  disabled?: boolean;
  customStyles?: {};
  customFontStyles?: {};
  isBottomCurvesEnabled?: boolean;
  isModalOpened?: boolean;
}

const ChooseWalletButton: React.FC<Props> = props => {
  const {
    value,
    onPress,
    disabled,
    customStyles,
    customFontStyles,
    isBottomCurvesEnabled,
    isModalOpened,
  } = props;

  const rotateArrowAnim = useRef(new Animated.Value(0)).current;
  const rotateArrow = () => {
    Animated.timing(rotateArrowAnim, {
      toValue: isModalOpened ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotateArrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['270deg', '90deg'],
  });

  const styles = StyleSheet.create({
    container: {
      height: Dimensions.get('screen').height * 0.035,
      width: '100%',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonBox: {
      height: '100%',
      borderRadius: Dimensions.get('screen').height * 0.01,
      backgroundColor: '#0d3d8a',
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: Dimensions.get('screen').height * 0.015,
      paddingRight: Dimensions.get('screen').height * 0.015,
      position: 'relative',
    },
    boxText: {
      fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
      color: '#fff',
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: 15,
    },
    boxArrow: {
      height: Dimensions.get('screen').height * 0.012,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      marginLeft: 10,
    },
    boxArrowIcon: {
      height: '100%',
      objectFit: 'contain',
    },
    boxLeftCurve: {
      position: 'absolute',
      bottom: 0,
      left: (Dimensions.get('screen').height * 0.02 * -1) + 1,
      height: Dimensions.get('screen').height * 0.02,
      width: Dimensions.get('screen').height * 0.02,
    },
    boxRightCurve: {
      position: 'absolute',
      bottom: 0,
      right: (Dimensions.get('screen').height * 0.02 * -1) + 1,
      height: Dimensions.get('screen').height * 0.02,
      width: Dimensions.get('screen').height * 0.02,
    },
    disabled: {
      opacity: 0.5,
    },
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      style={[
        styles.container,
        disabled ? styles.disabled : null,
      ]}
      onPress={() => {onPress(); rotateArrow();}}>
        <View style={[styles.buttonBox, customStyles]}>
          <Text
            style={[
              styles.boxText,
              customFontStyles,
            ]}>
            {value}
          </Text>
          <Animated.View
            style={[
              styles.boxArrow,
              {
                transform: [{rotate: spin}],
              },
            ]}>
            <Image style={styles.boxArrowIcon} source={require('../../assets/images/back-icon.png')} />
          </Animated.View>
          {isBottomCurvesEnabled ? (
            <>
              <Svg
                style={styles.boxLeftCurve}
                viewBox="0 0 15 15"
                fill="#0d3d8a"
              >
                <Path
                  d="M 0 15 q 15 0 15 -15 l 0 15"
                />
              </Svg>
              <Svg
                style={styles.boxRightCurve}
                viewBox="0 0 15 15"
                fill="#0d3d8a"
              >
                <Path
                  d="M 0 0 q 0 15 15 15 l -15 0"
                />
              </Svg>
            </>
          ) : (
            <>
            </>
          )}
        </View>
    </TouchableOpacity>
  );
};

export default ChooseWalletButton;
