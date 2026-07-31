# Bottom sheet fold/unfold — isolation harness, profiling protocol, ranked causes

Target: `com.litecoin.nexus` on SM-A336B (Exynos 1280, Mali-G68 MP4, 1080×2400 @ **90 Hz →
11.1 ms budget**, DPR 2.8125). Screen in dp = 384 × 853.33.
Sheet travel = `FOLD − UNFOLD` = 853.33 × 0.28 = **238.9 dp = 672 px**, animated by
`withTiming(200 ms)` → **~18 frames, ~37 px/frame**.

Method: 54 candidate causes generated across four independent lenses (render cascade,
animation mechanics, native compositing, harness requirements), each then put through **two
independent adversarial checks** — one trying to refute it from the source, one judging
whether it is measurable at all on a 90 Hz device. A claim was kept only if it survived
both. **9 survived, 26 refuted.** Every surviving claim below was then re-verified by hand.

---

## 1. The harness (built)

| File | Purpose |
|---|---|
| `src/config/perfHarness.ts` | `PERF_HARNESS` flag + `perfLog` |
| `src/screens/PerfHarness.tsx` | the rig |
| `src/navigation/NewWalletStack.tsx` | conditional `initialRouteName` + screen |
| `src/navigation/types.ts` | route type |
| `scripts/sheet-perf.sh` | host-side gfxinfo bracketing |

### Why not `__DEV__`

`babel.config.js:12` applies `transform-remove-console` for every env except development,
and Metro dead-code-eliminates `__DEV__` branches out of the release bundle. **A
`__DEV__`-gated harness would not exist in the binary being profiled**, and a dev bundle
measures the Metro dev runtime instead of the app. Hence a plain `PERF_HARNESS` constant,
release builds only. `perfLog` goes through `global.nativeLoggingHook` — the same channel
`index.js`'s persist logger uses — because it survives console stripping.

### Why not a deeplink

The obvious trigger is a `nexus://perf` URL handled in `Loading.tsx:78` (the manifest already
declares the `nexus` scheme at `AndroidManifest.xml:36`). **Rejected**: it would
`navigation.replace('PerfHarness')` before the PIN, i.e. a deeplink that bypasses the lock
screen on a wallet app. Instead `NewWalletStack.tsx` flips `initialRouteName` behind the
flag — unlock once, land on the harness, one line to revert.

### Correctness details that would otherwise silently invalidate runs

- **Seed both shared values at `FOLD_SHEET_POINT`**, exactly as `useNewMainAnims.ts:183-184`
  does. Any other seed makes the mount effect at `GlassBottomSheet.tsx:118-135` animate the
  sheet into place, so transition #1 is not comparable to #2..N.
- **Font readiness gate.** `useSatoshiFontMgr` (`GlassBalanceGraphics.tsx:65`) returns `null`
  until three `.ttf` files decode, and `useGlassTxRowElements` (`GlassTxRows.tsx:579-582`)
  returns `null` while it is falsy — so **GlassTxCanvas draws no rows at all**. Arming early
  measures an empty canvas.
- **`CardUnderlayProvider` on every rung.** Its context defaults are a `null` value and a
  no-op setter, so omitting it does not throw — `GlassTxCanvas` silently reads `null` and
  draws its own background instead of the card's Skia tree. Wrap every rung so it is not a
  variable between rungs.
- **Geometry from `ScreenSizeContext`, not `useWindowDimensions`** — every sheet dimension
  flows from it.
- `foldUnfold` inverts: `foldUnfold(true)` means *unfold* (`NewMain.tsx:336-343`).

### Two drive modes — the key control

Production commits a fold from the UI thread first (`useNewMainAnims.ts:100-101` springs,
*then* `runOnJS(settle)`), so a naive JS timer would invert the hop order and attribute the
React fan-out to the wrong frame.

- **`worklet`** — pure UI thread, zero React renders, `folded` never changes.
- **`runOnJS`** — production-shaped ordering.

**worklet = the UI-thread + Skia floor. The delta to runOnJS = the React commit cost.**

### Rung ladder (runtime-selected — one build measures all of it)

