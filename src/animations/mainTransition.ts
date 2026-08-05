// Shared v1 Main-screen geometry and colours used by the live screen and the
// unlock transition.
export const MAIN_BACKGROUND_COLOR = '#1162E6';
export const MAIN_OFFLINE_BACKGROUND_COLOR = '#F36F56';
export const MAIN_SHEET_BACKGROUND_COLOR = '#f7f7f7';

export const MAIN_SHEET_ANIM_MS = 200;
export const MAIN_SHEET_TOP_RADIUS_RATIO = 0.03;
export const MAIN_TOP_FOLD_RADIUS_RATIO = 0.05;

export const getMainSheetPoints = (screenHeight: number, topInset: number) => {
  const OFFSET_HEADER_DIFF = topInset - screenHeight * 0.07;
  const OPEN_SHEET_POINT = screenHeight * 0.24 + OFFSET_HEADER_DIFF;
  const FOLD_SHEET_POINT = screenHeight * 0.47 + OFFSET_HEADER_DIFF;

  return {
    OFFSET_HEADER_DIFF,
    SWIPE_TRIGGER_Y_RANGE: screenHeight * 0.15,
    OPEN_SHEET_POINT,
    FOLD_SHEET_POINT,
  };
};
