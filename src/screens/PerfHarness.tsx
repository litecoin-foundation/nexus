import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {SharedValue} from 'react-native-reanimated';
import {
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import GlassAmountView from '../components/GlassAmountView';
import GlassBottomSheet, {
  SHEET_FOLD_ANIM_MS,
} from '../components/GlassBottomSheet';
import GlassTabSelector from '../components/GlassTabSelector';
import GlassTopSectionChart from '../components/GlassTopSectionChart';
import GlassTransactionList from '../components/GlassTransactionList';
import LiquidGlassTabBar from '../components/LiquidGlassTabBar';
import {CardUnderlayProvider} from '../components/cardUnderlay';
import {
  DRAG_STRIP_HEIGHT_RATIO,
  GlassTxRowModels,
  SHEET_BACKGROUND,
  useGlassTxRowModels,
} from '../components/GlassTxRows';
import {useSatoshiFontMgr} from '../components/GlassBalanceGraphics';
import {
  BD_ALL,
  BackdropPart,
  perfLog,
  setBackdropParts,
} from '../config/perfHarness';
import {useAppSelector} from '../store/hooks';
import {txDetailSelector} from '../reducers/transaction';
import {flattenGroupedTransactions} from '../utils/groupTransactions';
import {ScreenSizeContext} from '../context/screenSize';
import {getNewMainSheetPoints} from '../animations/useNewMainAnims';

// Isolation rig for the sheet fold/unfold. Each rung adds exactly one suspected
// cost on top of the last, so the janky% delta between two rungs attributes the
// frame time to that one thing. Rungs are selected at runtime, so the whole
// ladder runs off a single release build.
const RUNGS = [
  'R0 bare',
  'R1 sheet only',
  'R2 tx list, no skia',
  'R3 tab bar canvas',
  'R4 rows',
  'R5 backdrop',
  'R6 chart',
  'R7 tab selector',
];

// The R4->R5 step costs +13ms of non-GPU time per frame, so price each element
// of the backdrop canvas on its own. Leave-one-out against S0, held at the R5
// content level, so every sub-rung draws the same tree minus one thing.
const SUB_LADDER = false;
const SUB_CONTENT_LEVEL = 5;
const without = (...drop: BackdropPart[]): BackdropPart[] =>
  BD_ALL.filter(p => !drop.includes(p));

const SUB_RUNGS: {name: string; parts: BackdropPart[]}[] = [
  // Discarded: the first window after unlock catches a sync-spinner burst that
  // renders ~2500 frames and dilutes janky%.
  {name: 'W warmup', parts: BD_ALL},
  {name: 'S0 all', parts: BD_ALL},
  {name: 'S1 -filter', parts: without('filter')},
  {name: 'S2 -gradient', parts: without('gradient')},
  {name: 'S3 -foldclip', parts: without('foldclip')},
  {name: 'S4 -balance', parts: without('balance')},
  {name: 'S5 -capsules', parts: without('shadows', 'accents')},
  {name: 'S6 empty canvas', parts: []},
];

const LADDER: string[] = SUB_LADDER ? SUB_RUNGS.map(s => s.name) : RUNGS;
// The sub-ladder only needs the pure-draw floor; React ordering is already
// known to cost nothing.
const MODES: DriveMode[] = SUB_LADDER ? ['worklet'] : ['worklet', 'runOnJS'];

// Production commits a fold from the UI thread first (useNewMainAnims springs,
// then runOnJS settles), so a plain JS timer would invert the hop order.
// `worklet` never flips React state at all, so it measures the UI thread and
// Skia floor; the delta to `runOnJS` is the React commit cost.
type DriveMode = 'worklet' | 'runOnJS';

const CYCLES = 20;
const PERIOD_MS = 1200; // clears the sheet's own 200/155/600ms timers
const ARM_MS = 6000; // clears the font decode and the 450ms mount fade
const RUNG_GAP_MS = 3000;

const PerfHarness: React.FC = () => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    SCREEN_HEIGHT,
    insets.top,
  );

  // Seed both at FOLD_SHEET_POINT exactly as useNewMainAnims does, or the
  // sheet's mount effect animates it into place and cycle 1 isn't comparable.
  const mainSheetsTranslationY = useSharedValue(FOLD_SHEET_POINT);
  const mainSheetsTranslationYStart = useSharedValue(FOLD_SHEET_POINT);
  const cardSwapOpacity = useSharedValue(0);
  const tabBarActivity = useSharedValue(0);
  const txListScrollY = useSharedValue(0);
  const txListHeaderOffset = useSharedValue(0);
  // runOnJS mode reads the fold state from the UI thread, so mirror it rather
  // than capture a stale render's copy.
  const foldedShared = useSharedValue(true);

  const [folded, setFolded] = useState(true);
  const [rung, setRung] = useState(0);
  // Set before children render, so bdOn() in the backdrop picks it up.
  const level = SUB_LADDER ? SUB_CONTENT_LEVEL : rung;
  if (SUB_LADDER) {
    setBackdropParts(SUB_RUNGS[rung].parts);
  }
  const [cycle, setCycle] = useState(0);
  const [mode, setMode] = useState<DriveMode>('worklet');

  useEffect(() => {
    foldedShared.value = folded;
  }, [folded, foldedShared]);

  // NewMain's foldUnfold inverts the sense: foldUnfold(true) means unfold.
  const foldUnfold = useCallback(
    (isFolded: boolean) => setFolded(!isFolded),
    [],
  );

  const transactions = useAppSelector(state => txDetailSelector(state));
  const txRows = useMemo(
    () => flattenGroupedTransactions(transactions),
    [transactions],
  );
  const txRowModels = useGlassTxRowModels(txRows);
  const emptyRowModels: GlassTxRowModels = useMemo(
    () => ({models: [], rowTops: [], rowBottoms: []}),
    [],
  );

  // useGlassTxRowElements returns null while the font manager is falsy, so an
  // early arm would measure a canvas drawing no rows at all.
  const ready = useSatoshiFontMgr() !== null;

  const drive = useCallback(() => {
    if (mode === 'runOnJS') {
      runOnUI(() => {
        'worklet';
        runOnJS(setFolded)(!foldedShared.value);
      })();
      return;
    }
    runOnUI(() => {
      'worklet';
      const mid = (UNFOLD_SHEET_POINT + FOLD_SHEET_POINT) / 2;
      const target =
        mainSheetsTranslationY.value > mid
          ? UNFOLD_SHEET_POINT
          : FOLD_SHEET_POINT;
      mainSheetsTranslationY.value = withTiming(target, {duration: SHEET_FOLD_ANIM_MS});
      mainSheetsTranslationYStart.value = target;
    })();
  }, [
    mode,
    foldedShared,
    UNFOLD_SHEET_POINT,
    FOLD_SHEET_POINT,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
  ]);

  // rn-skia's per-frame UI-thread timings. The worklet runtime has no logging
  // channel, and a plain JS read of a UI-written shared value does not sync
  // reliably, so react to it on the UI thread and hop back explicitly.
  const skPerf = (global as any).__skPerfSV as SharedValue<string> | undefined;
  const rungRef = useRef(rung);
  rungRef.current = rung;
  const reportSkia = useCallback((v: string) => {
    perfLog(`skia rung=${rungRef.current} ${v}`);
  }, []);
  useAnimatedReaction(
    () => skPerf?.value ?? '',
    (cur, prev) => {
      if (cur && cur !== prev) {
        runOnJS(reportSkia)(cur);
      }
    },
    [skPerf, reportSkia],
  );

  // Fires once the fonts land, giving the host the whole arm window to reset
  // gfxinfo before rung 0 starts driving.
  useEffect(() => {
    if (ready) {
      perfLog(`armed arm=${ARM_MS} cycles=${CYCLES} period=${PERIOD_MS}`);
    }
  }, [ready]);

  // The host brackets each rung with gfxinfo reset/dump off these markers, so
  // one launch measures the whole ladder hands-free.
  useEffect(() => {
    if (!ready) {
      return;
    }
    let n = 0;
    let tick: ReturnType<typeof setTimeout>;
    const start = setTimeout(
      function run() {
        if (n === 0) {
          perfLog(
            `rung=${rung} mode=${mode} start rows=${txRowModels.models.length}`,
          );
        }
        if (n >= CYCLES) {
          perfLog(`rung=${rung} mode=${mode} end cycles=${n}`);
          if (rung + 1 < LADDER.length) {
            tick = setTimeout(() => {
              setCycle(0);
              setRung(rung + 1);
            }, RUNG_GAP_MS);
          } else if (MODES.indexOf(mode) < MODES.length - 1) {
            const next = MODES[MODES.indexOf(mode) + 1];
            tick = setTimeout(() => {
              setCycle(0);
              setRung(0);
              setMode(next);
            }, RUNG_GAP_MS);
          } else {
            // Loop rather than stop: one unlock then covers every pass, and the
            // host can start its capture at any point and catch the next one.
            perfLog('ladder complete');
            tick = setTimeout(() => {
              setCycle(0);
              setRung(0);
              setMode(MODES[0]);
            }, RUNG_GAP_MS);
          }
          return;
        }
        n += 1;
        setCycle(n);
        drive();
        tick = setTimeout(run, PERIOD_MS);
      },
      rung === 0 && mode === MODES[0] ? ARM_MS : RUNG_GAP_MS,
    );
    return () => {
      clearTimeout(start);
      clearTimeout(tick);
    };
  }, [ready, rung, mode, drive, txRowModels.models.length]);

  const sheetContent =
    level >= 2 ? (
      <GlassTransactionList
        onPress={noop}
        rows={txRows}
        rowModels={txRowModels}
        folded={folded}
        foldUnfold={foldUnfold}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
        scrollY={txListScrollY}
        listHeaderOffset={txListHeaderOffset}
      />
    ) : (
      <View style={styles.stubContent} />
    );

  return (
    <CardUnderlayProvider>
      <View style={styles.container}>
        {level >= 5 ? (
          <GlassAmountView
            key={`bd${rung}`}
            internetOpacityStyle={styles.fullOpacity}
            mainSheetsTranslationY={mainSheetsTranslationY}
            activeTab={0}>
            {level >= 6 ? (
              <GlassTopSectionChart
                animatedOpacityStyle={styles.fullOpacity}
                isBottomSheetFolded={folded}
                triggerLester={0}
              />
            ) : null}
          </GlassAmountView>
        ) : null}

        {level >= 7 ? (
          <GlassTabSelector
            mainSheetsTranslationY={mainSheetsTranslationY}
            mainSheetsTranslationYStart={mainSheetsTranslationYStart}
            folded={folded}
            foldUnfold={foldUnfold}
            activeTab={0}
            onPressTab={noop}
            isInternetReachable={true}
          />
        ) : null}

        {level >= 1 ? (
          <GlassBottomSheet
            headerComponent={<View style={styles.dragStrip} />}
            txViewComponent={sheetContent}
            buyViewComponent={STUB}
            sellViewComponent={STUB}
            shopViewComponent={STUB}
            sendViewComponent={STUB}
            receiveViewComponent={STUB}
            mainSheetsTranslationY={mainSheetsTranslationY}
            mainSheetsTranslationYStart={mainSheetsTranslationYStart}
            cardOpacity={cardSwapOpacity}
            folded={folded}
            foldUnfold={foldUnfold}
            activeTab={0}
          />
        ) : null}

        {level >= 3 ? (
          <LiquidGlassTabBar
            activeIndex={0}
            onSelectSection={noop}
            contentActivity={tabBarActivity}
            rowModels={level >= 4 ? txRowModels : emptyRowModels}
            mainSheetsTranslationY={mainSheetsTranslationY}
            txListScrollY={txListScrollY}
            listHeaderOffset={txListHeaderOffset}
            showTxList={level >= 4}
            activeSheet={0}
            cardSwapOpacity={cardSwapOpacity}
            shopDisabled={false}
          />
        ) : null}

        {/* Screenshot-verifiable run state, so a gfxinfo window can be proved
            to have covered the cycles it claims. */}
        <View pointerEvents="none" style={styles.hud}>
          <Text style={styles.hudText}>
            {`${LADDER[rung]} | ${mode} | ${cycle}/${CYCLES}`}
          </Text>
          <Text style={styles.hudText}>
            {ready ? `rows ${txRowModels.models.length}` : 'waiting for fonts'}
          </Text>
        </View>
      </View>
    </CardUnderlayProvider>
  );
};

const noop = () => {};
const STUB = <View />;

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: screenWidth,
      height: screenHeight,
      backgroundColor: SHEET_BACKGROUND,
    },
    stubContent: {
      height: screenHeight * 0.6,
      backgroundColor: SHEET_BACKGROUND,
    },
    dragStrip: {
      width: '100%',
      height: screenHeight * DRAG_STRIP_HEIGHT_RATIO,
    },
    hud: {
      position: 'absolute',
      top: screenHeight * 0.06,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 999,
    },
    fullOpacity: {
      opacity: 1,
    },
    hudText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '700',
    },
  });

export default PerfHarness;
