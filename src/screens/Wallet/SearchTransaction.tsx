import React, {
  useRef,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useHeaderHeight} from '@react-navigation/elements';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import GlassTransactionList from '../../components/GlassTransactionList';
import GlassSearchTxCanvas from '../../components/GlassSearchTxCanvas';
import FilterButton from '../../components/Buttons/FilterButton';
import SearchBar from '../../components/SearchBar';
import SearchHeader from '../../components/SearchHeader';
import GlassTxDetailModal from '../../components/Modals/GlassTxDetailModal';
import GlassSearchBackdrop from '../../components/GlassSearchBackdrop';
import FoldedSkinView from '../../components/FoldedSkinView';
import {
  getGlassFilterClusterHeight,
  getGlassFilterRects,
  getGlassHeaderRects,
  GLASS_HEADER_PILL_HEIGHT_RATIO,
} from '../../components/glassSearchLayout';
import {SHEET_TOP_RADIUS_RATIO} from '../../components/GlassBottomSheet';
import {
  SHEET_BACKGROUND,
  useGlassTxRowModels,
} from '../../components/GlassTxRows';
import {
  GlassSearchFeed,
  useGlassSearchFeedPublisher,
  useGlassWalletFeed,
} from '../../components/glassChromeFeeds';
import {
  getNewMainSheetPoints,
  getTopHalfCard,
} from '../../animations/useNewMainAnims';
import {useAppSelector} from '../../store/hooks';
import {txDetailSelector} from '../../reducers/transaction';
import {flattenGroupedTransactions} from '../../utils/groupTransactions';
import {MainStackParamList} from '../../navigation/types';

import {ScreenSizeContext} from '../../context/screenSize';

// The transaction search: a transparent-modal route in the Main stack, like
// the shop, so the live wallet stays attached beneath and one transition
// value plays the hand-off against it — the navigator itself does nothing.
//
// Opening, the page lands whole on its first frame: the wallet's own gradient
// card, copied at the position the sheet rests in, over the wallet's own
// sheet colour — so the swap underneath shows nothing, and the chrome above
// (the rows, the bar) is cut as the feed lands. Then the list container — the
// wallet's sheet, colour and corners, with the wallet's own rows already on
// it — sets off from the sheet's edge to its resting place, while the filter
// row, the search bar and the header fade in on top. Closing plays the
// container back and lifts the page on the same value; the list and the
// controls are cut instead of faded, so what fades in is the wallet
// underneath, and the chrome returns with it.
//
// The page is RN views rather than the glass canvas: a canvas paints late and
// would show the wallet through for a frame. The canvases redraw the card
// only for their lenses to refract and clear themselves down to the pills.

interface Props {
  navigation: any;
  route: RouteProp<MainStackParamList, 'SearchTransaction'>;
}

// Constants
const SCREEN_RATIOS = {
  HEADER_BUTTON_HEIGHT: GLASS_HEADER_PILL_HEIGHT_RATIO,
  SEARCH_BAR_HEIGHT: 0.05,
  // The single gap: below the header's pills, between the filter row and the
  // search bar, and above the list.
  CONTROLS_GAP: 0.008,
  DROPDOWN_WIDTH: 0.37,
  PADDING_HORIZONTAL: 0.04,
} as const;

const ANIMATION_TIMING = {
  FADE_OUT_DURATION: 150,
  FADE_IN_DELAY: 150,
  FADE_IN_DURATION: 250,
} as const;

const OPEN_MS = 600;
const OPEN_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const FADE_EASING = Easing.inOut(Easing.quad);
const CLOSE_MS = 300;
const CLOSE_EASING = Easing.bezier(0.4, 0, 0.6, 1);

// iOS-style back swipe: starts at the left edge.
const BACK_EDGE_WIDTH = 32;

const TX_PRIVACY_TYPES = ['All', 'Regular', 'MWEB'];

