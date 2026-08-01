# Performance guide — Android, low-end devices

Reference for anyone adding Skia, animation or screens to this app. Everything here was
measured on the target device, not inferred. Investigation logs live in
`bottomsheet-perf-plan.md`, `glass-perf-plan.md` and `slow-device-perf-plan.md`; this file is
the distilled "what to do" version.

**Reference device:** Samsung SM-A336B (Galaxy A33), Android 14, Exynos 1280, Mali-G68 MP4,
1080×2400 **@ 90 Hz → 11.1 ms frame budget**, DPR 2.8125, screen 384 × 853.33 dp.

---

## 0. The short version

1. **Every `<Canvas>` costs 3–6 ms of UI-thread time per frame, regardless of what it draws.**
   Canvas count is the single biggest lever in this app. Publish into an existing canvas.
2. **This device is CPU-bound, not GPU-bound.** Measured 4 ms GPU against a 30 ms frame, with
   `gpu_busy` never pinned. Fill rate, overdraw and blur radius are *not* your problem.
3. **Animate `transform` and `opacity` only.** Anything else dirties Yoga and costs a layout
   pass per frame.
4. **Drive animation from shared values, never React state.** React commits measured at ~0 for
   fold animations; a state flip per frame is what kills you.

---

## 1. Skia rules

### 1.1 Canvas count is the cost — not canvas content

Per-frame UI-thread cost, measured by instrumenting rn-skia's mapper
(`Container.native.ts`, `nativeDrawOnscreen`):

| stage | cost |
|---|---|
| `sharedRecorder.applyUpdates()` | 0.02–0.18 ms |
| `recorder.play(picture)` (rebuild the SkPicture) | 0.08–2.7 ms |
| **`SkiaViewApi.setJsiProperty(id, "picture", …)`** | **3–6 ms** (maxes 19–28 ms) |

**That last line is not a hand-off — it is the whole render, run synchronously inside your
worklet.** Traced: `setPicture` → `requestRedraw` → `runOnMainThread` →
`PlatformContext.notifyTaskReady`, which is

```java
if (Looper.myLooper() == Looper.getMainLooper()) { notifyTaskReadyNative(); }  // inline
else { mainHandler.post(...); }
```

and Reanimated's UI runtime **is** the Android main thread, so it always takes the inline
branch → `renderImmediate` → `performDraw` → Skia draw + present. Every canvas renders and
presents serially on the main thread before the Choreographer callback returns.

That explains the shape of the numbers: cost scales with canvas *count* rather than content
(the tab bar's chrome canvas was a 722×156 layer drawing one hairline, one pill and three
icons — `play` 0.08 ms, this 3.97 ms), GPU time barely moves (~0.6 ms for the whole backdrop),
and the 19–28 ms outliers look like BufferQueue backpressure — the main thread blocking in
present waiting for a free buffer, not doing work.

Consequences:

- **Never mount a `<Canvas>` for a small decoration.** Draw it into a canvas that already
  exists nearby.
- **Publish Skia trees as props.** Established pattern in this repo: `GlassTxCanvas` takes a
  `barChrome` element from `LiquidGlassTabBar`; card underlays do the same via
  `cardUnderlay.tsx`; `LiquidGlassBackdrop` takes the chart cursor from
  `useGlassChartCursorGraphics`. Copy this pattern.
- **Keep the `GestureDetector` where it is** — move only the drawing. A plain `<View>` hit area
  is free; a `<Canvas>` is not.
- **Canvases can only be merged within a z-layer.** The backdrop and `GlassTxCanvas` cannot
  merge because the RN bottom sheet is sandwiched between them (backdrop behind,
  `GlassTxCanvas` at `zIndex: 3` in front).
- **A BackdropFilter only samples its own canvas.** Anything the glass must refract has to be
  drawn in the same canvas.

Measured payoff: merging two canvases on the main screen took composited layers 4 → 2 and
janky frames **57.5% → 35.8%**, median frame **32 → 28 ms**.

### 1.2 Mount cost, not just frame cost

Every `<Canvas>` on Android is a `SkiaTextureView`. Mounting one creates a SurfaceTexture and
an EGL surface **on the main thread**. Mounting a canvas *during* an animation drops frames at
exactly the wrong moment.

