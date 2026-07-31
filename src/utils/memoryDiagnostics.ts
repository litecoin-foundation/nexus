// Temporary diagnostic for the Hermes external-memory OOM
// (glass-perf-plan.md): logs GC external/heap counters to os_log every 10s.
// Writes through nativeLoggingHook because console.* is stripped from
// release bundles. Watch with:
//   xcrun devicectl ... or: log stream --predicate 'eventMessage CONTAINS "memlog"'
type HermesStats = Record<string, number>;
type HermesGlobal = {
  HermesInternal?: {getInstrumentedStats?: () => HermesStats};
  nativeLoggingHook?: (message: string, logLevel: number) => void;
};

export const startExternalMemoryLog = () => {
  const g = globalThis as HermesGlobal;
  const getStats = g.HermesInternal?.getInstrumentedStats;
  const log = g.nativeLoggingHook;
  if (!getStats || !log) {
    return;
  }
  const mb = (n: number | undefined) =>
    n === undefined ? '?' : (n / (1024 * 1024)).toFixed(1);
  setInterval(() => {
    try {
      const s = getStats();
      log(
        `[memlog] external=${mb(s.js_externalBytes)}MB heap=${mb(
          s.js_heapSize,
        )}MB alloc=${mb(s.js_allocatedBytes)}MB gcs=${s.js_numGCs}`,
        1,
      );
    } catch {
      // stats shape changed; stay silent
    }
  }, 10000);
};
