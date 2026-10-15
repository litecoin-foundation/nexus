import {useContext, useEffect, useMemo, useState} from 'react';
import {Image as RNImage} from 'react-native';
import {Skia} from '@shopify/react-native-skia';
import type {SkImage} from '@shopify/react-native-skia';
import {useTranslation} from 'react-i18next';

import {useAppSelector} from '../store/hooks';
import {
  satsToSubunitSelector,
  subunitSymbolSelector,
  currencySymbolSelector,
} from '../reducers/settings';
import {convertLocalFiatToUSD} from '../reducers/ticker';
import {ScreenSizeContext} from '../context/screenSize';

// Geometry, formatting and shared assets for the transaction rows. Nothing
// here draws: GlassTxSkiaRows renders these models into the chrome canvas's
// picture, and GlassTransactionList scrolls an invisible spacer of the same
// total height so scroll physics stay native and taps can be hit-tested
// against `rowTops`.

// Drag strip + tx title row sit above the list viewport.
export const DRAG_STRIP_HEIGHT_RATIO = 0;
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
  const localFiatToUSDRaw = useAppSelector(state =>
    convertLocalFiatToUSD(state),
  );
  // sub-display-precision rate jitter would rebuild every model (and re-shape
  // every paragraph downstream) on each 15s ticker tick
  const localFiatToUSD = Number(localFiatToUSDRaw.toPrecision(5));

  const cellHeight = getGlassTxCellHeight(SCREEN_HEIGHT);
  const headerHeight = SCREEN_HEIGHT * GLASS_TX_SECTION_HEADER_HEIGHT_RATIO;

  // geometry depends only on the row sequence; rate/currency changes must
  // not re-clone these arrays into the UI runtime
  const {rowTops, rowBottoms} = useMemo(() => {
    const tops: number[] = [];
    const bottoms: number[] = [];
    let y = 0;
    for (const row of rows) {
      const height =
        'type' in row && row.type === 'sectionHeader'
          ? headerHeight
          : cellHeight;
      tops.push(y);
      y += height;
      bottoms.push(y);
    }
    return {rowTops: tops, rowBottoms: bottoms};
  }, [rows, cellHeight, headerHeight]);

  const models = useMemo(() => {
    const built: GlassTxRowModel[] = [];
    let y = 0;
    for (const row of rows) {
      if ('type' in row && row.type === 'sectionHeader') {
        built.push({
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
        y += headerHeight;
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
      built.push({
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
      y += cellHeight;
    }
    return built;
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

  return useMemo(
    () => ({models, rowTops, rowBottoms}),
    [models, rowTops, rowBottoms],
  );
};

export type GlassTxIcons = Record<string, SkImage | null>;

// decode a set of bundled assets once for the app's life; returns a hook the
// Skia renderers share, retrying on the next mount after a failed load
export const makeCachedSkiaIcons = (
  modules: Record<string, number>,
): (() => GlassTxIcons) => {
  const keys = Object.keys(modules);
  const empty: GlassTxIcons = {};
  let cached: GlassTxIcons | null = null;
  let load: Promise<GlassTxIcons | null> | null = null;

  const loadIcons = () => {
    load ??= Promise.all(
      keys.map(key =>
        Skia.Data.fromURI(RNImage.resolveAssetSource(modules[key]).uri).then(
          data => Skia.Image.MakeImageFromEncoded(data),
        ),
      ),
    )
      .then(images => {
        const loaded: GlassTxIcons = {};
        keys.forEach((key, i) => {
          loaded[key] = images[i];
        });
        cached = loaded;
        return loaded;
      })
      .catch(() => {
        load = null;
        return null;
      });
    return load;
  };

  return function useCachedIcons(): GlassTxIcons {
    const [icons, setIcons] = useState(cached);
    useEffect(() => {
      if (icons) {
        return;
      }
      let alive = true;
      loadIcons().then(loaded => {
        if (alive && loaded) {
          setIcons(loaded);
        }
      });
      return () => {
        alive = false;
      };
    }, [icons]);
    return icons ?? empty;
  };
};

// the page, modal, and Skia list renderers share one decode
export const useGlassTxIcons = makeCachedSkiaIcons({
  Send: require('../assets/icons/sendtx.png'),
  Receive: require('../assets/icons/receivetx.png'),
  Convert: require('../assets/icons/converttx.png'),
  Buy: require('../assets/icons/buytx.png'),
  Sell: require('../assets/icons/selltx.png'),
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
