# BasicSwap integration review

The `codex/bsx-clean` baseline reconstructs 187 vendor commits into 12 review
units, followed by four cleanup commits and one documentation commit. The
`codex/bsx-merge-fixes` branch adds separate persistence, native-integration and
review-documentation commits: 20 commits above `glass` in total. Neither branch
is merged into `glass`; `bsx_merge` and
the exact vendor checkpoint remain unchanged. Native fixes are committed only
on the local native repository's `codex/bsx-merge-fixes` branch, as requested.

## Frozen inputs and preservation proof

- Base (`glass`): `931b523eae65a0ed54199c8f8f6a16b468eb49b6`.
- Vendor (`bsx_merge`): `8e723815a7d352f23529e4cbb3d698419fc8f165`.
- Original native module: `7f347514388e1162d68b93bff3dd7092296474e0` (unpublished version 0.2.11).
- Current local native pin: `4a795a036b6dd98b614738bfa2261fc3bd513970`.
- Reconstructed checkpoint: `333e5e1ecb735c1e8573d650b02b6e476d542785` (`codex/bsx-reconstructed`).
- Vendor and reconstructed tree: `fcda8967ea2865275b8ad34fef8e03d44729e1cc`.
- The source tip is also retained at `codex/bsx-vendor-2026-10-16`.

The remote Nexus tips were checked before reconstruction and matched these local
inputs. The checkpoint has exactly the vendor's tracked files, contents and modes,
including temporary build artifacts that are removed only in later commits.

```sh
git diff --exit-code bsx_merge codex/bsx-reconstructed
python3 scripts/verify-bsx-history.py --check-protected-refs
git diff codex/bsx-reconstructed HEAD
```

The first command must be empty. The second checks the complete 187-commit index,
12-commit parent chain, file ownership, identical tree hashes, documented cleanup
paths and unchanged protected branch tips. The third exposes every intentional
change after the checkpoint. Omit `--check-protected-refs` if those upstream
branches legitimately advance later; the recorded commit hashes remain fixed.

## Review units

| Unit | Commit | Scope | Files |
| --- | --- | --- | --- |
| 1 | `938e5f076c` | build(bsx): add pinned native module and LND lease bridge | 7 |
| 2 | `9c74095505` | feat(bsx): add configuration and deterministic wallet identity | 8 |
| 3 | `f4c768435d` | feat(bsx): add swap state and independent rate calculations | 11 |
| 4 | `e338692c69` | feat(bsx): constrain swap funding and signing to confirmed inputs | 9 |
| 5 | `d3282ae3ad` | feat(bsx): manage swap engine lifecycle and recovery | 8 |
| 6 | `18b5b3964c` | feat(bsx): add shared swap controls and presentation | 37 |
| 7 | `f9a0d57462` | feat(bsx): create and confirm swap requests | 3 |
| 8 | `be0fdd3030` | feat(bsx): accept offers and manage external wallet pay-ins | 5 |
| 9 | `775668bc0d` | feat(bsx): display active swaps and completed receipts | 3 |
| 10 | `c1fc3c4a67` | feat(bsx): configure swap servers and connection trust | 10 |
| 11 | `9267f0ca03` | feat(bsx): manage addresses and export swap diagnostics | 4 |
| 12 | `333e5e1ecb` | feat(bsx): connect swaps to the Nexus wallet interface | 20 |

[history.json](history.json) maps every original commit to the final file groups it
touched, including 16 vendor-version-only commits and paths whose changes were
subsequently undone. This mapping is a review index, not a claim that an original
patch maps one-to-one to a new patch. Tree equality proves preservation. Vendor
authors and coauthor attribution are retained; commits are unsigned local commits.

Read units 1–5 for native/core functionality, 6–11 for swap screens, and 12 for
application activation. Review the cleanup commits explicitly after that. These
are review slices of the final files; intermediate commits can reference files
introduced later and have not been validated as independently buildable. Validate
the complete branch. If splitting into stacked PRs, first adjust the boundaries
for those dependencies and distribute the cleanup commits over the stack, or
retain a final cleanup PR. No PRs have been created by this task.

## Intentional cleanup

- `f322ccde8a` — chore(bsx): remove vendor release and development artifacts.
- `7f18d2876a` — test(bsx): make the swap validation suite reproducible.
- `6d3c195d56` — refactor(bsx): remove unused swap row offset scaffolding.
- `433986cd34` — build(bsx): record iOS dependencies and local source installation.

