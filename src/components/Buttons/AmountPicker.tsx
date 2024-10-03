import React, {useState} from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';
import {useAppSelector} from '../../store/hooks';
import {subunitSymbolSelector} from '../../reducers/settings';

interface Props {
  amount: number;
}

const AmountPicker: React.FC<Props> = props => {
  const {amount} = props;
  const [toggleLTC, setToggleLTC] = useState(true);

  const ltcFontSize = useSharedValue(24);
  const fiatFontSize = useSharedValue(16);

  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);

  //   TEST HARDCODED
  const fiatAmount = '5498.24';

  const handleFontSizeChange = () => {
    if (toggleLTC) {
      ltcFontSize.value = withTiming(18);
      fiatFontSize.value = withTiming(20);
    } else {
      ltcFontSize.value = withTiming(24);
      fiatFontSize.value = withTiming(16);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.amountsContainer}>
        <Animated.Text
          style={[styles.buyText, {color: '#2C72FF', fontSize: ltcFontSize}]}>
          {amount === '' ? '0.00' : amount}
          {amountSymbol}
        </Animated.Text>

        <Animated.Text
          style={[styles.buyText, {color: '#747E87', fontSize: fiatFontSize}]}>
          {currencySymbol}
          {fiatAmount === '' ? '0.00' : fiatAmount}
        </Animated.Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          setToggleLTC(!toggleLTC);
          handleFontSizeChange();
        }}
        style={styles.switchButton}>
        <Image source={require('../../assets/icons/switch-arrow.png')} />
      </TouchableOpacity>
    </View>
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
  switchButton: {
    borderRadius: 10,
    backgroundColor: '#F3F3F3',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  amountsContainer: {
    flexDirection: 'column',
  },
});

export default AmountPicker;