- Don't gate a canvas on a boolean that flips during a transition. `GlassTopSectionChart` used
  to mount/unmount the chart canvas on every sheet fold — worth ~6–13 ms per fold-in.
- Prefer keeping the tree mounted and driving visibility from an opacity shared value.

### 1.3 Things that do *not* help on this device

- **`opaque` — tried and measured WORSE.** It is not a blending hint: `SkiaBaseView.setOpaque`
  swaps `SkiaTextureView` for `SkiaSurfaceView`, so SurfaceFlinger composites the surface
  instead of HWUI sampling it. Confirmed working — HWUI's layer list went 2 → 1 and the
  backdrop disappeared from it. **But the fold got 7–13 points jankier** (R5 27.1 → 34.3%
  runOnJS, 34.1 → 47.5% worklet; a no-backdrop control rung stayed flat), p50 +2–4 ms, and GPU
  memory rose 43 → 60 MB. Reason: `renderImmediate` is synchronous on the main thread *either
  way* — `opaque` changes who consumes the buffer, not who produces it. The blocking present
  remains, and you have added a full-screen SurfaceFlinger layer that is composited every
  frame whether or not it changed; with the app window and sheet above it, SF cannot use a
  hardware overlay. **Do not retry this for the backdrop.**
- Reducing blur sigma, shader ALU, crop bounds, overdraw, gradient area. All fill-rate.
  Shrinking the backdrop canvas by 40% bought ~3 ms; merging one canvas bought ~4 ms.
- `MakeCrop` on a `BackdropFilter` bounds the *shader*, not the *`saveLayer`*.

### 1.4 Gotchas

- `<Group opacity>` has **no effect on `<Paragraph>`** — opacity folds into the paint and
  `ParagraphCmd` never reads it. Use a `<Group layer={<Paint opacity/>}>` or an off-canvas
  transform.
- A clip around a `BackdropFilter` shifts the filter's coordinate origin, so it moves the
  drawn result. Keep glass filters unclipped with canvas-space uniforms.
- rn-skia's `Canvas` re-runs `useLayoutEffect(..., [children])`, and multi-child JSX makes a
  fresh array every render — so any React re-render of a canvas triggers **two** full JSI
  re-records (`SkiaSGRoot.render` + `HostConfig.resetAfterCommit`). Memoise a canvas's children
  into a single element if the parent re-renders often.

**But a small canvas with no animated props is cheaper than this rule suggests — measured.**
It never runs a per-frame mapper, and although the re-record above still fires on every render
of its subtree and ends in a synchronous `setJsiProperty`, one ~4 ms submit per transition is
one frame in ~380 — under the noise floor. The transaction-list search button is a 60 × 60 dp
canvas inside a subtree memoised on `isBottomSheetFolded`, so it re-records on **every fold**,
and mounting it moved janky% by +0.01/−0.73 points. Replacing it with native views measured
**+1.2/+1.0, i.e. no better**, and it never appeared in `Layer Info` at all.

So the "never mount a canvas for a decoration" rule is about canvases with **animated props**,
which redraw every frame. A static one costs its mount and one submit per render of its parent.
Worth avoiding in new code; not worth ripping out existing ones without measuring.

---

## 2. Animation rules (Reanimated 4)

### 2.1 Animate transform/opacity, never layout props

`left`, `top`, `width`, `height`, `flex`, margins and padding are `YogaStylableProp`s. Animating
them dirties the shadow node and forces a Yoga pass **every frame**.

Yoga *does* guard on equality (`YogaLayoutableShadowNode.cpp:378-388`), so a prop that stays
constant is free even if it appears in the animated style each frame. Only values that actually
change dirty the node.

Worked example — `GlassTabButton` used to return `{left, top, width}` plus an interpolated
`height`. `top` changed every frame, so all four buttons dirtied on all 18 frames of a fold.
Converted `left`/`top` to `transform` and switched `height` on the `folded` prop. `width` was
left animated: it is driven by `splitProgress`, clamped to the last ~22% of travel, so it is
constant — and therefore free — for the other ~78%.