const TX_TYPE_FILTERS = ['Buy', 'Sell', 'Send', 'Receive', 'Convert'];

const SearchTransaction: React.FC<Props> = props => {
  const {navigation, route} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const wallet = useGlassWalletFeed();
  const online = useAppSelector(state => !!state.info!.isInternetReachable);

  const headerButtonsHeight =
    SCREEN_HEIGHT * SCREEN_RATIOS.HEADER_BUTTON_HEIGHT;
  const searchBarHeight = SCREEN_HEIGHT * SCREEN_RATIOS.SEARCH_BAR_HEIGHT;
  const filterClusterHeight = getGlassFilterClusterHeight(SCREEN_HEIGHT);
  const deviceHeaderHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const stackHeaderHeight = deviceHeaderHeight - insets.top;

  // Where the wallet's sheet rests: the container sets off from it and
  // returns to it. Read live rather than copied, so the return lands wherever
  // the sheet actually is.
  const {FOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const foldedSheetY = useSharedValue(FOLD_SHEET_POINT);
  const sheetY = wallet?.mainSheetsTranslationY ?? foldedSheetY;

  const headerRects = useMemo(
    () =>
      getGlassHeaderRects({
        screenWidth: SCREEN_WIDTH,
        screenHeight: SCREEN_HEIGHT,
        topInset: insets.top,
        rowHeight: stackHeaderHeight,
        paddingHorizontal: SCREEN_WIDTH * SCREEN_RATIOS.PADDING_HORIZONTAL,
        dropdownWidth: SCREEN_WIDTH * SCREEN_RATIOS.DROPDOWN_WIDTH,
      }),
    [SCREEN_WIDTH, SCREEN_HEIGHT, insets.top, stackHeaderHeight],
  );

  // One gap everywhere: below the header's pills, below the filter row, then
  // again above and below the search bar inside the list. Measured from the
  // pills themselves rather than the header band, since the pills are what
  // you see the gap against.
  const controlsGap = SCREEN_HEIGHT * SCREEN_RATIOS.CONTROLS_GAP;
  const filterRowTop =
    headerRects.back.y + headerRects.back.height + controlsGap;
  const bandHeight = filterRowTop + filterClusterHeight + controlsGap;
  // Where the list's own content starts: past the search bar pinned inside
  // the container, which the rows scroll up behind.
  const listContentTop = controlsGap + searchBarHeight + controlsGap;
  // The container runs from the band to the screen bottom; the rows' canvas
  // records against this viewport.
  const listHeight = SCREEN_HEIGHT - bandHeight;

  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, controlsGap, bandHeight),
    [SCREEN_WIDTH, SCREEN_HEIGHT, controlsGap, bandHeight],
  );

  const {t} = useTranslation('searchTab');

  // Snapshot source for the tx detail sheet's glass.
  const mainContentRef = useRef<View>(null);

  const [txType, setTxType] = useState(route.params?.openFilter || 'All');
  const [selectedTransaction, selectTransaction] = useState<any>({});
  const [isTxDetailModalOpened, setTxDetailModalOpened] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [txPrivacyTypeFilter, setTxPrivacyTypeFilter] = useState('All');

  // 0 wallet, 1 search: the value the hand-off plays on — the container's
  // travel, the page's lift, the chrome's return
  const transition = useSharedValue(0);
  // 0 → 1 alongside it, on the fade curve: what the controls arrive on
  const arrival = useSharedValue(0);
  // the close cuts the controls and lifts the page; opening does neither
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  // Re-focus re-runs this with the values already at their
  // targets, so nothing moves.
  useFocusEffect(
    useCallback(() => {
      closingRef.current = false;
      setClosing(false);
      transition.value = withTiming(1, {
        duration: OPEN_MS,
        easing: OPEN_EASING,
      });
      arrival.value = withTiming(1, {duration: OPEN_MS, easing: FADE_EASING});
    }, [transition, arrival]),
  );

  const finishClose = useCallback(() => navigation.goBack(), [navigation]);
  // At 0 the container is the wallet's sheet — its colour, its radius, at
  // its edge — over the wallet's sheet, and the page is gone: popping the
  // route then changes no pixel.
  const closeSearch = useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    setClosing(true);
    transition.value = withTiming(
      0,
      {duration: CLOSE_MS, easing: CLOSE_EASING},
      finished => {
        if (finished) {
          runOnJS(finishClose)();
        }
      },
    );
  }, [transition, finishClose]);

  // The android back button leaves like the edge swipe does.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          closeSearch();
          return true;
        },
      );
      return () => subscription.remove();
    }, [closeSearch]),
  );

  // A drag in from the left edge closes; the hand-off is not scrubbed, since
  // it cuts the controls on the frame it starts.
  const backPan = Gesture.Pan()
    .onTouchesDown((e, manager) => {
      if (e.allTouches[0].x > BACK_EDGE_WIDTH) {
        manager.fail();
      }
    })
    .activeOffsetX(12)
    .failOffsetY([-16, 16])
    .onStart(() => {
      'worklet';
      runOnJS(closeSearch)();
    });

  // What the chrome reads for this screen.
  const feed = useMemo<GlassSearchFeed>(
    () => ({presented: !closing, transition}),
    [closing, transition],
  );
  useGlassSearchFeedPublisher(feed);

  // The container's top edge over the travel: the sheet's edge to its own
  // resting place.
  const containerTop = useDerivedValue(
    () => bandHeight + (sheetY.value - bandHeight) * (1 - transition.value),
  );
  // The page's card follows that edge exactly as the wallet's follows its
  // sheet: it starts as the wallet's card, at rest, and shortens with the
  // rise — the gradient compresses over it, so the band above shifts darker
  // the way a fold's does. Its lenses sample the same moving gradient.
  const card = useDerivedValue(() =>
    getTopHalfCard(containerTop.value, SCREEN_HEIGHT, insets.top),
  );
  const cardHeight = useDerivedValue(() => card.value.height);
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{translateY: containerTop.value - bandHeight}],
  }));
  const controlsOpacity = useDerivedValue(
    () => (closing ? 0 : arrival.value),
    [closing],
  );
  const filterRowStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));
  const searchBarStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));
  const listStyle = useAnimatedStyle(
    () => ({opacity: closing ? 0 : 1}),
    [closing],
  );
  const pageStyle = useAnimatedStyle(
    () => ({opacity: closing ? transition.value : 1}),
    [closing],
  );
  const headerOpacity = useSharedValue(1);
  const headerFadeStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value * controlsOpacity.value,
  }));

  useEffect(() => {
    headerOpacity.value = isTxDetailModalOpened
      ? withTiming(0, {duration: ANIMATION_TIMING.FADE_OUT_DURATION})
      : withDelay(
          ANIMATION_TIMING.FADE_IN_DURATION,
          withTiming(1, {duration: ANIMATION_TIMING.FADE_IN_DELAY}),
        );
  }, [isTxDetailModalOpened, headerOpacity]);

  const transactions = useAppSelector(txDetailSelector);
  const setTransactionIndex = useCallback(
    (newTxIndex: number) => {
      selectTransaction(transactions[newTxIndex]);
    },
    [transactions],
  );

  // The wallet's rows, filtered: the same grouping, drawn by the same Skia
  // renderer. Derived in render, so the first commit carries them.
  const txRows = useMemo(() => {
    let filtered = TX_TYPE_FILTERS.includes(txType)
      ? transactions.filter((tx: any) => tx.metaLabel === txType)
      : transactions;
    if (searchFilter) {
      filtered = filtered.filter(
        (tx: any) => tx.label.indexOf(searchFilter) > -1,
      );
    }
    if (txPrivacyTypeFilter === 'Regular') {
      filtered = filtered.filter((tx: any) => !tx.isMweb);
    } else if (txPrivacyTypeFilter === 'MWEB') {
      filtered = filtered.filter((tx: any) => tx.isMweb);
    }
    return flattenGroupedTransactions(filtered);
  }, [transactions, txType, searchFilter, txPrivacyTypeFilter]);
  const txRowModels = useGlassTxRowModels(txRows);
  // Written on the UI thread by the scroller, read by the rows' canvas.
  const txListScrollY = useSharedValue(0);

  // Stable identities: the tx detail sheet is memoized and always mounted, so
  // closed it skips reconciliation entirely — and the list rebuilds its
  // gestures on its handler, so a render here must not hand it a new one.
  const openTxDetailModal = useCallback((data: any) => {
    selectTransaction(data);
    setTxDetailModalOpened(true);
  }, []);
  const closeTxDetailModal = useCallback(() => {
    setTxDetailModalOpened(false);
  }, []);
  const noSwipe = useCallback(() => {}, []);

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

  // One set of rects for the glass and for the buttons over it.
  const filterRects = useMemo(
    () =>
      getGlassFilterRects({
        screenWidth: SCREEN_WIDTH,
        screenHeight: SCREEN_HEIGHT,
        rowTop: filterRowTop,
        count: filters.length,
        paddingHorizontal: SCREEN_WIDTH * SCREEN_RATIOS.PADDING_HORIZONTAL,
      }),
    [SCREEN_WIDTH, SCREEN_HEIGHT, filterRowTop, filters.length],
  );

  // Written by the dropdown as it folds, read by the canvas drawing its lens.
  const dropdownHeight = useSharedValue(headerButtonsHeight);

  const filterButtons = useMemo(
    () =>
      filters.map((element, i) => (
        <FilterButton
          textKey={String(element.value).toLocaleLowerCase()}
          textDomain="main"
          active={txType === element.value}
          onPress={() => setTxType(element.value)}
          key={element.value}
          imageSource={element.imgSrc}
          tint={element.value !== 'All'}
          rect={filterRects[i]}
        />
      )),
    [filters, txType, filterRects],
  );

  return (
    <GestureDetector gesture={backPan}>
      <View
        ref={mainContentRef}
        collapsable={false}
        style={styles.container}
        pointerEvents={closing ? 'none' : 'auto'}>
        {/* The page: the wallet's skin, its card riding the container's
            edge, and over it the filter pills' glass. First child, so
            everything paints over it; one view, so the close lifts it as
            one. */}
        <Animated.View
          style={[StyleSheet.absoluteFill, pageStyle]}
          pointerEvents="none">
          <FoldedSkinView online={online} card={card} />
          <GlassSearchBackdrop
            screenWidth={SCREEN_WIDTH}
            screenHeight={SCREEN_HEIGHT}
            online={online}
            cardHeight={cardHeight}
            filterRects={filterRects}
            activeFilterIndex={filters.findIndex(
              element => element.value === txType,
            )}
            controlsOpacity={controlsOpacity}
            lensActive={!closing}
          />
        </Animated.View>

        {/* Reserves the controls band so the list starts below it; the controls
            themselves are placed absolutely over it. */}
        <View style={styles.band} />

        {/* Each button places itself on its own rect, the same ones the canvas
            drew, so no flex row can nudge an icon off its lens. */}
        <Animated.View
          style={[StyleSheet.absoluteFill, filterRowStyle]}
          pointerEvents="box-none">
          {filterButtons}
        </Animated.View>

        <Animated.View style={[styles.txListContainer, containerStyle]}>
          <Animated.View style={[styles.fill, listStyle]}>
            {/* The wallet's list, with no sheet to hand drags to, drawing
                its rows in a canvas of its own beneath the scroller. */}
            <GlassTransactionList
              onPress={openTxDetailModal}
              rows={txRows}
              rowModels={txRowModels}
              scrollY={txListScrollY}
              // Clears the pinned search bar, so the list rests below it and
              // scrolls up behind it.
              contentTopInset={listContentTop}
              // The rows start where the list says: at the inset, or right
              // under the sync header, which takes the inset itself.
              // eslint-disable-next-line react/no-unstable-nested-components
              rowsLayer={topInset => (
                <GlassSearchTxCanvas
                  rowModels={txRowModels}
                  scrollY={txListScrollY}
                  topInset={topInset}
                  height={listHeight}
                />
              )}
            />
          </Animated.View>

          {/* After the list so it draws over it, and absolute so the list
              runs the full height of the container underneath. */}
          <Animated.View style={[styles.searchBar, searchBarStyle]}>
            <SearchBar
              value={searchFilter}
              placeholder={t('find_tx')}
              onChangeText={setSearchFilter}
            />
          </Animated.View>
        </Animated.View>

        {/* After the list so the opened dropdown falls over it, before the
            modal so the sheet still covers it. */}
        <SearchHeader
          rects={headerRects}
          onBack={closeSearch}
          fadeStyle={headerFadeStyle}
          screenWidth={SCREEN_WIDTH}
          screenHeight={SCREEN_HEIGHT}
          online={online}
          cardHeight={cardHeight}
          privacyFilter={txPrivacyTypeFilter}
          onSelectPrivacyFilter={setTxPrivacyTypeFilter}
          privacyFilterOptions={TX_PRIVACY_TYPES}
          cellHeight={headerButtonsHeight}
          // Opened, every row grows by this — the title cell included — so the
          // box reaches farther down with its rows still equal. Extending it
          // with separatorGapHeightInPx instead would leave the surplus below
          // the last option, where it just reads as a taller last row.
          cellHeightExpandMultiplier={1.8}
          dropdownHeight={dropdownHeight}
          interactive={!isTxDetailModalOpened && !closing}
        />

        {/* Snapshots mainContentRef on open; no row overlay here, the list is
            plain RN views and is captured with the rest of the screen. */}
        <GlassTxDetailModal
          isOpened={isTxDetailModalOpened}
          close={closeTxDetailModal}
          transaction={selectedTransaction}
          // The shown list is filtered, so the store indices the pager walks
          // would jump to transactions the filter hides: one card, exactly what
          // isSwiperActive={false} gave the modal this replaced.
          txsNum={1}
          setTransactionIndex={setTransactionIndex}
          swipeToPrevTx={noSwipe}
          swipeToNextTx={noSwipe}
          contentViewRef={mainContentRef}
        />
      </View>
    </GestureDetector>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  controlsGap: number,
  bandHeight: number,
) =>
  StyleSheet.create({
    // Transparent: the page is a child, and lifts off the live wallet.
    container: {
      flex: 1,
      flexDirection: 'column',
    },
    fill: {
      flex: 1,
    },
    // Pure spacer: it reserves the controls band so the list below starts
    // clear of it. Everything in the band is positioned absolutely, so this
    // holds nothing.
    band: {
      width: '100%',
      height: bandHeight,
    },
    // The wallet's sheet — its colour, its corners — so the hand-off at the
    // sheet's edge swaps nothing, and the rows sit on what they sit on there.
    txListContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: SHEET_BACKGROUND,
      borderTopLeftRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      borderTopRightRadius: screenHeight * SHEET_TOP_RADIUS_RATIO,
      // clips the list to the rounded top, and to the search bar's own
      // corners where the rows pass under it
      overflow: 'hidden',
    },
    // Pinned to the top of the container, over the list. The rows run full
    // height underneath and scroll up behind it.
    searchBar: {
      position: 'absolute',
      top: controlsGap,
      left: 0,
      width: '100%',
      paddingHorizontal: screenWidth * SCREEN_RATIOS.PADDING_HORIZONTAL,
    },
  });

export default SearchTransaction;
