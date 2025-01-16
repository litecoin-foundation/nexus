import React, {useState, useEffect, useContext} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {useSharedValue, withSpring, withTiming} from 'react-native-reanimated';
import {useAppSelector} from '../../store/hooks';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
} from '../../reducers/settings';
import {
  Canvas,
  Image,
  matchFont,
  RoundedRect,
  Text as SkiaText,
  useImage,
} from '@shopify/react-native-skia';
import {defaultButtonSpring} from '../../theme/spring';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  amount: number;
  fiatAmount: string;
  active: boolean;
  handlePress: () => void;
  handleToggle: () => void;
}

const AmountPicker: React.FC<Props> = props => {
  const {amount, active, handlePress, fiatAmount, handleToggle} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [toggleLTC, setToggleLTC] = useState(true);

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
  };
  const font = matchFont(fontStyle);

  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );

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
    } else {
      switchX.value = withSpring(SCREEN_HEIGHT * 0.044);
      switchIconX.value = withSpring(SCREEN_HEIGHT * 0.042);
      switchOpacity.value = withTiming(0);
    }
  }, [active, fiatFontSize, fiatFontY, ltcFontY, switchIconX, switchX]);

  const switchImage = useImage(require('../../assets/icons/switch-arrow.png'));

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Canvas style={styles.amountsContainer}>
        <SkiaText
          font={font}
          color={toggleLTC ? '#2C72FF' : '#747E87'}
          x={4}
          y={ltcFontY}
          text={
            String(amount) === ''
              ? '0.00'
              : `${String(convertToSubunit(amount))}${amountSymbol}`
          }
        />
        <SkiaText
          font={font}
          color={toggleLTC ? '#747E87' : '#2C72FF'}
          x={4}
          y={fiatFontY}
          text={
            String(fiatAmount) === ''
              ? '0.00'
              : `${String(currencySymbol)}${String(fiatAmount)}`
          }
        />
      </Canvas>

      <Pressable
        style={{alignSelf: 'center'}}
        disabled={!active}
        onPress={() => {
          setToggleLTC(!toggleLTC);
          handleToggle();
          handleFontSizeChange();
        }}>
        <Canvas
          style={{width: SCREEN_HEIGHT * 0.044, height: SCREEN_HEIGHT * 0.044}}>
          <RoundedRect
            x={switchX}
            y={0}
            width={SCREEN_HEIGHT * 0.044}
            height={SCREEN_HEIGHT * 0.044}
            r={SCREEN_HEIGHT * 0.01}
            color="#F3F3F3"
            opacity={switchOpacity}
          />
          <Image
            image={switchImage}
            fit="contain"
            x={switchIconX}
            y={SCREEN_HEIGHT * 0.011}
            width={SCREEN_HEIGHT * 0.02}
            height={SCREEN_HEIGHT * 0.02}
          />
        </Canvas>
      </Pressable>
    </Pressable>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'white',
      borderRadius: 11,
      borderWidth: 1,
      borderColor: '#e5e5e5',
      flexDirection: 'row',
      padding: 10,
      width: 190,
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
  });

export default AmountPicker;