**Measured outcome: no improvement.** The `GlassTabSelector` mount step stayed at ~8 points of
jank and ~2–3 ms either side of the change, inside a ~2–3 point run-to-run noise floor. The
conversion is still the correct way to animate position, but the layout passes were not what
made that step expensive — it also mounts ~48 views, four `TranslateText` labels and a pile of
mappers, and none of that was isolated. **Lesson: a ladder rung prices *mounting a component*,
not *a mechanism inside it*.** To attribute further, sub-ladder inside the component the way
§5 describes for the backdrop.

> **2026-08-01.** The conversion described above was **not in the tree** — HEAD still had
> `{left, top, width}` plus the interpolated `height`. It was lost between sessions and this
> paragraph outlived it. It has been re-applied, and re-measured: the R2→R3 step went 9.71 →
> 9.91 points, null again, exactly as recorded here. If you find yourself about to make this
> change a third time: it is correct, it is already done, and it buys nothing.
> The `'tabsel'` sub-ladder (`SUB_LADDER = 'tabsel'`) now exists to answer what that ~8 points
> actually is — see backlog item 1.

### 2.2 Don't round-trip through React to run an animation

Driving the sheet fold purely from a worklet (zero React renders) versus through
`runOnJS(setState)` produced **identical** jank at every rung. React commits are not the
problem *if* the animation reads shared values. What hurts is a state flip that re-renders a
big subtree while the animation runs.

### 2.3 Never let two animations fight over one shared value

**Worked example (fixed).** `useNewMainAnims` fired `withSpring(dest)` on drag release with no
`velocity` and a destination near where the finger lifted; one JS round-trip later
`GlassBottomSheet`'s effect assigned `withTiming(SNAP, 200)` to the same value. Interrupting a
spring restarts the easing **from a standstill**, giving **40–80 ms of visually motionless
sheet** and ~215–265 ms total instead of 200 ms. It costs **zero frame time**, so
`dumpsys gfxinfo` reports the run as clean. If something "feels sticky" but profiles clean,
look for this shape.

Fixed by springing to the real snap point with `velocity: e.velocityY`, and having the effect
skip when a gesture already committed the same target.

**Also keep roles separate.** `mainSheetsTranslationYStart` is the *drag origin*. An early
version of the fix overloaded it as an "already animating" flag by writing the destination to
it, which broke re-grabbing the sheet mid-animation — a finger landing during the fold measured
its drag from the destination and the sheet jumped. The origin is now claimed in
`.onBegin(() => Start.value = current)`, and the flag is a separate value.

The deeper form, still worth doing: one `sheetTarget` shared value with a single
`useAnimatedReaction` owner writing `mainSheetsTranslationY`, so gesture and tap paths both
just set a target.

### 2.4 Worklet mechanics that cost hours if you don't know them

- A **module-scope worklet captures its closure by value at serialization time**. A `let`
  assigned later stays `null` inside the worklet. Pass such things in as parameters.
- The worklets UI runtime has **no `nativeLoggingHook`** and `Rea.runOnJS` is **not callable**
  from inside a worklet through the Reanimated proxy.
- Reading `sharedValue.value` **from the JS thread** is not free and not async: with
  `USE_SYNCHRONIZABLE_FOR_MUTABLES: false` (the 4.2 default) the getter is a blocking
  `runOnUISync` that takes the UI runtime mutex on the calling thread. It returns the live
  value, but it stalls JS for however long the UI runtime is busy — so never do it on a hot
  path or mid-animation. Push values to JS through the `runOnJS` hop you already have, or read
  them with `useAnimatedReaction` + `runOnJS`.
- `console.log` is stripped from release builds (`babel.config.js` applies
  `transform-remove-console` to every env except development) — **including `node_modules`**.
  Use `global.nativeLoggingHook?.(msg, 3)` on the JS thread; it survives.

---

## 3. React / Redux rules

- `babel-plugin-react-compiler` is enabled, so manual `useMemo` is often redundant — but it
  cannot stop a re-render when a prop genuinely changes.
- Prefer narrow selectors. Whole-slice selectors re-run every subscriber on any field change.
- A `withRepeat(…, -1)` animation anywhere in a Skia tree makes that canvas redraw
  **continuously**, not just during interaction — and with the model in §1.1 that means a full
  synchronous render + present on the main thread every frame for as long as it runs. The sync
  spinner (`GlassTransactionList.tsx:166-177`) showed ~2500 frames in one 24 s window at
  unlock. It clears quickly, so it is not a steady-state cost — but the *pattern* is one to
  avoid for anything long-lived.
