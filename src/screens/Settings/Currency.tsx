import React, {useState, useContext} from 'react';
import {StyleSheet, FlatList, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackNavigationOptions} from '@react-navigation/stack';

import OptionCell from '../../components/Cells/OptionCell';
import Header from '../../components/Header';
import fiat from '../../assets/fiat';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setCurrencyCode} from '../../reducers/settings';
import {callRates} from '../../reducers/ticker';
import HeaderButton from '../../components/Buttons/HeaderButton';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type CurrencyCodeType = {
  name: string;
  key: string;
  symbol_native: string;
};

const Currency: React.FC = () => {
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {currencyCode} = useAppSelector(state => state.settings);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode);

  const handlePress = (code: string, symbol: string): void => {
    setSelectedCurrency(code);
    dispatch(setCurrencyCode(code, symbol));
    dispatch(callRates());
  };

  const renderItem = ({item}: {item: CurrencyCodeType}) => (
    <OptionCell
      title={`${item.name} (${item.symbol_native})`}
      key={item.key}
      onPress={() => handlePress(item.key, item.symbol_native)}
      selected={selectedCurrency === item.key ? true : false}
    />
  );

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        <FlatList data={fiat} renderItem={renderItem} />
        <SafeAreaView />
      </LinearGradient>
    </>
  );
};

const getStyles = (_screenWidth: number, _screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgb(238,244,249)',
    },
    headerTitle: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: 'white',
      fontSize: 17,
    },
  });

export const CurrencyNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="select_fiat"
        domain="settingsTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerTitleContainerStyle: {
      left: 7,
    },
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
        leftPadding
      />
    ),
    headerLeftContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginStart: -5} : null,
    headerRightContainerStyle:
      Platform.OS === 'ios' && SCREEN_WIDTH >= 414 ? {marginEnd: -5} : null,
  };
};

export default Currency;
