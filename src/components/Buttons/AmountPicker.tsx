import React, {useState, useEffect} from 'react';
import {Platform, Pressable, StyleSheet} from 'react-native';
import {useSharedValue, withSpring, withTiming} from 'react-native-reanimated';
import {useAppSelector} from '../../store/hooks';
import {subunitSymbolSelector} from '../../reducers/settings';
import {
  Canvas,
  Image,
  matchFont,
  RoundedRect,
  Text,
  useImage,
} from '@shopify/react-native-skia';
import {defaultButtonSpring} from '../../theme/spring';

interface Props {
  amount: number;
  fiatAmount: string;
  active: boolean;
  handlePress: () => void;
  handleToggle: () => void;
}

const AmountPicker: React.FC<Props> = props => {
  const {amount, active, handlePress, fiatAmount, handleToggle} = props;
  const [toggleLTC, setToggleLTC] = useState(true);

  const ltcFontSize = useSharedValue(24);
  const ltcFontY = useSharedValue(27);
  const fiatFontSize = useSharedValue(16);
  const fiatFontY = useSharedValue(60);
  const switchX = useSharedValue(44);
  const switchIconX = useSharedValue(42);
  const switchOpacity = useSharedValue(0);

  const fontFamily =
    Platform.OS === 'ios' ? 'Satoshi Variable' : 'SatoshiVariable-Regular.ttf';
  const fontStyle = {
    fontFamily,
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '700',
  };
  const font = matchFont(fontStyle);

  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);

  const handleFontSizeChange = () => {
    if (toggleLTC && active) {
      ltcFontSize.value = withTiming(18);
      fiatFontSize.value = withTiming(20);
    } else {
      ltcFontSize.value = withTiming(24);
      fiatFontSize.value = withTiming(16);
    }
  };

  useEffect(() => {
    if (active) {
      switchX.value = withSpring(0, defaultButtonSpring);
      switchIconX.value = withSpring(11, defaultButtonSpring);
      fiatFontY.value = withTiming(40);
      ltcFontY.value = withTiming(18);
      switchOpacity.value = withTiming(1);
    } else {
      switchX.value = withSpring(44);
      switchIconX.value = withSpring(42);
      switchOpacity.value = withTiming(0);
    }
  }, [active, fiatFontSize, fiatFontY, ltcFontY, switchIconX, switchX]);

  const switchImage = useImage(require('../../assets/icons/switch-arrow.png'));

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Canvas style={styles.amountsContainer}>
        <Text
          font={font}
          color={'#2C72FF'}
          x={4}
          y={ltcFontY}
          text={
            String(amount) === '' ? '0.00' : `${String(amount)}${amountSymbol}`
          }
        />
        <Text
          font={font}
          color={'#747E87'}
          x={4}
          y={fiatFontY}
          text={
            String(fiatAmount) === ''
              ? '0.00'
              : `${currencySymbol}${String(fiatAmount)}`
          }
        />
      </Canvas>

      <Pressable
        style={{alignSelf: 'center'}}
        onPress={() => {
          setToggleLTC(!toggleLTC);
          handleToggle();
          handleFontSizeChange();
        }}>
        <Canvas style={{width: 44, height: 44}}>
          <RoundedRect
            x={switchX}
            y={0}
            width={44}
            height={44}
            r={10}
            color="#F3F3F3"
            opacity={switchOpacity}
          />
          <Image
            image={switchImage}
            fit="contain"
            x={switchIconX}
            y={11}
            width={20}
            height={20}
          />
        </Canvas>
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
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
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
  },
  buyText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#2E2E2E',
  },
  amountsContainer: {
    flex: 1,
  },
});

export default AmountPicker;
