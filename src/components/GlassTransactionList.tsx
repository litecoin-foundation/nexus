import React, {
  useRef,
  useLayoutEffect,
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
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
  ROW_BORDER,
  MUTED_TEXT,
} from './GlassTxRows';
import {
  decimalSyncedSelector,
  recoveryProgressSelector,
  getRecoveryInfo,
} from '../reducers/info';

// Invisible native scroller; GlassTxCanvas draws the visible rows so the tab
// bar glass can refract them. The Skia rows are positioned from scrollY, so
// scrollY must be written on the UI thread — a JS-side scroll handler makes
// every drawn frame wait on the JS thread and stutters the whole list. That is
// why this is a plain Animated.ScrollView over one fixed-height spacer (row
// geometry is deterministic in rowModels) instead of a list component:
// FlashList v2 only supports plain-JS onScroll. Row taps are resolved by
// hit-testing the shared row geometry.
//
// The sync header is pinned above the scroller, so the scroller's origin is
// the first row's origin: a tap at e.y is at content offset e.y + scrollY, and
// listHeaderOffset (the header's height) is what shifts the Skia rows down.
// A content inset — the search screen's bar, which the rows scroll under —
// pads the scroller instead, and is that same offset. With the header up it
// pads the header in the scroller's place, so the rows follow the header
// directly rather than a second inset below it.
//
// The wallet's list is the sheet's: it hands drags to the sheet and is sized
// to the unfolded sheet. The search screen's has no sheet and fills its
// container; it draws the rows in a canvas of its own (GlassSearchTxCanvas).

// How far the finger has to travel before the sheet takes a drag away from the
// list; anything shorter reads as jitter inside a scroll.
const SHEET_PULL_SLOP = 8;

const IS_ANDROID = Platform.OS === 'android';

// What a list with no sheet folds nothing.
const noSheetFold = (_unfold: boolean) => {};

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

// The sheet the wallet's list lives on; absent for a list that stands alone.
export interface GlassTxListSheet {
  folded: boolean;
  foldUnfold: (unfold: boolean) => void;
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
}

interface Props {
  onPress(item: ItemType): void;
  rows: RowType[];
  rowModels: GlassTxRowModels;
  sheet?: GlassTxListSheet;
  onScrollActivity?: () => void;
  scrollY: SharedValue<number>;
  // Where the rows start below the container's top — the pinned sync header
  // plus the inset. For the chrome canvas, which draws in screen space; a
  // rows layer below draws in the scroller's and needs only the inset.
  listHeaderOffset?: SharedValue<number>;
  // Gap above the first row, inside the scroller. While the sync header is
  // up it pads the header instead, so whatever sits in the gap covers no
  // text and the rows start right under the header.
  contentTopInset?: number;
  // Drawn beneath the scroller, in its coordinates: a canvas for a list whose
  // rows are not in the chrome. Handed where the first row starts below the
  // scroller's top — the inset, or nothing under the sync header.
  rowsLayer?: (topInset: number) => React.ReactNode;
}

