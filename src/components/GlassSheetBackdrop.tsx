import React, {useContext, useMemo, useState} from 'react';
import {StyleSheet} from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Image,
  Paragraph,
  Path,
  Rect,
  Skia,
  useImage,
} from '@shopify/react-native-skia';
import type {SkImage, SkParagraph} from '@shopify/react-native-skia';
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {buildParagraph, useSatoshiFontMgr} from './GlassBalanceGraphics';
import {useAppSelector} from '../store/hooks';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  currencySymbolSelector,
} from '../reducers/settings';
import {convertLocalFiatToUSD} from '../reducers/ticker';
import {getNewMainSheetPoints} from '../animations/useNewMainAnims';
import {ScreenSizeContext} from '../context/screenSize';

// Skia renderer for the sheet's visible rows. GlassTransactionList scrolls
// an invisible spacer of the same total height so scroll physics stay native,
// and resolves row taps against this file's row geometry.

// Drag strip + tx title row sit above the list viewport.
export const DRAG_STRIP_HEIGHT_RATIO = 0.02;
export const TX_TITLE_ROW_HEIGHT_RATIO = 0.07;
export const GLASS_TX_LIST_TOP_RATIO =
  DRAG_STRIP_HEIGHT_RATIO + TX_TITLE_ROW_HEIGHT_RATIO;

// Row heights shared with the native spacers so both layouts match.
export const GLASS_TX_SECTION_HEADER_HEIGHT_RATIO = 0.031;
export const getGlassTxCellHeight = (screenHeight: number) =>
  Math.max(screenHeight * 0.08, 50);

export const SHEET_BACKGROUND = '#f7f7f7';
export const ROW_BORDER = 'rgba(214, 216, 218, 0.3)';
export const MUTED_TEXT = '#747E87';

export type GlassTxRow = any;

// Mirrors Cells/TransactionCell visuals.
const cellMeta = (metaLabel: string, pending: boolean) => {
  switch (metaLabel) {
    case 'Send':
      return {textKey: 'sent_ltc', amountColor: '#212124'};
    case 'Receive':
      return {textKey: 'received_ltc', amountColor: '#1162E6'};
    case 'Convert':
      return {textKey: 'converted_ltc', amountColor: '#1162E6'};
    case 'Buy':
      return {
        textKey: pending ? 'buying_ltc' : 'bought_ltc',
        amountColor: '#1162E6',
      };
    case 'Sell':
      return {
        textKey: pending ? 'selling_ltc' : 'sold_ltc',
        amountColor: '#212124',
      };
    default:
      return {textKey: '', amountColor: '#212124'};
  }
};

export interface GlassTxRowModel {
  header: boolean;
  top: number;
  height: number;
  title: string;
  meta: string;
  crypto: string;
  fiat: string;
  amountColor: string;
  circleColor: string;
  iconKey: string;
  confs: number;
}

export interface GlassTxRowModels {
  models: GlassTxRowModel[];
  rowTops: number[];
  rowBottoms: number[];
}

