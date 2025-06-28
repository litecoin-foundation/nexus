import React, {
  useRef,
  useState,
  useContext,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {StyleSheet, View, StyleProp, ViewStyle} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useHeaderHeight} from '@react-navigation/elements';
import {StackNavigationOptions} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

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

const RightHeaderButton: React.FC<RightHeaderProps> = React.memo(
  ({txPrivacyTypeFilter, setTxPrivacyTypeFilter, styles}) => {
    const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
    return (
      <View style={styles.dropDownContainer}>
        <DropDownButton
          initial={txPrivacyTypeFilter}
          options={TX_PRIVACY_TYPES}
          chooseOptionCallback={setTxPrivacyTypeFilter}
          cellHeight={SCREEN_HEIGHT * SCREEN_RATIOS.HEADER_BUTTON_HEIGHT}
          cellHeightExpandMultiplier={1.45}
        />
      </View>
    );
  },
);

// Constants
const SCREEN_RATIOS = {
  HEADER_BUTTON_HEIGHT: 0.035,
  SEARCH_BAR_HEIGHT: 0.05,
  FILTER_BUTTONS_BAR_HEIGHT: 0.065,
  CONTROLS_GAP: 0.008,
  TITLE_FONT_SIZE: 0.02,
  MODAL_GAP: 0.22,
  PADDING_TOP: 0.03,
  PADDING_HORIZONTAL: 0.04,
} as const;

const ANIMATION_TIMING = {
  FADE_OUT_DURATION: 150,
  FADE_IN_DELAY: 150,
  FADE_IN_DURATION: 250,
  MODAL_DURATION: 250,
} as const;

const TX_PRIVACY_TYPES = ['All', 'Regular', 'MWEB'];

