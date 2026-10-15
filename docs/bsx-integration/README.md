# BasicSwap integration review

This branch reconstructs 187 vendor commits into 12 review units, then applies
four cleanup commits and a final documentation commit: 17 commits in total.
It has not been merged into `glass` or pushed. The
original vendor branch and the local native-module repository were not modified.

## Frozen inputs and preservation proof

- Base (`glass`): `931b523eae65a0ed54199c8f8f6a16b468eb49b6`.
- Vendor (`bsx_merge`): `8e723815a7d352f23529e4cbb3d698419fc8f165`.
- Native module: `7f347514388e1162d68b93bff3dd7092296474e0` (unpublished version 0.2.11).
- Reconstructed checkpoint: `333e5e1ecb735c1e8573d650b02b6e476d542785` (`codex/bsx-reconstructed`).
- Vendor and reconstructed tree: `fcda8967ea2865275b8ad34fef8e03d44729e1cc`.
- The source tip is also retained at `codex/bsx-vendor-2026-10-16`.

The remote Nexus tips were checked before reconstruction and matched these local
inputs. The checkpoint has exactly the vendor's tracked files, contents and modes,
including temporary build artifacts that are removed only in later commits.

```sh
git diff --exit-code bsx_merge codex/bsx-reconstructed
python3 scripts/verify-bsx-history.py --check-protected-refs
git diff codex/bsx-reconstructed codex/bsx-clean
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

No signing, fee-limit, lease, lifecycle or persisted-data behavior was rewritten.
The large adapter and screens are retained so a later focused refactor can be
reviewed against a working baseline instead of mixed into history reconstruction.

## Install the unpublished native module

The package and Bun lockfile retain the vendor's exact Git revision. There is no
committed absolute path, `file:` dependency or requirement for a globally linked
package. The supplied local repository contained that exact clean commit.

```sh
python3 scripts/install-bsx-local.py /path/to/react-native-nitro-bsx
```

This checks that the clone contains the pinned commit, then runs
`bun install --frozen-lockfile` with a process-only Git URL rewrite. Bun obtains
the committed revision; uncommitted files in the local clone are not used. The
helper preserves existing command-level Git configuration and does not change
global Git settings. Normal `bun install --frozen-lockfile` works when the GitLab
source is accessible. No publication was attempted.

The local installation was exercised successfully with Bun 1.3.14 and Node
24.14.0. All four repository patches applied using the pinned patch-package.

## Validation on 2026-10-16

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

## Required follow-up before merging or publishing

1. **Persistence interruption window.** `adapter/config.ts` and
   `adapter/signingRecords.ts` write a temporary file, unlink the current file,
   then move the temporary file into place. If the app stops between unlink and
   move, their readers ignore the surviving temporary file. Configuration may
   fall back to defaults; missing signing records make signing fail closed but
   can disrupt an in-flight swap. Implement native atomic replacement or an
   explicit recoverable journal in a separate behavior change, with interruption,
   failed-rename, concurrent-write and restart tests. The vendor behavior is
   intentionally preserved in this review branch.
2. **Native publication packaging.** `npm pack --dry-run --ignore-scripts`
   contains neither `build/ios/NitroBSXCore.xcframework` nor `scripts/build-ios.sh`.
   The podspec expects that framework and still has a `TODO` source URL. Fix the
   package contents/build workflow and metadata in the native repository before
   publishing. Then replace the Git pin with the reviewed immutable release and
   regenerate locks in a separate integration commit. Until then, build the iOS
   core from the Git installation before running Pods:

   ```sh
   bash node_modules/react-native-nitro-bsx/scripts/build-ios.sh
   cd ios
   RCT_NEW_ARCH_ENABLED=1 RCT_HERMES_V1_ENABLED=1 pod install
   ```

3. **Native and device coverage.** Resolve the full-app build findings above,
   cover release builds and supported Android ABIs, and exercise notifications,
   denied permissions, background wakes, app termination/restart, Tor and server
   trust transitions. Check that the debug RPC listener is absent from release.
4. **Money-handling review.** Review the pinned native implementation alongside
   the Nexus signer: confirmed amounts/fees, request input ownership, lease
   reconciliation, stale offers, pay-in underpayment, refunds and recovery.
5. **Regtest environment.** The vendor debug branch has the three overlay commits
   `bdf960bc`, `9c9e7c37`, `a281048e` for regtest, application namespaces and a
   runtime guard. Adapt those to a separate test branch, keeping LND and BSX on
   the same network and the separate application namespace. The referenced
   `test_glueserver.py` harness is not in either supplied checkout; obtain the
   vendor harness/backends for end-to-end tests.
6. **Wallet UI review.** Verify send/receive, scanning, history, fold/unfold glass
   transitions, screen sizes and accessibility on Android and iOS. Automated
   component tests are not a replacement for this visual/device review.

These are merge gates, not evidence that the history reconstruction is incomplete.
Keep `bsx_merge` available for vendor follow-up and merge only the reviewed clean
series when the gates are satisfied.
