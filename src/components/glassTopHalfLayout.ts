import {
  getNewMainSheetPoints,
  getNewMainTopHalfHeight,
} from '../animations/useNewMainAnims';
import {GLASS_CHART_HEIGHT_RATIO, getGlassChartGap} from './GlassChart';
import {
  DATE_PICKER_HEIGHT_RATIO,
  getBalanceBlockBottom,
} from './GlassBalanceGraphics';

// A single tab pill.
export const GLASS_TAB_BUTTON_HEIGHT_RATIO = 0.057;
// The pill plus the label that drops in under it once unfolded.
export const GLASS_TAB_CLUSTER_HEIGHT_RATIO =
  GLASS_TAB_BUTTON_HEIGHT_RATIO + 0.033;

// The chart, its gap and the date picker row are spaced as one block.
const getChartBlockHeight = (screenHeight: number) =>
  screenHeight * GLASS_CHART_HEIGHT_RATIO +
  getGlassChartGap(screenHeight) +
  screenHeight * DATE_PICKER_HEIGHT_RATIO;

export interface GlassTopHalfRhythm {
  // Equal spacing between the folded card's three stacked blocks.
  foldedGap: number;
  unfoldedGap: number;
  chartTop: number;
  // Cluster top relative to the sheet edge it tracks, in pixels.
  foldedClusterTopOffset: number;
  unfoldedClusterTopOffset: number;
}

export const getGlassTopHalfRhythm = (
  screenHeight: number,
  topInset: number,
): GlassTopHalfRhythm => {
  const {UNFOLD_SHEET_POINT, FOLD_SHEET_POINT} = getNewMainSheetPoints(
    screenHeight,
    topInset,
  );
  const balanceBottom = getBalanceBlockBottom(screenHeight, topInset);
  const chartBlockHeight = getChartBlockHeight(screenHeight);
  const buttonHeight = screenHeight * GLASS_TAB_BUTTON_HEIGHT_RATIO;
  const clusterHeight = screenHeight * GLASS_TAB_CLUSTER_HEIGHT_RATIO;

  // Folded, the card's own bottom edge floats just above the sheet, and the
  // labels are hidden, so only the pill height takes part in the spacing.
  const foldedCardBottom = getNewMainTopHalfHeight(
    FOLD_SHEET_POINT,
    screenHeight,
    UNFOLD_SHEET_POINT,
    FOLD_SHEET_POINT,
  );
  const foldedGap =
    (foldedCardBottom - balanceBottom - chartBlockHeight - buttonHeight) / 3;

  // Unfolded the card runs on underneath the sheet, so the sheet's top edge is
  // the last edge the cluster can be spaced against, and the faded-out chart
  // leaves the labelled cluster alone between it and the balance block.
  const unfoldedGap = (UNFOLD_SHEET_POINT - balanceBottom - clusterHeight) / 2;

  return {
    foldedGap,
    unfoldedGap,
    chartTop: balanceBottom + foldedGap,
    foldedClusterTopOffset:
      foldedCardBottom - foldedGap - buttonHeight - FOLD_SHEET_POINT,
    unfoldedClusterTopOffset: -(unfoldedGap + clusterHeight),
  };
};
