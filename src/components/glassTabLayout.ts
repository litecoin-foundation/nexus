import {Extrapolation, interpolate} from 'react-native-reanimated';

import {
  getGlassTopHalfRhythm,
  GLASS_TAB_BUTTON_HEIGHT_RATIO,
} from './glassTopHalfLayout';

// Shared tab geometry for the touch overlay and glass shader.

export const GLASS_TAB_CORNER_RADIUS = 26;
export {
  GLASS_TAB_BUTTON_HEIGHT_RATIO,
  GLASS_TAB_CLUSTER_HEIGHT_RATIO,
} from './glassTopHalfLayout';

export const GLASS_TAB_IDS = [1, 2, 4, 5];

// The compact controls stay unchanged through most of the sheet travel. The
// Trade control only starts birthing Sell near the end of expansion.
const TRADE_SPLIT_START = 0.76;
const TRADE_SPLIT_END = 0.98;

// Horizontal slots only; both rows take their topOffset from the shared
// top-half rhythm so the cluster keeps equal gaps above and below it.
const FOLDED_ROW = {
  width: 0.2773,
  lefts: [0.0587, 0.3627, 0.6667],
};
const UNFOLDED_ROW = {
  width: 0.145,
  lefts: [0.185, 0.3467, 0.5083, 0.67],
};

interface GlassTabRect {
  left: number;
  width: number;
  topOffset: number;
}

export interface GlassTabLayout {
  folded: GlassTabRect;
  unfolded: GlassTabRect;
}

export const getGlassTabLayouts = (
  screenWidth: number,
  screenHeight: number,
  topInset: number,
): GlassTabLayout[] => {
  const {foldedClusterTopOffset, unfoldedClusterTopOffset} =
    getGlassTopHalfRhythm(screenHeight, topInset);
  const compactWidth = FOLDED_ROW.width * screenWidth;
  const compactTradeLeft = FOLDED_ROW.lefts[0] * screenWidth;
  const buttonHeight = GLASS_TAB_BUTTON_HEIGHT_RATIO * screenHeight;
  // Sell is born as a zero-size droplet just inside Trade's right edge.
  const sellSeedCenter = compactTradeLeft + compactWidth - buttonHeight * 0.55;
  const foldedRects = [
    {left: compactTradeLeft, width: compactWidth},
    {left: sellSeedCenter, width: 0},
    {left: FOLDED_ROW.lefts[1] * screenWidth, width: compactWidth},
    {left: FOLDED_ROW.lefts[2] * screenWidth, width: compactWidth},
  ];

  return foldedRects.map((foldedRect, i) => ({
    folded: {
      ...foldedRect,
      topOffset: foldedClusterTopOffset,
    },
    unfolded: {
      left: UNFOLDED_ROW.lefts[i] * screenWidth,
      width: UNFOLDED_ROW.width * screenWidth,
      topOffset: unfoldedClusterTopOffset,
    },
  }));
};

const smootherstep = (value: number) => {
  'worklet';
  return value * value * value * (value * (value * 6 - 15) + 10);
};

export const glassTabExpansionProgressAt = (
  sheetY: number,
  unfoldPoint: number,
  foldPoint: number,
) => {
  'worklet';
  return interpolate(
    sheetY,
    [unfoldPoint, foldPoint],
    [1, 0],
    Extrapolation.CLAMP,
  );
};

export const glassTabSplitProgressAt = (
  sheetY: number,
  unfoldPoint: number,
  foldPoint: number,
) => {
  'worklet';
  const expansion = glassTabExpansionProgressAt(sheetY, unfoldPoint, foldPoint);
  const linear = Math.min(
    Math.max(
      (expansion - TRADE_SPLIT_START) / (TRADE_SPLIT_END - TRADE_SPLIT_START),
      0,
    ),
    1,
  );
  return smootherstep(linear);
};

// Shared by shader uniforms and the RN overlay.
export const glassTabRectAt = (
  layout: GlassTabLayout,
  sheetY: number,
  unfoldPoint: number,
  foldPoint: number,
) => {
  'worklet';
  const expansionProgress = glassTabExpansionProgressAt(
    sheetY,
    unfoldPoint,
    foldPoint,
  );
  const splitProgress = glassTabSplitProgressAt(sheetY, unfoldPoint, foldPoint);
  return {
    x: interpolate(
      splitProgress,
      [0, 1],
      [layout.folded.left, layout.unfolded.left],
    ),
    y:
      sheetY +
      interpolate(
        expansionProgress,
        [0, 1],
        [layout.folded.topOffset, layout.unfolded.topOffset],
      ),
    width: interpolate(
      splitProgress,
      [0, 1],
      [layout.folded.width, layout.unfolded.width],
    ),
  };
};
