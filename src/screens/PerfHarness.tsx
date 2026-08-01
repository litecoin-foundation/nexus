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
import GlassTxListHeader from '../components/GlassTxListHeader';
import {
  BD_ALL,
  BackdropPart,
  TB_ALL,
  TabBarPart,
  TS_ALL,
  TabSelPart,
  perfLog,
  setBackdropParts,
  setFrostLevels,
  setSearchButtonImpl,
  setTabBarParts,
  setTabSelParts,
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
//
// Trimmed from the original eight after three measured builds. The cut rungs
// are not lost coverage, they are settled questions:
//   bare screen      rendered exactly one frame per cycle. The controller is free.
//   tx list, no skia delta to "sheet only" was -1.3 then +1.4 points, i.e. noise
//                    both times. A ScrollView over one spacer costs nothing.
//   chart            was +0 ms once GlassChartTouch's canvas merged into the
//                    backdrop (26.7 -> 27.0 janky%, p50 25 -> 25 ms).
// Their content is still mounted, folded into the rung above, so R3 is still
// the whole screen.
//
// R4/R5 are appended rather than inserted so R0-R3 stay comparable with runs
// taken before they existed. They mount the production title/search header,
// which no rung covered: the harness mounted GlassTransactionList directly,
// so the search button's <Canvas> was never priced. Their delta is the whole
// point — same content, one drawn in Skia and one in native views.
const RUNGS = [
  'R0 sheet + list',
  'R1 tab bar canvas',
  'R2 backdrop',
  'R3 chart + tab selector',
  'R4 + tx header (skia)',
  'R5 + tx header (native)',
];
// Content level each rung mounts, on the original 0-7 scale that the level>=N
// checks below are written against. Keeping the old scale means the rung set
// can be re-cut without touching the tree. 8 = R3 plus the tx-list header.
const RUNG_LEVELS = [2, 4, 5, 7, 8, 8];
const RUNG_SEARCH_IMPL = [
  'native',
  'native',
  'native',
  'native',
  'skia',
  'native',
] as const;

// A rung can only say "mounting this costs X". Sub-ladders say which pass
// inside it the X is in: hold the content level fixed and leave one part out at
// a time, so every sub-rung draws the same tree minus one thing.
type SubLadder = 'none' | 'backdrop' | 'tabbar' | 'tabsel';
// Asserted rather than annotated so editing this one line does not make every
// other branch below unreachable-by-narrowing.
const SUB_LADDER = 'none' as SubLadder;

const withoutBd = (...drop: BackdropPart[]): BackdropPart[] =>
  BD_ALL.filter(p => !drop.includes(p));
const withoutTb = (...drop: TabBarPart[]): TabBarPart[] =>
  TB_ALL.filter(p => !drop.includes(p));
const withoutTs = (...drop: TabSelPart[]): TabSelPart[] =>
  TS_ALL.filter(p => !drop.includes(p));

// The R1->R2 step costs +13 ms of non-GPU time per frame. Held at the backdrop
// content level.
const BD_RUNGS: {name: string; parts: BackdropPart[]}[] = [
  // Discarded: the first window after unlock catches a sync-spinner burst that
  // renders ~2500 frames and dilutes janky%.
  {name: 'W warmup', parts: BD_ALL},
  {name: 'S0 all', parts: BD_ALL},
  {name: 'S1 -filter', parts: withoutBd('filter')},
  {name: 'S2 -gradient', parts: withoutBd('gradient')},
  {name: 'S3 -foldclip', parts: withoutBd('foldclip')},
  {name: 'S4 -balance', parts: withoutBd('balance')},
  {name: 'S5 -capsules', parts: withoutBd('shadows', 'accents')},
  {name: 'S6 empty canvas', parts: []},
];

// GlassTxCanvas measured 8.9 ms/frame, of which ~6.2 ms is rasterisation
// (setJsiProperty) and ~2.7 ms is the picture rebuild. It is the most expensive
// canvas on the screen and no rung splits it. Held at the tab-bar content
// level, with the backdrop deliberately absent so the two canvases don't
// contend (mounting the backdrop pushed this one 8.0 -> 9.0 ms).
//
// T1/T2 bracket the frost: T1 removes all three blur levels, T2 removes one.
// The gap between them says whether the level count is worth tuning or the
// whole pass needs replacing.
const TB_RUNGS: {name: string; parts: TabBarPart[]; frostLevels?: number}[] = [
  {name: 'W warmup', parts: TB_ALL},
  {name: 'T0 all', parts: TB_ALL},
  {name: 'T1 -frost', parts: withoutTb('frost')},
  {name: 'T2 frost x2', parts: TB_ALL, frostLevels: 2},
  {name: 'T3 -rows', parts: withoutTb('rows')},
  {name: 'T4 -glass', parts: withoutTb('glass')},
  {name: 'T5 -chrome', parts: withoutTb('chrome')},
  {name: 'T6 -barshadow', parts: withoutTb('barshadow')},
  {name: 'T7 empty canvas', parts: []},
];

// PERFORMANCE.md's #1 backlog item: mounting GlassTabSelector costs ~8 points
// of jank and nobody knows why. Converting its Yoga-dirtying props to transform
// changed nothing, so the cost is in its ~48 views, its labels or its mappers.
// Built additively rather than leave-one-out, because the question is "which
// part is it", not "does removing one help".
const TS_RUNGS: {name: string; parts: TabSelPart[]}[] = [
  {name: 'W warmup', parts: TS_ALL},
  {name: 'U0 empty overlay', parts: []},
  {name: 'U1 +hit targets', parts: ['hittargets']},
  {name: 'U2 +icons', parts: ['hittargets', 'icons']},
  {name: 'U3 +labels', parts: ['hittargets', 'icons', 'labels']},
  {name: 'U4 +geometry (all)', parts: TS_ALL},
  {name: 'U5 all -labels', parts: withoutTs('labels')},
];

const SUB_RUNG_NAMES =
  SUB_LADDER === 'backdrop'
    ? BD_RUNGS.map(s => s.name)
    : SUB_LADDER === 'tabbar'
      ? TB_RUNGS.map(s => s.name)
      : SUB_LADDER === 'tabsel'
        ? TS_RUNGS.map(s => s.name)
        : [];
// Content level each sub-ladder holds. The backdrop needs its own canvas
// mounted (5); the tab bar canvas arrives with rows at 4.
const SUB_CONTENT_LEVEL =
  SUB_LADDER === 'backdrop' ? 5 : SUB_LADDER === 'tabsel' ? 7 : 4;

const LADDER: string[] = SUB_LADDER === 'none' ? RUNGS : SUB_RUNG_NAMES;
// Both modes on the main ladder: worklet and runOnJS have agreed at every rung
// across three builds, and that agreement is the control that keeps proving the
// React commit costs nothing. A sub-ladder only needs the pure-draw floor.
const MODES: DriveMode[] =
  SUB_LADDER === 'none' ? ['worklet', 'runOnJS'] : ['worklet'];

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
  // Set before children render, so bdOn()/tbOn() pick it up on this pass.
  const level = SUB_LADDER === 'none' ? RUNG_LEVELS[rung] : SUB_CONTENT_LEVEL;
  if (SUB_LADDER === 'backdrop') {
    setBackdropParts(BD_RUNGS[rung].parts);
  } else if (SUB_LADDER === 'tabbar') {
    setTabBarParts(TB_RUNGS[rung].parts);
    setFrostLevels(TB_RUNGS[rung].frostLevels ?? null);
  } else if (SUB_LADDER === 'tabsel') {
    setTabSelParts(TS_RUNGS[rung].parts);
  } else {
    setSearchButtonImpl(RUNG_SEARCH_IMPL[rung]);
  }
  const searchImpl = SUB_LADDER === 'none' ? RUNG_SEARCH_IMPL[rung] : 'native';
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
      mainSheetsTranslationY.value = withTiming(target, {
        duration: SHEET_FOLD_ANIM_MS,
      });
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

  // Memoized on `folded` exactly as NewMain's TxListComponentMemo is, so the
  // header re-renders once per fold here too — which is what makes the R3->R4
  // step measure the search canvas's per-fold re-record rather than 20 of them.
  const sheetContent = useMemo(
    () =>
      level >= 2 ? (
        <View>
          {level >= 8 ? (
            // keyed on the impl: the header is memoized and reads its impl
            // from module state, so R4 -> R5 has to remount it
            <GlassTxListHeader key={searchImpl} onSearch={noop} />
          ) : null}
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
        </View>
      ) : (
        <View style={styles.stubContent} />
      ),
    [
      level,
      searchImpl,
      txRows,
      txRowModels,
      folded,
      foldUnfold,
      mainSheetsTranslationY,
      mainSheetsTranslationYStart,
      txListScrollY,
      txListHeaderOffset,
      styles.stubContent,
    ],
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
          // Remounted per rung so a leave-one-out set is picked up even
          // though the parts are module state, not props.
          <LiquidGlassTabBar
            key={`tb${rung}`}
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
          {SUB_LADDER !== 'none' ? (
            <Text style={styles.hudText}>{`sub: ${SUB_LADDER}`}</Text>
          ) : null}
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