- redux-persist writes the whole persisted blob on every change. Blacklist volatile slices
  (`chart`, `input`) or every keystroke writes hundreds of KB.

---

## 4. Build configuration

| Item | State | Impact |
|---|---|---|
| **R8 / minify** | ON. Shrink + obfuscate only — `getDefaultProguardFile("proguard-android.txt")` carries `-dontoptimize`, so the dex-size/class-loading win needs the `-optimize` variant | APK size |
| **ABIs** | driven solely by `reactNativeArchitectures`. **`app/build.gradle` used to hard-code a second list in `ndk { abiFilters }`** that silently overrode it — the two diverged, building ABIs that were then discarded and packaging one the native deps no longer built | build time, and an `UnsatisfiedLinkError` waiting to happen |
| Hermes | on, bytecode precompiled | startup is *not* JS parsing |
| Baseline profiles | generated by AGP into `app/build/outputs/apk/release/baselineProfiles` | keep |

**Whenever you change R8 rules, verify the class Expo resolves by name survived:**
`grep -m1 "^expo.modules.ExpoModulesPackageList ->" android/app/build/outputs/mapping/release/mapping.txt`
must map to itself. If R8 renames it, `ExpoModulesHelper`'s `Class.forName` returns null,
`NativeModulesProxy` NPEs at launch, and every Expo module — including `expo-secure-store` and
`expo-local-authentication` — fails to load. Expo's own consumer rule is `-keepclassmembers`,
which does not stop the class itself being renamed.

**For profiling builds, always use `-PreactNativeArchitectures=arm64-v8a`** — 188 MB instead of
398 MB and ~18 s incremental rebuilds.

**Do not profile a debug build.** Metro's dev runtime dominates, and `__DEV__` branches are
eliminated from release bundles — so `__DEV__`-gated instrumentation does not exist in the
binary you measure. Gate profiling code on a plain constant instead.

Gradle does **not** track `node_modules` as a bundle input. After editing a library's source,
delete `android/app/build/generated/assets/react/release/index.android.bundle` or the JS will
be silently stale.

---

## 5. How to measure

A working harness lives in `src/screens/PerfHarness.tsx` + `scripts/sheet-perf.sh`
(enable with `PERF_HARNESS` in `src/config/perfHarness.ts`). It self-drives N fold cycles per
rung, emits logcat markers, and the host script brackets each rung with `gfxinfo`.

**Preflight — a failed check invalidates the run.** Two runs were wasted on this.

```sh
adb shell dumpsys window | grep mCurrentFocus          # must name com.litecoin.nexus
adb shell dumpsys power  | grep mWakefulness           # must be Awake
adb shell dumpsys thermalservice | grep -i "Thermal Status"   # 0, before AND after
adb shell dumpsys gfxinfo com.litecoin.nexus | head -8 # Total frames > 0
adb shell svc power stayon usb                         # and restore to false after
```

**Method that works: the bisect ladder.** Build one screen that mounts your subject and nothing
else, then add exactly one suspected cost per rung, runtime-selectable so one build measures
the whole ladder. The janky% delta between two rungs attributes the frame time to that one
thing. Run every rung in two drive modes — pure worklet (UI-thread + Skia floor) and
production-shaped `runOnJS` — because the delta is the React cost.

**Reading `gfxinfo`:** `Total frames rendered`, `Janky frames`, `50th/90th percentile`,
`Number Slow UI thread`, `Number Missed Vsync`, and the `Layer Info` block — `GlLayer` entries
are a direct count of composited TextureViews, which is the fastest way to confirm a canvas
merge landed.

**Attributing CPU vs GPU:** `gfxinfo`'s GPU column only covers HWUI's own context, **not**
rn-skia's EGL context. Sample `/sys/kernel/gpu/gpu_busy` and `/sys/kernel/gpu/gpu_clock`
on-device instead and compute GPU-ms/frame = mean(busy) × window ÷ frames.

---

## 6. Ranked backlog

Ordered by expected win. Confidence is stated per item — several plausible-looking items have
already been measured to zero, so treat anything unmeasured with suspicion.

