# Slow-device performance plan — app-wide (mid-range Android)

Target device: **Samsung Galaxy A33 5G (SM-A336B)**, Android 14, Exynos 1280, Mali-G68 MP4,
1080×2400 **@ 90 Hz** (11.1 ms frame budget, not 16.7 ms), thermally throttled.
Companion document: `glass-perf-plan.md` covers the Skia/glass rendering work on the Main
screen. **This plan covers everything else** — the app is slow on this phone away from the
glass screens too, and the causes below are independent of Skia.

Status: written 2026-07-31. Nothing here is implemented yet.

---

## TL;DR — why the whole app is slow on this phone

Three unrelated layers each impose a floor, and none of them is the renderer.

1. **Every Redux action rewrites the entire persisted store, encrypted, on the JS thread.**
   `persistConfig` is `{key:'root', storage, timeout:0}` — no `throttle`, no `whitelist`.
   All 21 slices sit in one key. redux-persist stringifies the changed slice, then
   stringifies the *map of already-serialised strings* again, then hands the result to
   `storage.set()` — a **synchronous** Nitro/JSI call into MMKV with an `encryptionKey` set,
   so software AES plus the mmap write run inline on the JS thread. Volatile slices are in
   there: `chart` (dispatched **per touch-move**) and `input` (**per keystroke**), plus the
   full transaction list and six price-history arrays. Four never-stopping pollers dispatch
   slice-replacing actions continuously, and the poll reducers rebuild their slice object
   unconditionally — so a tick where *nothing changed* still costs a full encrypted write.

2. **The Java/Kotlin layer ships unshrunk, and nothing on the RN hot path is AOT-compiled.**
   R8 has never run (`android/app/build/outputs/mapping/` does not exist): 54,308 classes /
   74 MB of DEX across 6 files, ~19,600 of them Jetpack Compose dragged in by the Flexa SDK.
   The baseline profile contains **zero** `com/facebook/react` and **zero** app methods, so
   Fabric mounting, ViewManager instantiation, `Readable*Map` marshalling and
   `ReactChoreographer` dispatch all run interpreted-then-JIT.

3. **Navigation does avoidable work on every single focus.** The Main screen's header
   deliberately unmounts and remounts itself 50 ms after every focus (a workaround for a
   `headerTransparent` bug), and that subtree contains a Skia Canvas, an expo-blur BlurView
   and a hidden measuring `<Text onLayout>` that `setState`s. A second, duplicate
   `LiquidGlassWalletButton` (with its own Canvas) is built as a static `headerTitle` and
   immediately overridden. Separately, all 52 screens evaluate at bundle load because
   `inlineRequires` cannot defer default imports.

**Honest expectation.** Item 1 is the largest *runtime* win and the cheapest. Item 2 buys
install size, page-cache footprint and install-time dex2oat — it is **not** a fix for JS-thread
jank and **not** a fix for the navigation stutter; do not sequence anything behind it. Item 3
is what the user experiences as "changing screens stutters".

### Scope and non-goals

- **Out of scope: the ~1000 ms splash delay in `App.tsx:275`.** It is intentional. Not touched.
- **Out of scope: the Skia/glass rendering work.** See `glass-perf-plan.md`.
- **Pollers stay.** They are the data path from lndltc to the UI. This plan makes their ticks
  nearly free; it does not delete them or degrade freshness.
- **`TranslateText` keeps its i18n role and its exact public API.** All 448 call sites keep
  working unchanged. Only its internals change.

### How this was derived, and how much to trust it

Two multi-agent passes: a 7-dimension audit (62 findings raised, 46 survived adversarial
verification, 13 refuted) and a 5-area design pass, each design reviewed by an independent
critic. **Every critic returned "needs-work"** and the corrections are folded in below —
several were serious, including one proposed test procedure that could have destroyed a
user's funds. Load-bearing claims were then re-verified by hand.

⚠️ **All of it is static analysis. The device was not connected.** No measurement exists for
any payoff claimed here. Impact *ordering* is reasoned, not measured. Phase 0 exists to fix
that, and several items below are explicitly gated on it.

---

---

## Implementation status (2026-07-31)

Each change is on its own branch in its own worktree under `.claude/worktrees/`, based on
`glass` HEAD `43fa518`. **Nothing is merged, nothing is pushed, and none of it has run on a
device.** Every branch is independently reviewable and independently revertable.

| Branch | Items | Commits | Review |
|---|---|---|---|
| `perf/stable-poll-reducers` | A1 — **PARKED, see below** | `perf: stop poll reducers rebuilding unchanged state` | 4 agents; 5 findings applied |
| `perf/navigation-header` | A6 + timer leak | `perf: drop throwaway main header content`, `fix: restore main header if blur interrupts the header flip` | 2 agents; 1 finding applied |
| `perf/persist-instrumentation` | A0b | `chore: count redux-persist writes` | — (11 lines) |
| `fix/poller-survivability` | A15 | `fix: keep pollers alive after a failed tick` | 1 agent |
| `perf/chart-cursor-dedupe` | A2 | `perf: dedupe chart cursor dispatches` | 1 agent |

Repo-wide baseline is **63 TypeScript errors and 12 ESLint errors**; every branch above holds
at those numbers. Prettier clean throughout.

**A1 (`mergeStable`) is parked on its branch, deliberately.** Measurement showed it targets the
*idle* write rate, which came in at 0–3 writes/10 s — already near zero. The damage is in chart
scrub (137) and typing (40), and A1 touches neither. It remains the highest-blast-radius change
in the plan (update semantics across 7 slices) for the smallest measured win, so it stays
unmerged until there is a reason to want it. The branch is pushed and reviewed; nothing is lost.

Follow-ups the reviews surfaced, none blocking:

- `updateCursorValueAction` could use `mergeStable` (reducer-level) instead of A2's component-level
  ref, which would also cover the unguarded twin at `src/components/Chart/Cursor.js:142`. Left
  component-level because the two live on independent branches, and the component guard is
  strictly cheaper — it skips the dispatch entirely rather than short-circuiting inside it.
- `stopAllPollers()` and `getActivePollerCount()` in `src/utils/poll.js` still have **zero call
  sites**. `stopAllPollers` most likely belongs in `stopLnd` (`src/reducers/lightning.ts`), which
  today resets `_pollersStarted = false` without cancelling the in-flight loops — a real
  duplicate-poller leak on rescan. Not done here: it changes lnd teardown behaviour and wants
  supervision.
- `getInfo`/`getPeers` read `getState().lightning` *before* their internal try/catch, so that one
  line is the realistic path that reaches A15's new catch.

### Deliberately NOT done, and why

- **A5 (delete the header flip).** The `headerShown` false→true flip works around a
  header-disappearing bug when returning from `headerTransparent: true` screens (~20 of them,
  and `NewMain` sets it too). Best hypothesis: `CardStack`'s `scene.__memo` doesn't invalidate
  on imperative `setOptions`, and toggling `headerShown` forces it. **That is unverified** —
  deleting the flip needs a device repro first. What landed instead is the cheap half: the
  duplicate header content is gone, and the flip can no longer strand the header hidden.
