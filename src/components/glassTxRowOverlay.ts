import {useContext, useEffect, useMemo} from 'react';
import {Skia} from '@shopify/react-native-skia';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import {
  GLASS_TX_LIST_TOP_RATIO,
  GlassTxRowModels,
  useGlassTxRowElements,
} from './GlassTxRows';
import {getGlassCanvasTop, rowsTopInCanvas} from './GlassTxCanvas';
import {ScreenSizeContext} from '../context/screenSize';

// Live tx rows for a full-screen overlay's own canvas.
//
// GlassTxCanvas draws the rows as app chrome above the navigator, and every
// overlay that covers the wallet fades that chrome out (barSuppressed) so the
// tab bar does not sit on top of it. The rows go with it, leaving the bare
// sheet behind the overlay — so an overlay that wants them has to draw them
// itself, from the same models and the same geometry the page canvas uses.
//
// Lives in its own module rather than in GlassTxRows: the geometry comes from
// GlassTxCanvas, which imports GlassTxRows, so putting it there would cycle.

interface Params {
  rowModels: GlassTxRowModels;
  // Sheet position and list scroll, both written on the UI thread.
  mainSheetsTranslationY: SharedValue<number>;
  txListScrollY: SharedValue<number>;
  // Height of the pinned sync header above the first row (0 when absent).
  listHeaderOffset: SharedValue<number>;
  // False while the overlay is off screen. The mappers below sit on the
  // list's scroll path, so they must cost nothing then.
  enabled: boolean;
}

export const useGlassTxRowOverlay = (params: Params) => {
  const {
    rowModels,
    mainSheetsTranslationY,
    txListScrollY,
    listHeaderOffset,
    enabled,
  } = params;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const insets = useSafeAreaInsets();

  // Same list viewport the page canvas uses, so both windows (and the shared
  // paragraph cache) stay identical.
  const listTopInSheet = SCREEN_HEIGHT * GLASS_TX_LIST_TOP_RATIO;
  const viewportHeight =
    SCREEN_HEIGHT - getGlassCanvasTop(SCREEN_HEIGHT, insets.top);

  // Mirror for worklets: an overlay stays mounted while it is closed, and
  // `enabled` is JS-thread state a worklet cannot track.
  const enabledSV = useSharedValue(false);
  useEffect(() => {
    enabledSV.value = enabled;
  }, [enabled, enabledSV]);

  const rowElements = useGlassTxRowElements({
    rowModels,
    scrollY: txListScrollY,
    listHeaderOffset,
    viewportHeight,
    enabled,
  });

  // Rows in screen coordinates — an overlay canvas starts at y = 0. Derived
  // once so the clip and the row transform can never desync.
  const rowsTop = useDerivedValue(() =>
    enabledSV.value
      ? rowsTopInCanvas(
          mainSheetsTranslationY.value,
          listTopInSheet,
          0,
          listHeaderOffset.value,
        )
      : 0,
  );

  // Runs to the bottom edge, unlike the page canvas's list clip: that one
  // stops at the tab bar band because a second, frosted pass redraws the rows
  // under the bar's glass. An overlay has no band pass and the bar is faded
  // out beneath it, so stopping short would just leave a bare strip.
  const emptyRect = useMemo(() => Skia.XYWHRect(0, 0, 0, 0), []);
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

  const identityTransform = useMemo(() => [{translateY: 0}], []);
  const transform = useDerivedValue(() => {
    if (!enabledSV.value) {
      return identityTransform;
    }
    return [{translateY: rowsTop.value - txListScrollY.value}];
  });

  return {rowElements, clip, transform};
};