const SearchTransaction: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const headerButtonsHeight =
    SCREEN_HEIGHT * SCREEN_RATIOS.HEADER_BUTTON_HEIGHT;
  const searchBarHeight = SCREEN_HEIGHT * SCREEN_RATIOS.SEARCH_BAR_HEIGHT;
  const filterButtonsBarHeight =
    SCREEN_HEIGHT * SCREEN_RATIOS.FILTER_BUTTONS_BAR_HEIGHT;
  const deviceHeaderHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const stackHeaderHeight = deviceHeaderHeight - insets.top;
  const alignHeaderElementsWithMarginTop = useMemo<StyleProp<ViewStyle>>(
    () => ({
      marginTop: (stackHeaderHeight - headerButtonsHeight) * -1,
    }),
    [headerButtonsHeight, stackHeaderHeight],
  );
  const controlsGap = SCREEN_HEIGHT * SCREEN_RATIOS.CONTROLS_GAP;
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
  const styles = useMemo(
    () =>
      getStyles(
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        controlsPaddingTop,
        controlsAbsoluteHeightWithGaps,
      ),
    [
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      controlsPaddingTop,
      controlsAbsoluteHeightWithGaps,
    ],
  );

  const {t} = useTranslation('searchTab');

  const transactionListRef = useRef<any>(null);

  const [txType, setTxType] = useState(route.params?.openFilter || 'All');
  const [selectedTransaction, selectTransaction] = useState<any>(null);
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [txPrivacyTypeFilter, setTxPrivacyTypeFilter] = useState('All');

  const fadingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const buttonOpacity = useSharedValue(0);

  const animatedButton = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
    };
  });

  const headerTitleMemo = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={animatedButton}>
          <TranslateText
            textKey="transactions"
            domain="searchTab"
            maxSizeInPixels={SCREEN_HEIGHT * SCREEN_RATIOS.TITLE_FONT_SIZE}
            textStyle={styles.headerTitle}
            numberOfLines={1}
          />
        </Animated.View>
      </View>
    ),
    [
      alignHeaderElementsWithMarginTop,
      SCREEN_HEIGHT,
      styles.headerTitle,
      animatedButton,
    ],
  );

  const headerLeftMemo = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={animatedButton}>
          <HeaderButton
            onPress={() => navigation.goBack()}
            imageSource={require('../../assets/images/back-icon.png')}
          />
        </Animated.View>
      </View>
    ),
    [navigation, alignHeaderElementsWithMarginTop, animatedButton],
  );

  const headerRightMemo = useMemo(
    () => (
      <View style={alignHeaderElementsWithMarginTop}>
        <Animated.View style={animatedButton}>
          <RightHeaderButton
            txPrivacyTypeFilter={txPrivacyTypeFilter}
            setTxPrivacyTypeFilter={setTxPrivacyTypeFilter}
            styles={styles}
          />
        </Animated.View>
      </View>
    ),
    [
      alignHeaderElementsWithMarginTop,
      styles,
      txPrivacyTypeFilter,
      animatedButton,
    ],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => headerTitleMemo,
      headerLeft: () => headerLeftMemo,
      headerRight: () => headerRightMemo,
    });
  }, [navigation, headerTitleMemo, headerLeftMemo, headerRightMemo]);

  const emptyComponent = useMemo(() => <></>, []);

  useEffect(() => {
    if (isTxDetailModalOpened) {
      buttonOpacity.value = withTiming(0, {
        duration: ANIMATION_TIMING.FADE_OUT_DURATION,
      });

      fadingTimeout.current = setTimeout(() => {
        navigation.setOptions({
          headerTitle: () => emptyComponent,
          headerLeft: () => emptyComponent,
          headerRight: () => emptyComponent,
        });
      }, ANIMATION_TIMING.FADE_OUT_DURATION);
    } else {
      buttonOpacity.value = withDelay(
        ANIMATION_TIMING.FADE_IN_DURATION,
        withTiming(1, {duration: ANIMATION_TIMING.FADE_IN_DELAY}),
      );

      navigation.setOptions({
        headerTitle: () => headerTitleMemo,
        headerLeft: () => headerLeftMemo,
        headerRight: () => headerRightMemo,
      });
    }

    return () => {
      clearTimeout(fadingTimeout.current);
    };
  }, [
    navigation,
    isTxDetailModalOpened,
    buttonOpacity,
    headerTitleMemo,
    headerLeftMemo,
    headerRightMemo,
    emptyComponent,
  ]);

  const transactions = useAppSelector(txDetailSelector);
  const setTransactionIndex = useCallback(
    (newTxIndex: number) => {
      selectTransaction(transactions[newTxIndex]);
    },
    [transactions],
  );

  const filters = useMemo(
    () => [
      {
        value: 'All',
        imgSrc: require('../../assets/icons/blue-tick-oval.png'),
      },
      {value: 'Buy', imgSrc: require('../../assets/icons/buy-icon.png')},
      {value: 'Sell', imgSrc: require('../../assets/icons/sell-icon.png')},
      {value: 'Send', imgSrc: require('../../assets/icons/send-icon.png')},
      {
        value: 'Receive',
        imgSrc: require('../../assets/icons/receive-icon.png'),
      },
    ],
    [],
  );

  const filterButtons = useMemo(
    () =>
      filters.map(element => (
        <FilterButton
          textKey={String(element.value).toLocaleLowerCase()}
          textDomain="main"
          active={txType === element.value}
          onPress={() => setTxType(element.value)}
          key={element.value}
          imageSource={element.imgSrc}
          tint={element.value !== 'All'}
        />
      )),
    [filters, txType],
  );

  const plasmaModal_TxDetailModalContent_backSpecifiedStyle = {
    backgroundColor: 'rgba(17, 74, 175, 0.8)',
  };
  const plasmaModal_TxDetailModalContent_gapSpecifiedStyle = {
    backgroundColor: 'transparent',
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <View style={styles.search}>
          <SearchBar
            value={searchFilter}
            placeholder={t('find_tx')}
            onChangeText={setSearchFilter}
          />
        </View>

        <View style={styles.filterContainer}>{filterButtons}</View>
      </View>

      <View style={styles.txListContainer}>
        <TransactionList
          ref={transactionListRef}
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
        isSwiperActive={false}
        animDuration={ANIMATION_TIMING.MODAL_DURATION}
        gapInPixels={SCREEN_HEIGHT * SCREEN_RATIOS.MODAL_GAP}
        backSpecifiedStyle={plasmaModal_TxDetailModalContent_backSpecifiedStyle}
        gapSpecifiedStyle={plasmaModal_TxDetailModalContent_gapSpecifiedStyle}
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
      fontSize: screenHeight * SCREEN_RATIOS.TITLE_FONT_SIZE,
      fontStyle: 'normal',
      fontWeight: '700',
    },
    dropDownContainer: {
      width: screenWidth * 0.35,
      height: screenHeight * 0.035,
      marginRight: screenWidth * 0.04 - 1,
    },
    filters: {
      width: '100%',
      height: controlsAbsoluteHeightWithGaps,
      paddingTop: controlsPaddingTop,
    },
    search: {
      width: '100%',
      paddingBottom: screenHeight * SCREEN_RATIOS.CONTROLS_GAP,
      paddingHorizontal: screenWidth * SCREEN_RATIOS.PADDING_HORIZONTAL,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: screenWidth * SCREEN_RATIOS.PADDING_HORIZONTAL,
    },
    txListContainer: {
      flex: 1,
      width: '100%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: '#fff',
      paddingTop: screenHeight * SCREEN_RATIOS.PADDING_TOP,
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
        maxSizeInPixels={SCREEN_HEIGHT * SCREEN_RATIOS.TITLE_FONT_SIZE}
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
      />
    ),
  };
};

export default SearchTransaction;
