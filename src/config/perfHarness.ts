// Perf branch only — must never be true on a branch that ships: NewWalletStack
// makes PerfHarness the initial route when it is. Note the screen is a static
// import there, so it stays in the bundle even when this is false; make it a
// require() inside the ternary if that matters. Gating on
// __DEV__ would not work: babel.config.js strips console for every env except
// development, and Metro drops __DEV__ branches from the release bundle, so a
// __DEV__-gated harness would not exist in the build we profile.
export const PERF_HARNESS = true;

// Leave-one-out switches for LiquidGlassBackdrop's draw tree, so a sub-rung can
// price each element of that canvas individually. Read at render time; the
// harness remounts the subtree via a key when the set changes.
export type BackdropPart =
  | 'gradient'
  | 'chart'
  | 'balance'
  | 'shadows'
  | 'filter'
  | 'accents'
  | 'foldclip';

export const BD_ALL: BackdropPart[] = [
  'gradient',
  'chart',
  'balance',
  'shadows',
  'filter',
  'accents',
  'foldclip',
];

let backdropParts = new Set<BackdropPart>(BD_ALL);
export const setBackdropParts = (parts: BackdropPart[]) => {
  backdropParts = new Set(parts);
};
// Always true off the perf branch, so the gates are no-ops.
export const bdOn = (part: BackdropPart) =>
  !PERF_HARNESS || backdropParts.has(part);

// Same idea for GlassTxCanvas. It is the most expensive canvas on the screen
// (~8.9ms/frame of which ~6.2ms is rasterisation) and a rung can only say
// "mounting it costs X" — these say which of its passes the X is in.
//   frost      the three blurred+masked band copies (ProgressiveEdgeBlur)
//   rows       the recorded row picture, in both the list and band passes
//   glass      the capsule BackdropFilter (runtime shader + blur child)
//   chrome     the bar's border, thumb and icons
//   barshadow  the pre-blurred capsule shadow image
export type TabBarPart = 'frost' | 'rows' | 'glass' | 'chrome' | 'barshadow';

export const TB_ALL: TabBarPart[] = [
  'frost',
  'rows',
  'glass',
  'chrome',
  'barshadow',
];

let tabBarParts = new Set<TabBarPart>(TB_ALL);
export const setTabBarParts = (parts: TabBarPart[]) => {
  tabBarParts = new Set(parts);
};
export const tbOn = (part: TabBarPart) =>
  !PERF_HARNESS || tabBarParts.has(part);

// Leave-one-out switches for GlassTabSelector, the #1 item on PERFORMANCE.md's
// backlog: mounting it costs ~8 points of jank and nobody knows why. Converting
// its Yoga-dirtying props to transform changed nothing (PERFORMANCE.md §2.1),
// so the cost is somewhere in its ~48 views, four TranslateText labels or its
// mappers. These bisect that.
//   hittargets  the Pressable/GestureDetector roots
//   geometry    the animated rect (transform + width) — static rects without it
//   icons       the folded/unfolded icon images
//   labels      the TranslateText labels, folded and below-button
export type TabSelPart = 'hittargets' | 'geometry' | 'icons' | 'labels';

export const TS_ALL: TabSelPart[] = [
  'hittargets',
  'geometry',
  'icons',
  'labels',
];

let tabSelParts = new Set<TabSelPart>(TS_ALL);
export const setTabSelParts = (parts: TabSelPart[]) => {
  tabSelParts = new Set(parts);
};
export const tsOn = (part: TabSelPart) =>
  !PERF_HARNESS || tabSelParts.has(part);

// The transaction-list search button is its own tiny <Canvas>, which looks like
// it should be native views. Measured: it is not worth changing. R3->R4 (adding
// the header with the Skia button) was +0.01/-0.73 points, and R4->R5 (swapping
// to native) was +1.22/+0.96 — no better, and the elevation shadow is not the
// same as Skia's. Production keeps the Skia one; the native path stays here so
// the result can be re-checked rather than re-argued.
export type SearchButtonImpl = 'native' | 'skia';
let searchButtonImpl: SearchButtonImpl = 'skia';
export const setSearchButtonImpl = (impl: SearchButtonImpl) => {
  searchButtonImpl = impl;
};
export const getSearchButtonImpl = (): SearchButtonImpl =>
  PERF_HARNESS ? searchButtonImpl : 'skia';

// Frost level count, so a sub-rung can price dropping one blur pass without
// it being an all-or-nothing leave-one-out. Null means "whatever the component
// ships with", which is what production always reads.
let frostLevelOverride: number | null = null;
export const setFrostLevels = (levels: number | null) => {
  frostLevelOverride = levels;
};
export const getFrostLevels = () => (PERF_HARNESS ? frostLevelOverride : null);

// Release strips console, so the run markers go through the same channel the
// persist logger uses. Tag is ReactNativeJS.

export const perfLog = (msg: string) => {
  const log = (global as any).nativeLoggingHook as
    | ((m: string, level: number) => void)
    | undefined;
  log?.(`[perf] ${msg}`, 3);
};
