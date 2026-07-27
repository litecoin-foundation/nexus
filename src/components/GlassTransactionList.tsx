import React, {
  useRef,
  useLayoutEffect,
  useEffect,
  useState,
  useContext,
  useCallback,
} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  withTiming,
  withRepeat,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  SharedValue,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import TransactionListEmpty from './TransactionListEmpty';
import TranslateText from '../components/TranslateText';
import ProgressBar from './ProgressBar';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {getTransactions} from '../reducers/transaction';
import {DisplayedMetadataType} from '../utils/txMetadata';
import {ScreenSizeContext} from '../context/screenSize';
import {
  getNewMainSheetPoints,
  makeSheetSnapHandlers,
} from '../animations/useNewMainAnims';
import {
  firstRowAt,
  GlassTxRowModels,
  GLASS_TX_LIST_TOP_RATIO,
  GLASS_TX_SECTION_HEADER_HEIGHT_RATIO,
  ROW_BORDER,
  MUTED_TEXT,
} from './GlassSheetBackdrop';
import {
  decimalSyncedSelector,
  recoveryProgressSelector,
  getRecoveryInfo,
} from '../reducers/info';

// Invisible native scroller; GlassSheetBackdrop draws the visible rows so the
// tab bar glass can refract them. The Skia rows are positioned from scrollY,
// so scrollY must be written on the UI thread — a JS-side scroll handler
// makes every drawn frame wait on the JS thread and stutters the whole list.
// That is why this is a plain Animated.ScrollView over one fixed-height
// spacer (row geometry is deterministic in rowModels) instead of a list
// component: FlashList v2 only supports plain-JS onScroll. Row taps are
// resolved by hit-testing the shared row geometry.

type ItemType = {
  hash: string;
  time: Date;
  amount: number;
  label: string;
  metaLabel: string;
  priceOnDate: number;
  confs: number;
  providerMeta: DisplayedMetadataType;
};

type RowType = ItemType | {type: 'sectionHeader'; title: string};

interface Props {
  onPress(item: ItemType): void;
  rows: RowType[];
  rowModels: GlassTxRowModels;
  folded: boolean;
  foldUnfold: (unfold: boolean) => void;
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
  onScrollActivity?: () => void;
  scrollY: SharedValue<number>;
  listHeaderOffset: SharedValue<number>;
}

