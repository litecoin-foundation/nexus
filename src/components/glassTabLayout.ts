import {Extrapolation, interpolate} from 'react-native-reanimated';

// Shared tab geometry for the touch overlay and glass shader.

export const GLASS_TAB_CORNER_RADIUS = 26;
export const GLASS_TAB_BUTTON_HEIGHT_RATIO = 0.057;
// Top of the folded button cluster — content above must clear the buttons.
export const GLASS_TAB_CLUSTER_TOP_OFFSET_RATIO = -0.096;

export const GLASS_TAB_IDS = [3, 4, 5];

const FOLDED_ROW = {
  width: 0.2773,
  lefts: [0.0587, 0.3627, 0.6667],
  topOffset: GLASS_TAB_CLUSTER_TOP_OFFSET_RATIO,
};
const UNFOLDED_ROW = {
  width: 0.16,
  lefts: [0.2333, 0.42, 0.6067],
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
  return FOLDED_ROW.lefts.map((foldedLeft, i) => ({
    folded: {
      left: foldedLeft * screenWidth,
      width: FOLDED_ROW.width * screenWidth,
      topOffset: FOLDED_ROW.topOffset * screenHeight,
    },
    unfolded: {
      left: UNFOLDED_ROW.lefts[i] * screenWidth,
      width: UNFOLDED_ROW.width * screenWidth,
      topOffset: UNFOLDED_ROW.topOffset * screenHeight,
    },
  }));
};

// Shared by shader uniforms and the RN overlay.
export const glassTabRectAt = (
  layout: GlassTabLayout,
  sheetY: number,
  unfoldPoint: number,
  foldPoint: number,
) => {
  'worklet';
  const progress = interpolate(
    sheetY,
    [unfoldPoint, foldPoint],
    [1, 0],
    Extrapolation.CLAMP,
  );
  return {
    x: interpolate(
      progress,
      [0, 1],
      [layout.folded.left, layout.unfolded.left],
    ),
    y:
      sheetY +
      interpolate(
        progress,
        [0, 1],
        [layout.folded.topOffset, layout.unfolded.topOffset],
      ),
    width: interpolate(
      progress,
      [0, 1],
      [layout.folded.width, layout.unfolded.width],
    ),
  };
};