const GlassTransactionList: React.FC<Props> = props => {
  const insets = useSafeAreaInsets();

  const {
    onPress,
    rows,
    rowModels,
    sheet,
    onScrollActivity,
    scrollY,
    listHeaderOffset,
    contentTopInset = 0,
    rowsLayer,
  } = props;

  const {rowTops, rowBottoms} = rowModels;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  useEffect(() => {
    scrollY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stand-ins for a list with no sheet, so the drag worklets exist either
  // way; the gestures that would read them are not attached.
  const idleSheetY = useSharedValue(0);
  const folded = sheet?.folded ?? false;
  const foldUnfold = sheet?.foldUnfold ?? noSheetFold;
  const mainSheetsTranslationY = sheet?.mainSheetsTranslationY ?? idleSheetY;
  const mainSheetsTranslationYStart =
    sheet?.mainSheetsTranslationYStart ?? idleSheetY;

  const {UNFOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const scrollContainerHeight =
    SCREEN_HEIGHT -
    UNFOLD_SHEET_POINT -
    SCREEN_HEIGHT * GLASS_TX_LIST_TOP_RATIO;
  const containerStyle = sheet ? {height: scrollContainerHeight} : styles.fill;

  const listContentHeight =
    rowBottoms.length > 0 ? rowBottoms[rowBottoms.length - 1] : 0;

  const {recoveryMode, recoveryFinished, syncedToChain} = useAppSelector(
    state => state.info!,
  );
  const progress = useAppSelector(state => decimalSyncedSelector(state));
  const recoveryProgress = useAppSelector(state =>
    recoveryProgressSelector(state),
  );

  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    // the 15s poll owns tx fetching; a mount-time fetch re-fired the whole
    // row/paragraph cascade right as the return-to-wallet fade plays
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

  // The inset pads whichever comes first: the pinned header while it is up,
  // else the scroller's content. Never both, or the rows would sit a whole
  // inset below the header's note.
  const insetStyle = useMemo(
    () => ({paddingTop: contentTopInset}),
    [contentTopInset],
  );
  const rowsTopInset = showSyncProgress ? 0 : contentTopInset;
  const contentStyle = useMemo(
    () => ({paddingTop: rowsTopInset}),
    [rowsTopInset],
  );

  useEffect(() => {
    if (!showSyncProgress && listHeaderOffset) {
      listHeaderOffset.value = contentTopInset;
    }
  }, [showSyncProgress, listHeaderOffset, contentTopInset]);

  const SyncProgressIndicator = (
    <View
      style={insetStyle}
      onLayout={e => {
        if (listHeaderOffset) {
          listHeaderOffset.value = e.nativeEvent.layout.height;
        }
      }}>
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
      <TranslateText
        textKey={'txs_take_time_to_appear'}
        domain="onboarding"
        maxSizeInPixels={SCREEN_HEIGHT * 0.015}
        textStyle={styles.noteText}
        numberOfLines={3}
      />
    </View>
  );

  // Both measured, so neither goes stale when the pinned header appears and
  // resizes the scroller without changing its content. Until the first layout
  // lands the viewport is assumed to be the whole container, which is what it
  // is whenever the sync header is absent.
  const [viewportHeight, setViewportHeight] = useState(scrollContainerHeight);
  const [contentHeight, setContentHeight] = useState(0);
  const isListScrollable = contentHeight > viewportHeight;

  const pullAnchorY = useSharedValue(0);
  const sheetTookTouch = useSharedValue(false);
  const sheetDragging = useSharedValue(false);
  const pullSlopTaken = useSharedValue(0);
  const momentumActive = useSharedValue(false);
  const lastMomentumEnd = useSharedValue(0);
  const caughtFling = useSharedValue(false);
  const lastActivityMark = useSharedValue(0);

  // Reanimated keys a scroll handler on its worklets' code hash, never on the
  // values they capture, so the handler below is built once and any plain JS
  // value it reads would stay frozen at its first-render value. `folded`
  // changes, so it has to reach the UI thread as a shared value.
  const foldedValue = useSharedValue(folded);
  useEffect(() => {
    foldedValue.value = folded;
  }, [folded, foldedValue]);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: e => {
        scrollY.value = e.contentOffset.y;
        if (onScrollActivity) {
          const now = Date.now();
          if (now - lastActivityMark.value > 200) {
            lastActivityMark.value = now;
            runOnJS(onScrollActivity)();
          }
        }
      },
      onBeginDrag: () => {
        // A scroll attempt while folded unfolds the sheet, unless this very
        // touch is the one that folded it.
        if (foldedValue.value && !sheetTookTouch.value) {
          runOnJS(foldUnfold)(true);
        }
      },
      onMomentumBegin: () => {
        momentumActive.value = true;
      },
      onMomentumEnd: () => {
        momentumActive.value = false;
        lastMomentumEnd.value = Date.now();
      },
    },
    [foldUnfold, onScrollActivity],
  );

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

  // The list keeps every vertical drag for as long as it has rows left to
  // scroll back through; the sheet only takes over once the first row is on
  // screen, so a scroll can never be cut short by a fold mid-list.
  const panGesture = Gesture.Pan()
    .shouldCancelWhenOutside(false)
    .manualActivation(true)
    .onTouchesDown(e => {
      pullAnchorY.value = e.changedTouches[0].absoluteY;
      pullSlopTaken.value = 0;
      sheetTookTouch.value = false;
      sheetDragging.value = false;
    })
    .onTouchesMove((e, state) => {
      if (sheetTookTouch.value) {
        return;
      }
      const y = e.changedTouches[0].absoluteY;
      if (isListScrollable && scrollY.value > 0) {
        pullAnchorY.value = y;
        return;
      }
      const pull = y - pullAnchorY.value;
      if (!isListScrollable) {
        // Nothing to scroll, so the whole drag belongs to the sheet.
        if (Math.abs(pull) > SHEET_PULL_SLOP) {
          sheetTookTouch.value = true;
          sheetDragging.value = true;
          pullSlopTaken.value = pull;
          state.activate();
        }
        return;
      }
      if (!foldedValue.value && pull > SHEET_PULL_SLOP) {
        sheetTookTouch.value = true;
        onFoldTrigger();
        if (IS_ANDROID) {
          state.activate();
        } else {
          state.fail();
        }
      }
    })
    .onUpdate(e => {
      if (!sheetDragging.value) {
        return;
      }
      onDragUpdate(e.translationY - pullSlopTaken.value);
    })
    .onEnd(e => {
      if (!sheetDragging.value) {
        return;
      }
      onEndTrigger({
        translationY: e.translationY - pullSlopTaken.value,
        velocityY: e.velocityY,
      });
    });

  // Rows have no native views; taps are resolved against the row geometry.
  // Pressable-like timing: any hold without movement counts on release.
  const tapGesture = Gesture.Tap()
    // A press has no time limit, like the Pressable rows this replaced; it is
    // movement past the touch slop that hands the touch to the scroller.
    .maxDuration(10000)
    .maxDistance(20)
    .onTouchesDown(() => {
      // A touch that catches a fling only stops it, exactly as it did when the
      // rows were native pressables inside the scroller.
      caughtFling.value =
        momentumActive.value || Date.now() - lastMomentumEnd.value < 120;
    })
    .onEnd(e => {
      'worklet';
      if (caughtFling.value || rowBottoms.length === 0) {
        return;
      }
      const y = e.y + scrollY.value - rowsTopInset;
      const index = firstRowAt(rowBottoms, y);
      // Past the last row (the footer) the tap falls outside every row.
      if (y < rowTops[index] || y >= rowBottoms[index]) {
        return;
      }
      runOnJS(handleRowPress)(index);
    });

  // No sheet, no drag to hand it - the scroller keeps every drag itself.
  const listGestures = sheet
    ? Gesture.Simultaneous(panGesture, tapGesture)
    : tapGesture;

  return (
    <View style={containerStyle}>
      {showSyncProgress ? SyncProgressIndicator : <></>}
      <View style={styles.viewport}>
        {rowsLayer?.(rowsTopInset)}
        <GestureDetector gesture={listGestures}>
          <Animated.ScrollView
            style={styles.scroller}
            contentContainerStyle={contentStyle}
            bounces={false}
            scrollEventThrottle={1}
            onLayout={e => setViewportHeight(e.nativeEvent.layout.height)}
            onContentSizeChange={(_, height) => setContentHeight(height)}
            onScroll={scrollHandler}>
            {rows.length === 0 ? (
              <TransactionListEmpty />
            ) : (
              <View style={{height: listContentHeight}} />
            )}
            <View style={styles.emptyView} />
          </Animated.ScrollView>
        </GestureDetector>
      </View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    fill: {
      flex: 1,
    },
    viewport: {
      flex: 1,
    },
    scroller: {
      flex: 1,
    },
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
