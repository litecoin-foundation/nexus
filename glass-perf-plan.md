# Glass performance plan — Main screen + bottom sheets

Deep audit of the Skia/liquid-glass stack (2026-07-29). Every finding below was
verified against the actual code by an adversarial second pass; claims that
didn't survive are listed in "Dead ends" so we don't chase them again.

## TL;DR — why it stutters even on a new phone

The screen is actually quiet at true idle. The cost shows up in two places:

1. **Every interaction frame is GPU-expensive.** Any sheet drag, list scroll,
   or card transition dirties one or two large canvases, and each ends in an
   **unclipped BackdropFilter**: Skia snapshots the whole layer, runs the
   Gaussian blur child over *every pixel of the layer*, then runs the SDF glass
   shader over every pixel — for a capsule that covers 5–10% of it.
   - `LiquidGlassBackdrop` — full screen, blur σ4, every drag/fold frame
   - `GlassTxCanvas` — ~64% of screen, blur σ1, every scroll/drag/card frame
   - `GlassTxDetailModal` — full screen at **σ14.9**, every frame of its
     open spring / dismiss drag, even though the content behind it is static
   - Plus: the wallet/alert/category modals use the legacy shader with **no
     cheap-exit** — 16× supersampling, ~80 SDF evals and up to 48 texture taps
     *per pixel* — paid exactly during their open animation
2. **The JS thread re-renders the screen every few seconds while "idle", and
   cold-mounts 1000-line cards on tap.** The 15s tx poll always dispatches a
   new array → full NewMain → re-shapes ~64–96 SkParagraphs; the 5s info poll
   re-renders the list + balance header (whole-slice subscriptions); a 3s
   `momentTime` setState loop ticks the top half forever; tapping send/receive
   cold-mounts a 1073-line card at t=155ms in the same tick as a second
   NewMain render, inside the fade animation.

Plus two real memory bugs (wallet/alert modals never dispose their full-screen
snapshots) and a snapshot-mirror subsystem that runs invisibly for every card
even though only the (departing) shop card needs it.

**Order of attack: measure (Phase 0) → GPU cuts (1) → idle churn (2) →
interaction stutter (3) → simplification (4).** Phase 1 alone should transform
drag/scroll frame times; Phase 2 kills the rhythmic hitches.

---

## Measured on device — Phase 0 results (2026-07-29)

Recorded on Loshan's iPhone Air (iOS 26.5.2), dev-signed Release build,
`xctrace` Time Profiler + GPU + Hitches + CA FPS, ~50s per scenario.
Raw traces + reports: session scratchpad `traces/` (re-recordable any time).

| Scenario | FPS avg / min | Hitches | GPU frag busy | Main thread | JS thread |
|---|---|---|---|---|---|
| idle (40s) | screen static | 0 | ~0% | **0.03%** of a core | 1.5% (poll ticks, JSON) |
| list scroll | 51 / **4** | 6 (71ms) | **45%** | 19% | **37%** (+GC 13%) |
| sheet drag | **42.7 / 29** | **232 (2.0s!)** | 24% | **32%** | 4% |
| cards open/close | 57 / **11** | 0 | 32% | **43%** | **27%** |
| tx modal | 58 / **17** | 0 | 28% | **35%** | 14% |

What the stacks say (per ~50s of interaction):

- **Card opens stutter because of `makeImageFromView`**: 2,158ms of
  `RNSkApplePlatformContext::takeScreenshotFromViewTag` on the main thread in
  the cards scenario (plus ~1,379ms of `vTransformTRCParametric` colorspace
  conversion from the same pipeline), and another 989ms in the modal scenario.
  This is the snapshot-mirror/capture system doing main-thread screenshots
  mid-interaction — the single biggest attributable stall. → items 3.2 / 4.1.
- **Reanimated ShadowTree `commitUpdates` is the #2 main-thread cost
  everywhere**: 4.9s (drag), 7.5s (cards), 6.7s (modal) in the
  Reanimated bucket — RN-side animated props committing through
  Fabric per frame (the animated Yoga height + fold morph + card fades).
  The drag scenario is the worst UX of all (42.7 fps, 232 hitches) and is
  main-thread-bound, not GPU-bound. → item 4.4 is CONFIRMED, no longer
  "profile first"; prefer transform/canvas-side animation over committed props.
- **Scroll is the GPU-heaviest scenario**: fragment shaders busy 45% of wall,
  per-frame GPU p50 7.9ms / p90 10.8ms — on ProMotion that alone halves the
  frame rate. → item 1.1 (MakeCrop) attacks exactly this.
- **Scroll also hammers the JS thread**: 37% of a core in React
  commits (Fabric `Task::execute` 2.5s + microtasks 1.3s), 731ms of RNSkia
  JS↔native prop conversion (the windowed row re-renders), and 1.75s of
  Hermes GC on the hades thread — GC weak-map scans grow with the WeakMap
  paragraph caches. → items 2.1 / 2.4 / 3.1.
- **CPU path rasterization during drags**: `skcpu::Draw::drawDevPath` +
  `aaa_fill_path` ≈ 1s over the drag trace — the BlurMask capsule shadows
  being software-rasterized per frame. → item 1.6 PROMOTED from optional.