- Removed `make.log`, blanket LogBox suppression, and the unused settings import.
- Restored `glass` version/build numbering and the development resize control.
  Release numbers must be assigned again before any production distribution.
- Restored the two address-prefix mappings to the exact base implementation;
  this does not introduce new regtest routing or expose a mainnet/regtest switch.
- Matched React's test renderer to React 19.2, enabled Immer transformation in
  Jest, and added the filesystem unlink behavior missing from the signing mock.
- Pinned patch-package 8.0.1 and made patch failures fail installation.
- Removed the always-zero swap-row offset and wrapper. Four shared glass files
  now exactly match the base; swap history preview and the swap entry remain.
- Resolved the new BSX iOS pod; the lock also refreshes stale Podfile/Hermes
  checksums without changing any existing pod versions.
- Added the local native-source installer and this provenance/verification guide.

The reconstruction and initial cleanup did not rewrite signing, fee-limit,
lease, lifecycle or persisted-data behavior. The follow-up persistence fix below
is separate from those commits.
The large adapter and screens are retained so a later focused refactor can be
reviewed against a working baseline instead of mixed into history reconstruction.

## Install the unpublished native module

The package and Bun lockfile pin the reviewed local native commit. There is no
committed absolute path, `file:` dependency or requirement for a globally linked
package. **The new native commit has not been pushed anywhere.** Reviewers need
the local native repository containing that commit; ordinary remote installation
and CI cannot fetch it until the native changes are shared in a later step.

```sh
python3 scripts/install-bsx-local.py /path/to/react-native-nitro-bsx
```

This checks that the clone contains the pinned commit, then runs
`bun install --frozen-lockfile` with a process-only Git URL rewrite. Bun obtains
the committed revision; uncommitted files in the local clone are not used. The
helper preserves existing command-level Git configuration and does not change
global Git settings. Normal remote installation becomes available only after the
pinned commit is shared or replaced with the approved published version. No
package publication was attempted, and the native version remains 0.2.11.

The local installation was exercised successfully with Bun 1.3.14 and Node
24.14.0. All four repository patches applied using the pinned patch-package.

## Initial cleanup validation on 2026-10-16

```sh
bun run test -- src/features/mbsx --runInBand --watchman=false
bun run test -- --runInBand --watchman=false
bunx eslint src/features/mbsx
bunx tsc --noEmit
```

- Swap tests: **23/23 suites, 144/144 tests pass**.
- Entire suite: **25/27 suites pass; 178/182 tests pass**. The failures exactly
  match `glass` tested with the same installed dependencies and corrected Jest
  transform configuration: Sell fails during native Worklets initialization, and
  four existing `estimateFee` assertions fail (including unfinished expectations).
- Feature lint: **0 errors, 31 existing warnings**.
- TypeScript: **58 errors on both base and cleaned branch**, with no additional
  diagnostic paths/kinds after normalizing line shifts and expanded Redux types.
  There are no diagnostics in `src/features/mbsx`.
- Commit messages: the reconstructed series passes the repository commitlint rules.
- Native iOS core: device arm64, simulator arm64 and simulator x86_64 builds pass;
  the combined `NitroBSXCore.xcframework` was produced.
- CocoaPods installation passes (147 pods, including BSX).

- Full iOS Debug simulator app build fails in the pinned native module on arm64
  and x86_64: `cpp/wallet/base_wallet.h:25` declares `WalletTypes::DEBUG`, which
  collides with Xcode's `DEBUG=1` macro. References in `debug_wallet.h:25` and
  `HybridNitroBSX.cpp:402` fail for the same reason. Rename that enum member and
  its references in the native repository, then update the pin and rerun the app
  build in a separate integration change. The standalone core build above does
  not compile this React Native bridge configuration.
- Android investigation was stopped at the user's request. The BSX library's
  arm64 debug build passes; the full-app attempt failed with unresolved React
  Native C++ symbols. Its cause was not established against a base native build.

The iOS app attempt used:

```sh
cd ios
xcodebuild -workspace Nexus.xcworkspace -scheme nexus -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/bsx-clean-derived CODE_SIGNING_ALLOWED=NO build
```

Native checks use a clean JS dependency installation plus copies of the existing
Nexus LND libraries. They do not validate those prebuilt LND libraries from source.
No app was installed on a device, no production swap was attempted, and no funds
were used. A complete live regtest swap/refund/recovery run remains outstanding.

