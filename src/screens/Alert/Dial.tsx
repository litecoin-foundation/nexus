import React, {useState, useContext} from 'react';
import {View, Text, StyleSheet, Image, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';

import Header from '../../components/Header';
import SlideRuler from '../../components/SlideRuler';
import BlueButton from '../../components/Buttons/BlueButton';
import {addAlert} from '../../reducers/alerts';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {convertLocalFiatToUSD, ltcRateSelector} from '../../reducers/ticker';
import HeaderButton from '../../components/Buttons/HeaderButton';

import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  Dial: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Dial'>;
}

const Dial: React.FC<Props> = props => {
  const {navigation} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const currentRate = Number(useAppSelector(state => ltcRateSelector(state)));
  const localFiatToUSDRate = useAppSelector(state =>
    convertLocalFiatToUSD(state),
  );
  const currencySymbol = useAppSelector(state => state.settings.currencySymbol);
  const [value, setValue] = useState(0);
  const [usdValue, setUSDValue] = useState(0);

  const maximumValue = currentRate > 1000 ? currentRate + 500 : 1000;

  const toggleActive = value >= currentRate;

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <Header />
      <View style={styles.subContainer}>
        <View style={styles.topContainer}>
          <Image
            style={styles.imageContainer}
            source={require('../../assets/images/alert-art.png')}
          />
          <Text style={styles.text}>Alert me when</Text>
          <Text style={styles.text}>
            Litecoin <Text style={styles.boldText}>(LTC)</Text> is
          </Text>

          <View style={styles.switchContainer}>
            <View style={!toggleActive ? styles.toggleActive : styles.toggle}>
              <Text
                style={
                  !toggleActive ? styles.toggleTextActive : styles.toggleText
                }>
                BELOW
              </Text>
            </View>
            <View style={toggleActive ? styles.toggleActive : styles.toggle}>
              <Text
                style={
                  toggleActive ? styles.toggleTextActive : styles.toggleText
                }>
                ABOVE
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>
            {currencySymbol}
            {value}
          </Text>
        </View>
        <View style={styles.rulerContainer}>
          <SlideRuler
            onValueChange={(slideValue: number) => {
              setValue(slideValue);
              const calculatedValue = Number(
                (slideValue * localFiatToUSDRate).toFixed(2),
              );
              setUSDValue(calculatedValue);
            }}
            maximumValue={maximumValue}
            decimalPlaces={1}
            multiplicity={1}
            arrayLength={1000}
            initialValue={currentRate}
          />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <BlueButton
          value="Create Alert"
          onPress={() => {
            dispatch(
              addAlert({
                value,
                originalValue: usdValue,
                isIOS: Platform.OS === 'ios',
              }),
            );
            navigation.goBack();
          }}
          small={false}
        />
      </View>
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
    },
    topContainer: {
      flexBasis: '72%',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    imageContainer: {
      height: screenHeight * 0.4,
      objectFit: 'contain',
      marginTop: screenHeight * 0.01 * -1,
      marginBottom: screenHeight * 0.025 * -1,
    },
    text: {
      color: '#2E2E2E',
      fontSize: screenHeight * 0.03,
      fontWeight: '500',
    },
    boldText: {
      color: '#2E2E2E',
      fontSize: screenHeight * 0.03,
      fontWeight: '700',
    },
    switchContainer: {
      width: screenWidth * 0.7,
      height: screenHeight * 0.05,
      borderRadius: screenHeight * 0.01,
      borderColor: '#1F2124',
      borderWidth: screenHeight < 701 ? 2 : 3,
      backgroundColor: '#fff',
      flexDirection: 'row',
      marginTop: screenHeight * 0.02,
      overflow: 'hidden',
    },
    toggle: {
      flexBasis: '50%',
      height: '100%',
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleActive: {
      flexBasis: '50%',
      height: '100%',
      backgroundColor: '#1F2124',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleText: {
      color: '#2E2E2E',
      fontSize: screenHeight * 0.02,
      fontWeight: '500',
    },
    toggleTextActive: {
      color: '#fff',
      fontSize: screenHeight * 0.02,
      fontWeight: '500',
    },
    valueContainer: {
      width: '100%',
      alignItems: 'center',
      height: screenHeight * 0.08,
      justifyContent: 'center',
    },
    valueText: {
      fontSize: screenHeight * 0.07,
      color: '#2C72FF',
      fontWeight: 'bold',
      letterSpacing: -0.39,
    },
    rulerContainer: {
      width: '100%',
      marginTop: screenHeight * 0.01,
    },
    buttonContainer: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 15,
      paddingHorizontal: screenWidth * 0.06,
      paddingBottom: screenHeight * 0.03,
    },
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 17,
    },
  });

export const DialNavigationOptions = (navigation: any) => {
  return {
    headerTitle: '',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        title="SET ALERTS"
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Dial;