- **A3 (persistence scope + migration).** The single change in this plan that can permanently
  destroy wallets, settings and alerts if the migration is wrong. Needs supervision.
- **A12 (R8).** Cannot be validated without a build + the full device smoke matrix (A13).
- **A9 (lazy screens).** Mechanical and tsc-verifiable, but a mistake is a white screen on some
  route, and the payoff is cold-start only — which A0a may reframe entirely. Wants a device.

### Branch status (2026-07-31, end of session)

- **Uncommitted in `glass`** (awaiting review): the chart cursor rewrite
  (`GlassChart.js` + new `glassChartCursor.ts`) and the Skia advisory hunks in `patches/`.
  Suggested messages: `fix: correct inflated Skia memory advisories` and
  `perf: scrub chart cursor on the UI thread`.
- **`perf/chart-cursor-dedupe` — DELETED** (local + remote). The rewrite removed the function
  it was deduping.
- **`perf/skia-memory-advisories` — redundant**, its contents are in the working tree.
- **`perf/persist-scope`** (local only): blacklists `chart`/`input` from redux-persist. Six
  lines, no migration, doesn't touch stored data. Its chart benefit is now redundant, but the
  **per-keystroke** win stands — every numpad keypress currently re-serialises and AES-encrypts
  the whole ~307 KB store on the JS thread.
- Pushed and unmerged: `fix/poller-survivability` (safest — 7 lines, pure robustness),
  `perf/navigation-header` (header already verified on device),
  `perf/persist-instrumentation` (only if you keep measuring),
  `perf/stable-poll-reducers` (**stay parked** — biggest blast radius, 6→4 writes/10 s).

### Honest note on perceptibility

Of everything built this session, only two things were felt: the chart crash fix and the cursor
rewrite. The four earlier branches were infrastructure, robustness and a one-time cold-start
cost — none was ever going to be noticeable, and it is worth judging them on correctness rather
than on feel.

### Suggested order when you're back

1. Run **A0a** (the AOT experiment) — five minutes, no build, and it may reorder everything.
2. Build `perf/stable-poll-reducers` with the A0b logger wired up; capture the three baselines.
3. Eyeball `perf/navigation-header`: the header must look identical at rest, and the first
   frame after Main mounts now shows an empty title slot instead of a dummy "Wallet Title"
   button.

---

## ✅ P0 RESOLVED — chart scrub crash + ghosting (2026-07-31)

Two separate faults, both fixed and confirmed on device.

**Fault 1 — the crash. Root cause: a fabricated memory advisory, not a real leak.**
`JsiRecorder::getMemoryPressure()` returns a hardcoded 5 MiB, justified in-source by
`// This has no basis in reality but since these are private long-lived objects...`.
They are not long-lived: `Container.native.ts` mints a fresh `Recorder` on every `redraw()`,
and `redraw()` fires **twice** per React commit (`HostConfig.resetAfterCommit` plus the
unconditional call in `Reconciler.ts`), across **two** canvases that both subscribed to the
cursor slice. That is ~21 MB of phantom advisory per commit at ~90 commits/s ≈ the measured
941 MB/s. Hermes was killing the process for exceeding a budget it was never near — the JS heap
was 8 MB while the phantom total hit 4.5 GB.

Fixed by correcting four fabricated constants to 64 KB in
`patches/@shopify+react-native-skia+2.10.0.patch` (hunks 4-7): `JsiRecorder` (5 MiB),
`JsiSkParagraphBuilderFactory` (1 MiB, minted on *every* `Skia.ParagraphBuilder` property
access), `JsiSkShader` (1 MiB), `JsiSkPictureRecorder` (1 MiB). `JsiSkiaContext` is left at
10 MiB — it genuinely is one long-lived object per canvas. **Note the first three existing
hunks (paragraph advisories, 64 KB) never helped, because paragraphs were ~2% of the problem.**

Both are worth reporting upstream, along with a related library bug the investigation found:
`cloneCustom` in react-native-worklets (`src/memory/serializable.native.ts`) is the only clone
function that never populates `serializableMappingCache`, so Skia objects are re-boxed — and
re-charged — on every single serialization.

**Fault 2 — the ghosting.** With the crash gone, sustained dragging still accumulated ~1s of
cursor lag. Cause: every touch-move went JS thread → Redux dispatch → React re-render of two
canvases → full Skia re-record → Reanimated mapper restart, ~90×/s, which cannot drain at that
rate. Fixed by moving the cursor entirely to the UI thread (`src/components/glassChartCursor.ts`
+ the `GlassChart.js` rewrite): a worklet `Gesture.Pan`/`Gesture.LongPress` pair, a lookup table
built once per data change and indexed per whole dp (exact, because `collectHovered` already
quantised with `Math.round`), and every cursor-driven Skia prop bound to a shared value. A drag
now causes **zero** React renders. Confirmed smooth on device.

**Known remaining gap:** the big balance/date readout still updates via Redux, throttled to
~12 Hz. Converting it needs the balance Paragraph moved to shared-value Skia text, and the
review established that `<Group opacity>` has **no effect on `<Paragraph>`** (opacity is folded
into the paint; `ParagraphCmd` never reads it), so the obvious implementation renders both
readouts on top of each other. Real alternatives: `<Group layer={<Paint opacity/>}>` (a
full-width saveLayer per frame), or translating the resting paragraph off-canvas with a
shared-value transform (CTM *is* honoured by ParagraphCmd). Scoped, not small.

### Original P0 write-up, kept for the mechanism detail

Reproducible on the A33, every time. Instrumented build, `[memlog]` sampling every 2s:

| Interaction | external memory | GC rate | Outcome |
|---|---|---|---|
| Idle | 29 MB, flat | — | fine |
| TX list fling-scroll, 35s | 65–120 MB, oscillating, reclaimed each sample | ~6.6/s | **no crash** |
| **Chart scrub** | **62 MB → 1,945 MB in ~2s** | **~394/s** | **SIGSEGV** |

```
HermesGC: OOM: reason = Max heap size was exceeded
numCollections = 1896, heapSize = 8388608, allocated = 7361480, external = 4475038888
F libc : Fatal signal 11 (SIGSEGV) ... Process com.litecoin.nexus has died
```

**This outranks every performance item in this plan.** A wallet that dies when the user drags
the price chart is a correctness bug, not a slowness bug.

What is established:
- **Chart-specific.** The tx list — the original OOM reproducer, fixed earlier — is now bounded
  and healthy. That fix works; this is a different path.
- **Not the advisory patch.** Verified live in the crashing build: `JsiSkParagraph`,
  `JsiSkParagraphBuilder` and `JsiSkImageFilter` all at `64 * 1024`.
- **Not one big allocation per frame.** The only `Skia.Surface.Make` / `makeImageSnapshot` /
  `makeImageFromView` sites in `src/` are the module-cached capsule shadow and four modal
  captures, none of which run during a scrub. `GlassChart`'s paths are `useMemo`'d on the data.
- **Scale implies ~15,000 objects/sec** (941 MB/s ÷ 64 KB) — i.e. thousands of short-lived Skia
  objects per second whose advisories are only debited on finalization, outrunning the old-gen
  sweep. The heap itself stays at 8–24 MB throughout; only `external` explodes.

