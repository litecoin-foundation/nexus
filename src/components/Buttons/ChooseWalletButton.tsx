import React, {useEffect, useRef, useState} from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Platform, Dimensions, Image, Animated} from 'react-native';
import Svg, {Path} from 'react-native-svg';

interface Props {
  title: string;
  onPress(): void;
  disabled?: boolean;
  customFontStyles?: {};
  isModalOpened: boolean;
  isFromBottomToTop: boolean;
  animDuration: number;
}

const ChooseWalletButton: React.FC<Props> = props => {
  const {
    title,
    onPress,
    disabled,
    customFontStyles,
    isModalOpened,
    isFromBottomToTop,
    animDuration,
  } = props;

  const rotateArrowAnim = useRef(new Animated.Value(0)).current;
  const rotateArrow = () => {
    Animated.timing(rotateArrowAnim, {
      toValue: isModalOpened ? 0 : 1,
      duration: animDuration,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotateArrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['270deg', '90deg'],
  });

  const [isCurvesVisible, setCurvesVisible] = useState(false);
  useEffect(() => {
    var timeout = setTimeout(() => {
      setCurvesVisible(isModalOpened);
    }, isFromBottomToTop ? (isModalOpened ? animDuration : 0) : (isModalOpened ? 0 : animDuration));

    return () => clearTimeout(timeout);
  }, [isModalOpened]);

  const fontSize = Math.round(Dimensions.get('screen').height * 0.018) - 1;
  const arrowHeight = Math.round(Dimensions.get('screen').height * 0.012);
  const boxPadding = Math.round(Dimensions.get('screen').height * 0.015);
  const boxHeight = Math.round(Dimensions.get('screen').height * 0.035);
  let boxWidth = Math.round(fontSize * title.length / 3) + arrowHeight * 3 + boxPadding * 2;

  if (isCurvesVisible) {boxWidth = Math.round(boxWidth * 1.14);}

  const styles = StyleSheet.create({
    container: {
      height: boxHeight,
      width: '100%',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonBox: {
      height: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
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

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      style={[
        styles.container,
        disabled ? styles.disabled : null,
      ]}
      onPress={() => {onPress(); rotateArrow();}}>
        <View style={styles.buttonBox} >
          <Text
            style={[
              styles.boxText,
              customFontStyles,
            ]}>
            {title}
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
          {isCurvesVisible ? (
            <>
              <Svg style={styles.boxSvg} viewBox="0 0 114 20" preserveAspectRatio="none" fill="#0d3d8a">
                <Path
                  d="M 0 20 q 7 0 7 -7 l 0 -6 q 0 -7 7 -7 l 86 0 q 7 0 7 7 l 0 6 q 0 7 7 7 l -114 0"
                />
              </Svg>
            </>
          ) : (
            <>
              <Svg style={styles.boxSvg} viewBox="0 0 100 20" preserveAspectRatio="none" fill="#0d3d8a">
                <Path
                  d="M 10 20 l -3 0 q -7 0 -7 -7 l 0 -6 q 0 -7 7 -7 l 13 0 l 60 0 l 13 0 q 7 0 7 7 l 0 6 q 0 7 -7 7 l -73 0"
                />
              </Svg>
            </>
          )}
        </View>
    </TouchableOpacity>
  );
};

export default ChooseWalletButton;