## Follow-up fixes on 2026-10-16

- Nexus `8c6cdd4a`: recover interrupted settings and signing writes. Writes keep
  the old file in `.bak` until the pending `.tmp` becomes the primary. Readers
  recover a complete pending write, or the previous backup when appropriate,
  before deciding that a file is absent. Reads, migrations, first loads and writes
  share a queue. Failed signing writes invalidate the in-memory permissions cache;
  recovery failures propagate instead of returning stale permission or defaults.
  Quarantine clears stale recovery files so old signing permission cannot return.
- Native `127a284`: rename the wallet enum member to `DEBUG_WALLET`, preserving
  its numeric value and the external `"debug"` configuration value. This avoids
  Xcode's `DEBUG` macro without disabling debug checks in other dependencies.
- Native `105229d`: include both iOS framework slices, the generated version
  header and build script in packages; build the Release core during `prepack`;
  provide real repository metadata and a CocoaPods source preparation command.
  Explicitly disable the debug RPC listener when configuring the iOS core.
- Native `4a795a0`: retain the bridge's supporting headers when CocoaPods cleans
  a direct Git source installation.
- Nexus `b29fe65f`: pin the final local native revision and refresh only
  the corresponding Bun and CocoaPods lock entries. The native repository and
  packages remain unpublished.

Validation after these fixes:

- **25/25 swap suites and 162/162 tests pass**, including 18 new recovery cases.
  Tests cover interruption after each file mutation, partial writes, failed
  renames, restarts, concurrent edits/reads, I/O errors and stale permissions.
- Feature lint remains **0 errors and 31 existing warnings**. TypeScript has the
  same **58 existing diagnostics**, with no new diagnostics or swap-path errors.
- The complete production iOS JavaScript bundle and its 182 assets build with
  Metro using the final local native dependency.
- Native iOS core builds successfully for device arm64, simulator arm64 and
  simulator x86_64. The package file-list check includes the framework's two
  library slices, generated version header and build script. Symbol inspection
  confirms that none of the three core libraries contains `DebugRpcServer`.
  The actual `npm run prepack` hook also passes; nothing was published.
- The React Native BSX bridge compiles on both simulator architectures. The full
  simulator app stops at linking because the supplied `ios/liblnd.a` is built
  for iOS devices, not the simulator; a simulator-compatible LND archive is
  needed for that target.
- The full unsigned iOS Debug device build **passes** with the final native pin:
  `xcodebuild -workspace Nexus.xcworkspace -scheme nexus -configuration Debug
  -sdk iphoneos -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build`.
  Pods installation and the frozen local-source installation also pass.
- Android builds were not run for this follow-up, as requested.

The recovery tests model process interruption and filesystem failures. They do
not establish durability during a physical power loss: RNFS does not expose a
file/directory fsync transaction here. No funds, live swaps or device installations
were used for validation.

## Remaining integration and review work

1. **Share the native source when approved.** This Nexus review branch depends
   on a local-only native commit. Before merging, make that revision available to
   CI and reviewers or publish the reviewed package and update the immutable pin
   and locks. Package creation is fixed; no push, tag or package release was
   performed in the native repository.
2. **Device and release coverage.** Exercise notifications, denied permissions,
   background wakes, app termination/restart, Tor and server trust transitions.
   Validate release builds and obtain a simulator-compatible LND library for
   simulator app tests. Android validation remains deferred at the user's request.
3. **Money-handling review.** Review the pinned native implementation alongside
   the Nexus signer: confirmed amounts/fees, request input ownership, lease
   reconciliation, stale offers, pay-in underpayment, refunds and recovery.
4. **Live regtest environment.** The vendor debug branch has the three overlay
   commits `bdf960bc`, `9c9e7c37`, `a281048e` for regtest, application namespaces
   and a runtime guard. Adapt those to a separate test branch, keeping LND and
   BSX on the same network with a separate application namespace. The referenced
   `test_glueserver.py` harness is not in either supplied checkout; the vendor
   harness/backends are still needed for live swap/refund/recovery tests.
5. **Wallet UI review.** Verify send/receive, scanning, history, fold/unfold glass
   transitions, screen sizes and accessibility on a device. Automated component
   tests do not cover this visual/device review.

The identified persistence, packaging and macro-collision defects are addressed;
these remaining review and environment checks are not claimed as completed.
Keep `bsx_merge` available for vendor follow-up and merge only after review.
