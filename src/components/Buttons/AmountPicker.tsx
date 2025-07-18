import React, {useState, useEffect, useContext} from 'react';
import {View, Platform, Pressable, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import {useAppSelector} from '../../store/hooks';
import {subunitSymbolSelector} from '../../reducers/settings';
import {
  Canvas,
  matchFont,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia';
import {defaultButtonSpring} from '../../theme/spring';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  amount: string;
  fiatAmount: string;
  active: boolean;
  handlePress: () => void;
  handleToggle: () => void;
  setMax: () => void;
}

const AmountPicker: React.FC<Props> = props => {
  const {amount, active, handlePress, fiatAmount, handleToggle, setMax} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [toggleLTC, setToggleLTC] = useState(true);
  const [sendAllEnabled, setSendAllEnabled] = useState(false);

  const ltcFontSize = useSharedValue(SCREEN_HEIGHT * 0.024);
  const ltcFontY = useSharedValue(SCREEN_HEIGHT * 0.027);
  const fiatFontSize = useSharedValue(SCREEN_HEIGHT * 0.016);
  const fiatFontY = useSharedValue(SCREEN_HEIGHT * 0.06);
  const switchX = useSharedValue(SCREEN_HEIGHT * 0.044);
  const switchIconX = useSharedValue(SCREEN_HEIGHT * 0.042);
  const switchOpacity = useSharedValue(0);

  const fontStyle = {
    fontFamily: 'Satoshi Variable',
    fontSize: SCREEN_HEIGHT * 0.018,
    fontStyle: 'normal',
    fontWeight: '700',
  } as const;

  const font = Platform.select({
    ios: matchFont(fontStyle),
    default: useFont(require('../../fonts/Satoshi-Variable.ttf'), 12),
  });

  const toggleScaler = useSharedValue(1);
  const maxButtonScaler = useSharedValue(1);
  const toggleBg = useSharedValue(1);
  const maxButtonBg = useSharedValue(1);
  const toggleX = useSharedValue(50);
  const maxButtonX = useSharedValue(100);
  const activeOpacity = useSharedValue(0);

  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(
    state => state.settings!.currencySymbol,
  );

  const handleSetAll = () => {
    ltcFontY.value = withTiming(SCREEN_HEIGHT * 0.027);
    fiatFontY.value = withTiming(SCREEN_HEIGHT * 0.06);

    setSendAllEnabled(true);
    setMax();
  };

  useEffect(() => {
    setSendAllEnabled(false);
  }, [amount, fiatAmount]);

  // animation
  const toggleContainerMotionStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {scale: toggleScaler.value},
        {translateX: withSpring(toggleX.value, {stiffness: 50})},
      ],
      backgroundColor: interpolateColor(
        toggleBg.value,
        [0, 1],
        ['#C5C5C5', '#f7f7f7'],
      ),
      opacity: activeOpacity.value,
    };
  });

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

  const handleFontSizeChange = () => {
    if (toggleLTC && active) {
      ltcFontSize.value = withTiming(SCREEN_HEIGHT * 0.018);
      fiatFontSize.value = withTiming(SCREEN_HEIGHT * 0.02);
    } else {
      ltcFontSize.value = withTiming(SCREEN_HEIGHT * 0.024);
      fiatFontSize.value = withTiming(SCREEN_HEIGHT * 0.016);
    }
  };

  useEffect(() => {
    if (active) {
      switchX.value = withSpring(0, defaultButtonSpring);
      switchIconX.value = withSpring(
        SCREEN_HEIGHT * 0.011,
        defaultButtonSpring,
      );
      fiatFontY.value = withTiming(SCREEN_HEIGHT * 0.04);
      ltcFontY.value = withTiming(SCREEN_HEIGHT * 0.018);
      switchOpacity.value = withTiming(1);

      toggleX.value = 0;
      maxButtonX.value = 0;
      activeOpacity.value = withTiming(1, {duration: 500});
    } else {
      switchX.value = withSpring(SCREEN_HEIGHT * 0.044);
      switchIconX.value = withSpring(SCREEN_HEIGHT * 0.042);
      switchOpacity.value = withTiming(0);

      toggleX.value = 50;
      maxButtonX.value = 100;
      activeOpacity.value = withTiming(0, {duration: 230});
    }
  }, [
    active,
    fiatFontSize,
    fiatFontY,
    ltcFontY,
    switchIconX,
    switchX,
    SCREEN_HEIGHT,
    switchOpacity,
    activeOpacity,
    toggleX,
    maxButtonX,
  ]);

  const onPressIn = (button: string) => {
    switch (button) {
      case 'toggle':
        toggleScaler.value = withSpring(0.9, {mass: 1});
        toggleBg.value = withTiming(0);
        break;
      case 'maxButton':
        maxButtonScaler.value = withSpring(0.9, {mass: 1});
        maxButtonBg.value = withTiming(0);
        break;
    }
  };

  const onPressOut = (button: string) => {
    switch (button) {
      case 'toggle':
        toggleScaler.value = withSpring(1, {mass: 0.7});
        toggleBg.value = withTiming(1);
        break;
      case 'maxButton':
        maxButtonScaler.value = withSpring(1, {mass: 0.7});
        maxButtonBg.value = withTiming(1);
        break;
    }
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Canvas style={styles.amountsContainer}>
        <SkiaText
          font={font}
          color={toggleLTC ? '#2C72FF' : '#747E87'}
          x={4}
          y={ltcFontY}
          text={
            sendAllEnabled === true
              ? 'ALL'
              : String(amount) === ''
                ? `0.00${amountSymbol}`
                : `${amount}${amountSymbol}`
          }
        />
        <SkiaText
          font={font}
          color={toggleLTC ? '#747E87' : '#2C72FF'}
          x={4}
          y={fiatFontY}
          text={
            String(fiatAmount) === ''
              ? `${String(currencySymbol)}0.00`
              : `${String(currencySymbol)}${String(fiatAmount)}`
          }
        />
      </Canvas>

      <View style={styles.pressables}>
        <Pressable
          style={styles.maxButton}
          disabled={!active}
          onPressIn={() => onPressIn('maxButton')}
          onPressOut={() => onPressOut('maxButton')}
          onPress={() => handleSetAll()}>
          <Animated.View
            style={[styles.maxButtonContainer, maxButtonContainerMotionStyle]}>
            <TranslateText
              textValue="ALL"
              maxSizeInPixels={SCREEN_HEIGHT * 0.015}
              textStyle={styles.maxButtonText}
              numberOfLines={1}
            />
          </Animated.View>
        </Pressable>

        <Pressable
          style={[styles.toggle]}
          disabled={!active}
          onPressIn={() => onPressIn('toggle')}
          onPressOut={() => onPressOut('toggle')}
          onPress={() => {
            setToggleLTC(!toggleLTC);
            handleToggle();
            handleFontSizeChange();
          }}>
          <Animated.View
            style={[styles.toggleContainer, toggleContainerMotionStyle]}>
            <Animated.Image
              style={styles.toggleIcon}
              source={require('../../assets/icons/switch-arrow.png')}
            />
          </Animated.View>
        </Pressable>
      </View>
    </Pressable>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: screenWidth * 0.48,
      minWidth: 200,
      height: screenHeight * 0.044 + 20,
      backgroundColor: 'white',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e5e5e5',
      flexDirection: 'row',
      padding: 10,
      justifyContent: 'space-between',
    },
    ltcFontSize: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
    },
    buyText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
    },
    amountText: {
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.028,
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
    },
    amountsContainer: {
      flex: 1,
    },
    pressables: {
      height: '100%',
      justifyContent: 'center',
    },
    toggle: {
      position: 'absolute',
      right: 0,
      height: 36,
      width: 36,
    },
    toggleContainer: {
      borderRadius: screenHeight * 0.007,
      height: '100%',
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleIcon: {
      width: 20,
      height: 18,
    },
    maxButton: {
      position: 'absolute',
      right: 42,
      height: 36,
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    maxButtonContainer: {
      height: '100%',
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: screenHeight * 0.007,
    },
    maxButtonText: {
      color: '#2E2E2E',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
    },
  });

export default AmountPicker;
