import {StyleSheet, FlatList} from 'react-native';
import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';

import OptionCell from '../../components/Cells/OptionCell';
import Header from '../../components/Header';
import fiat from '../../assets/fiat';
import {useAppSelector} from '../../store/hooks';

type CurrencyCodeType = {
  name: string;
  key: string;
  symbol_native: string;
};

const Currency: React.FC = () => {
  const {countryCode} = useAppSelector(state => state.settings);
  const [selectedCurrency, setSelectedCurrency] = useState(countryCode);

  const renderItem = ({item}: {item: CurrencyCodeType}) => (
    <OptionCell
      title={`${item.name} (${item.symbol_native})`}
      key={item.key}
      onPress={() => setSelectedCurrency(item.key)}
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
});

export default Currency;
