// Perf branch only — must never be true on a branch that ships: NewWalletStack
// makes PerfHarness the initial route when it is. Note the screen is a static
// import there, so it stays in the bundle even when this is false; make it a
// require() inside the ternary if that matters. Gating on
// __DEV__ would not work: babel.config.js strips console for every env except
// development, and Metro drops __DEV__ branches from the release bundle, so a
// __DEV__-gated harness would not exist in the build we profile.
export const PERF_HARNESS = true;

// Release strips console, so the run markers go through the same channel the
// persist logger uses. Tag is ReactNativeJS.
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

export const perfLog = (msg: string) => {
  const log = (global as any).nativeLoggingHook as
    | ((m: string, level: number) => void)
    | undefined;
  log?.(`[perf] ${msg}`, 3);
};
