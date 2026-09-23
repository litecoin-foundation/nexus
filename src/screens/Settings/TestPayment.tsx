import React, {useState, useContext} from 'react';
import {StyleSheet, FlatList, View, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import OptionCell from '../../components/Cells/OptionCell';
import ScreenHeader, {
  ScreenHeaderCard,
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setTestPayment} from '../../reducers/settings';
import {moonpayCountries, onramperCountries} from '../../reducers/buy';
import fiat from '../../assets/fiat';

import {ScreenSizeContext} from '../../context/screenSize';

const TEST_PAYMENT_ACTIVE: boolean[] = [true, false];
const TEST_PAYMENT_METHODS: string[] = ['MOONPAY', 'ONRAMPER'];
const ALL_COUNTRIES = [...new Set([...moonpayCountries, ...onramperCountries])];

const TEST_PAYMENT_FIATS: string[] = fiat.map(fiatObj => fiatObj.code);

const TestPayment: React.FC = () => {
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const {cardHeight, rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, cardHeight);

  const {
    testPaymentActive,
    testPaymentKey,
    testPaymentMethod,
    testPaymentCountry,
    testPaymentFiat,
  } = useAppSelector(state => state.settings);

  const [selectedTPA, setSelectedTPA] = useState(testPaymentActive || false);
  const [selectedTPK, setSelectedTPK] = useState(testPaymentKey || false);
  const [selectedTPM, setSelectedTPM] = useState(testPaymentMethod || '');
  const [selectedTPC, setSelectedTPC] = useState(testPaymentCountry || '');
  const [selectedTPF, setSelectedTPF] = useState(testPaymentFiat || '');

  const handleSetTestPayment = (
    TPA: boolean,
    TPK: boolean,
    TPM: string,
    TPC: string,
    TPF: string,
  ): void => {
    dispatch(setTestPayment(TPA, TPK, TPM, TPC, TPF));
  };

  const handlePressTPA = (newOption: boolean): void => {
    setSelectedTPA(newOption);
    handleSetTestPayment(
      newOption,
      selectedTPK,
      selectedTPM,
      selectedTPC,
      selectedTPF,
    );
  };
  const handlePressTPK = (newOption: boolean): void => {
    setSelectedTPK(newOption);
    handleSetTestPayment(
      selectedTPA,
      newOption,
      selectedTPM,
      selectedTPC,
      selectedTPF,
    );
  };
  const handlePressTPM = (newOption: string): void => {
    setSelectedTPM(newOption);
    handleSetTestPayment(
      selectedTPA,
      selectedTPK,
      newOption,
      selectedTPC,
      selectedTPF,
    );
  };
  const handlePressTPC = (newOption: string): void => {
    setSelectedTPC(newOption);
    handleSetTestPayment(
      selectedTPA,
      selectedTPK,
      selectedTPM,
      newOption,
      selectedTPF,
    );
  };
  const handlePressTPF = (newOption: string): void => {
    setSelectedTPF(newOption);
    handleSetTestPayment(
      selectedTPA,
      selectedTPK,
      selectedTPM,
      selectedTPC,
      newOption,
    );
  };

  const renderItemTPA = ({item}: {item: boolean}) => (
    <OptionCell
      title={String(item)}
      key={String(item)}
      onPress={() => handlePressTPA(item)}
      selected={selectedTPA === item}
    />
  );
  const renderItemTPK = ({item}: {item: boolean}) => (
    <OptionCell
      title={String(item)}
      key={String(item)}
      onPress={() => handlePressTPK(item)}
      selected={selectedTPK === item}
    />
  );
  const renderItemTPM = ({item}: {item: string}) => (
    <OptionCell
      title={item}
      key={item}
      onPress={() => handlePressTPM(item)}
      selected={selectedTPM === item}
    />
  );
  const renderItemTPC = ({item}: {item: string}) => (
    <OptionCell
      title={item}
      key={item}
      onPress={() => handlePressTPC(item)}
      selected={selectedTPC === item}
    />
  );
  const renderItemTPF = ({item}: {item: string}) => (
    <OptionCell
      title={item}
      key={item}
      onPress={() => handlePressTPF(item)}
      selected={selectedTPF === item}
    />
  );

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <View style={styles.headerSpacer} />
        <View style={styles.separator}>
          <Text style={styles.separatorTitle}>Active</Text>
        </View>
        <View style={styles.flatListContainer}>
          <FlatList data={TEST_PAYMENT_ACTIVE} renderItem={renderItemTPA} />
        </View>
        <View style={styles.separator}>
          <Text style={styles.separatorTitle}>Test Key</Text>
        </View>
        <View style={styles.flatListContainer}>
          <FlatList data={TEST_PAYMENT_ACTIVE} renderItem={renderItemTPK} />
        </View>
        <View style={styles.separator}>
          <Text style={styles.separatorTitle}>Method</Text>
        </View>
        <View style={styles.flatListContainer}>
          <FlatList data={TEST_PAYMENT_METHODS} renderItem={renderItemTPM} />
        </View>
        <View style={styles.separator}>
          <Text style={styles.separatorTitle}>Country</Text>
        </View>
        <View style={styles.flatListContainer}>
          <FlatList data={ALL_COUNTRIES} renderItem={renderItemTPC} />
        </View>
        <View style={styles.separator}>
          <Text style={styles.separatorTitle}>Fiat</Text>
        </View>
        <View style={styles.flatListContainer}>
          <FlatList data={TEST_PAYMENT_FIATS} renderItem={renderItemTPF} />
        </View>
        <ScreenHeaderCard cardHeight={cardHeight} />
        <ScreenHeader
          rects={rects}
          paddingHorizontal={paddingHorizontal}
          titleKey="Setup Test Payment"
          titleDomain="settingsTab"
          fadeStyle={headerFadeStyle}
        />
      </LinearGradient>
    </>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  cardHeight: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    headerSpacer: {
      height: cardHeight,
    },
    separator: {
      width: '100%',
      height: screenHeight * 0.02,
      minHeight: screenHeight * 0.02,
      backgroundColor: '#F7F7F7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    flatListContainer: {
      width: '100%',
      minHeight: 100,
      maxHeight: screenHeight * 0.22,
    },
    separatorTitle: {
      color: '#000',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
    },
  });

export default TestPayment;
