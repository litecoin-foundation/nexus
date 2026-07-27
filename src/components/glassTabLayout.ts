import {Extrapolation, interpolate} from 'react-native-reanimated';

// Shared tab geometry for the touch overlay and glass shader.

export const GLASS_TAB_CORNER_RADIUS = 26;
export const GLASS_TAB_BUTTON_HEIGHT_RATIO = 0.057;
// Top of the folded button cluster — content above must clear the buttons.
export const GLASS_TAB_CLUSTER_TOP_OFFSET_RATIO = -0.096;

export const GLASS_TAB_IDS = [1, 2, 4, 5];

// The compact controls stay unchanged through most of the sheet travel. The
// Trade control only starts birthing Sell near the end of expansion.
const TRADE_SPLIT_START = 0.76;
const TRADE_SPLIT_END = 0.98;

const FOLDED_ROW = {
  width: 0.2773,
  lefts: [0.0587, 0.3627, 0.6667],
  topOffset: GLASS_TAB_CLUSTER_TOP_OFFSET_RATIO,
};
const UNFOLDED_ROW = {
  width: 0.145,
  lefts: [0.185, 0.3467, 0.5083, 0.67],
  topOffset: -0.1236,
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
): GlassTabLayout[] => {
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
      topOffset: FOLDED_ROW.topOffset * screenHeight,
    },
    unfolded: {
      left: UNFOLDED_ROW.lefts[i] * screenWidth,
      width: UNFOLDED_ROW.width * screenWidth,
      topOffset: UNFOLDED_ROW.topOffset * screenHeight,
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
