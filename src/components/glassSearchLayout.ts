import {GLASS_TAB_BUTTON_HEIGHT_RATIO} from './glassTabLayout';

// Slot geometry for every glass control on the search screen — the header's
// back pill and filter dropdown, and the filter row beneath them. Same split
// as glassTabLayout: one source of rects for the Skia glass and for the RN
// overlay that carries the icons, labels and touch. They must agree exactly —
// a pill whose lens sits half a point off its own icon is worse than no lens
// at all, which is why this is computed rather than measured or left to a
// flex row.

// Wider than a tab pill (0.145): the tabs share the top half with the balance
// and the chart, where the filter row is the whole of its band.
export const GLASS_FILTER_PILL_WIDTH_RATIO = 0.165;
// Header controls are shorter than the filter pills — they have to sit inside
// the navigator's header row.
export const GLASS_HEADER_PILL_HEIGHT_RATIO = 0.035;
// The back pill is a stadium rather than a circle. Its corner radius stays
// half the height, so the caps stay round and only the flat run grows.
export const BACK_PILL_ASPECT = 1.6;

// A filter control is its pill, a gap, then the label's line box. Both the
// button and the band that spaces it measure from this, so the cluster has no
// slack at the bottom that would widen the gap under it.
export const GLASS_FILTER_LABEL_GAP_RATIO = 0.01;
const GLASS_FILTER_LABEL_LINE_RATIO = 0.019;

export const getGlassFilterClusterHeight = (screenHeight: number) =>
  screenHeight *
  (GLASS_TAB_BUTTON_HEIGHT_RATIO +
    GLASS_FILTER_LABEL_GAP_RATIO +
    GLASS_FILTER_LABEL_LINE_RATIO);

export interface GlassRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FilterParams {
  screenWidth: number;
  screenHeight: number;
  rowTop: number;
  count: number;
  paddingHorizontal: number;
}

export const getGlassFilterRects = (params: FilterParams): GlassRect[] => {
  const {screenWidth, screenHeight, rowTop, count, paddingHorizontal} = params;

  const width = screenWidth * GLASS_FILTER_PILL_WIDTH_RATIO;
  const height = screenHeight * GLASS_TAB_BUTTON_HEIGHT_RATIO;
  const span = screenWidth - paddingHorizontal * 2;
  const gap = count > 1 ? (span - width * count) / (count - 1) : 0;

  return Array.from({length: count}, (_, i) => ({
    x: paddingHorizontal + i * (width + gap),
    y: rowTop,
    width,
    height,
  }));
};

interface HeaderParams {
  screenWidth: number;
  screenHeight: number;
  topInset: number;
  rowHeight: number;
  paddingHorizontal: number;
  dropdownWidth: number;
}

export interface GlassHeaderRects {
  back: GlassRect;
  dropdown: GlassRect;
  titleLeft: number;
}

export const getGlassHeaderRects = (params: HeaderParams): GlassHeaderRects => {
  const {
    screenWidth,
    screenHeight,
    topInset,
    rowHeight,
    paddingHorizontal,
    dropdownWidth,
  } = params;

  const height = screenHeight * GLASS_HEADER_PILL_HEIGHT_RATIO;
  const y = topInset + Math.max(0, (rowHeight - height) / 2);

  const backWidth = height * BACK_PILL_ASPECT;

  return {
    back: {x: paddingHorizontal, y, width: backWidth, height},
    dropdown: {
      x: screenWidth - paddingHorizontal - dropdownWidth,
      y,
      width: dropdownWidth,
      height,
    },
    titleLeft: paddingHorizontal + backWidth,
  };
};
