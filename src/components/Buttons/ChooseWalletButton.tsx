import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';

import {useAppSelector} from '../../store/hooks';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  title: string;
  onPress(): void;
  disabled?: boolean;
  customFontStyles?: {};
  isModalOpened: boolean;
  isFromBottomToTop: boolean;
  animDuration: number;
  rotateArrow(): void;
  arrowSpinAnim: any;
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
    rotateArrow,
    arrowSpinAnim,
  } = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const isInternetReachable = useAppSelector(
    state => state.info.isInternetReachable,
  );
  const buttonColor = isInternetReachable ? '#0d3d8a' : '#e06852';

  const [isCurvesVisible, setCurvesVisible] = useState(false);
  useEffect(() => {
    var timeout = setTimeout(
      () => {
        setCurvesVisible(isModalOpened);
      },
      isFromBottomToTop
        ? isModalOpened
          ? animDuration
          : 0
        : isModalOpened
        ? 0
        : animDuration,
    );

    return () => clearTimeout(timeout);
  }, [animDuration, isFromBottomToTop, isModalOpened]);

  const fontSize = Math.round(SCREEN_HEIGHT * 0.018) - 1;
  const arrowHeight = Math.round(SCREEN_HEIGHT * 0.012);
  const boxPadding = Math.round(SCREEN_HEIGHT * 0.015);
  const boxHeight = Math.round(SCREEN_HEIGHT * 0.035);

  const boxWidth =
    Math.round((fontSize * title.length) / 3) +
    arrowHeight * 3 +
    boxPadding * 2;

  let boxWidthSvg = boxWidth;

  if (isCurvesVisible) {
    boxWidthSvg = Math.round(boxWidthSvg * 1.14);
  }

  const styles = StyleSheet.create({
    container: {
      height: boxHeight,
      minHeight: 25,
      width: '100%',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonBox: {
      height: '100%',
      width: 'auto',
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
      width: boxWidthSvg,
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
      style={[styles.container, disabled ? styles.disabled : null]}
      onPress={() => {
        onPress();
        rotateArrow();
      }}>
      <View style={styles.buttonBox}>
        <Text style={[styles.boxText, customFontStyles]}>{title}</Text>
        <Animated.View style={[styles.boxArrow, arrowSpinAnim]}>
          <Image
            style={styles.boxArrowIcon}
            source={require('../../assets/images/back-icon.png')}
          />
        </Animated.View>
        {isCurvesVisible ? (
          <>
            <Svg
              style={styles.boxSvg}
              viewBox="0 0 114 20"
              preserveAspectRatio="none"
              fill={buttonColor}>
              <Path d="M 0 20 q 7 0 7 -7 l 0 -6 q 0 -7 7 -7 l 86 0 q 7 0 7 7 l 0 6 q 0 7 7 7 l -114 0" />
            </Svg>
          </>
        ) : (
          <>
            <Svg
              style={styles.boxSvg}
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              fill={buttonColor}>
              <Path d="M 10 20 l -3 0 q -7 0 -7 -7 l 0 -6 q 0 -7 7 -7 l 13 0 l 60 0 l 13 0 q 7 0 7 7 l 0 6 q 0 7 -7 7 l -73 0" />
            </Svg>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ChooseWalletButton;
