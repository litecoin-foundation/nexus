import {StyleSheet, FlatList, Text} from 'react-native';
import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';

import OptionCell from '../../components/Cells/OptionCell';
import Header from '../../components/Header';
import fiat from '../../assets/fiat';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setCurrencyCode} from '../../reducers/settings';
import HeaderButton from '../../components/Buttons/HeaderButton';

type CurrencyCodeType = {
  name: string;
  key: string;
  symbol_native: string;
};

const Currency: React.FC = () => {
  const dispatch = useAppDispatch();
  const {currencyCode} = useAppSelector(state => state.settings);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode);

  const handlePress = (code: string, symbol: string): void => {
    setSelectedCurrency(code);
    dispatch(setCurrencyCode(code, symbol));
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
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
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

export const CurrencyNavigationOptions = navigation => {
  return {
    headerTitle: () => (
      <Text style={styles.headerTitle}>Select Fiat Currency</Text>
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

export default Currency;
