import React, {useRef, useState, useContext, useLayoutEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useHeaderHeight} from '@react-navigation/elements';
import {StackNavigationOptions} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

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

interface RightHeaderProps {
  txPrivacyTypeFilter: string;
  setTxPrivacyTypeFilter: (option: string) => void;
  styles: {
    [key: string]: any;
  };
}

const RightHeaderButton: React.FC<RightHeaderProps> = props => {
  const {txPrivacyTypeFilter, setTxPrivacyTypeFilter, styles} = props;
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
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
};

const SearchTransaction: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  // deviceHeaderHeight = insets.top + stack header height
  const headerButtonsHeight = SCREEN_HEIGHT * 0.035;
  const searchBarHeight = SCREEN_HEIGHT * 0.05;
  const filterButtonsBarHeight = SCREEN_HEIGHT * 0.065;
  const deviceHeaderHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const stackHeaderHeight = deviceHeaderHeight - insets.top;
  const alignHeaderElementsWithMarginTop = {
    marginTop: (stackHeaderHeight - headerButtonsHeight) * -1,
  };
  const controlsGap = SCREEN_HEIGHT * 0.008;
  const controlsPaddingTop =
    deviceHeaderHeight -
    (stackHeaderHeight - headerButtonsHeight) +
    controlsGap;
  const controlsAbsoluteHeightWithGaps =
    controlsPaddingTop +
    searchBarHeight +
    controlsGap +
    filterButtonsBarHeight +
    controlsGap;
  const styles = getStyles(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    controlsPaddingTop,
    controlsAbsoluteHeightWithGaps,
  );

  const {t} = useTranslation('searchTab');

  const TransactionListRef = useRef();

  const [txType, setTxType] = useState(route.params?.openFilter || 'All');
  const [selectedTransaction, selectTransaction] = useState<any>({});
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [txPrivacyTypeFilter, setTxPrivacyTypeFilter] = useState('All');

  useLayoutEffect(() => {
    navigation.setOptions({
      /* eslint-disable react/no-unstable-nested-components */
      headerTitle: () => (
        <View style={alignHeaderElementsWithMarginTop}>
          <TranslateText
            textKey="transactions"
            domain="searchTab"
            maxSizeInPixels={SCREEN_HEIGHT * 0.02}
            textStyle={styles.headerTitle}
            numberOfLines={1}
          />
        </View>
      ),
      headerLeft: () => (
        <View style={alignHeaderElementsWithMarginTop}>
          <HeaderButton
            onPress={() => navigation.goBack()}
            imageSource={require('../../assets/images/back-icon.png')}
          />
        </View>
      ),
      headerRight: () => (
        <View style={alignHeaderElementsWithMarginTop}>
          <RightHeaderButton
            txPrivacyTypeFilter={txPrivacyTypeFilter}
            setTxPrivacyTypeFilter={setTxPrivacyTypeFilter}
            styles={styles}
          />
        </View>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, styles, txPrivacyTypeFilter, SCREEN_HEIGHT]);

  const transactions = useAppSelector(state => txDetailSelector(state));
  function setTransactionIndex(newTxIndex: number) {
    selectTransaction(transactions[newTxIndex]);
  }

  const filters = [
    {value: 'All', imgSrc: require('../../assets/icons/blue-tick-oval.png')},
    {value: 'Buy', imgSrc: require('../../assets/icons/buy-icon.png')},
    {value: 'Sell', imgSrc: require('../../assets/icons/sell-icon.png')},
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

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  controlsPaddingTop: number,
  controlsAbsoluteHeightWithGaps: number,
) =>
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
    filters: {
      width: '100%',
      height: controlsAbsoluteHeightWithGaps,
      paddingTop: controlsPaddingTop,
    },
    search: {
      width: '100%',
      paddingBottom: screenHeight * 0.008,
      paddingHorizontal: screenWidth * 0.04,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: screenWidth * 0.04,
    },
    txListContainer: {
      flex: 1,
      width: '100%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: '#fff',
      paddingTop: screenHeight * 0.03,
    },
  });

export const SearchTransactionNavigationOptions = (
  navigation: any,
): StackNavigationOptions => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0);

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
