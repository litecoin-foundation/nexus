import React, {useState, useContext} from 'react';
import {StyleSheet, FlatList} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';

import OptionCell from '../../components/Cells/OptionCell';
import ScreenHeader, {
  ScreenHeaderCard,
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import fiat from '../../assets/fiat';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setCurrencyCode} from '../../reducers/settings';
import {callRates} from '../../reducers/ticker';

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
  const {cardHeight, rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, cardHeight);

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
        <FlatList
          data={fiat}
          renderItem={renderItem}
          contentContainerStyle={styles.scrollContent}
        />
        <SafeAreaView />
        <ScreenHeaderCard cardHeight={cardHeight} />
        <ScreenHeader
          rects={rects}
          paddingHorizontal={paddingHorizontal}
          titleKey="select_fiat"
          titleDomain="settingsTab"
          fadeStyle={headerFadeStyle}
        />
      </LinearGradient>
    </>
  );
};

const getStyles = (
  _screenWidth: number,
  _screenHeight: number,
  cardHeight: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgb(238,244,249)',
    },
    scrollContent: {
      paddingTop: cardHeight,
    },
  });

export default Currency;