// Worklets capture numeric offsets only, not row objects.
export const useGlassTxRowModels = (rows: GlassTxRow[]): GlassTxRowModels => {
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const {t} = useTranslation('main');

  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const amountSymbol = useAppSelector(state => subunitSymbolSelector(state));
  const currencySymbol = useAppSelector(state => currencySymbolSelector(state));
  const localFiatToUSD = useAppSelector(state => convertLocalFiatToUSD(state));

  const cellHeight = getGlassTxCellHeight(SCREEN_HEIGHT);
  const headerHeight = SCREEN_HEIGHT * GLASS_TX_SECTION_HEADER_HEIGHT_RATIO;

  return useMemo(() => {
    const models: GlassTxRowModel[] = [];
    const rowTops: number[] = [];
    const rowBottoms: number[] = [];
    let y = 0;
    for (const row of rows) {
      if ('type' in row && row.type === 'sectionHeader') {
        models.push({
          header: true,
          top: y,
          height: headerHeight,
          title: row.title,
          meta: '',
          crypto: '',
          fiat: '',
          amountColor: MUTED_TEXT,
          circleColor: '',
          iconKey: '',
          confs: 0,
        });
        rowTops.push(y);
        y += headerHeight;
        rowBottoms.push(y);
        continue;
      }
      const pending = row.providerMeta?.status === 'pending';
      const {textKey, amountColor} = cellMeta(row.metaLabel, pending);
      let crypto = convertToSubunit(row.amount).toFixed(8);
      if (crypto.match(/\./)) {
        crypto = crypto.replace(/\.?0+$/, '');
      }
      const fiatOnDate = Math.abs(
        Number(
          parseFloat(
            String((row.priceOnDate / localFiatToUSD) * (row.amount / 1e8)),
          ).toFixed(2),
        ),
      );
      const sign = Math.sign(parseFloat(String(row.amount))) === -1 ? '-' : '';
      models.push({
        header: false,
        top: y,
        height: cellHeight,
        title: t(textKey),
        meta: `${String(row.time)}  ${row.label}`,
        crypto: `${crypto}${amountSymbol}`,
        fiat: `${sign}${currencySymbol}${fiatOnDate}`,
        amountColor,
        circleColor: row.metaLabel === 'Send' ? '#000000' : '#1162E6',
        iconKey: row.metaLabel,
        confs: row.confs,
      });
      rowTops.push(y);
      y += cellHeight;
      rowBottoms.push(y);
    }
    return {models, rowTops, rowBottoms};
  }, [
    rows,
    t,
    convertToSubunit,
    amountSymbol,
    currencySymbol,
    localFiatToUSD,
    cellHeight,
    headerHeight,
  ]);
};

export const useGlassTxIcons = (): Record<string, SkImage | null> => ({
  Send: useImage(require('../assets/icons/sendtx.png')),
  Receive: useImage(require('../assets/icons/receivetx.png')),
  Convert: useImage(require('../assets/icons/converttx.png')),
  Buy: useImage(require('../assets/icons/buytx.png')),
  Sell: useImage(require('../assets/icons/selltx.png')),
});

