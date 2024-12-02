import React, {useState} from 'react';
import {View, Text, StyleSheet, Image, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {v4 as uuidv4} from 'uuid';
import {StackNavigationProp} from '@react-navigation/stack';

import Header from '../../components/Header';
import SlideRuler from '../../components/SlideRuler';
import BlueButton from '../../components/Buttons/BlueButton';
import {addAlert} from '../../reducers/alerts';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {convertLocalFiatToUSD, ltcRateSelector} from '../../reducers/ticker';
import HeaderButton from '../../components/Buttons/HeaderButton';

type RootStackParamList = {
  Dial: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Dial'>;
}

const Dial: React.FC<Props> = props => {
  const {navigation} = props;
  const dispatch = useAppDispatch();
  const currentRate = Number(useAppSelector(state => ltcRateSelector(state)));
  const localFiatToUSDRate = useAppSelector(state =>
    convertLocalFiatToUSD(state),
  );
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const [value, setValue] = useState(0);
  const [usdValue, setUSDValue] = useState(0);

  const maximumValue = currentRate > 1000 ? currentRate + 500 : 1000;

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <Header />
      <View style={styles.subContainer}>
        <View style={styles.topContainer}>
          <View style={styles.imageContainer}>
            <Image source={require('../../assets/images/attention-big.png')} />
          </View>
          <Text style={styles.text}>ALERT ME WHEN</Text>
          <Text style={styles.boldText}>Litecoin (LTC)</Text>
          <Text style={styles.text}>
            IS {value >= currentRate ? 'ABOVE' : 'BELOW'}
          </Text>
        </View>

        <View style={styles.flex}>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>
              {currencySymbol}
              {value}
            </Text>
          </View>
          <View>
            <SlideRuler
              onValueChange={(slideValue: number) => {
                setValue(slideValue);
                const calculatedValue = Number(
                  (slideValue * localFiatToUSDRate).toFixed(2),
                );
                setUSDValue(calculatedValue);
              }}
              multiplicity={1}
              initialValue={currentRate}
              maximumValue={maximumValue}
            />
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <BlueButton
          value="Create alert"
          onPress={() => {
            dispatch(
              addAlert({
                id: uuidv4(),
                date: Date.now(),
                enabled: true,
                value,
                originalValue: usdValue,
                isIOS: Platform.OS === 'ios',
              }),
            );
            navigation.goBack();
          }}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subContainer: {
    alignItems: 'center',
    flex: 1,
  },
  topContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  imageContainer: {
    paddingBottom: 46,
  },
  boldText: {
    color: '#484859',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: -0.36,
    paddingBottom: 6,
    paddingTop: 6,
  },
  valueText: {
    fontSize: 28,
    color: '#2C72FF',
    fontWeight: 'bold',
    letterSpacing: -0.39,
  },
  text: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
  },
  valueContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    height: 75,
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  buttonContainer: {
    bottom: 0,
    position: 'absolute',
    alignSelf: 'center',
    height: 100,
  },
  headerTitle: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
  },
});

export const DialNavigationOptions = navigation => {
  return {
    headerTitle: () => (
      <Text style={styles.headerTitle}>Create Price Alert</Text>
    ),
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Dial;