Next diagnostic step (not yet done): sample at 250 ms, scrub for ~1s then STOP, and see whether
`external` recovers. If it does, it is transient allocation outrunning GC (fix: stop allocating
per-frame). If it does not, it is a true leak (fix: explicit dispose).

## 🔐 Security finding — surfaced by this work, not a performance item

**The BIP39 mnemonic is in the persisted Redux blob.** `onboarding.seed` and
`onboarding.generatedSeed` (`src/reducers/onboarding.ts:23-24, 39-40`) are persisted, read by
`Settings/Seed.tsx:25`, `RootKey.tsx:55`, `ExportElectrum.tsx:55`, `Auth/Forgot.tsx:31`. The
same seed is *already* durable in the keychain (`SEED_KEY`, read at
`src/reducers/lightning.ts:346`), so the Redux copy is a duplicate of the app's most sensitive
secret — protected only by the MMKV `encryptionKey` generated at `src/store/mmkv.ts:7` as
`Crypto.randomBytes(16).toString()`.

Note that `.toString()` on a Buffer with no encoding argument yields **UTF-8**, so
non-printable bytes collapse to U+FFFD — the effective key entropy is well under the nominal
128 bits. This wants an independent decision from the perf work. The mechanical fix is the
same `createTransform` mechanism used in A3: strip `seed`/`generatedSeed` inbound, hydrate
from the keychain on demand.

---

## Phase 0 — Measure first (nothing here depends on a rebuild)

Do this the moment the A33 is plugged in. It costs minutes and it decides whether the Phase 4
and Phase 5 items are worth their risk.

```bash
PKG=com.litecoin.nexus
adb shell dumpsys gfxinfo $PKG reset
# ... fling-scroll the tx list ~10s, then navigate Main -> Settings -> back ...
adb shell dumpsys gfxinfo $PKG                 # janky %, 50/90/95/99th, causal buckets
adb shell dumpsys gfxinfo $PKG framestats      # per-frame ns per stage
adb shell dumpsys SurfaceFlinger --timestats   # ground-truth present cadence
adb shell dumpsys display | grep -i refresh    # confirm 60 vs 90 Hz budget
adb shell dumpsys thermalservice | head -40    # before/after a long session
# Samsung exposes GPU load without root:
adb shell "while true; do cat /sys/kernel/gpu/gpu_busy; sleep 0.1; done"
```

Decision rule: **GPU busy ≈99% while frames miss → fragment-bound → `glass-perf-plan.md`.
GPU busy ≈40% while frames miss → JS/main-thread-bound → this plan.**

### A0a — the AOT experiment: RUN, AND **REFUTED** (2026-08-01)

**Result: forcing full AOT compilation makes no measurable difference. A14 (baseline profile)
drops well down the priority list.** Measured on the A33 with `[status=speed] [reason=cmdline]`
verified applied via `dumpsys package`:

| Metric | `verify` (default) | `speed` (full AOT) |
|---|---|---|
| Cold start to first frame (`am start -W`, median of 5) | **376 ms** | **392 ms** |
| First frame → first Skia surface mounted (RN tree up) | **0.82–0.88 s** | **0.81–0.86 s** |

Why it came out flat, in hindsight: React Native startup is dominated by **Hermes evaluating the
JS bundle**, and that bundle is *already* AOT-compiled to Hermes bytecode with `-O` at build
time. ART's compilation filter governs the Java/Kotlin layer, which simply isn't where this
app's startup time goes. The "everything is slow because nothing is AOT-compiled" theory was
wrong.

**Consequence:** the remaining suspects are the ones on the JS thread and in the view/GPU layer
— Phase 1 (persist writes), Phase 2 (navigation), and the Skia/TextureView work in
`glass-perf-plan.md`. Do not sequence anything behind A14.

### Measured device facts (2026-08-01)

- **Display runs at 90 Hz** (`activeMode=90.00 Hz`) → the frame budget is **11.1 ms**, not 16.7.
  A single ~10–25 ms persist write therefore drops 1–2+ frames, not part of one.
- 1080×2400 at density 450 → **DPR 2.8125**, so a full-screen Skia canvas is ~2.6M fragments.
- `/sys/kernel/gpu/gpu_busy` **is readable without root** (reads `0%` at idle, max clock
  897 MHz) — this is the fill-rate proxy for the GPU-bound vs CPU-bound decision.
- Thermal status 0 (cool) at rest, so throttling is not a resting-state factor.

### A0b results — MEASURED ON DEVICE (2026-07-31)

Integration build on the A33 with the persist-write counter live. **The blob is 307 KB per
write**, dead consistent across every sample (4301/14, 2151/7, 1229/4 all = 307) — so the
earlier ~400 KB synthetic estimate was the right order, and this is now measured.

| State | writes / 10 s | serialized + AES'd per 10 s |
|---|---|---|
| Idle, without `mergeStable` | ~6 | ~1.8 MB |
| Idle, with `mergeStable` (A1) | ~4 | ~1.2 MB |
| **Startup / unlock burst** | **~100 (one-off)** | **~30 MB** |
| Typing an amount | **34–42** | **~12 MB** |
| Chart scrub | **137** | **42 MB** |
| Fling-scrolling the tx list | 4–6 | ~1.5 MB |

At ~10–25 ms per write, a chart scrub spends roughly **1.4–3.4 s of every 10 s with the JS
thread blocked**, against an 11.1 ms frame budget. Note the chart figure is *with* A2's dedupe
already applied — those 137 are the cursor genuinely reaching 137 distinct data points, so
dedupe cannot help further. Only removing `chart` from persistence (or throttling) fixes it.

### Scroll is a SEPARATE fault, and it is CPU-bound not GPU-bound

`dumpsys gfxinfo` over 1441 frames of hard fling-scrolling, plus direct `gpu_busy` sampling:

| Signal | Value |
|---|---|
| Frame time 50th / 90th / 95th / 99th | **30 / 46 / 53 / 65 ms** (budget 11.1 ms) |
| GPU time 50th / 99th | **4 ms / 12 ms** |
| `gpu_busy` median / max | 68% / 93% — loaded, **never pinned** |
| Janky frames | 35% (92% legacy) |
| Slow UI thread | **501** of 1441 |
| Missed Vsync / High input latency | 260 / 1799 |
| Slow bitmap uploads | **0** (not asset decoding) |

**The GPU accounts for 4 ms of a 30 ms frame. The other 26 ms is the main thread.** Caveat:
HWUI's GPU percentiles may not attribute rn-skia's own GL work, which is why `gpu_busy` was
sampled separately — but a GPU-bound app sits near 100% and paces frames at GPU speed, and this
one does not.

**Consequence for `glass-perf-plan.md`:** the fill-rate items (rim supersampling, blur σ,
`MakeCrop`) tune the part that is not the bottleneck. The valuable Skia work is the **canvas
merge + `opaque` SurfaceView**, because on Android rn-skia submits draws on the *main* thread
and every extra TextureView adds an HWUI composite there — CPU cost in GPU clothing.

### Two independent faults, not one

1. **Redux-dispatching interactions** (chart scrub, typing) → persist-write storm → fixed by A3.
2. **Scrolling** → main-thread bound with the GPU idle-ish → fixed by composite/submission work,
   not by shaders and not by persistence.

