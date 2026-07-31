# Profiling harness — how to use it

Everything here is measurement scaffolding. It is **not** meant to merge into a release branch.
For the findings it produced and the rules that came out of them, read `PERFORMANCE.md`.

Target device for every number in these docs: Samsung SM-A336B (Galaxy A33), Android 14,
1080×2400 @ 90 Hz → **11.1 ms frame budget**.

---

## What's here

| File | Purpose |
|---|---|
| `src/config/perfHarness.ts` | the `PERF_HARNESS` flag and `perfLog` |
| `src/screens/PerfHarness.tsx` | the rig: mounts the sheet in isolation and drives it |
| `src/navigation/NewWalletStack.tsx` | makes the rig the initial route when the flag is on |
| `src/navigation/types.ts` | the route type |
| `scripts/sheet-perf.sh` | host side: brackets each rung with `dumpsys gfxinfo` |
| `src/utils/memoryDiagnostics.ts` | periodic Hermes external-memory log |
| `PERFORMANCE.md` | the findings and the rules |
| `bottomsheet-perf-plan.md`, `glass-perf-plan.md`, `slow-device-perf-plan.md` | investigation logs |

---

## Quick start

```sh
# 1. Turn the rig on
#    src/config/perfHarness.ts -> export const PERF_HARNESS = true;

# 2. Build and install. Release only, arm64 only.
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk

# 3. Launch, unlock with your PIN. The rig is the first screen after unlock.
adb shell svc power stayon usb          # stop the device sleeping mid-run
adb shell am start -n com.litecoin.nexus/.MainActivity

# 4. Capture. Takes up to ~14 min: it waits for a clean pass boundary, then
#    records all 16 rungs with a screenshot each.
./scripts/sheet-perf.sh out/my-run

# 5. Put the device back
adb shell svc power stayon false
```

Then flip `PERF_HARNESS` back to `false` and rebuild.

---

## Rules that make runs valid

These are not optional. Several runs were thrown away for breaking them.

- **Release builds only.** `babel.config.js` strips `console` for every env except development
  and Metro drops `__DEV__` branches, so `__DEV__`-gated instrumentation *does not exist* in
  the binary you profile. That is why the flag is a plain constant. A dev build measures the
  Metro dev runtime, not the app.
- **Gradle does not track `node_modules` as a bundle input.** After editing a library's source,
  delete `android/app/build/generated/assets/react/release/index.android.bundle` or you will
  silently measure the old JS.
- **Preflight, every time** — the script does this and aborts on failure:
  app focused, device `Awake`, `Thermal Status: 0` before *and* after, `gfxinfo` returning
  frames. Two early runs produced garbage because the operator was not interacting and the
  screen had dozed.
- **Don't touch the phone during a capture.** Backgrounding the app empties the window.
- **The run-to-run noise floor is ~2–3 points of janky%.** Anything smaller is not a result.
  Take a control rung that your change cannot affect and confirm it stayed flat before you
  believe a delta.

---

## The rung ladder

`PerfHarness.tsx` mounts the sheet and nothing else, then adds exactly one suspected cost per
rung. All rungs are selectable at runtime, so **one build measures the whole ladder**.

| Rung | Adds |
|---|---|
| R0 | bare screen, controller running, nothing moves |
| R1 | `GlassBottomSheet` + drag strip + stub cards. Zero Skia |
| R2 | the real `GlassTransactionList` (plain ScrollView + spacer). Still zero Skia |
| R3 | `LiquidGlassTabBar`, no rows |
| R4 | real row models |
| R5 | `GlassAmountView` (the backdrop canvas) |
| R6 | `GlassTopSectionChart` |
| R7 | `GlassTabSelector` |

**A rung prices *mounting a component*, not *a mechanism inside it*.** That distinction has
already produced two wrong conclusions — see the refuted list in `PERFORMANCE.md`. To attribute
a cost to a mechanism you must sub-ladder inside the component, the way the backdrop was
decomposed (`SUB_LADDER` in `PerfHarness.tsx` still has the scaffolding for it).

### Two drive modes

Every rung runs twice:

- **`worklet`** — the fold is driven straight from the UI thread. Zero React renders. This is
  the UI-thread + Skia floor.
- **`runOnJS`** — production-shaped ordering (the real gesture springs on the UI thread, *then*
  hops to JS to set state).

**The delta between them is the React cost.** Measured at ~0 for the sheet fold, which is how
we know React commits were not the problem.

---

## Reading the output

Per rung the script writes `rN_<mode>.txt` (full `gfxinfo`) and `rN_<mode>.png`.

- `Janky frames` — the headline. Compare *steps between rungs*, not absolutes.
- `50th percentile` — median frame time against the 11.1 ms budget.
- `Number Slow UI thread`, `Number Missed Vsync` — where the time went.
- **`Layer Info` / `GlLayer` entries** — a direct count of composited HWUI layers. The fastest
  way to confirm a canvas merge landed. Note a `SkiaSurfaceView` (i.e. `opaque`) does *not*
  appear here.

### CPU vs GPU

`gfxinfo`'s GPU column only covers HWUI's own context, **not** react-native-skia's EGL context.
To attribute properly, sample the Mali counters on-device and compute
GPU-ms/frame = mean(busy) × window ÷ frames:

```sh
adb shell 'i=0; while [ $i -lt 4500 ]; do \
  echo "$(date +%s%N) $(cat /sys/kernel/gpu/gpu_busy) $(cat /sys/kernel/gpu/gpu_clock)"; \
  i=$((i+1)); sleep 0.03; done > /data/local/tmp/gpu.log'
adb pull /data/local/tmp/gpu.log
```

Correlate against the harness's own markers with
`adb logcat -d -v epoch -s ReactNativeJS:V | grep '\[perf\]'`.

---

## Timing inside react-native-skia

The single most useful probe in this whole exercise. It splits the per-frame UI-thread cost
into `applyUpdates` / `recorder.play` / `setJsiProperty`, which is how we learned that the last
one is not a hand-off but the entire synchronous render and present.

It lives in `node_modules`, so it is deliberately **not** committed — `bun install` wipes it.
To recreate, in `@shopify/react-native-skia/src/sksg/Container.native.ts`:

1. Bracket `recorder.play(picture)` and `SkiaViewApi.setJsiProperty(...)` inside
   `nativeDrawOnscreen` with `performance.now()`.
2. Accumulate into a `globalThis.__skPerf[nativeId]` object on the UI runtime.
3. Every 120 frames, write a formatted string into a shared value **created in `redraw()` and
   passed down as a parameter** — a module-scope worklet captures it as `null` otherwise.
4. Read it on the JS side with `useAnimatedReaction` + `runOnJS`.

Step 4 is not optional. The worklets UI runtime has no `nativeLoggingHook`, `Rea.runOnJS` is
not callable from inside a worklet through the Reanimated proxy, and a plain JS `.value` read
takes a blocking lock on the UI runtime. `useAnimatedReaction` is the only channel that works.

---

## Before merging anything

- `PERF_HARNESS` must be `false`. When it is `true`, `NewWalletStack` makes the rig the initial
  route and the app boots into it.
- Note `PerfHarness` is a **static** import in `NewWalletStack`, so it stays in the bundle even
  when the flag is false. Make it a `require()` inside the ternary if that matters.
- There is no CI (`.github/` has only issue templates, `.husky/pre-commit` is empty). The only
  guard available today would be a jest assertion — `expect(PERF_HARNESS).toBe(false)` — wired
  into `npm test` plus a populated pre-commit hook.
