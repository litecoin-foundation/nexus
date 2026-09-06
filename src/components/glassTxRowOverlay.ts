import {useContext, useMemo} from 'react';
import {Skia} from '@shopify/react-native-skia';
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import {GLASS_TX_LIST_TOP_RATIO} from './GlassTxRows';
import {rowsTopInCanvas} from './GlassTxCanvas';
import {sheetTopClip, titleTopInCanvas} from './GlassTxTitleRow';
import {useGlassRowsLayer} from './glassChromeFeeds';
import {ScreenSizeContext} from '../context/screenSize';

// Places the chrome's recorded row picture on a full-screen overlay's own
// canvas. Every overlay that covers the wallet fades the chrome out, so it has
// to redraw the rows itself — but it draws the same picture rather than
// recording a second one, which would cost a window of paragraph shaping on
// the JS thread at the moment it opens.
//
// Separate module from GlassTxRows: the geometry comes from GlassTxCanvas,
// which imports GlassTxRows, so living there would cycle.

interface Params {
  // Sheet position and list scroll, both written on the UI thread.
  mainSheetsTranslationY: SharedValue<number>;
  txListScrollY: SharedValue<number>;
  // Height of the pinned sync header above the first row (0 when absent).
  listHeaderOffset: SharedValue<number>;
  enabled: boolean;
}

export const useGlassTxRowOverlay = (params: Params) => {
  const {mainSheetsTranslationY, txListScrollY, listHeaderOffset, enabled} =
    params;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  const listTopInSheet = SCREEN_HEIGHT * GLASS_TX_LIST_TOP_RATIO;

  const layer = useGlassRowsLayer();
  const picture = layer?.picture ?? null;
  const contentHeight = layer?.contentHeight ?? null;

  const enabledSV = useSharedValue(enabled);
  enabledSV.value = enabled;

  // Positions must never be gated on `enabled`: it reaches the UI thread
  // asynchronously across separate mappers, so a zeroed one can paint against
  // a live clip and draw the whole picture rowsTop px high. Only the clip
  // gates — an empty clip draws nothing rather than something misplaced.
  const rowsTop = useDerivedValue(() =>
    rowsTopInCanvas(
      mainSheetsTranslationY.value,
      listTopInSheet,
      0,
      listHeaderOffset.value,
    ),
  );

  const emptyRect = useMemo(() => Skia.XYWHRect(0, 0, 0, 0), []);

  // Runs to the bottom edge, unlike the page canvas's clip: that one stops at
  // the tab bar band because a second frosted pass redraws the rows there.
  const clip = useDerivedValue(() => {
    if (!enabledSV.value) {
      return emptyRect;
    }
    const top = Math.max(0, rowsTop.value);
    return Skia.XYWHRect(
      0,
      top,
      SCREEN_WIDTH,
      Math.max(0, SCREEN_HEIGHT - top),
    );
  });

  const transform = useDerivedValue(() => [
    {translateY: rowsTop.value - txListScrollY.value},
  ]);

  // In content space, so it rides the row transform. Collapsed at zero rows so
  // an empty list still shows its empty state.
  const tailRect = useDerivedValue(() => {
    const top = contentHeight?.value ?? 0;
    if (top <= 0) {
      return emptyRect;
    }
    return Skia.XYWHRect(0, top, SCREEN_WIDTH, SCREEN_HEIGHT);
  });

  // The heading rides the sheet only — no scroll, no sync-header offset.
  const titleTransform = useDerivedValue(() => [
    {
      translateY: titleTopInCanvas(
        mainSheetsTranslationY.value,
        SCREEN_HEIGHT,
        0,
      ),
    },
  ]);

  // Heading down to the first row, which spans the pinned sync header when it
  // is up. An overlay repaints that strip so both bands are fresh Skia fills
  // under its dim, instead of one being the live RN view showing through.
  const titleBandRect = useDerivedValue(() => {
    const top = titleTopInCanvas(
      mainSheetsTranslationY.value,
      SCREEN_HEIGHT,
      0,
    );
    return Skia.XYWHRect(
      0,
      top,
      SCREEN_WIDTH,
      Math.max(0, rowsTop.value - top),
    );
  });

  const sheetClip = useDerivedValue(() =>
    sheetTopClip(
      titleTopInCanvas(mainSheetsTranslationY.value, SCREEN_HEIGHT, 0),
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
    ),
  );

  return {
    picture: enabled ? picture : null,
    clip,
    transform,
    titleTransform,
    titleBandRect,
    sheetClip,
    tailRect,
  };
};
