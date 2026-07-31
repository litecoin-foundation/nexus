#!/usr/bin/env bash
# Brackets each PerfHarness rung with a gfxinfo reset/dump, driven by the
# harness's own logcat markers. Poll-based on purpose: no lingering adb
# processes to clean up.
#
#   ./scripts/sheet-perf.sh [outdir]
#
# Unlock the phone and let it sit on the harness screen. The whole ladder is
# ~7 minutes; the script exits on the "ladder complete" marker.
set -uo pipefail

PKG=com.litecoin.nexus
OUT="${1:-perf-run-$(date +%H%M%S)}"
mkdir -p "$OUT"

say() { printf '%s\n' "$*"; }

# --- preflight: a failed check here invalidates everything downstream --------
say "== preflight =="
adb devices | sed -n '2p'
# The app is often mid-relaunch right after an install, so wait rather than abort.
for _ in $(seq 1 40); do
  FOCUS=$(adb shell dumpsys window | grep -m1 mCurrentFocus)
  case "$FOCUS" in *"$PKG"*) break;; esac
  sleep 1
done
WAKE=$(adb shell dumpsys power | grep -m1 'mWakefulness=')
THERM=$(adb shell dumpsys thermalservice | grep -i -m1 'Thermal Status')
say "$FOCUS"
say "$WAKE"
say "$THERM"

case "$FOCUS" in *"$PKG"*) ;; *) say "ABORT: $PKG is not focused"; exit 1;; esac
case "$WAKE" in *Awake*) ;; *) say "ABORT: device is not awake"; exit 1;; esac
case "$THERM" in *"status=0"*|*NONE*) ;; *) say "WARN: thermal not idle -> $THERM";; esac

if ! adb shell dumpsys gfxinfo $PKG | grep -q 'Total frames rendered'; then
  say "ABORT: gfxinfo returns no frame data (app cached or not drawing)"
  exit 1
fi

# --- follow the harness's markers -------------------------------------------
# logcat -c does not reliably drain every buffer, so ignore anything stamped
# before this script started rather than trusting the clear.
adb logcat -b all -c 2>/dev/null
T0=$(adb shell date +%s)
say "== waiting for harness (markers after epoch $T0) =="

SEEN=""
ARMED=""   # the ladder loops, so sync to a pass boundary before capturing
while true; do
  LINES=$(adb logcat -d -v epoch -s ReactNativeJS:V 2>/dev/null \
    | awk -v t0="$T0" '/\[perf\]/ { if ($1+0 > t0) { ts=$1; sub(/^.*\[perf\]/,"[perf]"); print ts" "$0 } }')
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    case "$SEEN" in *"|$line|"*) continue;; esac
    SEEN="$SEEN|$line|"

    line=${line#* }   # drop the epoch stamp used only for dedupe
    say "$line"

    case "$line" in
      *armed*|*"ladder complete"*)
        if [ -z "$ARMED" ]; then
          ARMED=1
          adb shell dumpsys gfxinfo $PKG reset >/dev/null
          say "  -> pass boundary; capturing from here"
          continue
        fi
        say "== done -> $OUT =="
        exit 0
        ;;
      *end\ cycles=*)
        [ -z "$ARMED" ] && continue
        # "[perf] rung=4 mode=worklet end cycles=20"
        RUNG=$(printf '%s' "$line" | sed -n 's/.*rung=\([0-9]*\).*/\1/p')
        MODE=$(printf '%s' "$line" | sed -n 's/.*mode=\([a-zA-Z]*\).*/\1/p')
        F="$OUT/r${RUNG}_${MODE}"
        adb shell dumpsys gfxinfo $PKG > "$F.txt"
        adb exec-out screencap -p > "$F.png"
        # Reset inside the 3s inter-rung gap, ready for the next one.
        adb shell dumpsys gfxinfo $PKG reset
        TOTAL=$(grep -m1 'Total frames rendered' "$F.txt")
        JANK=$(grep -m1 'Janky frames' "$F.txt")
        say "  -> $F.txt | $TOTAL | $JANK"
        ;;
    esac
  done <<< "$LINES"
  sleep 1
done
