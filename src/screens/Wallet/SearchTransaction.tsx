import React, {
  useMemo,
  useRef,
  useState,
  useContext,
  useLayoutEffect,
} from 'react';
import {StyleSheet, View} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import HeaderButton from '../../components/Buttons/HeaderButton';
import TransactionList from '../../components/TransactionList';
import DropDownButton from '../../components/Buttons/DropDownButton';
import FilterButton from '../../components/Buttons/FilterButton';
import SearchBar from '../../components/SearchBar';
import PlasmaModal from '../../components/Modals/PlasmaModal';
import TxDetailModalContent from '../../components/Modals/TxDetailModalContent';

import {useAppSelector} from '../../store/hooks';
import {txDetailSelector} from '../../reducers/transaction';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type RootStackParamList = {
  SearchTransaction: {
    openFilter?: string;
  };
};

interface Props {
  navigation: any;
  route: RouteProp<RootStackParamList, 'SearchTransaction'>;
}

const SearchTransaction: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const {t} = useTranslation('searchTab');

  const TransactionListRef = useRef();

  const [txType, setTxType] = useState(route.params?.openFilter || 'All');
  const [selectedTransaction, selectTransaction] = useState<any>({});
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [txPrivacyTypeFilter, setTxPrivacyTypeFilter] = useState('All');

  const rightHeaderButton = useMemo(() => {
    const txPrivacyTypes = ['All', 'Regular', 'MWEB'];

    return (
      <View style={styles.dropDownContainer}>
        <DropDownButton
          initial={txPrivacyTypeFilter}
          options={txPrivacyTypes}
          chooseOptionCallback={(option: string) =>
            setTxPrivacyTypeFilter(option)
          }
          cellHeight={SCREEN_HEIGHT * 0.035}
        />
      </View>
    );
  }, [SCREEN_HEIGHT, styles, txPrivacyTypeFilter]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => rightHeaderButton,
    });
  }, [navigation, rightHeaderButton]);

  const transactions = useAppSelector(state => txDetailSelector(state));
  function setTransactionIndex(newTxIndex: number) {
    selectTransaction(transactions[newTxIndex]);
  }

  const filters = [
    {value: 'All', imgSrc: require('../../assets/icons/blue-tick-oval.png')},
    {value: 'Buy', imgSrc: require('../../assets/icons/buy-icon.png')},
    {value: 'Sell', imgSrc: require('../../assets/icons/sell-icon.png')},
    {value: 'Convert', imgSrc: require('../../assets/icons/convert-icon.png')},
    {value: 'Send', imgSrc: require('../../assets/icons/send-icon.png')},
    {value: 'Receive', imgSrc: require('../../assets/icons/receive-icon.png')},
  ];

  const Filter = filters.map(element => {
    return (
      <FilterButton
        textKey={String(element.value).toLocaleLowerCase()}
        textDomain="main"
        active={txType === element.value ? true : false}
        onPress={() => {
          setTxType(element.value);
        }}
        key={element.value}
        imageSource={element.imgSrc}
        tint={element.value === 'All' ? false : true}
      />
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <View style={styles.search}>
          <SearchBar
            value={searchFilter}
            placeholder={t('find_tx')}
            onChangeText={text => setSearchFilter(text)}
          />
        </View>

        <View style={styles.filterContainer}>{Filter}</View>
      </View>

      <View style={styles.txListContainer}>
        <TransactionList
          ref={TransactionListRef}
          headerBackgroundColor="white"
          onPress={(data: any) => {
            selectTransaction(data);
            setTxDetailModalOpened(true);
          }}
          transactionType={txType}
          searchFilter={searchFilter}
          txPrivacyTypeFilter={txPrivacyTypeFilter}
        />
      </View>

      <PlasmaModal
        isOpened={isTxDetailModalOpened}
        close={() => {
          setTxDetailModalOpened(false);
        }}
        isFromBottomToTop={true}
        isSwiperActive={false ? true : false}
        animDuration={250}
        gapInPixels={SCREEN_HEIGHT * 0.27}
        backSpecifiedStyle={{backgroundColor: 'rgba(17, 74, 175, 0.8)'}}
        gapSpecifiedStyle={{backgroundColor: 'transparent'}}
        renderBody={(
          _,
          __,
          ___,
          ____,
          cardTranslateAnim: any,
          cardOpacityAnim: any,
          prevNextCardOpacityAnim: any,
          paginationOpacityAnim: any,
        ) => (
          <TxDetailModalContent
            close={() => {
              setTxDetailModalOpened(false);
            }}
            transaction={selectedTransaction}
            setTransactionIndex={(txIndex: number) => {
              setTransactionIndex(txIndex);
            }}
            cardTranslateAnim={cardTranslateAnim}
            cardOpacityAnim={cardOpacityAnim}
            prevNextCardOpacityAnim={prevNextCardOpacityAnim}
            paginationOpacityAnim={paginationOpacityAnim}
          />
        )}
      />
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1162E6',
      flexDirection: 'column',
    },
    headerTitle: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    dropDownContainer: {
      width: screenWidth * 0.35,
      height: screenHeight * 0.035,
      marginRight: screenWidth * 0.04 - 1,
    },
    mwebFilterBtn: {
      width: screenWidth * 0.35,
      height: screenHeight * 0.035,
      minHeight: 25,
      borderRadius: screenHeight * 0.01,
      backgroundColor: '#0F4CAD',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginHorizontal: screenWidth * 0.04,
    },
    mwebFilterBtnText: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '500',
      letterSpacing: -0.39,
    },
    search: {
      width: '100%',
      paddingBottom: screenHeight * 0.01,
      paddingHorizontal: screenWidth * 0.04,
    },
    filters: {
      flexBasis: '25%',
      width: '100%',
      justifyContent: 'flex-end',
      paddingBottom: screenHeight * 0.01,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: screenWidth * 0.04,
    },
    txListContainer: {
      flexBasis: '75%',
      width: '100%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: '#fff',
      paddingTop: screenHeight * 0.03,
    },
  });

export const SearchTransactionNavigationOptions = (navigation: any) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="transactions"
        domain="searchTab"
        maxSizeInPixels={SCREEN_HEIGHT * 0.02}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
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

export default SearchTransaction;
