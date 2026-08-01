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

# 4. Capture. Takes up to ~8 min: it waits for a clean pass boundary, then
#    records all 8 passes (4 rungs x 2 drive modes) with a screenshot each.
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
- **Wait for the chain sync to finish before capturing.** A fresh install re-syncs, and while
  `syncedToChain` is false `GlassTransactionList` pins a header with an **infinite `withRepeat`
  spinner**, plus a 10 s timer that resizes that header mid-run. The spinner renders frames on
  its own and dilutes janky%; the resize moves the Skia rows under the capture. The harness
  screen shows it — "Loading Transactions" above the list. Two runs on different sides of this
  are not comparable, so let both settle.
- **The run-to-run noise floor is ~2–3 points of janky%.** Anything smaller is not a result.
  Take a control rung that your change cannot affect and confirm it stayed flat before you
  believe a delta.

---

## The rung ladder

`PerfHarness.tsx` mounts the sheet and nothing else, then adds exactly one suspected cost per
rung. All rungs are selectable at runtime, so **one build measures the whole ladder**.

| Rung | Adds |
|---|---|
| R0 | `GlassBottomSheet` + drag strip + the real `GlassTransactionList`. Zero Skia |
| R1 | `LiquidGlassTabBar` — the tab-bar glass canvas — with real row models |
| R2 | `GlassAmountView` (the backdrop canvas) |
| R3 | `GlassTopSectionChart` + `GlassTabSelector` — the whole screen |
| R4 | the production `GlassTxListHeader`, **Skia** search button |
| R5 | the same header, **native** search button |

R4/R5 are appended rather than inserted so R0–R3 stay comparable with runs taken before they
existed. They close a real gap: the harness mounts `GlassTransactionList` directly, so the
production title/search header — and the third `<Canvas>` that used to be in it — was outside
every rung. The header is memoized on `folded` here exactly as `TxListComponentMemo` is in
`NewMain`, so it re-renders once per fold in both. R3→R4 prices the Skia version; R4→R5 is the
swap. Expect the delta to show in `runOnJS` only: in `worklet` mode `folded` never changes, so
the header never re-renders and its canvas never re-records.

### Why it is four rungs and not eight

Three measured builds retired four of the original rungs. They are not lost coverage, they
are answered questions — and every one of them was costing ~50 s of run time per pass:

| Retired | Why |
|---|---|
| bare screen | rendered exactly 20 frames for 20 cycles: one per HUD update. The controller is free. Preflight already catches a bad environment |
| tx list, no Skia | delta to "sheet only" was −1.3 points, then +1.4 on the re-run. Noise both times. A `ScrollView` over one spacer costs nothing |
| tab bar with no rows | folded into R1. The rows were a +4 ms step when they were declarative `<Paragraph>` nodes; they are one `drawPicture` now |
| chart | +0.3 points and +0 ms once `GlassChartTouch`'s canvas merged into the backdrop |

The retired content is still **mounted**, folded into the rung above it, so R3 is still the
whole screen. `RUNG_LEVELS` in `PerfHarness.tsx` maps rungs onto the original 0–7 content
scale, so re-cutting the set is a one-line edit and does not touch the tree.

**A rung prices *mounting a component*, not *a mechanism inside it*.** That distinction has
already produced two wrong conclusions — see the refuted list in `PERFORMANCE.md`.

### Sub-ladders

To attribute a cost to a mechanism, hold the content level fixed and vary one part at a time.
Set `SUB_LADDER` in `PerfHarness.tsx` to `'backdrop'`, `'tabbar'` or `'tabsel'`; `'none'` runs
the main ladder. A sub-ladder runs `worklet` only — the React ordering is already known to cost
nothing, and halving the run is worth more than re-confirming it.

Each has a discarded `W warmup` rung first: the first window after unlock catches a
sync-spinner burst that renders ~2500 frames and dilutes janky%.

**`'backdrop'`** (held at R2's content) prices `LiquidGlassBackdrop`, the +13 ms step:
`-filter`, `-gradient`, `-foldclip`, `-balance`, `-capsules`, and an empty canvas.

**`'tabbar'`** (held at R1's content, backdrop deliberately absent so the two canvases don't
contend — mounting the backdrop pushed this one 8.0 → 9.0 ms) prices `GlassTxCanvas`, which
measured 8.9 ms/frame of which ~6.2 ms is rasterisation and ~2.7 ms the picture rebuild:

| Sub-rung | Removes |
|---|---|
| `T1 -frost` | all three `ProgressiveEdgeBlur` levels |
| `T2 frost x2` | one of the three. T1 and T2 bracket it: the gap says whether the level count is worth tuning or the whole pass needs replacing |
| `T3 -rows` | the recorded row picture, in both the list and the band pass |
| `T4 -glass` | the capsule `BackdropFilter` (runtime shader + blur child) |
| `T5 -chrome` | the bar's border, thumb and icons |
| `T6 -barshadow` | the pre-blurred capsule shadow image |
| `T7 empty canvas` | everything — the floor for one mounted `<Canvas>` |

**`'tabsel'`** (held at R3's content) is item #1 on `PERFORMANCE.md`'s backlog: mounting
`GlassTabSelector` costs ~8 points of jank and *nobody knows why*. Converting its Yoga-dirtying
props to `transform` changed nothing (§2.1), so the cost is somewhere in its ~48 views, its
four `TranslateText` labels or its mappers. This one is **additive, not leave-one-out**,
because the question is "which part is it" rather than "does removing one help":

| Sub-rung | Mounts |
|---|---|
| `U0 empty overlay` | the absolutely-positioned container and nothing else |
| `U1 +hit targets` | four `Pressable`s inside four `GestureDetector`s |
| `U2 +icons` | the folded and unfolded `<Image>`s |
| `U3 +labels` | the four `TranslateText` labels |
| `U4 +geometry (all)` | the animated rect — production |
| `U5 all -labels` | production minus labels, as a cross-check on U2→U3 |

With `geometry` off, every control is pinned at its folded rect, so U0–U3 have no animated
layout at all. If the step is in U3, the labels are the answer; if it is flat all the way to
U4, it is the mappers.

The parts are module state, not props, so the harness remounts `GlassAmountView` and
`LiquidGlassTabBar` on a `key` per rung. That also defeats the `React.memo` on the canvases,
which is what you want here.

### Two drive modes

Every rung on the main ladder runs twice:

- **`worklet`** — the fold is driven straight from the UI thread. Zero React renders. This is
  the UI-thread + Skia floor.
- **`runOnJS`** — production-shaped ordering (the real gesture springs on the UI thread, *then*
  hops to JS to set state).

**The delta between them is the React cost.** Measured at ~0 for the sheet fold, which is how
we know React commits were not the problem.

Both modes stay even though that question is settled, because their agreement is the control
this whole ladder rests on: if a change makes them diverge, it moved work onto the commit path.
That is cheaper insurance than re-deriving it later.

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