| Rung | Adds | A janky% jump here proves |
|---|---|---|
| R0 | bare screen, controller running, nothing moves | baseline; non-zero ⇒ environment problem, abort |
| R1 | `GlassBottomSheet`, drag strip, 6 `<View/>` stubs. **Zero Skia** | the translateY + 2 GestureDetectors + 2 setTimeouts. Should be ≈0 |
| R2 | real `GlassTransactionList` (a plain `Animated.ScrollView` over one spacer — **still zero Skia**) | **pure React-commit cost, no Skia, no GPU** |
| R3 | `LiquidGlassTabBar`, `showTxList=false`, empty rowModels | one non-opaque `SkiaTextureView` + the runtime-shader BackdropFilter, with no row content |
| **R4** | real rowModels + `showTxList` | **the decisive step** — per-frame Skia record cost |
| R5 | `GlassAmountView`, chart off | the 2nd, full-screen 1080×2400 TextureView |
| R6 | `GlassTopSectionChart` | chart mount/unmount per fold. Expect **fold-in only** |
| R7 | `GlassTabSelector` | the only Yoga-dirtying animated props on the screen |

R0/R1/R2/R4 are the must-runs. Real cards were deliberately left out — they drag five
components with their own nav/Flexa dependencies into the rig for an expected delta of ≈0.

---

## 2. Measurement protocol

**Preflight — a failed check invalidates the run.** Two runs were wasted on this previously.

```sh
adb shell dumpsys window | grep mCurrentFocus            # must name com.litecoin.nexus
adb shell dumpsys power  | grep mWakefulness             # must be Awake
adb shell dumpsys thermalservice | grep -i "Thermal Status"   # 0, before AND after
adb shell dumpsys gfxinfo com.litecoin.nexus | head -8   # Total frames > 0
```

Also record `syncedToChain` at arm time — if false, `GlassTransactionList.tsx:166-197` runs
an infinite `withRepeat` spinner and a 10 s timer that resizes the pinned header mid-run.
Two runs with different flags are not comparable.

**`framestats` keeps only the last ~120 frames.** A 20-cycle run is ~360 animated frames, so
it silently drops two thirds. Use a 20-cycle run for percentiles and a separate short run for
stage columns.

### Discriminating the hypotheses

| Hypothesis | Signature in framestats |
|---|---|
| React / Reanimated commit + rn-skia draw blocking the UI thread | `PERFORM_TRAVERSALS_START − ANIMATION_START` inflated. Reanimated posts via the Choreographer ANIMATION callback and commits with `mountSynchronously=true`, so the shadow-tree commit, Yoga, Fabric mount **and** rn-skia's inline draw all land in this one span. Bumps `Number Slow UI thread` |
| Yoga specifically | `DRAW_START − PERFORM_TRAVERSALS_START`. Should be ~0 at R0–R6 and step up at R7 |
| Compositing / GPU | `ISSUE_DRAW_COMMANDS → SWAP_BUFFERS → GPU_COMPLETED`. Prior data says GPU is 4 ms, never pinned — **flat is expected; if it isn't, that's news** |
| JS thread blocking | **Invisible to framestats.** Shows only as latency, or as the worklet↔runOnJS delta |

Caveat: Reanimated's own C++ tracepoints are compiled out (`enableReanimatedProfiling`
defaults false in its `build.gradle`), so perfetto shows no named Reanimated slices without
an NDK rebuild. RN core's `ShadowTree::commit` sections survive.