### Original experiment definition (kept for reference)

This is the highest-information test available and it needs no build, no code change and about
five minutes. It can reorder this entire plan.

```bash
PKG=com.litecoin.nexus
adb shell cmd package compile -m speed -f $PKG      # force full AOT compilation
# force-stop, relaunch, use the app for 2 minutes: navigate Main <-> Settings <-> Alerts,
# open the tx detail modal, scroll the list, open the drawer
adb shell cmd package compile -m verify -f $PKG     # restore the sideloaded default
# force-stop, relaunch, repeat the SAME two minutes and compare
```

**Why it matters.** The app currently has **zero** RN methods AOT-compiled (Phase 3 / A14):
on a sideloaded build ART's install-time filter is `verify`, so Fabric mounting,
ViewManagerDelegate instantiation, `Readable*Map` marshalling and `ReactChoreographer`
dispatch all run interpreted-then-JIT. ART normally recovers by collecting a runtime profile
and AOT-compiling during idle background dexopt — **but every `./gradlew installRelease` wipes
that profile.** So the development loop may be permanently reproducing a worst case that a
real user only experiences for their first day or two.

**How to read the result.**

| Observation | Conclusion |
|---|---|
| `-m speed` feels markedly smoother, especially first-visit-to-a-screen | Class loading / JIT dominates. **A14 (baseline profile) becomes the top priority**, and a chunk of "everything is slow" was a testing artefact. Re-measure everything else against the `-m speed` state, not the default. |
| No perceptible difference | The Java/ART layer is not the bottleneck. Phase 1 (persist writes) and Phase 2 (header/transition work) carry the plan; A14 drops down the list. |
| Somewhat smoother | Both matter. Keep the ordering as written. |

Pair it with `dumpsys gfxinfo` before/after for a number rather than a feel — the janky-%
and 95th-percentile lines are the ones to compare. Note that `-m speed` compiles everything,
which is *more* than a baseline profile would; treat it as an upper bound on A14's payoff, not
a prediction of it.

**Caveat:** `cmd package compile` needs no root and is non-destructive — it only changes the
compiled artefact, never app data — but it is a per-install state, so any reinstall resets it.

### A0b — instrument the persist path ✅ IMPLEMENTED (`perf/persist-instrumentation`)

The central claim of Phase 1 is write *frequency*, and nothing measured it. `src/store/mmkv.ts`
now counts writes and characters inside the redux-persist storage adapter and exports
`getPersistWriteStats()`. Two adds per write, so it is free enough to leave on permanently.

The *logging* half is deliberately not committed — it is throwaway, same as the existing
memlog hook. Paste this into `index.js` while measuring and drop it afterwards:

```js
import {getPersistWriteStats} from './src/store/mmkv';

let last = getPersistWriteStats();
setInterval(() => {
  const now = getPersistWriteStats();
  // console.* is stripped in release (babel.config.js), so use the runtime hook
  global.nativeLoggingHook?.(
    `[persistlog] +${now.writes - last.writes} writes/10s ` +
      `+${Math.round((now.chars - last.chars) / 1024)}KB total=${now.writes}`,
    1,
  );
  last = now;
}, 10000);
```

Record a 60 s baseline in three states, because they exercise completely different paths:
**idle** (poller-driven — what A1 targets), **scrubbing the chart** (touch-rate — what A2/A3
target), and **typing an amount** (keystroke-rate — what A3 targets). Without these three
numbers, every payoff in Phase 1 stays asserted rather than measured. `[critical / trivial]`

Deeper profiling, in order of setup cost: **Perfetto** (the xctrace equivalent —
`android.surfaceflinger.frametimeline` gives per-frame `jank_type`, the direct analogue of the
Hitches instrument) → **simpleperf** for native symbols → **Arm Streamline** for Mali counters.
The last two need `<profileable android:shell="true"/>` in the manifest, which the release
build does not have. Add it uncommitted, like the memlog hook.

---

## Phase 1 — Stop the whole-store encrypted write `[critical]`

The single largest runtime win, and the lowest-risk part of this plan *except* for the
migration, which is the highest-risk change in the whole document.

### A1 — Reference-stable poll reducers `[critical / small]`

Do this **first**. It is pure win with no persistence-semantics risk: a poll tick whose payload
is value-equal returns the *identical* state object, which kills both the re-render and the
persist write, with no change to polling at all.

New `src/reducers/identity.ts`:

```ts
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null &&
  Object.getPrototypeOf(v) === Object.prototype;

// One level deep, deliberately. Object.is alone is NOT enough: inside an RTK case
// reducer `state` is an Immer draft, and reading a nested property mints a fresh
// child proxy, so Object.is(state.uris, payload.uris) is always false. The
// array/object branches compare elements, which sidesteps that.
// Do not "simplify" this back to Object.is.
const fieldEq = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length &&
           keys.every(k => Object.is(a[k], b[k]));
  }
  return false;
};

export const mergeStable = <S extends object>(state: S, patch: Partial<S>): S => {
  for (const key of Object.keys(patch) as Array<keyof S>) {
    if (!fieldEq(state[key], patch[key])) return {...state, ...patch};
  }
  return state;
};
```

Apply to: `balance.ts` (`getBalanceAction` — seven strings, exact comparison, highest value),
`info.ts` (all four poll-driven reducers), `ticker.ts` (the two 15 s reducers), `buy.ts` (the
six poll-driven reducers — this is what stops quote churn), `lightning.ts` (`lndState` /
`setWalletState` — `subscribeState` dispatches `lndState(true)` on every lnd state event).

Also delete or stabilise the `txSubscriptionStartedAction` dispatches in `transaction.ts`: the
reducer at :1462-1465 rebuilds unconditionally, so each one re-serialises the entire persisted
transactions array. On a flapping stream that is two per reconnect cycle.

> Corrected from the raw design: the "guaranteed no-op every 15 s" claim for `buy.ts:416` is
> wrong — `proceedToGetBuyLimits` genuinely flips when the provider returns limits. The guard
> is still right; the frequency was overstated.

**Verify:** with A0's counter running, an idle synced wallet should drop from ~28 writes/min
to near zero.

### A2 — Chart cursor and keystroke churn `[high / small]`

`GlassChart.js:333` dispatches `updateCursorValue` inside `collectHovered`, **before** the
offsets-unchanged early-return at :531-536 — so a touch-move resolving to the same data point
still writes. Move the dispatch behind that check. Add a belt-and-braces value guard in
`chart.ts` `updateCursorValueAction` so any other caller (`Chart/Cursor.js`) cannot reintroduce
it.

> Payoff correction: once A3 de-scopes `chart` from persistence, this removes **zero** persist
> writes. Its remaining value is the dispatch plus the re-renders at `GlassAmountView.tsx:68-71`
> and `NewAmountView.tsx:34-37` — real, but A2 and A3 were double-counting the same win.

### A3 — Persistence scope, throttle, and migration `[critical / medium — highest risk in this plan]`

New `src/store/persistScope.ts` holding two arrays, so a CI test and the store can share them:

