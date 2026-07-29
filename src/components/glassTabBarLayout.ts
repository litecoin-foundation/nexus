// Geometry shared by the floating tab bar and the Skia canvas that draws its
// glass. Both need the same capsule rect and band height, and they cannot
// import each other.

export const BAR_WIDTH_RATIO = 0.6693;
export const BAR_HEIGHT_RATIO = 0.0652;
export const THUMB_WIDTH_RATIO = 0.2027;
export const THUMB_HEIGHT_RATIO = 0.0547;

// Frosted strip at the bottom of the screen that the capsule floats in.
export const BAND_HEIGHT_RATIO = 0.108;
export const BAND_BLUR_SIGMA = 8;

export const PRESSED_SCALE = 1.06;
export const SCROLLING_SCALE = 0.9;
export const THUMB_SPRING = {mass: 0.3, damping: 14, stiffness: 180};

export const getBottomOffset = (screenHeight: number, bottomInset: number) =>
  Math.max(bottomInset, screenHeight * 0.026);

// Vertical space cards must leave free so their CTAs clear the bar.
export const getTabBarClearance = (screenHeight: number, bottomInset: number) =>
  getBottomOffset(screenHeight, bottomInset) + screenHeight * BAR_HEIGHT_RATIO;

// sheets that hide the tab bar; the wallet and the shop keep it
export const sheetHidesTabBar = (sheet: number) => sheet !== 0 && sheet !== 3;

export const getTabBarBandHeight = (
  screenHeight: number,
  bottomInset: number,
) =>
  Math.max(
    screenHeight * BAND_HEIGHT_RATIO,
    getTabBarClearance(screenHeight, bottomInset),
  );

// slide distance that fully clears the bar and its shadow off-screen
export const getTabBarHideDistance = (
  screenHeight: number,
  bottomInset: number,
) => getTabBarBandHeight(screenHeight, bottomInset) + 8;