// First row whose bottom edge is below contentTop.
export const firstRowAt = (rowBottoms: number[], contentTop: number) => {
  'worklet';
  let lo = 0;
  let hi = rowBottoms.length - 1;
  let first = rowBottoms.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (rowBottoms[mid] > contentTop) {
      first = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return first;
};

export const WINDOW_OVERSCAN_ROWS = 8;

// Rows [start, end] cover [contentTop, contentBottom] plus at least
// `overscanRows` on each side, quantized to overscan boundaries. The result
// only changes when the visible range crosses a boundary, so the JS-side
// window re-render fires once per ~8 rows of travel instead of per row, and
// the overscan keeps drawn rows ahead of the UI-thread transform during
// flings while a re-render is still pending.
export const windowedRowRange = (
  rowTops: number[],
  rowBottoms: number[],
  contentTop: number,
  contentBottom: number,
  overscanRows: number,
) => {
  'worklet';
  const first = firstRowAt(rowBottoms, contentTop);
  let last = first;
  while (last + 1 < rowTops.length && rowTops[last + 1] < contentBottom) {
    last += 1;
  }
  const start = Math.max(
    0,
    Math.floor((first - overscanRows) / overscanRows) * overscanRows,
  );
  const end = Math.min(
    rowBottoms.length - 1,
    (Math.floor((last + overscanRows) / overscanRows) + 1) * overscanRows - 1,
  );
  return {start, end};
};

interface RowElementParams {
  models: GlassTxRowModel[];
  start: number;
  end: number;
  fontMgr: NonNullable<ReturnType<typeof useSatoshiFontMgr>>;
  icons: Record<string, SkImage | null>;
  // Cache paragraphs across window shifts.
  paragraphCache: Map<number, Record<string, SkParagraph>>;
  screenWidth: number;
  screenHeight: number;
}

// Long scroll sessions on large wallets would otherwise grow the cache
// without bound; rebuilding an evicted row's paragraphs is cheap.
const PARAGRAPH_CACHE_CAP = 400;

// Skia elements for rows [start, end], in list-content coordinates.
export const buildGlassTxRowElements = (params: RowElementParams) => {
  const {
    models,
    start,
    end,
    fontMgr,
    icons,
    paragraphCache,
    screenWidth,
    screenHeight,
  } = params;

  const pad = screenWidth * 0.05;
  const circleSize = screenHeight * 0.045;
  const textLeft = pad + circleSize + pad;
  const cellPadV = screenHeight * 0.02;
  const primarySize = screenHeight * 0.016;
  const secondarySize = screenHeight * 0.014;

  const paragraphsFor = (index: number, model: GlassTxRowModel) => {
    const cached = paragraphCache.get(index);
    if (cached) {
      return cached;
    }
    const built: Record<string, SkParagraph> = model.header
      ? {
          title: buildParagraph(
            fontMgr,
            model.title,
            secondarySize,
            700,
            MUTED_TEXT,
            screenWidth,
          ),
        }
      : {
          title: buildParagraph(
            fontMgr,
            model.title,
            primarySize,
            700,
            '#484859',
            screenWidth,
          ),
          meta: buildParagraph(
            fontMgr,
            model.meta,
            secondarySize,
            700,
            MUTED_TEXT,
            screenWidth,
          ),
          crypto: buildParagraph(
            fontMgr,
            model.crypto,
            primarySize,
            700,
            model.amountColor,
            screenWidth,
          ),
          fiat: buildParagraph(
            fontMgr,
            model.fiat,
            secondarySize,
            700,
            MUTED_TEXT,
            screenWidth,
          ),
        };
    paragraphCache.set(index, built);
    return built;
  };

  const clampedStart = Math.min(start, models.length - 1);
  const clampedEnd = Math.min(end, models.length - 1);
  if (paragraphCache.size > PARAGRAPH_CACHE_CAP) {
    for (const key of paragraphCache.keys()) {
      if (key < clampedStart || key > clampedEnd) {
        paragraphCache.delete(key);
        if (paragraphCache.size <= PARAGRAPH_CACHE_CAP) {
          break;
        }
      }
    }
  }
  const elements = [];
  for (let i = clampedStart; i <= clampedEnd; i++) {
    const model = models[i];
    const paragraphs = paragraphsFor(i, model);
    if (model.header) {
      elements.push(
        <Group key={i}>
          <Rect
            x={0}
            y={model.top}
            width={screenWidth}
            height={model.height}
            color={SHEET_BACKGROUND}
          />
          <Rect
            x={0}
            y={model.top + model.height - 0.5}
            width={screenWidth}
            height={0.5}
            color={ROW_BORDER}
          />
          <Paragraph
            paragraph={paragraphs.title}
            x={screenHeight * 0.02}
            y={model.top + (model.height - paragraphs.title.getHeight()) / 2}
            width={screenWidth}
          />
        </Group>,
      );
      continue;
    }

    const cy = model.top + model.height / 2;
    const pendingTx = model.confs <= 6;
    const circleR = (circleSize * (pendingTx ? 0.67 : 0.8)) / 2;
    const icon = icons[model.iconKey] ?? null;
    const iconSize = circleR * 1.1;
    let progressRing = null;
    if (pendingTx) {
      const ringR = (circleSize - 6) / 2;
      const sweep = (Math.min(Math.max(model.confs, 0), 6) / 6) * 360;
      const ring = Skia.Path.Make();
      ring.addArc(
        {
          x: pad + circleSize / 2 - ringR,
          y: cy - ringR,
          width: ringR * 2,
          height: ringR * 2,
        },
        -90,
        sweep,
      );
      progressRing = (
        <Path
          path={ring}
          style="stroke"
          strokeWidth={screenHeight * 0.003}
          color="#1EBC73"
        />
      );
    }

    elements.push(
      <Group key={i}>
        <Rect
          x={0}
          y={model.top}
          width={screenWidth}
          height={model.height}
          color="#ffffff"
        />
        <Rect
          x={0}
          y={model.top + model.height - 1}
          width={screenWidth}
          height={1}
          color={ROW_BORDER}
        />
        <Circle
          cx={pad + circleSize / 2}
          cy={cy}
          r={circleR}
          color={model.circleColor}
        />
        {icon ? (
          <Image
            image={icon}
            x={pad + circleSize / 2 - iconSize / 2}
            y={cy - iconSize / 2}
            width={iconSize}
            height={iconSize}
            fit="contain"
          />
        ) : null}
        {progressRing}
        <Paragraph
          paragraph={paragraphs.title}
          x={textLeft}
          y={model.top + cellPadV}
          width={screenWidth}
        />
        <Paragraph
          paragraph={paragraphs.meta}
          x={textLeft}
          y={model.top + model.height - cellPadV - paragraphs.meta.getHeight()}
          width={screenWidth}
        />
        <Paragraph
          paragraph={paragraphs.crypto}
          x={screenWidth - pad - paragraphs.crypto.getLongestLine()}
          y={model.top + cellPadV}
          width={screenWidth}
        />
        <Paragraph
          paragraph={paragraphs.fiat}
          x={screenWidth - pad - paragraphs.fiat.getLongestLine()}
          y={model.top + model.height - cellPadV - paragraphs.fiat.getHeight()}
          width={screenWidth}
        />
      </Group>,
    );
  }
  return elements;
};

interface Props {
  rowModels: GlassTxRowModels;
  scrollY: SharedValue<number>;
  // Measured height of the list's sync-progress header (0 when absent).
  listHeaderOffset: SharedValue<number>;
  // False while a card is open — only the sheet background shows then.
  showTxList: boolean;
}

const GlassSheetBackdrop: React.FC<Props> = props => {
  const {rowModels, scrollY, listHeaderOffset, showTxList} = props;
  const {models, rowTops, rowBottoms} = rowModels;

  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const fontMgr = useSatoshiFontMgr();
  const icons = useGlassTxIcons();

  const {UNFOLD_SHEET_POINT} = getNewMainSheetPoints(SCREEN_HEIGHT, insets.top);
  const listTop = SCREEN_HEIGHT * GLASS_TX_LIST_TOP_RATIO;
  const canvasHeight = SCREEN_HEIGHT - UNFOLD_SHEET_POINT - listTop;

  // Re-render only when the overscanned row window shifts (~once per 8 rows).
  const [window, setWindow] = useState({start: 0, end: 0});
  useAnimatedReaction(
    () => {
      if (!showTxList || rowBottoms.length === 0) {
        return {start: 0, end: 0};
      }
      const contentTop = scrollY.value - listHeaderOffset.value;
      return windowedRowRange(
        rowTops,
        rowBottoms,
        contentTop,
        contentTop + canvasHeight,
        WINDOW_OVERSCAN_ROWS,
      );
    },
    (cur, prev) => {
      if (!prev || cur.start !== prev.start || cur.end !== prev.end) {
        runOnJS(setWindow)(cur);
      }
    },
    [showTxList, rowTops, rowBottoms, canvasHeight],
  );

  // List-content coordinates -> canvas coordinates.
  const contentTransform = useDerivedValue(() => [
    {translateY: listHeaderOffset.value - scrollY.value},
  ]);

  const paragraphCache = useMemo(() => {
    return new Map<number, Record<string, SkParagraph>>();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, fontMgr, SCREEN_WIDTH, SCREEN_HEIGHT]);

  const rowElements = useMemo(() => {
    if (!showTxList || !fontMgr || models.length === 0) {
      return null;
    }
    return buildGlassTxRowElements({
      models,
      start: window.start,
      end: window.end,
      fontMgr,
      icons,
      paragraphCache,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showTxList,
    fontMgr,
    models,
    window,
    paragraphCache,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    icons.Send,
    icons.Receive,
    icons.Convert,
    icons.Buy,
    icons.Sell,
  ]);

  const styles = getStyles(SCREEN_WIDTH, listTop, canvasHeight);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      <Rect
        x={0}
        y={0}
        width={SCREEN_WIDTH}
        height={canvasHeight}
        color={SHEET_BACKGROUND}
      />
      {rowElements ? (
        <Group transform={contentTransform}>{rowElements}</Group>
      ) : null}
    </Canvas>
  );
};

const getStyles = (
  screenWidth: number,
  listTop: number,
  canvasHeight: number,
) =>
  StyleSheet.create({
    canvas: {
      position: 'absolute',
      top: listTop,
      left: 0,
      width: screenWidth,
      height: canvasHeight,
    },
  });

export default GlassSheetBackdrop;