**PERSISTED (14)** — `onboarding`, `wallets`, `settings`, `authentication`, `alerts`,
`transaction`, `buy`, `nexusshopaccount`, `cart`, `giftcardcart`, `popupschedule`, `balance`
(refetchable in ≤5 s, but a blank balance on cold start is unacceptable in a wallet — churn is
killed by A1, not by de-scoping), `ticker` (`rates` is needed for the first frame's fiat
figures), `address` — **see the correction below**.

**NOT_PERSISTED (7)** — `info` (node telemetry, refetched every 5 s), `lightning` (a persisted
`walletState: RPC_ACTIVE` stops `Auth.tsx:79` from firing, suppressing the launch biometric
prompt), `authpad` (one encrypted write **per PIN digit**), `chart`, `input` (two dispatches per
keystroke; a restored send address is a hazard), `deeplinks`, `errors` (a persisted
`visible:true` re-shows the banner on launch).

Two `createTransform`s: `trimTickerHistory` (drop `week..all`; they are refetched in full every
launch by `App.tsx:106`, and `all` is the entire daily LTC price history that gets
re-stringified on **every** write) and `resetTxSubscriptionFlag` (a persisted `true` means the
tx subscription is never re-established after the first ever launch).

**Corrections that must be applied:**

- **`address` is misclassified in the raw design.** The rationale ("lnd returns the same unused
  address anyway") is false: `address.ts:53-57` passes a per-account `account`, so a different
  selected wallet yields a different address, and `walletSwitchMiddleware` never resets it.
  `state.address.regularAddress` is the **buy destination** (`ConfirmBuy.tsx:93`) and the **sell
  refund address** (`ConfirmSell.tsx:80`). A persisted address belonging to a previously-selected
  wallet is what those screens use until `getAddress()` lands. Either move `address` to
  NOT_PERSISTED, or add it to `walletSwitchMiddleware`'s reset. Do not ship the original comment.

- **`throttle` sizing is wrong in the raw design.** `createPersistoid` stages **one key per
  interval tick** and only writes when the queue drains, and the first `update()` of a session
  is the REHYDRATE one, which queues all whitelisted keys **plus `_persist`**. So the first
  durable write of every session lands at `(K+1) × throttle` ≈ **30 s** at 2000 ms — meaning the
  entire first-run onboarding window is non-durable. Either use **500 ms**, or keep 2000 ms and
  add a one-shot `pStore.flush()` when the persistor reports `bootstrapped`, plus explicit
  flushes after `finishOnboarding`, `setSeedVerified`, and adding a HW wallet.

- **`pStore.flush()` on background must be deferred one macrotask.**
  `authentication.ts:208 subscribeAppState` registers its own AppState listener that dispatches
  into a whitelisted slice; RN delivers listeners in registration order, so an undeferred flush
  can drain *before* that dispatch dirties the slice. Use
  `setTimeout(() => pStore.flush(), 0)`.

- **`purgeStore()` interaction is unhandled.** `persistReducer`'s PURGE branch does not clear
  the persistoid's interval and `stagedState` survives, so with a non-zero throttle a queued
  drain can call `storage.setItem` and **recreate `persist:root` after the `RNFS.unlink`**. Add
  `pStore.pause()` before `purge()`.

- **De-scoping `lightning` makes two documented comments false.** `lightning.ts:320-323` and
  `:337-342` both reason about the persisted `isMigrating` flag surviving restarts. The end
  state is unchanged (the durable source of truth is the `ELECTRUM_MIGRATION_FLAG` keychain
  entry), but update those comments and delete the now-dead stale-UI branch in the same PR.

**The migration is the dangerous part.** If `migrate` throws, `createMigrate` rejects,
`autoMergeLevel1` is skipped, the app boots on `initialState` for **every** slice, and the
persistoid immediately overwrites `persist:root` with it — permanent loss of wallets, settings,
alerts and gift cards. Keep it one explicit destructure wrapped in try/catch returning `state`.
No loops, no dynamic keys, no async, ever.

### A4 — CI guard on the classification `[high / small]`

A test asserting `PERSISTED ∪ NOT_PERSISTED` equals the actual slice set, so a 22nd slice
cannot silently inherit the wrong behaviour.

> Corrected: the raw design's test **cannot run** — `import reducer from '../reducers'` pulls in
> `store/mmkv.ts`, which at module scope calls `Crypto.randomBytes` (unmocked),
> expo-secure-store's sync `getItem` (jest.setup mocks only the async API), and `createMMKV`
> (jest.setup mocks the v2/v3 `MMKV` export, but package.json pins mmkv 4.3.1). Instead: read
> `src/reducers/index.ts` with `fs.readFileSync` and extract the `combineReducers({...})` keys,
> or export a `SLICE_NAMES` constant and build `combineReducers` from it. Zero native imports.

---

## Phase 2 — Navigation stutter `[critical]`

### A5 — Delete the header self-destruct `[critical / trivial]`

`useMainLayout.tsx:337-359` sets `headerShown:false` 50 ms after **every** focus, then `true`
10 ms later. `@react-navigation/stack`'s `HeaderContainer` returns `null` when
`headerShown` is false, so the whole header subtree — Skia Canvas, expo-blur BlurView, hidden
measuring `<Text>` — fully unmounts and remounts on every return to Main. It also leaks: the
cleanup at :357 clears only the outer `timeoutId`, so the nested 10 ms timer still fires after
a blur landing inside that window, calling `setOptions` on an unfocused screen.

Root-cause the underlying `headerTransparent` bug first (the comment says "fixes header
disappearing when navigating back from screens with `headerTransparent: true`"). If it cannot
be root-caused, the safe alternative is keeping the header mounted and toggling opacity —
anything that stops the unmount.

`Settings.tsx:170-183` has a second copy of the same flip, gated on
`route.params?.updateHeader`, so it fires on fewer focuses. Delete it too; note the `updateHeader`
param is declared **required** in a local `RootStackParamList` at `ConfirmBuy.tsx:35`, which the
raw design missed.

### A6 — Delete the duplicate header button `[critical / small]`

`NewMain.tsx:929-957` builds a second `LiquidGlassWalletButton` — its own Skia Canvas, its own
BlurView, its own hidden `<Text>`, its own `TranslateText` — as a static `navigationOptions`
`headerTitle`, which `useMainLayout` then immediately overrides.

> **Do not simply delete `headerTitle`.** `getHeaderTitle` falls back to
> `options.headerTitle ?? options.title ?? route.name`, so removing it renders the literal
> string **"Main"** in the theme text colour over the blue card until the post-commit effect
> lands. Ship `title: ''` and `headerTitle: () => null`.

### A7 — Fix the header measuring loop `[high / small]`

Two problems, and the raw design got the mechanism wrong on both.

- `useHeaderHeight()` drives a layout→state→layout loop. Substituting
  `getDefaultHeaderHeight(layout, false, 0)` is exact **on Android only**: on a Dynamic Island
  iPhone the current expression yields 38.67 while the substitute yields 44, a 5.33 px shift
  applied to all three header elements. Branch on `Platform.OS`.
- The measuring `useLayoutEffect` has no dependency array. **Narrowing the deps is the wrong
  fix** — once A5 and the height change land, `measure()` runs only on the mount commit, where
  `pageY` returns 0, leaving `plasmaModalGapInPixels` permanently 0 and docking the wallet-select
  modal at the top of the screen. Replace the render-loop `measure()` with an `onLayout` on the
  button's `Animated.View` (or one `requestAnimationFrame` before measuring).

Also: `LiquidGlassWalletButton`'s hidden measuring `<Text onLayout>` → `setTextWidth` forces a
second render pass on every mount. Size the pill intrinsically with flexbox. If the inert
BlurView is replaced with a flat tint, the ships-today value is **`rgba(249,249,249,0.19)`** —
expo-blur's `TintStyle.LIGHT.toColorInt(25)` computes alpha 49 on `#F9F9F9`, roughly double the
`rgba(255,255,255,0.10)` the raw design proposed.

### A8 — The transition itself `[high / medium — unanalysed, do Phase 0 first]`

The largest gap in the navigation work: **the animation was never analysed, only the JS work
around it.** On Android 14 `TransitionPresets` selects `FadeFromRightAndroid`, which fades the
incoming card (an offscreen composite layer) and applies `translateX: 0 → -96` to the outgoing
Main card — a subtree containing several Skia **TextureViews** and expo BlurViews. Translating
and compositing those per frame is the Android-specific cost from the companion plan, landing
here on every push.

Evaluate: `animation:'none'` / `forNoAnimation` for Main→leaf pushes, `detachPreviousScreen`,
`cardOverlayEnabled`. Also fix the button pop: `useNewMainAnims.ts:266-272` zeroes both header
opacities the instant Main blurs, i.e. on frame 1 of every push while the card is still fully
on screen. And restoring the 150 ms lead-in needs a `justFocused` ref — there is no state today
distinguishing "just focused" from "modal just closed", so the raw sketch would have removed
the delay from the modal path too.

### A9 — Lazy screens `[critical / large]`

`inlineRequires` is enabled but **cannot** defer default imports: babel emits
`var _X = _interopRequireDefault(require(...))` and metro's plugin only hoists a require whose
direct parent is a `VariableDeclarator`. Every navigator uses `component={X}`;
`getComponent`/`React.lazy` appear nowhere. All 52 screens (251 modules, 1.2 MB JS) evaluate at
bundle load.

Move every non-initial screen in `NewWalletStack`, `SettingsStack`, `NexusShopStack`,
`AlertsStack`, `AuthStack` and `OnboardingStack` to
`getComponent={() => require('./X').default}`. Expect ~45 of 52 to leave the boot closure.

### A10 — Freeze blurred leaf stacks `[medium / medium]`

`enableFreeze` / `freezeOnBlur` are used nowhere. Enable **per-navigator on the leaf stacks
only — never globally, never on Main**. Freezing stops React renders, **not** Reanimated
UI-thread loops, so gate the one ungated Reanimated loop on `useIsFocused` as well.

### A11 — Drawer hygiene `[low / trivial — demoted]`

Delete the dead `sceneContainerStyle` key (v7 renamed it `sceneStyle`, so it does nothing
today). **`drawerType: 'slide' → 'front'` is demoted to "nice to have, needs design sign-off":**
the per-frame transform is only paid *while the drawer animates*, `swipeEnabled: false` means it
opens only from the shop tab button, and at rest the two modes are identical. The earlier "high
payoff" rating was wrong.

**Dropped entirely:** narrowing `BottomSheetMemo`'s `route` dependency. NewMain is a
`Drawer.Screen`, so `props.route` is the drawer route; the four `navigate('Main', {...})` call
sites set params on the *stack* route and a bare `{isInitial:true}` never propagates inward, so
`route` identity does not change and the memo was never invalidated by them. Net work removed:
zero.

---

## Phase 3 — R8 and the baseline profile `[high, but not what you think]`

**Payoff, stated honestly:** install/OTA size, page-cache footprint, install-time dex2oat, and
6 → 3–4 DEX containers. Expect 54,308 → roughly 25,000–32,000 classes. It does **not** touch the
JS thread and is **not** a fix for the navigation stutter. The 11,400 unused
`androidx.compose.material.icons` classes are never loaded at runtime, so removing them saves
zero class-load time — the win is container count and install cost, plausibly tens of ms of cold
start on a throttled Exynos, not a step change.

> Also corrected: R8 is **not** a precondition for the baseline profile. A profile's value
> depends on whether it names the hot methods, not on total class count. Do not sequence A14
> behind A12.

### A12 — Stage 1: shrink only, no renaming `[high / medium]`

`android/gradle.properties`:

```properties
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=false   # separate failure domain, flip separately
android.enableR8.fullMode=false                      # every consumer rule in the tree is compat-mode
android.r8.failOnMissingClasses=true
```

No `build.gradle` edit is needed — the RN 0.83 template already wires both properties
(`android/app/build.gradle:65`, `:142-144`).

Full mode stays **off**: it drops the implicit keeps that library consumer rules were written
against (no implicit default-constructor keep for member-only rules, no implicit
`Signature`/`InnerClasses` retention, `-allowaccessmodification` assumed). Flexa,
kotlinx.serialization, Gson and expo all ship compat-mode rules. A wallet does not trade
correctness for a few hundred KB. Note `expo-modules-core`'s `ExpoModulesHelper` also does
`.getConstructor().newInstance()`, an independent second reason.

`proguard-rules.pro` gets `-dontobfuscate` for this stage plus, at minimum:

```proguard
-keepattributes SourceFile,LineNumberTable

# androidx @Keep (independent of notifee's and play-services-basement's transitive rules)
-keep class androidx.annotation.Keep
-keep @androidx.annotation.Keep class * { *; }
-keepclasseswithmembers class * { @androidx.annotation.Keep <init>(...); }
-keepclasseswithmembers class * { @androidx.annotation.Keep <methods>; }
-keepclasseswithmembers class * { @androidx.annotation.Keep <fields>; }

# Fresco's DoNotStrip — react-native-mmkv's JNI-visible HybridMMKVPlatformContext uses it,
# and com.facebook.fresco:fbcore ships no proguard.txt.
-keep @com.facebook.common.internal.DoNotStrip class * { *; }
-keepclassmembers class * { @com.facebook.common.internal.DoNotStrip *; }

# ⚠️ WALLET-CRITICAL. react-native-keychain persists via androidx.datastore, whose on-disk
# format is repackaged protobuf-javalite resolving fields by reflective name lookup. The
# seed and pincode live here. Today this survives only by accident of version resolution
# (only datastore-preferences-core-android:1.1.7 ships proguard.txt; keychain declares 1.1.1).
-keepclassmembers class * extends androidx.datastore.preferences.protobuf.GeneratedMessageLite { <fields>; }
-keep class androidx.datastore.preferences.PreferencesProto$** { *; }

-keep class com.margelo.nitro.** { *; }
-keep class expo.modules.ExpoModulesPackageList { *; }
-keep class com.shopify.reactnative.skia.** { *; }
-keep class com.litecoin.jade.** { *; }          # kotlinx.serialization to a Jade signer
-keepclassmembers class **$$serializer { *; }
-keepclassmembers enum * { <fields>; }

# reanimated does Class.forName("com.swmansion.gesturehandler.react.RNGestureHandlerModule")
# and swallows the failure; RNGH ships no consumer rules.
-keepnames class com.swmansion.gesturehandler.react.RNGestureHandlerModule
```

**The lnd path carries zero R8 risk** — the biggest de-risking finding. `react-native-nitro-lndltc`
declares a pure C++ HybridObject with no Kotlin/JNI surface, and every protobuf message is
encoded/decoded **in JavaScript** with `@bufbuild/protobuf`. There is no Java protobuf runtime
for lnd in this app.

> **Correction to the staging rationale.** Stage 1 was sold as "loud failures only". That is
> false: shrinking *also* deletes reflectively-reached classes, and those land in exactly the
> same swallowed-exception paths (`ExpoModulesPackage.kt:27-30` returns `emptyList()`;
> `AppContext.kt:146` catches with an empty body; reanimated's `NativeProxy.java:82` assigns
> null). Stage 1 removes the *rename* half of the risk only. **Run the full smoke matrix on
> stage 1, not just stage 2.**

Also budget for build cost: `org.gradle.jvmargs=-Xmx4096m` may OOM on whole-program analysis of
this input, and `:app:minifyReleaseWithR8` is not incremental.

### A13 — Verification matrix and the upgrade gate `[critical / small]`

> ⚠️ **The raw design's stage-2 gate — "upgrade-in-place over a stage-1 build with a funded
> wallet" — can destroy funds.** `src/store/mmkv.ts:9-15` reads `plasmaKey` and, if it comes
> back `null`, generates a fresh key **and writes it back**. Any partial failure yielding `null`
> rather than a throw permanently orphans the encrypted MMKV instance; rolling the release back
> does not recover it.

Run upgrade-in-place only on a device whose seed is **independently backed up**, and gate on a
read-only assertion first: confirm Redux state rehydrates non-empty before permitting any write
path. Separately, harden `mmkv.ts` to throw rather than silently re-key.

Smoke matrix (all of it, on stage 1): cold start; upgrade-in-place with existing MMKV + keychain
data; biometric unlock; PIN change; send; receive; buy/sell; Flexa Spend load; Jade connect;
deep link; NFC; camera scan. Gate on `mapping/release/usage.txt` showing nothing removed under
`androidx.datastore.preferences`, `com.oblador.keychain`, `com.swmansion.gesturehandler`, or
Fresco's `DoNotStrip` classes; and `configuration.txt` containing the
`GeneratedMessageLite` rule. Archive `mapping.txt` per release. Confirm which artifact actually
ships (APK vs AAB) — `shrinkResources` behaves differently under AAB.

Stage 2 (delete `-dontobfuscate`) and stage 3 (`proguard-android-optimize.txt` +
`shrinkResources`) are separate releases.

### A14 — Baseline profile `[high / large — independent of A12]`

Hand-write `android/app/src/main/baseline-prof.txt` with `HSPL` rules for
`com/facebook/react/fabric/**`, `uimanager/**`, `bridge/Readable*`,
`modules/core/ReactChoreographer`, `com/swmansion/rnscreens/**`, and **`com/litecoin/nexus/**`**.

> The raw sketch used `com/nexus/**` throughout. The namespace and applicationId are both
> `com.litecoin.nexus` — every app rule would have been **silently dropped**, the exact failure
> the design's own risk column warned about. The verification command must be
> `am start-activity -W -S com.litecoin.nexus/.MainActivity`. Assert with profgen that the app
> rules survive; do not check only `baseline.prof`'s file size.

Then move to the `androidx.baselineprofile` plugin with a generator that exercises cold start,
a drawer open and two stack pushes.

---

## Phase 4 — Poller optimisation `[medium — gate on Phase 0]`

The pollers stay. A1 already makes most ticks free; what follows reduces the work each tick
does. **Everything in this phase carries behaviour risk and none of it has a measured payoff —
do A0 first and only take the items the numbers justify.**

### A15 — Make `poll()` survivable `[high / small]`

`await api()` is not wrapped in try/catch and `poll()` is called without `.catch()`, so a single
rejection **permanently kills that poller** and surfaces only as an unhandled rejection. This is
survivable today only because every polled thunk has its own try/catch — it stops being
survivable the moment cadence is reduced. Wrap the call inside the loop. Any watchdog must
compare the live key set against the expected set; checking for zero active pollers cannot
detect one dead poller.

Also wire the existing `stopAllPollers()` (currently **zero call sites**) into lnd teardown —
this fixes a real duplicate-poller leak on rescan, not just dead code.

### A16 — Adaptive cadence `[medium / medium]`

Fast while syncing, slow once `syncedToChain`. Stagger phase offsets. On resume, **gate the
catch-up on `lastSuccessAt` per key** — the raw design woke info, balance and transactions
unconditionally on every `active` transition, which would force a full-history
`getTransactions` (RPC + protobuf decode + `getPriceOnDate` for uncached txs) on every
app-switcher flick. Note JS timers already do not fire while backgrounded, so stopping on
background saves little by itself; the real hazard is the resume drain.

If a focus-scoped poller is introduced, **do not let the background stop cancel it** — the raw
design's `stopAllPollers()` killed the Buy/Sell quote poller, which nothing restarted because
react-navigation focus is not tied to AppState and the card never blurred.

### A17 — Split `ListUnspent` out of the 5 s balance poll `[medium / small]`

`WalletBalance` already gives confirmed/unconfirmed; the full UTXO-set walk is only needed by
coin-control surfaces. Move it to an on-demand thunk — **with the `utxoSplitFresh` guard the raw
sketch described but did not ship.** `regularConfirmedBalance` initialises to `''` and
`Number('') === 0`, so without the guard `input.ts:154-186` clamps the user's typed convert
amount silently to **0** for the whole pre-fetch window. Trigger it from Send's `showConvert`
toggle as well as Convert's mount.

### A18 — Rates poll `[medium / medium — behaviour risk]`

Steady state is 12 HTTPS requests/min (not 16 — `setLimits` early-returns for non-Moonpay/
Onramper users). Scope the provider quote calls to Buy/Sell focus.

> ⚠️ **`ticker.ltcRate` must stay live.** It is written *only* by `updateRatesAction` from
> `callRates`, and read by `input.ts:99,122` for the `'ltc'` branch — the **Send card** path.
> Scoping `callRates` to Buy/Sell focus means that on a fresh install where the user never opens
> Buy/Sell, typing a fiat amount on Send computes `0` LTC. Either keep `ltcRate` updated from the
> background poller, or repoint `input.ts` at `ltcRateSelector` (derived from `rates`, which
> stays live).

### A19 — Incremental `GetTransactions` `[low / large — deferred]`

`GetTransactions` supports `start_height`, so the 15 s full-history pull and decode could be
incremental. **Recommended against for now**: large change, wallet-critical path, unmeasured
payload size. Documented so it is not rediscovered.

> Also dropped: deriving confirmations from the chain tip. Adding `tipHeightSelector` to
> `txDetailSelector` makes it recompute once per block anyway — the same cadence it has today —
> so the claimed render/paragraph win does not exist. If pursued, keep `confs` tip-independent in
> the selector and derive `displayConfs` in `GlassTxRows`, applying it only to rows with
> `confs <= 6`.

---

## Phase 5 — TranslateText view tax `[medium — biggest structural item, lowest certainty]`

448 call sites, each currently **two Android views that Fabric can never flatten**: reanimated
injects both `collapsable:false` and `nativeID`, and in RN 0.83 `ViewShadowNode` treats either
as `FormsStackingContext → FormsView`, so a layout-only wrapper that would otherwise be
flattened away is *guaranteed* to become a real `ReactViewGroup` — and blocks flattening inside
it. `useAnimatedStyle` is also called unconditionally even when discarded.

### A20 — Split the component `[high / medium]`

Internal dispatcher → `StaticTranslateText` / `AnimatedTranslateText`. It must be **separate
components**, not a branch, so the static path never calls `useAnimatedStyle` (rules of hooks).
Public API and all 448 call sites unchanged.

Implementation notes the critic caught:
- Keep the original `flatStyle && flatStyle.flexBasis ? ... : undefined` truthiness expression —
  `flatStyle?.flexBasis` would pass `0` through and collapse the wrapper.
- Annotate the style memo `useMemo<ViewStyle>` or the fresh `'100%'` literal widens to `string`
  and fails `strict` type-checking.
- Add `maxWidth` to the box-keys set, or a `maxWidth` in `textStyle` without a `width` silently
  loses one of two live caps.

### A21 — Drop the wrapper at runtime, not statically `[medium / medium]`

The wrapper/no-wrapper split is **not statically determinable**: 15 sites receive `textStyle` as
a forwarded prop from a different call site (`HeaderButton`, `NewBlueButton`, `NewWhiteButton`,
`DateButton`, `TableCell`, `TableTitle`, `TableCheckbox`). So the "77 static / 353 wrapped" split
is not a measurement and the proposed CI assertion is unimplementable. Decide at runtime from the
flattened style. Screenshot-diff every screen rendering those seven components, plus the
largest bucket: labels with no `textStyle` at all.

### A22 — The cheaper win the design missed: `useTranslation` `[high / medium]`

Every render of every label runs react-i18next's `useTranslation`: a context read, a 3-way
spread, a namespaces array allocation, `addUsedNamespaces`, `hasLoadedNamespace`, and
`useMemoizedT` — which **eagerly invokes `i18n.getFixedT(...)` on every render** and discards the
result — plus `useState`, `usePrevious`, `useRef` and two `useEffect`s that add/remove an
`i18n.on('languageChanged')` listener per label. That is per-render work comparable to the
`useAnimatedStyle` registration A20 targets, and 448 listeners means one language switch fires
448 `setT` updates.

Replace with `useSyncExternalStore` over a single module-level language listener, then call
`i18n.t(key, {ns: domain, ...})` directly. Safe because `src/utils/i18n.ts:49` already sets
`react: {useSuspense: false}`. Component type stays identical at all 448 sites.

### A23 — Name the real memoization blocker `[medium / medium]`

`React.memo` on the leaves would not hit today: **173 files call `getStyles(SCREEN_WIDTH,
SCREEN_HEIGHT)` inline in the render body** and only 18 memoize it, so `textStyle` identity
churns every render. Until that is fixed, A20/A21 improve **mount** cost only; steady-state
re-render cost is unchanged. Fix the call sites (or a module-level cache keyed by screen size)
before claiming a steady-state win.

Related and separate: 38% of components (84/217) emit zero React Compiler memo caches. The cause
is **not** mostly `eslint-disable` as first reported — only 37 are; **45 bail on unrelated
compiler errors** (`Found mutation of 'scaler'`, `ThrowStatement inside of try/catch`). Removing
the eslint disables would not fix most of them.

---

## Dead ends — checked and refuted, don't redo these

- **lnd writes to flash continuously.** Refuted.
- **The Hermes memlog timer matters.** Refuted twice; it is the uncommitted diagnostic anyway.
- **Locale JSON parsing at startup is expensive.** Refuted (15 files, 392 KB, but not on the
  critical path in the way claimed).
- **`matchFont()` runs every render on Android.** Refuted.
- **`gramophone-art@3x` / `LoadingIndicator`'s idle animation.** Refuted.
- **`MIN_WAVE_MS` adds 900 ms to launch.** Materially overstated — it is a *floor* that only
  applies once lnd is already RPC-ready, so on a cold start it contributes nothing.
- **Persisted-deeplink clobbering.** Not real: REHYDRATE always resolves before any
  `getInitialURL` macrotask. De-scoping `deeplinks` is still right, but not for that reason.
- **`drawerType:'slide'` costs at rest.** It does not; only while animating.
- **Narrowing `BottomSheetMemo`'s `route` dep.** Removes zero work.

---

## Execution order

Each step ships and is verified before the next. A0 first so every later claim is measurable.

| # | Item | Payoff | Effort | Risk |
|---|------|--------|--------|------|
| A0a | **AOT experiment** — run before anything else | critical | trivial | none |
| A0 | Persist-write counter + Phase 0 device triage | critical | trivial | none |
| A1 | Reference-stable poll reducers | critical | small | low |
| A2 | Chart cursor / keystroke dispatch churn | high | small | low |
| A5 | Delete the header self-destruct (both copies) | critical | trivial | low |
| A6 | Delete the duplicate header button | critical | small | low |
| A7 | Header measuring loop → `onLayout` | high | small | medium |
| A3 | Persistence scope + throttle + migration | critical | medium | **high** |
| A4 | CI guard on slice classification | high | small | none |
| A12 | R8 stage 1 (shrink only) | high | medium | **high** |
| A13 | Verification matrix + safe upgrade gate | critical | small | none |
| A14 | Baseline profile | high | large | low |
| A9 | Lazy screens via `getComponent` | critical | large | medium |
| A8 | The transition itself | high | medium | medium |
| A15 | `poll()` error survivability | high | small | low |
| A20–A23 | TranslateText + `useTranslation` + memo blocker | high | large | medium |
| A10 | Freeze blurred leaf stacks | medium | medium | medium |
| A16–A18 | Adaptive cadence, ListUnspent split, rates scoping | medium | medium | **high** |
| A11 | Drawer hygiene | low | trivial | low |
| A19 | Incremental `GetTransactions` | low | large | deferred |

**Suggested first PR:** A0 + A1 + A2 + A5 + A6. All low-risk, no persistence-semantics change,
and it should be visible on the A33 immediately — that also validates A0's counter before the
dangerous work starts.

---

## Open questions

1. **Which artifact ships — APK or AAB?** Both exist in `build/outputs/`. It changes how
   `shrinkResources` and the DEX comparison work in A13.
2. **Actual persisted-blob size per slice on a real wallet.** The ~400 KB figure is a synthetic
   estimate from a test fixture, not a measurement. It decides whether `ticker` or `transaction`
   dominates, and therefore whether A3's transforms are aimed correctly.
3. **The `headerTransparent` bug behind A5.** Needs reproduction on device to root-cause rather
   than work around.
4. **The seed-in-Redux finding** — product/security decision, not a perf call.
5. **`address` persistence** — de-scope, or add to `walletSwitchMiddleware`'s reset?
