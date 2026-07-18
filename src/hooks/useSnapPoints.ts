import {useContext} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenSizeContext} from '../context/screenSize';

// NOTE: Screen-height factors for the main sheet's fold/unfold geometry. These are
// shared by BottomSheet, TransactionList and useMainAnims so the sheet, the
// transaction list gestures and the header animations all snap to the exact
// same points — keep them here as the single source of truth.
const HEADER_OFFSET_FACTOR = 0.07;
const SWIPE_TRIGGER_FACTOR = 0.15;
const UNFOLD_FACTOR = 0.225;
const FOLD_FACTOR = 0.31;

/**
 * Computes the main sheet's snap points from the current screen height and
 * safe-area insets.
 *
 * @param foldExtra Extra pixels to push the folded point down by (e.g. the
 *   rendered chart height when the chart is open). Also shifts FOLD_SNAP_POINT
 *   so the swipe trigger stays consistent. Defaults to 0.
 */
export function useSnapPoints(foldExtra = 0) {
  const insets = useSafeAreaInsets();
  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

  const OFFSET_HEADER_DIFF = insets.top - SCREEN_HEIGHT * HEADER_OFFSET_FACTOR;
  const SWIPE_TRIGGER_Y_RANGE = SCREEN_HEIGHT * SWIPE_TRIGGER_FACTOR;

  const UNFOLD_SHEET_POINT = SCREEN_HEIGHT * UNFOLD_FACTOR + OFFSET_HEADER_DIFF;
  const FOLD_SHEET_POINT =
    SCREEN_HEIGHT * FOLD_FACTOR + OFFSET_HEADER_DIFF + foldExtra;

  const UNFOLD_SNAP_POINT = UNFOLD_SHEET_POINT + SWIPE_TRIGGER_Y_RANGE;
  const FOLD_SNAP_POINT = FOLD_SHEET_POINT - SWIPE_TRIGGER_Y_RANGE;

  return {
    OFFSET_HEADER_DIFF,
    SWIPE_TRIGGER_Y_RANGE,
    UNFOLD_SHEET_POINT,
    FOLD_SHEET_POINT,
    UNFOLD_SNAP_POINT,
    FOLD_SNAP_POINT,
  };
}