const GlassTransactionList: React.FC<Props> = props => {
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef<any>(null);

  const {
    onPress,
    rows,
    rowModels,
    folded,
    foldUnfold,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    onScrollActivity,
    scrollY,
    listHeaderOffset,
  } = props;

  const {rowTops, rowBottoms} = rowModels;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    scrollY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {UNFOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const scrollContainerHeight =
    SCREEN_HEIGHT -
    UNFOLD_SHEET_POINT -
    SCREEN_HEIGHT * GLASS_TX_LIST_TOP_RATIO;

  const listContentHeight =
    rowBottoms.length > 0 ? rowBottoms[rowBottoms.length - 1] : 0;
  const headerRowHeight = SCREEN_HEIGHT * GLASS_TX_SECTION_HEADER_HEIGHT_RATIO;

  const {recoveryMode, recoveryFinished, syncedToChain} = useAppSelector(
    state => state.info!,
  );
  const progress = useAppSelector(state => decimalSyncedSelector(state));
  const recoveryProgress = useAppSelector(state =>
    recoveryProgressSelector(state),
  );

  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    dispatch(getTransactions());
    dispatch(getRecoveryInfo());
  }, [dispatch]);

  const decProgress = recoveryMode
    ? recoveryProgress > 0
      ? recoveryProgress > 1
        ? 1
        : recoveryProgress
      : 0.001
    : progress > 0
      ? progress > 1
        ? 1
        : progress
      : 0.001;

  const percentageProgress =
    decProgress > 0
      ? decProgress > 1
        ? 100
        : Math.floor(decProgress * 10 * 100) / 10
      : 0.1;

  const isAlmostDone = percentageProgress >= 99.9 && percentageProgress < 100;
  const showSpinner =
    isAlmostDone ||
    (recoveryMode && (percentageProgress <= 1.5 || percentageProgress >= 100));

  const rotation = useSharedValue(0);
  useEffect(() => {
    if (showSpinner) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, {duration: 1250, easing: Easing.linear}),
        -1,
        false,
      );
    } else {
      rotation.value = 0;
    }
  }, [showSpinner, rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }));

  // Show the note if sync stalls.
  const loadingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const [takingTooLong, setTakingTooLong] = useState(false);
  useEffect(() => {
    clearTimeout(loadingTimeout.current);

    if (percentageProgress < 99 && !recoveryMode && recoveryProgress !== 0) {
      loadingTimeout.current = setTimeout(() => {
        setTakingTooLong(true);
      }, 10000);
    }
    return () => {
      clearTimeout(loadingTimeout.current);
    };
  }, [percentageProgress, recoveryMode, recoveryProgress]);

  // Recovery rescans can run after chain sync finishes.
  const showSyncProgress =
    (recoveryMode && !recoveryFinished) || !syncedToChain;

  useEffect(() => {
    if (!showSyncProgress) {
      listHeaderOffset.value = 0;
    }
  }, [showSyncProgress, listHeaderOffset]);

  const SyncProgressIndicator = (
    <>
      <View style={styles.headerContainer}>
        <TranslateText
          textKey={recoveryMode ? 'recover_txs' : 'load_txs'}
          domain="main"
          maxSizeInPixels={SCREEN_HEIGHT * 0.013}
          textStyle={styles.sectionHeaderText}
          numberOfLines={1}
        />
        {showSpinner ? (
          <Animated.Image
            source={require('../assets/icons/loading.png')}
            style={[styles.spinner, spinStyle]}
          />
        ) : (
          <TranslateText
            textValue={` (${percentageProgress}%) `}
            maxSizeInPixels={SCREEN_HEIGHT * 0.013}
            textStyle={styles.sectionHeaderText}
            numberOfLines={1}
          />
        )}
        {takingTooLong ? (
          <TranslateText
            textKey={'taking_too_long'}
            domain="main"
            maxSizeInPixels={SCREEN_HEIGHT * 0.013}
            textStyle={styles.sectionHeaderText}
            numberOfLines={1}
          />
        ) : null}
      </View>
      <ProgressBar percentageProgress={percentageProgress} />
    </>
  );

  const [isListScrollable, setIsListScrollable] = useState(false);
  const startClosing = useSharedValue(false);
  const yStartPos = useSharedValue(-1);
  const momentumActive = useSharedValue(false);
  const lastMomentumEnd = useSharedValue(0);
  const lastActivityMark = useSharedValue(0);

  const handleContentSizeChange = (
    contentWidth: number,
    contentHeight: number,
  ) => {
    const scrollable = contentHeight > scrollContainerHeight;
    setIsListScrollable(scrollable);
  };

  const isAndroid = Platform.OS === 'android';

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: e => {
      const offsetY = e.contentOffset.y;
      scrollY.value = offsetY;
      startClosing.value = !folded && offsetY === 0;
      if (onScrollActivity) {
        const now = Date.now();
        if (now - lastActivityMark.value > 200) {
          lastActivityMark.value = now;
          runOnJS(onScrollActivity)();
        }
      }
    },
    onBeginDrag: e => {
      // A scroll attempt while folded unfolds the sheet.
      if (folded && (isAndroid || !startClosing.value)) {
        runOnJS(foldUnfold)(true);
      }
      startClosing.value = !folded && e.contentOffset.y === 0;
    },
    onEndDrag: e => {
      startClosing.value = !folded && e.contentOffset.y === 0;
    },
    onMomentumBegin: () => {
      momentumActive.value = true;
    },
    onMomentumEnd: () => {
      momentumActive.value = false;
      lastMomentumEnd.value = Date.now();
    },
  });

  const handleRowPress = useCallback(
    (index: number) => {
      const item = rows[index];
      if (item && !('type' in item && item.type === 'sectionHeader')) {
        onPress(item as ItemType);
      }
    },
    [rows, onPress],
  );

  const {onDragUpdate, onEndTrigger} = makeSheetSnapHandlers({
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
    folded,
    foldUnfold,
    screenHeight: SCREEN_HEIGHT,
    topInset: insets.top,
  });

  function onFoldTrigger() {
    'worklet';
    runOnJS(foldUnfold)(false);
  }

  const panGesture = Gesture.Pan()
    .shouldCancelWhenOutside(false)
    .simultaneousWithExternalGesture(scrollViewRef)
    .onTouchesDown(e => {
      if (isListScrollable) {
        yStartPos.value = e.changedTouches[0].y;
      }
    })
    .onTouchesMove((e, state) => {
      if (isListScrollable) {
        if (startClosing.value && e.changedTouches[0].y > yStartPos.value) {
          yStartPos.value = -1;
          onFoldTrigger();
        } else {
          state.fail();
        }
      }
    })
    .onUpdate(e => {
      if (!isListScrollable) {
        onDragUpdate(e.translationY);
      }
    })
    .onEnd(e => {
      if (!isListScrollable) {
        onEndTrigger(e);
      }
    });

  // Rows have no native views; taps are resolved against the row geometry.
  // Pressable-like timing: any hold without movement counts on release.
  const tapGesture = Gesture.Tap()
    .maxDuration(10000)
    .maxDistance(20)
    .onEnd(e => {
      'worklet';
      // A tap that stops (or closely follows) a fling shouldn't open a row —
      // the native list swallowed those touches too.
      if (momentumActive.value || Date.now() - lastMomentumEnd.value < 120) {
        return;
      }
      if (rowBottoms.length === 0) {
        return;
      }
      const y = e.y + scrollY.value - listHeaderOffset.value;
      if (y < 0) {
        return;
      }
      const index = firstRowAt(rowBottoms, y);
      if (y < rowTops[index] || y >= rowBottoms[index]) {
        return;
      }
      // Section headers are not tappable.
      if (rowBottoms[index] - rowTops[index] <= headerRowHeight + 0.5) {
        return;
      }
      runOnJS(handleRowPress)(index);
    });

  const listGestures = Gesture.Simultaneous(panGesture, tapGesture);

  return (
    <View style={{height: scrollContainerHeight}}>
      {showSyncProgress ? SyncProgressIndicator : <></>}
      <GestureDetector gesture={listGestures}>
        <Animated.ScrollView
          ref={scrollViewRef}
          bounces={false}
          scrollEventThrottle={1}
          onContentSizeChange={handleContentSizeChange}
          onScroll={scrollHandler}>
          {showSyncProgress ? (
            <View
              onLayout={e => {
                listHeaderOffset.value = e.nativeEvent.layout.height;
              }}>
              <TranslateText
                textKey={'txs_take_time_to_appear'}
                domain="onboarding"
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                textStyle={styles.noteText}
                numberOfLines={3}
              />
            </View>
          ) : null}
          {rows.length === 0 ? (
            <TransactionListEmpty />
          ) : (
            <View style={{height: listContentHeight}} />
          )}
          <View style={styles.emptyView} />
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    sectionHeaderText: {
      color: MUTED_TEXT,
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
      fontWeight: '700',
      letterSpacing: -0.28,
    },
    spinner: {
      width: screenHeight * 0.016,
      height: screenHeight * 0.016,
      marginLeft: 6,
    },
    emptyView: {
      height: screenHeight * 0.2,
      paddingVertical: screenHeight * 0.01,
      paddingHorizontal: screenWidth * 0.1,
    },
    noteText: {
      color: MUTED_TEXT,
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
      fontWeight: '700',
      letterSpacing: -0.28,
      paddingVertical: screenHeight * 0.01,
      paddingLeft: screenHeight * 0.02,
      paddingRight: screenWidth * 0.1,
    },
    headerContainer: {
      flexDirection: 'row',
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: ROW_BORDER,
      paddingLeft: screenHeight * 0.02,
    },
  });

export default GlassTransactionList;