**Direct probe.** rn-skia ships a commented-out timer at exactly the hot spot —
`node_modules/@shopify/react-native-skia/src/sksg/Container.native.ts:26-31`. Uncomment,
swap `console.log` for `nativeLoggingHook`, and bracket `visit(recorder, this.root)` in
`redraw()`. This settles the largest open disagreement (#1) in one run.

**Build:** release only, `-PreactNativeArchitectures=arm64-v8a`. arm64-only is ~172 MB with R8
and rebuilds in ~20 s. (An earlier note here claimed the APK shipped four ABIs at 398 MB; that
was wrong — `app/build.gradle`'s `ndk { abiFilters }` capped packaging at two.)

---

## 2b. MEASURED RESULTS — run 1, 2026-07-31, 268 tx rows

20 cycles/rung, 1200 ms period, release build, arm64, screen kept awake over USB.
Preflight passed. `gfxinfo` bracketed by the harness's own logcat markers.

| Rung | frames | janky% (worklet) | janky% (runOnJS) | p50 | Slow UI | GPU p50 | composited layers |
|---|---|---|---|---|---|---|---|
| R0 bare | 20 | — | — | — | — | — | 0 |
| R1 sheet only | 435 | 6.95% | 4.83% | 10 ms | 16 | 6 ms | 0 |
| R2 + tx list | 400 | 5.65% | 6.25% | 9 ms | 20 | 5 ms | 0 |
| R3 + tab bar canvas | 422 | 12.75% | 9.95% | 9 ms | 24 | 5 ms | 2 (7.3 MB) |
| R4 + rows | 454 | 9.79% | 9.69% | 13 ms | 39 | 4 ms | 2 (7.3 MB) |
| **R5 + backdrop** | 445 | **32.45%** | **34.16%** | **30 ms** | 146 | 3 ms | **3 (17.5 MB)** |
| R6 + chart | 358 | 45.45% | 42.74% | 30 ms | 151 | 3 ms | 4 (19.0 MB) |
| R7 + tab selector | 328 | 54.86% | 56.71% | 32 ms | 181 | 3 ms | 4 (19.0 MB) |

Per-frame cost of each rung (runOnJS p50 delta):

| Step | Δ p50 | What it adds |
|---|---|---|
| R3→R4 | **+4 ms** | the 5× row recording |
| **R4→R5** | **+17 ms** | **`LiquidGlassBackdrop`'s full-screen 1080×2400 canvas** |
| R5→R6 | ~0 ms | chart |
| R6→R7 | +2 ms | 4 `GlassTabButton`s animating Yoga props |

### Three conclusions, all decisive

**1. `LiquidGlassBackdrop` is the bottleneck, not the tx rows.** Mounting `GlassAmountView`
adds **+17 ms per frame on its own — 1.5× the entire 11.1 ms budget**. `Layer Info` confirms
the mechanism exactly: a `GlLayer size 1080x2400` appears at R5 and `Layers Total` jumps
7.3 MB → 17.5 MB. **This overturns the pre-registered #1**, which predicted the
`GlassTxCanvas` 5× row recording would dominate. Measured, that step (R3→R4) costs 4 ms —
real, but 4× smaller.

**2. The React commit costs nothing.** worklet and runOnJS are within noise at *every* rung
(R5: 32.45 vs 34.16; R7: 54.86 vs 56.71). In worklet mode `folded` never changes, so **zero
React renders happen** — and the jank is identical. That refutes cause #2 (two JSI re-records
per commit) and cause #4's mount cost as significant contributors. The work is per-frame Skia
drawing, not React, not mounting, not Fabric.

**3. Emphatically CPU-bound.** GPU p50 *falls* from 6 ms to 3 ms as janky% climbs from 7% to
57%. `Slow UI thread` rises 16 → 181, `Missed Vsync` 0 → 144, `Slow bitmap uploads` stays 0.
Every fill-rate/overdraw/`opaque` idea is confirmed irrelevant.

**Net: the sheet animates at ~30 fps (30 ms/frame) against an 11.1 ms budget, and ~17 ms of
that is one full-screen Skia canvas redrawing every frame.**

Harness validation: R0 rendered exactly 20 frames for 20 cycles — one per HUD update — so the
controller itself contributes nothing.

## 2c. RUN 2 — is the backdrop's 17 ms CPU or GPU?

gfxinfo's GPU histogram only covers HWUI's own GL context. react-native-skia renders into its
**own** EGL context on a TextureView, so Skia GPU work is invisible there and would surface as
main-thread time. Settled by sampling `/sys/kernel/gpu/gpu_busy` and `/sys/kernel/gpu/gpu_clock`
on-device at ~12 Hz through a second full ladder run, correlated against the harness's
logcat markers by epoch timestamp.

GPU-ms per frame = mean(gpu_busy) × window seconds ÷ frames rendered.

| Rung | GPU ms/frame | frame p50 | non-GPU ms | GPU clock max |
|---|---|---|---|---|
| R1 sheet only | 2.7 | 9 ms | 6.3 | 208 MHz |
| R2 + tx list | 2.8 | 9 ms | 6.2 | 208 MHz |
| R3 + tab bar canvas | 4.2 | 8 ms | 3.8 | 403 MHz |
| R4 + rows | 8.0 | 13 ms | 5.0 | 507 MHz |
| **R5 + backdrop** | **8.6** | **27 ms** | **18.4** | 702 MHz |
| R6 + chart | 11.8 | 32 ms | 20.2 | 702 MHz |
| R7 + tab selector | 12.0 | 32 ms | 20.0 | 611 MHz |

**R4→R5 adds +0.6 ms of GPU and +13.4 ms of non-GPU.** The worklet run agrees (+4.6 GPU,
+13.4 non-GPU — the non-GPU delta is identical to the decimal). Peak `gpu_busy` during
animation reaches ~80–92%, and DVFS climbs 208 → 702 MHz, so the GPU is genuinely working —
but its per-frame time barely moves while frame time more than doubles.

**Conclusion: `LiquidGlassBackdrop` is CPU/main-thread bound, not fill-rate bound.**

This matters for the fix direction. Cropping the `BackdropFilter` to reduce *fill* would be
chasing the wrong quantity. The suspects are now all CPU-side:
- `glassFilter` (`LiquidGlassBackdrop.tsx:387-410`) constructs a **brand-new Skia ImageFilter
  every frame** via `makeGlassTabFilter`, composing a RuntimeShaderBuilder with a
  `MakeBlur(4,4)` child — a native allocation + JSI traffic per frame.
- rn-skia replays the canvas's **entire** command list per frame on the main thread.
- ~8 `useDerivedValue` mappers on this canvas, including `foldClip` (`:361`) building a path
  per frame.

Caveat on method: `gpu_busy` is a DVFS-windowed average sampled at 12 Hz against a 17% duty
cycle, so per-rung GPU-ms carries maybe ±30% error. That is nowhere near enough to overturn a
0.6 vs 13.4 ms split, but do not quote these as precise.

## 2d. RUN 3 — direct per-frame timing inside rn-skia. THE ANSWER.

`node_modules/@shopify/react-native-skia/src/sksg/Container.native.ts` was instrumented to
split the per-frame UI-thread mapper into its three parts, batched over 120 frames and handed
back to JS via a shared value + `useAnimatedReaction` (the worklet runtime has no logging
channel of its own, and a plain JS read of a UI-written shared value does not sync reliably).

| rung | canvas | `applyUpdates` | `recorder.play` | **`setJsiProperty`** | total |
|---|---|---|---|---|---|
| R4 | 1007 tab-bar glass | 0.06 | 1.59–2.25 | **5.63–6.11** (max 26.5) | ~8.0 ms |
| R4 | 1008 tab-bar chrome | 0.02 | 0.08 | **3.97** (max 19.2) | 4.1 ms |
| R5 | 1007 | 0.07 | 2.52–2.63 | **6.27–6.37** (max 28.1) | ~9.0 ms |
| R5 | 1009 backdrop | 0.14 | **0.21–0.25** | **2.93–4.22** | 3.3–4.6 ms |
| R6 | 1010 chart | 0.17 | 0.22 | **4.02** | 4.4 ms |

### What this settles

**1. `recorder.play()` is not the bottleneck.** For the backdrop it is **0.21 ms**. The picture
rebuild — the thing the `ProgressiveEdgeBlur` 5×-instantiation theory and the whole
`redraw()`/re-record line of reasoning pointed at — is essentially free. Dead hypothesis.

**2. The cost is `SkiaViewApi.setJsiProperty(nativeId, "picture", …)`** — the hand-off that
makes the native view draw. **3–6 ms per canvas per frame**, maxes of 19–28 ms. It runs on the
UI thread, which is why `gpu_busy` could not see it and why it read as "non-GPU" time.

**3. It scales with the NUMBER of canvases, not their content.** Every mounted `<Canvas>` pays
its own hand-off, serially, every frame:

- R4 = 2 canvases ≈ 12 ms/frame
- R5 = 3 canvases ≈ 17 ms
- R6 = 4 canvases ≈ 21 ms

against measured frame p50 of 13 / 27 / 30 ms — essentially the whole budget. Canvases also
contend: mounting the backdrop pushed the tab-bar canvas from 8.0 → 9.0 ms.

The clincher is canvas **1008**, the tab bar's chrome canvas
(`LiquidGlassTabBar.tsx:404`, a 722×156 layer drawing one hairline rect, one thumb pill and
three icons). It costs **4 ms/frame** — `play` is 0.08 ms and the other 3.97 ms is pure
hand-off. Content is irrelevant; the canvas itself is the cost.

### Consequence for the fix direction

The lever is **canvas count**, not shader tuning, crop bounds, blur sigma or picture size.
This is why §2b's canvas-height fix only bought ~3 ms: it shrank one canvas's work without
removing a hand-off. It independently matches the earlier scroll profiling, which concluded
"the lever is composite and submission count: merging the canvases".

Merge candidates, in order of tractability:
1. **`LiquidGlassTabBar`'s chrome canvas (`:404`) into `GlassTxCanvas`** — same component,
   same `zIndex: 3` layer, and `GlassTxCanvas` already receives `pressScale`, `hideProgress`
   and `contentActivity`, so it already has the geometry. **~4 ms/frame.**
2. **`GlassChartTouch` into `LiquidGlassBackdrop`** — both are top-half, same z-layer, and the
   backdrop already draws the chart line via `useGlassChartGraphics`. ~4 ms/frame.
3. Backdrop + `GlassTxCanvas` **cannot** be merged: the RN bottom sheet is z-sandwiched
   between them (backdrop behind, `GlassTxCanvas` at `zIndex: 3` in front).

## 2e. FIXES APPLIED AND RE-MEASURED

Two changes, both staged, both verified visually identical by screenshot:

1. **`LiquidGlassBackdrop` canvas 2400 → 1441 px** and the fold-morph erase rect
   2400 → 622 px tall (§2b). The parent already clips at 1441 px with `overflow: 'hidden'`.
2. **`LiquidGlassTabBar`'s chrome canvas merged into `GlassTxCanvas`** (`barChrome` prop).
   The bar's `Animated.View` stays as a hit area only; `GlassTxCanvas` draws the border,
   thumb and icons under a `barTransform` matching the glass capsule exactly.

Per-frame rn-skia timings confirm the mechanism — one fewer canvas at every rung:

| | before | after |
|---|---|---|
| R4 | 1007 (8.0 ms) + 1008 (4.1 ms) = **12.1 ms** | 1007 only = **~8.9 ms** |
| R5 | ≈ **17 ms** | ≈ **13.9 ms** |

`play` on 1007 rose 2.2 → 2.7 ms (it now draws the chrome) but a whole ~4 ms hand-off is gone.

Frame-level, same ladder, before vs after:

| rung | janky% worklet | janky% runOnJS | p50 runOnJS |
|---|---|---|---|
| R5 +backdrop | 37.9 → **32.0** | 33.6 → **26.7** | 27 → **25 ms** |
| R6 +chart | 45.5 → **34.4** | 47.5 → **29.7** | 32 → **25 ms** |
| **R7 +tabsel** | 57.6 → **43.0** | 57.5 → **37.1** | 32 → **28 ms** |

**On the rung closest to the real screen, janky frames fell ~20 points and the median frame
4–7 ms.** Still above the 11.1 ms budget — the remaining canvases (backdrop, chart, tab-bar
glass) each still cost their own 3–6 ms hand-off, so the next win is merging
`GlassChartTouch` into `LiquidGlassBackdrop` (both top-half, same z-layer).

## 2f. THIRD MERGE — chart cursor into the backdrop

`GlassChartTouch`'s `<Canvas>` drew **only** the scrub crosshair, entirely from the
module-scope shared values in `glassChartCursor.ts`, so it moved with no prop threading:
`useGlassChartCursorGraphics({chartTop})` is now exported from `GlassChart.js` and rendered by
`LiquidGlassBackdrop`, which already draws the chart line at the same `chartTop` offset.
`GlassChartTouch` keeps its `GestureDetector` + `View` as a hit area and the Lester image.

Bonus beyond the per-frame saving: `GlassTopSectionChart` mounts/unmounts this subtree on
**every fold**, so this also removes a per-fold `SkiaTextureView` + EGL surface creation
(original cause #4, ~6–13 ms per fold-in) that the steady-state ladder does not fully capture.

### Cumulative, same ladder, three builds

| rung | janky% orig → merge1 → merge2 | p50 orig → merge2 | GlLayers orig → now |
|---|---|---|---|
| R5 +backdrop | 33.6 → 26.7 → **26.9** | 27 → **25 ms** | 3 → 2 |
| R6 +chart | 47.5 → 29.7 → **27.0** | 32 → **25 ms** | 4 → 2 |
| **R7 +tabsel** | 57.5 → 37.1 → **35.8** | 32 → **28 ms** | 4 → 2 |

*(runOnJS; worklet agrees — R7 57.6 → 43.0 → 42.6, p50 34 → 28 ms.)*

**Composited layers on the full screen went 4 → 2.** The chart merge on its own is worth
1–3 points and 0–2 ms in steady state — smaller than the tab-bar merge, because the chart
canvas was already cheaper — but it removes the per-fold TextureView churn on top.

Cumulative on the rung closest to production: **janky frames 57.5% → 35.8%, median frame
32 → 28 ms.** Still above the 11.1 ms budget; two canvases remain (backdrop, tab-bar glass)
and they cannot be merged — the RN bottom sheet is z-sandwiched between them.

### Re-creating the rn-skia probe

The timing probe was reverted from `node_modules` (it is untracked and `bun install` wipes it).
To redo it: in `@shopify/react-native-skia/src/sksg/Container.native.ts`, bracket
`recorder.play(picture)` and `SkiaViewApi.setJsiProperty(...)` inside `nativeDrawOnscreen` with
`performance.now()`, accumulate into a `globalThis.__skPerf[nativeId]` object on the UI
runtime, and every 120 frames write a formatted string into a shared value created in
`redraw()` and passed down as a parameter (a module-scope worklet captures it as `null`).
Read it on the JS side with `useAnimatedReaction` + `runOnJS` — the UI runtime has neither
`nativeLoggingHook` nor a callable `Rea.runOnJS`, and a plain JS `.value` read does not sync.

### Where to look next
`LiquidGlassBackdrop.tsx` — it is full-screen (`:480-487` sizes the canvas to `screenHeight`)
and its `glassFilter` is rebuilt per frame off `mainSheetsTranslationY`. The R4→R5 delta is
now the number to beat. A perfetto trace or the `Container.native.ts:26-31` `recorder.play`
timer will say whether the 17 ms is the runtime shader, the picture re-record, or the
1080×2400 texture upload.

---

## 3. Ranked causes (pre-registered, now partly superseded by §2b)

### #1 — `GlassTxCanvas` records the row window **five times** per replay, every frame
`src/components/GlassTxCanvas.tsx:320, :334, :358, :368` + `src/components/ProgressiveEdgeBlur.tsx:17, :130`

`rowElements` (`:171`) appears in the recorded tree five times — verified: the clipped list
pass (`:334`), `bandSource` drawn plainly (`:358`), and `ProgressiveEdgeBlur` (`:368`)
re-rendering `{children}` once per `LEVEL_FRACTIONS = [0.35, 0.65, 1]`. Five
`useDerivedValue`s over `mainSheetsTranslationY` fire the canvas's mapper on **every one of
the ~18 frames**, and `recorder.play()` rebuilds the SkPicture **on the main thread**, inline.

**Cost is genuinely contested — the two passes disagreed 20×.** One modelled `play()` as a
cheap native command-vector walk: **0.15–0.35 ms/frame**. The other counted ~1,100–1,500
nodes of which 480–640 are `ParagraphCmd` draws calling `paragraph->layout()` on every
replay, with no bounding-box hierarchy to cull against: **3–8 ms/frame**. That is **6 ms vs
140 ms per transition** — the largest unknown and the largest prize.

**Settled by:** the R3→R4 delta, plus the `Container.native.ts` timer.
**Fix:** gate the blur subtree when `frostOpacity` is 0; 3 levels → 2; consume a drawn layer
instead of re-recording `bandSource`; reduce `WINDOW_OVERSCAN_ROWS` (`GlassTxRows.tsx:228`,
currently 8 — an ~8.5-row viewport quantises to a 24–32-row window).
**Also measure the scroll path** — the same 5× replay fires per scroll frame via `txListScrollY`.

### #2 — the `isBottomSheetFolded` commit forces two full JSI re-records per transition
`src/screens/NewMain.tsx:648, :700` → `LiquidGlassTabBar.tsx:206` → `GlassTxCanvas.tsx:102`

`isBottomSheetFolded` is a dep of both `TxListComponentMemo` and `BottomSheetMemo`. Neither
`GlassTxCanvas` nor `LiquidGlassTabBar` is memoized. rn-skia's `Canvas` re-runs
`useLayoutEffect(..., [children])`, and multi-child JSX makes a fresh array every render, so
`SkiaSGRoot.render` **plus** `HostConfig.resetAfterCommit` = **two `redraw()`s per commit**,
each walking the whole (5×-duplicated) tree one JSI hop per node with no diffing.

**Cost:** ~3–5 ms JS per re-record (≈8–20 ms/transition), plus main-thread `play()` tail and
two mapper stop/start round trips. **Must A/B on a populated wallet** — under 1 ms on a 5-tx one.
**Fix:** `React.memo` both canvases, memoize `onSelectSection` (`NewMain.tsx:764`, currently
an inline arrow so the memo would never hit), make each `<Canvas>`'s children one `useMemo`'d
fragment.

### #3 — the card-swap cluster lands at t=155 ms of a 200 ms animation
`GlassBottomSheet.tsx:26, :147-158`, `NewMain.tsx:322-333`

`CARD_SWAP_DELAY = 155` vs `SHEET_FOLD_ANIM_MS = 200`. Two effects batch into one render at
t=155 ms, mounting `TxListComponent` — which contains **its own `<Canvas>`** (`NewMain.tsx:160`),
i.e. a new `SkiaTextureView` + EGL surface created **on the main thread**, plus a ScrollView
and two RNGH attachments. **Scoping matters:** both key on `activeTab`, not `folded`, so a
plain wallet fold/unfold is an `Object.is` bailout and none of it runs. Fires only on
tab-press-from-folded and fold-home-from-a-card.
**Cost:** ~5–12 ms JS + ~8–20 ms main thread in a 1–3 frame window at the *tail* of the fold —
reads as the sheet sticking on landing. **0 ms for a plain wallet fold.**
**Fix:** move the swap past the animation via `withTiming`'s completion callback; collapse the
two duplicate 155 ms timers. **Risk:** 155 is tuned against the `withSequence(150, 300)`
crossfade — the swap must happen at opacity ≈0 or the outgoing card pops.

### #4 — chart canvas mount + 385 `measureText` calls on every fold-in
`GlassTopSectionChart.tsx:22-28`, `GlassChart.js:327-367`

The chart subtree mounts/unmounts on every fold. Mounting runs a `Math.round(width)+1` = **385**
column loop doing a d3 bisect, a `scaleTime.invert` (Date alloc), a template string and a
`measureText` per column, plus a new TextureView + EGL setup.
**Cost:** ~6–13 ms per fold-**in**, ~1–4 ms per fold-out. **Strictly asymmetric — do not
average the directions.**
**Free sub-fix, verified:** `chartMode` defaults to `'price'` (`reducers/settings.ts:80`) and
the pill is only drawn when `chartMode === 'balance'` (`GlassChart.js:684`). So in the default
config all 385 `measureText` calls and both pill arrays are computed for something never
rendered. Gate the label half of the loop.
**Do not remove the LUT itself** — it landed in `1560ecd` to fix the chart OOM crash.

### #5 — `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` is false
`node_modules/react-native-reanimated/src/featureFlags/staticFlags.json:4`

Every animated prop takes the full clone → commit → diff → mount path on the main thread
inside the Choreographer ANIMATION callback. ~0.25–0.6 ms/frame, ~5–11 ms/transition.
**Only pays off after #6** — layout props aren't in the synchronous allowlist. Needs an NDK
rebuild. Still experimental in 4.2.3.

### #6 — four `GlassTabButton`s animate Yoga layout props
`src/components/Buttons/GlassTabButton.tsx:72-80` (`{left, top, width}`), `:136-152` (`{height}`)

8 Yoga-dirty nodes/frame, ~0.1–0.25 ms/frame. Small on its own, but they are the **last**
per-frame non-allowlisted animated props on the sheet path, so converting `top → translateY`
and `height → fixed` is the precondition that makes #5 worth doing.

### #7 — drag-release fires a spring that a JS-thread timing retargets from a standstill
`useNewMainAnims.ts:100-101` and `GlassBottomSheet.tsx:118-135`

`onHandlerEnd` springs to `clamp(releaseY + velocityY*0.03)` — roughly *where the finger let
go*, not a snap point — and passes **no `velocity`**, so it starts at v=0. ζ≥1 routes to
critically-damped, ω₀ = 94.9 rad/s, 10.5 ms time constant: it covers the toss in 3–4 frames
and stops. One JS round-trip later `setBottomSheetFolded` re-runs the effect, assigning
`withTiming(SNAP_POINT, 200)` to the same shared value. `timing`'s `onStart` only inherits a
timeline from a previous *timing* with an identical `toValue`; interrupting a spring takes the
else branch and **restarts a full 200 ms ease from a standstill**.

**Cost: zero frame time. Every frame renders on schedule.** What you get is **40–80 ms of
visually motionless sheet after finger-lift, then a fresh 200 ms ease — ~215–265 ms total.**
Worst for slow deliberate drags; nearly absent for hard flicks.

> **This will never appear in `dumpsys gfxinfo`, in any column.** If the complaint is "the
> sheet opens and closes slowly / sticks", this is the cause, and every frame-timing tool
> will report the run as clean.

Confirm with a 240 fps capture, or set `SHEET_FOLD_ANIM_MS = 2000` and watch it snap, pause,
then crawl. **Fix:** spring to the real destination with `velocity: e.velocityY`, write
`mainSheetsTranslationYStart` on the UI thread (not from the 200 ms `setTimeout` at
`GlassBottomSheet.tsx:123`, which is never cleared and leaves a stale drag origin), and drive
from one `sheetTarget` shared value that both the gesture and tap paths write.

### Negative result worth keeping
**Nothing under `GlassBottomSheet` drives a per-frame Yoga layout or an `onLayout`.** Its only
animated styles are `transform` (`:112-116`) and `opacity` (`:137-141`), neither a
`YogaStylableProp`. Don't spend time here. Any future animated style inside the sheet must
stay on transform/opacity.

---

## 4. Refuted — do not re-derive

| Claim | Why dropped |
|---|---|
| Gesture objects rebuilt every render → handler drop/reattach | `needsToReattach` returns false; it's a config push deferred into a microtask, ~1.5–3 ms JS once |
| `getStyles()`/`StyleSheet.create` per render defeats Fabric's diff | payload is null, no native update; microseconds, once per transition |
| `TxListComponentMemo`/`BottomSheetMemo` deps "defeat" the memos | `isBottomSheetFolded` genuinely changed; no dep edit avoids the render. The expensive siblings sit *outside* both memos |
| `collapsable={false}` inventory | Reanimated clones only the ancestor path; the Differentiator short-circuits on pointer equality |
| GlassBottomSheet's double full-screen rounded background | real, but no `saveLayer` and it's GPU-side on a CPU-bound device |
| card-opacity forces `saveLayer` | nothing sets `needsOffscreenAlphaCompositing` |
| non-opaque TextureViews / pass `opaque` | GPU/fill-rate reasoning on a device measured at 4 ms GPU vs 30 ms frame. Also structurally unavailable: `LiquidGlassBackdrop.tsx:462` needs `blendMode="clear"` |
| `detachPreviousScreen:false` keeps Auth mounted all session | `Auth.tsx:138` is a `replace`; the route is gone ~320 ms after unlock |
| whole-slice `state.info` selectors + pollers | ~6% chance of landing in a 200 ms window, ~0.05–0.15 ms expected |
| root `onTouchMove` floods JS | RNGH sets `childIsHandlingNativeGesture`; JSTouchDispatcher early-returns |
| outer pan wrapping the tx list is a regression | deliberate (`357d1ede`); inner scroller latches at 8 dp before the outer 15 dp `activeOffsetY` |

---

## 5. Dead code

`src/screens/Main.tsx` has **zero importers** (verified), and it is the only importer of
`src/components/BottomSheet.tsx`. `MainDrawer.tsx:32-36` registers only `NewMain`.
`BottomSheet.tsx:77-135` still carries an inlined copy of the old snap logic with *different*
ratios (0.24/0.47 vs 0.37/0.65), so keeping the two sheets in sync is not even meaningful.
Both files ship in the bundle. **Recommend deleting both** — not done yet, flagged for review.
Either way, neither should receive any of the fixes above.

---

## 6. Reverting the harness

Set `PERF_HARNESS = false` in `src/config/perfHarness.ts`. That restores
`initialRouteName="Main"` and drops the screen from the navigator. Delete
`src/screens/PerfHarness.tsx`, `src/config/perfHarness.ts`, `scripts/sheet-perf.sh` and the
`PerfHarness` line in `src/navigation/types.ts` to remove it entirely.