1. **Sub-ladder inside `GlassTabSelector`.** Mounting it costs ~8 points of jank and ~2–3 ms
   and *nobody knows why* — converting its Yoga-dirtying props changed nothing (§2.1). It adds
   ~48 views, four `TranslateText` labels and a pile of mappers. **The harness for this is
   built**: set `SUB_LADDER = 'tabsel'` in `PerfHarness.tsx` and run it — U0 empty overlay →
   +hit targets → +icons → +labels → +geometry. **Confidence: the cost is measured; the cause
   is not.**
2. **Modals each mount their own canvas** (`GlassTxDetailModal`, `LiquidGlassWalletModal`,
   `LiquidGlassAlertModal`, `CategoryPickerModal`). Each creates a TextureView *during* the
   open animation. Consider publishing into the backdrop canvas instead.
5. **R8 is on but not optimising.** `getDefaultProguardFile("proguard-android.txt")` carries
   `-dontoptimize`; the `-optimize` variant is where dex-size and class-loading wins come from.
   Re-verify the keep rules (§5) after switching.
6. **Per-ABI splits or an app bundle** if download size matters — that drops nothing and does
   not require two ABI lists to agree.
7. **Scope redux-persist** (blacklist `chart`, `input`) — a per-keystroke win.
8. **Lazy screen requires** — `NewWalletStack` imports all screens at module scope, so every
   screen module evaluates at boot.
9. **`ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS`** in Reanimated's static flags. Only pays off
   *after* item 1, since layout props aren't in the synchronous allowlist. Needs an NDK rebuild.
10. ~~**Memoise the sheet drag handlers.**~~ **Done for `GlassTabSelector`** (2026-08-01):
    both `makeSheetSnapHandlers` and the four `makeDragGesture()` calls are `useMemo`'d on
    `[folded, …]`, which is what they actually close over. `GlassBottomSheet` (`:85`) still
    rebuilds its two on every render — same fix, not yet applied.
11. **Delete the dead pre-Skia sheet.** `src/screens/Main.tsx` has zero importers and is the
    only importer of `src/components/BottomSheet.tsx`; `src/components/TransactionList.tsx`
    hangs off it too. All three still carry the old drag/snap logic with different ratios, so
    they read as live alternatives when they are not. They ship in the bundle.

---

## 7. Refuted — do not re-derive

Each of these was investigated and measured false on this device.

| Claim | Verdict |
|---|---|
| AOT compilation (`cmd package compile -m speed`) helps startup | 376 ms vs 392 ms — noise. RN startup is precompiled Hermes bytecode |
| GPU / fill rate is the bottleneck | 4 ms GPU vs 30 ms frame; GPU-ms/frame moved +0.6 ms while frame time moved +14 ms |
| `recorder.play()` / picture rebuild is the Skia cost | 0.21 ms for the backdrop canvas |
| The `ProgressiveEdgeBlur` 5× row instantiation dominates | ~4 ms, real but 4× smaller than the canvas hand-off |
| React commits / memo dep arrays cause the fold jank | worklet-driven and state-driven folds measured identical |
| Gesture objects rebuilt each render drop the native handler | `needsToReattach` returns false; it's a deferred config push |
| `StyleSheet.create` per render defeats Fabric's diff | payload is null, no native update; microseconds |
| `collapsable={false}` inventory / stacked full-screen backgrounds / non-opaque TextureViews | all GPU-side on a CPU-bound device |
| `detachPreviousScreen: false` keeps the Auth screen mounted all session | `Auth.tsx:138` is a `replace`; the route is gone ~320 ms after unlock |
| `opaque` → SurfaceView takes the backdrop off the main-thread present path | Mechanism confirmed (HWUI layers 2 → 1) but **7–13 points jankier**. The render is synchronous on main either way; you just add a SurfaceFlinger layer. See §1.3 |
| Converting `GlassTabButton`'s Yoga-dirtying props to `transform` | Correct change, **zero measured effect**. The `GlassTabSelector` mount cost is ~8 points and is *not* layout passes. See §2.1 |
| Shrinking the backdrop canvas / erase rect by 40% | ~3 ms only. Area is not the cost; canvas count is |
| The sync spinner's `withRepeat(-1)` is a standing whole-app cost | The ~2500-frame burst was seen in **one** window right after unlock. The spinner clears quickly in practice, so this is a transient at unlock, not a steady-state cost. Do not chase it |