- **Idle is clean** on the main thread (12ms/40s, screen not refreshing) —
  the glass architecture's idle claim holds. The JS thread's 604ms/40s of
  poll work (JSON quoting visible) is the only idle burn. → Phase 2 stays,
  but idle is not where the user-felt jank comes from.

**Revised attack order from the measurements:**
1. Captures off the interaction path (3.2 + the 4.1 gating) — biggest stall.
2. MakeCrop the three BackdropFilters (1.1) — GPU headroom in every scenario.
3. Stop animating Yoga height / committed props in the fold morph (4.4).
4. BlurMask shadow caching (1.6) + activity-spring timing (1.4).
5. JS churn: stable tx array, row-geometry memo split, card keep-alive
   (2.1 / 2.4 / 3.1) — biggest JS-thread wins for scroll + cards.
6. Everything else as planned (1.2, 1.3, 1.5, 3.3 leaks are still correct
   hygiene; modal σ14.9 pre-blur helps the modal's 28% GPU share).

---

## Re-trace after the under-glass program (2026-07-29, same device/protocol)

Raw traces + reports: session scratchpad `traces2/`. Same five scenarios,
same instrument set, recorded after G0–G4 landed. Baseline → new:

| Scenario | FPS avg / min | Hitches | GPU frag busy | Main thread | JS thread |
|---|---|---|---|---|---|
| cards | 57 / **11** → 60 / **53** | 0 → 0 | 32% → 34% | 43% → 45% | 27% → 38% |
| sheet drag | 42.7 / 29 → **50.6** / 29 | **232 (2.0s)** → **0** | 24% → 29% | 32% → 29% | 4% → 6% |
| tx modal | 58 / **17** → 56 / **24** | 0 → 0 | 28% → 32% | **35% → 26%** | **14% → 7%** |
| list scroll | 51 / 4 → 42 / 4 | 6 → 0 | 45% → 39% | 19% → 18% | 37% → 26% |
| idle | static → static after sync (see below) | 0 → 0 | ~0% | 0.03% → 7%* | 1.5% → 1.8% |

What changed:

- **The #1 stall is gone**: `takeScreenshotFromViewTag` no longer appears in
  the cards trace at all (was 2,158ms + 1,379ms of colorspace conversion).
  Card min FPS went **11 → 53** — transitions no longer visibly drop frames.
  JS thread is up (27→38%) partly because more card cycles fit in 50s once
  each cycle stopped stalling; per-cycle JS cost (cold card mounts, F7/3.1)
  is still the next cards win.
- **Drag hitches 232 → 0** (valid empty table, same instrument), avg
  42.7 → 50.6 fps, per-frame GPU p50 4.0 → 3.6ms. The hide/return
  choreography over live pixels is cheaper than the old capture+mirror path.
- **Modal improved without being touched**: main thread 35% → 26%, JS
  14% → 7%, min FPS 17 → 24 — the deleted capture machinery used to fire
  around modal opens. The modal's own capture (959ms, legitimate) and its
  σ14.9 blur remain; 1.2/1.5/F8 still apply.
- **Scroll is architecturally unchanged** (expected — F2/F5 not done):
  per-frame GPU p50 7.8/p90 10.6/p99 13.3ms ≈ identical to baseline.
  Baseline's better-looking avg FPS came from a 13.7s trace span — the
  baseline scroll session actually ended in a **Hermes OOM crash** (see
  below); the new run sustained 47.5s of flinging.
- ***Idle 60fps loop — investigated, NOT a regression**: the new idle trace
  ran 60fps for its first 29s then went dead quiet (identical to baseline).
  Culprit is the pre-existing sync spinner
  (`GlassTransactionList.tsx:169` — `withRepeat` rotate on a Fabric
  `Animated.Image`): scenario 1 started ~1 min after a fresh launch, so LND
  was still syncing; the "settled" control re-triggered it because
  unlocking re-foregrounds the app and restarts sync. While syncing it
  costs ~38ms/s of main-thread commit machinery and holds the display at
  60Hz. Optional improvement → G5 below. Post-sync idle is as clean as
  baseline; the glass architecture's idle claim still holds.
  Bonus find from the same investigation, already fixed: GlassReceive's
  shimmer effect lacked unmount cleanup — unmounting the receive card
  mid-load leaked three infinite UI-thread animations that kept the
  Reanimated display link alive (`cancelAnimation` cleanup added).

### Crash finding (promoted to top priority): recurring Hermes OOM

`nexus-2026-07-29-{152524,155233,182416,200608}.ips` (pulled to scratchpad
`crashes/`): four crashes in one day of normal use, all
`hermes::vm::GCBase::oom` / `hermesFatalErrorHandler` → SIGABRT — the JS
heap is exhausted. The 20:06 one killed the **baseline** scroll recording
13.7s in (GC was burning 12.8% of a core in that window); it predates the
under-glass program. Sustained fling-scroll is the reliable reproducer.
The Xcode log for these crashes names the real mechanism:

```
HermesGC: OOM: [RNBridgeless] reason = Max heap size was exceeded
(vm_allocate_category), numCollections = 5070,
heapSize = 25165824, allocated = 24906384, va = 25165824,
external = 3646703828
```

The JS heap itself is a healthy 24MB — but **3.65GB of *external* memory**
(native allocations advised to the GC: Skia host objects, Nitro wrappers,
ArrayBuffer backings) is charged against the heap budget on the main React
runtime. That collapses the effective heap to its floor, forces
back-to-back collections (5,070 — the 12.8%-of-a-core GC we measured in
the baseline scroll death spiral), and finally SIGABRTs. So the bug is
**retention of native-backed objects** (or advisories that never get
released), not allocation churn per se — churn (F5) just pulls the
trigger faster.

**Recon verdict (5-agent sweep + local verification):**

- react-native-skia 2.10 advises external memory for every JSI wrapper
  (`cpp/jsi/NativeObject.h:337-339`), and **`JsiSkParagraph` advises a flat
  1MB each** (`JsiSkParagraph.h:297`) — 20–100× a real shaped paragraph.
  The shared tx-row cache (cap 400 rows × 4 paragraphs, canvas + tx modal)
  legitimately holds **~1.6GB of live advisories** once fling-scrolling
  fills it, plus churned generations that survive until an old-gen sweep.
  Dominant accumulator; matches the scroll reproducer.
- `getTransactions` had no in-flight guard and `subscribeTransactions`
  re-fetched the FULL list per streamed tx: during sync/rescan, dozens to
  hundreds of concurrent runs each pin a 1–15MB response ArrayBuffer
  (Hermes-external) for minutes (per-tx `getPriceOnDate` awaits) — the
  fast ramp that killed fresh launches.
- Hermes only releases an advisory when the owning JS object is FINALIZED
  (old-gen sweep). External above the old-gen target zeroes the young gen
  → a collection on ~every allocation (the 5,070-GC thrash); external
  above the 3GiB max fails every segment alloc → SIGABRT.
- Ruled out: Nitro HybridObject advisories (lnd bridge reports 0 bytes);
  redux stores plain data only.

**Fixes landed (2026-07-29):**

1. `patches/@shopify+react-native-skia+2.10.0.patch` — Paragraph +
   ParagraphBuilder advisories 1MB → 64KB (**needs a rebuild**; applied by
   the postinstall patch-package hook).
2. `GlassTxRows` eviction now `dispose()`s evicted paragraphs — prompt
   debit instead of waiting for finalization.
3. `getTransactions`: module-level in-flight guard; fingerprint
   (`txHash:confs:amount`) skip-dispatch when nothing changed;
   `previousOutpoints` copied to plain objects (a retained proto message
   pins its whole response buffer via subarray views); subscription
   refreshes debounced 2s so rescan bursts coalesce.
4. Snapshot `dispose()` in all three leaking modals — wallet, alert,
   category picker (3.3 complete; tx-detail modal was already correct).
5. Temporary `[memlog]` os_log line every 10s (`index.js` →
   `src/utils/memoryDiagnostics.ts`): `js_externalBytes`/heap/GC count via
   `HermesInternal.getInstrumentedStats()` — release-safe (console.* is
   babel-stripped, so it writes `nativeLoggingHook` directly). Remove
   after verification.

**VERIFIED on device (2026-07-29):** 2 minutes of hard fling-scroll +
card/modal use on the fixed build — no crash; `js_externalBytes`
oscillated 79–280MB and receded between bursts (was 3,646MB at crash).
Residual: GC frequency stays elevated during heavy scroll (~50/s cheap
young-gen collections) because external still exceeds the old-gen target
— F5 (fewer re-shapes) shrinks this further. Keep the `[memlog]` hook
through a few days of normal use as a soak test, then remove it with F10
cleanup.

### G5 — sync spinner off the Fabric commit path `[low / small, optional]`

`GlassTransactionList.tsx:169-181` — the sync spinner's `withRepeat` rotate
on an `Animated.Image` commits the shadow tree every frame for the whole
sync/rescan window (~38ms/s main thread + display pinned at 60Hz). Draw it
in Skia instead (a canvas already exists on this screen) or use an RN-core
native-driver rotation. Pre-existing behavior, not a G-program blocker.

---

## Phase 0 — Measure first (half a day, sets the baseline)

Three different threads can be the bottleneck and they need different tools.
GPU-bound is the prior given the BackdropFilter architecture — confirm before
touching JS.

**30-second triage:** shake device → Perf Monitor. JS FPS drops during the
stutter → JS-bound. UI FPS drops while JS stays 60 → main-thread or GPU
(overlay can't tell those apart — that's what xctrace is for).

**Primary tool: `xctrace` (already installed, no setup).** The iPhone Air is
already paired: UDID `00008150-000E10D90A87801C` (iOS 26.5.2). Phone must be
plugged in and unlocked. Needs a dev-signed Release build (what Xcode's
Profile action makes):

```sh
xcodebuild -workspace ios/Nexus.xcworkspace -scheme Nexus \
  -configuration Release -destination 'id=00008150-000E10D90A87801C' build
# install + launch via xcrun devicectl, then while reproducing the stutter:
xcrun xctrace record --template 'Metal System Trace' \
  --device 00008150-000E10D90A87801C --attach Nexus \
  --time-limit 20s --output /tmp/nexus-gpu.trace
# repeat with 'Time Profiler' and 'Animation Hitches'
xcrun xctrace export --input /tmp/nexus-gpu.trace --toc   # then --xpath per table
```

Reading it:
- **long GPU frame times** in Metal System Trace → shader/BackdropFilter cost → Phase 1
- **main-thread samples** in Reanimated worklet / Skia record+flush frames → UI-thread → Phases 1+4
- **Hermes JS thread samples** dominate → React churn → Phase 2

Record each scenario once: idle 30s on wallet, slow sheet drag, fast list
fling, tap receive, open tx detail modal. Keep the traces as the baseline.

**MCP / agent integration (your question):**

| Tool | What | Verdict |
|---|---|---|
| `xctrace` via Bash | CPU per thread + GPU + hitches on device | **Use this.** Claude records and parses the XML export directly — no MCP needed |
| Rozenite agent CLI (Callstack) | Headless JS-side traces (React commits, flamegraph) against the dev build; built for coding agents; pushed 2026-07 | **Set up if Phase 0 points at JS.** Metro plugin + `rozenite-agent` skill |
| XcodeBuildMCP (Sentry) | build/install/launch/logs on device — **no profiling tools** | Optional convenience for the deploy loop |
| apple-instruments-mcp | xctrace wrapper with parsed Time Profiler output | Optional; brand-new (~no adoption), keep Bash as fallback; no GPU parser |
| mobile-mcp | Scripted taps/swipes during a recording | Optional; go-ios on iOS 26 unverified — manual scrolling is fine |
| react-native-release-profiler | Hermes profile in a true Release build | Use to confirm any JS finding without dev-mode skew; verify RN 0.83 compat first |
| react-native-debugger-mcp | — | **Dead** (archived 3/2025). Simulator MCPs: wrong tool — sim GPU numbers aren't representative |

Also worth 20 lines: a `useFrameCallback` FPS counter behind `__DEV__` so
every fix below has a number on-device. RN DevTools (press `j`) works for
interactive JS traces; Skia 2.10 itself ships no perf HUD.

---

## Phase 1 — GPU cuts (small diffs, biggest wins)

### 1.1 Bound all three glass BackdropFilters with `ImageFilter.MakeCrop`  `[high / small]`
`GlassTxCanvas.tsx:453`, `LiquidGlassBackdrop.tsx:410`, `GlassTxDetailModal.tsx:706`

`Skia.ImageFilter.MakeCrop(rect, tileMode?, input?)` exists in 2.10. Wrap the
runtime-shader filter **and** its `MakeBlur` child in a crop = glass boxes
inflated by ~100px (refraction reach ≈ 80px + blur 3σ). Critically, this is
**not** the clip that broke on-device before: a crop lives *inside the filter
DAG in layer space* — the layer origin doesn't move, `fragCoord` and the
canvas-space box uniforms stay valid. Outside the crop the shader was a 1:1
passthrough recopy anyway, and srcOver compositing preserves the pixels
already drawn beneath — pixel-identical result.

Expected: blur pass area ~2–3.5× smaller (not 10× — the capsule rows span
most of the width), and the full-layer per-pixel SDF pass shrinks to the
capsule strip. On every scroll/drag/transition frame, on all three surfaces.

*Do it incrementally:* GlassTxCanvas first, verify on-device that the glass
renders identically (rim, refraction position, band edge), then the other two.

### 1.2 Tx-detail modal: pre-blur the backdrop once at capture  `[high / medium]`
`GlassTxDetailModal.tsx:371-398` — σ14.9 full-screen Gaussian re-runs every
frame of the 520ms open spring / dismiss drag / keyboard shift, blurring
content that is static during those animations.

At capture time render the composite (page snapshot **+ the rows base** — the
live rows are drawn over the snapshot on purpose) into an offscreen
`Skia.Surface`, blur once, `makeImageSnapshot()`, and feed the shader
`Skia.ImageFilter.MakeImage(preBlurred)` instead of the per-frame `MakeBlur`.
Re-blur when rowModels/window change (rare while open). Caveats signed off:
refraction inside the glass goes slightly stale between re-blurs (invisible
behind the 55% frost mix, but it is a behavior change), and an SkImage child
samples transparent outside its bounds where clamp used to extend — inflate
the source or pick a tile mode to avoid rim fringes at screen edges.
Combined with 1.1 the per-frame cost drops to a cropped SDF pass.

### 1.3 Port the cheap-exit into `liquidGlassShader`  `[medium / small]`
`Modals/liquidGlassShader.ts:100-112` — used by the wallet, alert, and
category-picker modals. ~10 mechanical lines: copy glassTabShader's prologue
(`dc > 1.5` → `image.eval` passthrough; `dc < -1.5` → single
`calculateLiquidGlass`; supersample only the ±1.5px rim). ~16× interior win,
lands exactly on the modal open animation.

**Do NOT port the consumers to `glassModalShader` instead** — it dropped
fresnel/specular/edge-shadow and has ~9× less refraction depth; the modals
would visibly turn from clear glass into milky frost. Keep their look, fix
their loop. Also hoist `RuntimeShaderBuilder` + blur child out of
`useDerivedValue` in all three consumers (the newer callers' pattern).

### 1.4 Kill the post-scroll glass tail  `[medium / small]`
`NewMain.tsx:284-294` — after every scroll ends, the `tabBarActivity` shrink
spring re-dirties the whole GlassTxCanvas pipeline for ~0.4–0.6s for a sub-dp
capsule change. Replace both springs with `withTiming(150-200ms)`. If more is
needed: cache and return the *same* filter object when quantized inputs are
unchanged (gate through an intermediate shared value written by
`useAnimatedReaction` — quantizing inside the filter mapper does nothing,
because returning a new filter object re-dirties the canvas regardless).

### 1.5 Tx-detail card: 9 stacked BlurViews → 3–4  `[medium / small]`
`GlassTxDetailModal.tsx:768` — nine live `UIVisualEffectView`s recomposite on
every content-scroll frame (and scroll frames don't even touch the Skia
canvas — the blur stack is the *entire* scroll cost). Reduce
`FADE_LAYER_COUNT` to 3–4 with retuned intensities. A Skia in-canvas frost is
impossible here (it can't sample the native ScrollView), and the layer count
exists to hide blur boundaries — retune, don't just delete.

### 1.6 Cache the capsule BlurMask shadows as images  `[medium / small — promoted by measurement]`
5 offscreen mask-blur rasterizations per drag frame
(`LiquidGlassBackdrop.tsx:179`, `GlassTxCanvas.tsx:423`). Measured: ~1s of
CPU path rasterization (`skcpu::Draw::drawDevPath`/`aaa_fill_path`) on the
main thread over a 50s drag session. Pre-render one blurred capsule to an
SkImage, draw translated/stretched.

---

## Phase 2 — Stop the idle render churn (JS thread)

### 2.1 Make the 15s tx poll referentially stable  `[high / medium]`
`reducers/transaction.ts:898` — `getTransactions` always dispatches a fresh
array; downstream that invalidates NewMain → row models → the WeakMap
paragraph cache (~64–96 SkParagraph re-shapes in one burst) → GlassBottomSheet
→ canvas reconciliation, every 15 seconds, forever. Compare the existing
fingerprint pattern (`txFingerprintSelector`, transaction.ts:1235 —
hash:timeStamp:amount) and **skip the dispatch when unchanged**; confs-only
changes still flow once per block. Also remove the mount-time
`dispatch(getTransactions())` in `GlassTransactionList.tsx:136` — the poll
covers it, and today it re-fires the whole cascade right as the
return-to-wallet fade plays.

### 2.2 Info poll: subscribe to fields, not the slice  `[medium / small]`
`GlassTransactionList.tsx:126`, `GlassAmountView.tsx:99` — both re-render
every 5s forever off `state.info!`. Select
`recoveryMode`/`recoveryFinished`/`syncedToChain` as primitives (or
shallowEqual), and make `getInfoAction` bail when the payload is unchanged so
no subscriber ticks at all.

### 2.3 Delete the 3s `momentTime` loop  `[medium / small]`
`GlassAmountView.tsx:131-137` — self-perpetuating setState every 3s. Replace
with one scheduled check (~11s after mount) + the peersLength-driven effect;
only setState when the boolean flips. Also memoize `balanceModel` (fresh
object literal every render defeats any child memo) and then
`React.memo(LiquidGlassBackdrop)`.

### 2.4 Rates poll: stop re-serializing row geometry  `[medium / small]`
`GlassTxRows.tsx:111-177` — for non-USD currencies every 15s rate tick creates
a new models/rowTops/rowBottoms triple; the tops/bottoms arrays get re-cloned
to the UI runtime in *both* consumers though their contents are identical.
Split the memo: `rowTops`/`rowBottoms` keyed on `[rows, cellHeight,
headerHeight]` only. Quantize `localFiatToUSD` with `toPrecision(5)` before it
enters deps (not `toFixed(4)` — breaks small-ratio currencies). Do **not**
key the paragraph cache on a tx fingerprint — `paragraphsFor` returns by index
and would serve stale fiat/currency text.

### 2.5 Chart scrub: dedupe before dispatch  `[medium / small first step]`
`Chart/Cursor.js:142` — `collectHovered` dispatches `updateCursorValue`
*before* the offsets-unchanged early-return, so redux is written for no-op
moves, and each write re-renders GlassAmountView + rebuilds the fitted balance
paragraph at event rate. First step: move the dispatch behind the dedup and
throttle it (~50–100ms). The full worklet rewrite is a later option — note
`collectHovered` closes over d3 scales, so a UI-thread version must copy plain
arrays and reimplement the linear-scale math, and two consumers need the value
live (the cursor's own fiat label and the balance readout).

---

## Phase 3 — Interaction stutter (card open/close)

### 3.1 Keep cards alive after first open  `[high / medium]`
`GlassBottomSheet.tsx:207-236` — RenderCard hard-unmounts/mounts card
subtrees; at t=155ms after a tab press the card cold-mounts (Send.tsx: 1073
lines, ~31 hooks) in the same tick as a NewMain re-render, inside the fade,
followed by the full Fabric view-tree commit. Fix: **lazy keep-alive** — mount
each card on first open, then hide with `react-freeze` / `display:'none'`
instead of unmounting. Corrections that make it work:
- All six branches share ONE `panGesture` instance and RNGH forbids one
  gesture on multiple mounted detectors → give each card its own gesture (or
  one wrapping detector).
- Keeping cards mounted persists card state (Send's address/amount survive
  close/reopen) — decide whether that's wanted or add an explicit reset.
- Don't eagerly mount all six at startup — that just moves the jank to
  first render.

### 3.2 Deduplicate sheet captures  `[medium / small]`
`GlassTxCanvas.tsx:263-313` — every interaction burst inside an open card
(via `contentActivity` settling) schedules TWO full-screen
`makeImageFromView` main-thread rasterizations (immediate + settled 600ms).
On revision-driven refreshes keep only one (the settled card is already
stable); keep the immediate capture only for card-to-card swaps where it
covers the 155ms swap window. Also gate `refreshSheetSnapshot` until the open
transition has finished (closes the 0.5–0.95s tap-after-scroll window where a
capture can land mid-open). Note: `makeImageFromView` in Skia 2.10 has no
pixelRatio option — captures stay full-res.

### 3.3 Fix the snapshot memory leaks  `[high / small — do immediately]`
`LiquidGlassWalletModal.tsx:89-151` and `LiquidGlassAlertModal.tsx:91-165`
never call `.dispose()` — every open orphans a ~12–15MB native SkImage until
some eventual GC; repeated opens step memory up and drive iOS memory pressure
(purged texture caches, GC pauses = stutter). Copy the dispose-in-updater +
unmount-ref pattern that `GlassTxDetailModal.tsx:175-321` already implements
in the same directory. Also: clear `sheetSnapshot` when returning home
(`GlassTxCanvas` keeps the last card's snapshot resident all wallet session,
provably never drawn once rows mount — clear ~150ms after `showTxList` flips,
guarded on `activeSheet === 0`).

---

## Phase 4 — Simplification (the "overly complicated" part)

### 4.1 Gate the band/mirror pipeline; delete it when shop moves  `[high / small now, big deletion later]`
`GlassTxCanvas.tsx:263` — the snapshot-mirror subsystem (captures, mirror
draw, frost band, always-on BackdropFilter) runs for every card even though
sheets 1/2/4/5 hide the tab bar and show none of it: settled captures 600ms
after every open, 2 more per interaction burst, and every redraw executes the
3-level ProgressiveEdgeBlur saveLayers *at opacity 0* (group opacity doesn't
cull layer passes) plus the full-canvas backdrop blur with the capsule
off-screen. Only the shop sheet needs the mirror — and the shop is leaving.

Now: gate on `!sheetHidesTabBar(activeSheet)` — skip captures, render no
bandSource/frost, unmount the BackdropFilter (deferred ~BAR_HIDE_MS so the
capsule finishes sliding out). Accepted visual change: during card-close the
band frosts the flat stand-in for ~150ms instead of a card mirror. Bonus: this
also fixes a real staleness artifact — the un-gated band currently paints a
snapshot copy *over* the live card's bottom band between captures.

When the shop moves to its own screen: delete outright `sheetSnapshot`,
`captureGeneration`, `refreshSheetSnapshot`, `mirrorOpacity`,
`sheetSnapshotY`, and the captureRef plumbing through LiquidGlassTabBar,
GlassBottomSheet and NewMain, plus the shop branches (`SHOP_CARD_EXTRA_HEIGHT`,
`sheetHidesTabBar`'s sheet-3 exemption, drawer wrapper + `useDrawerStatus`).

### 4.2 Delete the dead legacy screen  `[clarity + bundle size only]`
`screens/Main.tsx` (no navigator routes to it) and `Cards/Receive.tsx` (only
imported by dead Main). Keep `TransactionList.tsx` (SearchTransaction uses
it). Optionally rename `glassTabLayout.ts` → `glassSheetButtonLayout.ts` —
it's top-sheet-button geometry, not a duplicate of `glassTabBarLayout.ts`;
the names are the confusion, not the code.

### 4.3 ProgressiveEdgeBlur: cull at zero opacity, consider 2 levels  `[medium / small]`
Render `null` instead of a `frostOpacity=0` group (layers execute regardless
of opacity). The levels are already clipped to sub-strips (~7–9% of screen
each — cheaper than it looks), so 3→2 levels is a judgment call after
measuring; if mirror mode survives Phase 4.1, pre-blur the snapshot per level
sigma at capture instead of live-blurring.

### 4.4 Top-half fold morph: stop animating Yoga height  `[high — confirmed by measurement]`
`useNewMainAnims.ts:207-226` animates `height` (a layout prop → per-frame
ShadowTree commit + Yoga pass) while `LiquidGlassBackdrop` already computes
the same edge per frame for its gradient. Fix is NOT trivial: the container's
animated height + overflow clip is load-bearing (the gradient clamps below
the fold — fixing the height would paint it to screen bottom). Correct form:
fix the container height and clip *all* top-half draws (gradient, chart,
date picker, balance) inside one animated rounded-rect clip in the canvas,
keeping the shadow/BackdropFilter/accent stack OUTSIDE the clip. The
border-radius props are paint-time on Fabric, not layout — they're free;
only the height matters. Measured: the drag scenario spends ~4.9s/50s of
main thread in Reanimated `commitUpdates`/ShadowTree work and is the worst
scenario for frame pacing (42.7 fps, 232 hitches) — this fix plus 1.6 and
1.1 are the drag remedies.

### 4.5 Shader end-state: two files
After 1.3, converge on **glassTabShader** (multi-box, cheap-exit) +
**one single-box panel shader**. liquidGlassShader keeps its richer optics but
gains the cheap exit; glassModalShader stays the frosted variant. Merging
further trades away the tab shader's specialized SDF for nothing — don't.

---

## Dead ends (checked and refuted — don't redo these)

- **Clipping the BackdropFilters** — device-verified broken (layer origin
  shifts, glass pins to the wrong place; documented in GlassTxCanvas:448 and
  the modal). `MakeCrop` inside the filter DAG is the correct tool.
- **"Chart dash intro restarts on every price tick"** — false. The intro's
  deps are d3 path *strings* (value-compared); memoized selectors upstream.
  It replays only when the chart genuinely changed.
- **Deleting the root `onTouchMove` handler for a win** — RN's responder
  dispatches JS touch events regardless, and RNGH/scroll activation cancels
  the stream mid-gesture; the handler is microseconds. At most, throttle
  `markTabBarActivity` like the scroll path already does (200ms).
- **Porting wallet/alert modals to glassModalShader** — visibly changes the
  material (loses fresnel/specular/depth). Fix the loop, keep the look.
- **Keying the paragraph cache on a tx fingerprint** — serves stale
  fiat/currency text (cache returns by row index without comparing content).

---

## Execution order — F1…F10, with a regression test after each

Workflow: one fix lands → tsc/lint/build verified → **STOP → you test on
device using the checklist → you report pass/fail** → next fix. Baseline
traces exist (2026-07-29); re-profiling checkpoints after F2, F4, F7 and at
the end to diff against them.

| Fix | Plan items | Targets | Risk |
|---|---|---|---|
| F1 | 4.1 gating + 3.2 | card-open stall (the 2.2s of screenshots) | medium |
| F2 | 1.1 | GPU in every scenario (scroll worst) | medium |
| F3 | 1.6 + 1.4 | drag hitches + post-scroll tail | low |
| F4 | 4.4 | drag hitches (Reanimated commits) | **high** |
| F5 | 2.1 + 2.4 | scroll JS thread + GC | medium |
| F6 | 2.2 + 2.3 | idle/periodic re-renders | low |
| F7 | 3.1 | card-open JS cost after first open | medium |
| F8 | 1.2 + 1.5 | tx-modal GPU + scroll blur stack | medium |
| F9 | 1.3 + 3.3 | wallet/alert modal open hitch + memory leaks | low |
| F10 | 4.2 + 4.3 (+2.5 optional) | complexity/bundle cleanup | low |

### F1 — RETIRED, superseded by the under-glass program (G0–G3) below
Direction change (2026-07-30): the bottom bar must stay visible on
send/buy/sell/receive and its glass must refract LIVE card content, like the
wallet. A BackdropFilter can only sample its own canvas, so card pixels
within the glass's reach must be drawn inside GlassTxCanvas — snapshots can
never be "live" and the hide choreography no longer has a reason to exist.

#### G0 — Platform: always-on bar, delete hide + capture systems
Bar never hides; cards get `getTabBarClearance` again; delete
`sheetHidesTabBar`/`getTabBarHideDistance`, `hiddenForCard`/`hideProgress`
and the bar's hide styles, the entire capture/mirror system
(`makeImageFromView`, `sheetSnapshot`, `mirrorOpacity`, captureRef plumbing),
and the flat stand-in. The band over an open card is a live flat strip of
card background (frost skipped there — blurred flat is flat). Kills the
measured 2.2s screenshot stall outright.
**Test:** open each card from the middle selector — the bottom bar stays put
with its glass capsule; card content clears the bar (nothing important
hidden beneath it); wallet↔card swaps crossfade under a stationary bar;
collapse-drag from a card: band area shows a flat strip until the rows fade
back in (expected until G1 puts real card pixels there); shop tab unchanged
except its band is now flat (accepted, shop is leaving). Regressions:
black band, capsule glass artifacts, card CTAs hidden behind the bar.

#### G1 — Receive under glass
GlassReceive's Skia element tree moves into the shared canvas, positioned by
the sheet translation (the rows mechanism), so its content sits under and is
refracted by the glass live — including during sheet drags. Invisible
pressables stay in the card.
**Test:** receive card visually identical but its lower content now runs
under the bar and refracts through the capsule; drag the sheet — content
slides under the glass and frosts into the band live; QR/address/pills all
still tappable; mweb toggle reflows correctly.

#### G2 — Send under glass
Send's bottom section (BlueButton CTA row) drawn via the canvas underlay;
inputs stay native above the clearance line.
**Test:** send flow end-to-end (address, amount, fee, send button presses,
keyboard behavior — keyboard slides over the bar naturally).

#### G3 — Buy + Sell under glass
Same port as G2 for both cards' bottom button rows.
**Test:** buy and sell flows end-to-end, Moonpay hand-offs unchanged.

F2–F10 continue unchanged after G0 (they don't depend on the hide system).

### F2 — MakeCrop the three glass BackdropFilters (1.1) — IMPLEMENTED 2026-07-29

Crops live in the two shared factories: `makeGlassTabFilter` (pad 120,
union of boxes — covers GlassTxCanvas + LiquidGlassBackdrop) and
`makeGlassModalFilter` (pad 160). The skia patch also drops
JsiSkImageFilter's flat 1MB GC advisory to 64KB (filters rebuild per
animated frame on the UI runtime). Visual check passed on device; memory
stayed bounded. GPU quantification still pending — the post-F2 traces
were mis-captured (scroll recorded idle, drag partial) — measure in the
next re-trace session against baseline scroll fragment 39% / p50 7.8ms.
**Test (pure visual-identity check):** wallet tab — scroll slow + fling and
stare at the bottom glass capsule: refraction, rim, frost identical; sheet
drag — watch the four middle-selector buttons' glass through the whole
travel; tx detail modal — open, drag it around, check the glass card.
Regressions to flag: a hard rectangular edge around any glass (crop too
tight), glass content offset or pinned to the wrong place (the known clip
failure mode), rim artifacts at screen edges. Feel: scroll FPS should be
visibly better. *(I'll re-trace the scroll scenario after this one.)*

### F3 — Drag remedies A: cached BlurMask shadows + activity timing (1.6 + 1.4)
**Test:** drag the sheet slowly and quickly — capsule/button shadows look the
same softness and track exactly (no stretching, doubling, or misalignment at
rest or mid-morph); scroll then stop — the capsule settles quickly with no
pop and nothing keeps shimmering afterwards.

### F4 — Fold morph off Yoga (4.4) — riskiest change
Fixed container height; the rounded bottom edge and clipping of
gradient/chart/balance/date picker move into the backdrop canvas.
**Test:** very slow full drags up and down, watching the top card's bottom
edge: it must round and track your finger exactly as today, nothing may
paint below it (especially the blue gradient reaching down to the sheet),
the fold-state gap between card and sheet stays, and folded/unfolded rest
states must look pixel-identical to before. Also check the middle-selector
buttons still sit/behave identically. Feel: dragging should be the biggest
single improvement of the whole plan. *(Re-trace drag after this.)*

### F5 — Scroll JS churn: stable tx array + row-geometry memo (2.1 + 2.4)
**Test (correctness, mostly):** tx list renders identically; leave the app
open a few minutes — rows still update (a pending tx gains confirmations);
if you use a non-USD currency, fiat values still track the price; return to
the wallet tab from a card — list appears correctly with the fade. Feel:
long flings lose their periodic micro-hitch. Regressions: a list that never
updates, wrong/stale fiat, rows flashing every 15s (that's the old bug —
it should be gone).

### F6 — Idle churn: info-slice selectors + momentTime loop (2.2 + 2.3)
**Test:** balance header and sync banner behave normally; airplane mode for
~20s → the no-peers warning appears; back on → it clears and balance/fiat
resume updating; chart scrub readout still live.

### F7 — Card keep-alive (3.1)
Cards mount on first open, then hide instead of unmounting. Card state
resets on close (preserving today's behavior).
**Test:** every card: first open feels like today, close/reopen is
instant; type an address in Send, close, reopen → field is empty (flag if
you'd rather it persist); drag-to-collapse works from inside every card;
cycle all cards many times — no slowdown creep. *(Re-trace cards after.)*

### F8 — Tx modal: pre-blurred backdrop + fewer fade layers (1.2 + 1.5)
**Test:** open the modal on several txs: glass identical; drag-dismiss
halfway and release — glass tracks; scroll the content — the bottom fade
must still look like a smooth ramp (a subtle boundary shift is acceptable,
an obvious hard line is a regression); edit the label so the keyboard
pushes the card — glass follows, no fringes at the screen edges.

### F9 — Wallet/alert modal glass: cheap-exit + dispose (1.3 + 3.3)
**Test:** wallet-switcher modal: open/close ~10× fast — looks identical,
no crash (a crash here means a double-dispose — report immediately);
same for any alert modal and the shop category picker. Feel: open
animation hitch should be gone.

### F10 — Cleanup: dead code, frost cull, renames (4.2 + 4.3, 2.5 optional)
**Test:** full smoke pass — cold start, wallet, all cards, shop,
search-transactions screen (it uses the old list component that stays),
all modals. Nothing should look or behave differently.

Then a final re-trace of all five scenarios against the 2026-07-29 baseline.
Fix comments in the usual style: lowercase terse labels.
