import {cancelWake, scheduleWake} from 'react-native-nitro-bsx';

import {getNetwork} from '../network';

import {hasActiveSwaps, resumeIfNeeded} from './index';
import {notifySwapProblem} from './notify';

// How long the wake holds the service while the engine works. The task's native
// timeout is longer, so this is what ends it in the ordinary case.
const WAKE_HOLD_MS = 90 * 1000;

// Waking only at the lock deadline would stall a swap and then refund it: the
// steps are minutes apart, so a closed app has to be woken on a cadence.
const WAKE_INTERVAL_MS =
  getNetwork() === 'regtest' ? 60 * 1000 : 15 * 60 * 1000;
const POLL_MS = 5 * 1000;

/**
 * Arms the one wake that covers every unfinished swap, or clears it when there
 * are none.
 *
 * Called whenever the set of swaps may have changed. The alarm replaces rather
 * than accumulates, so this is safe to repeat.
 */
export const scheduleWakes = () => {
  // Never throws: a swap that is running matters more than one that is only
  // scheduled to be looked at, so this must not be able to fail a core start.
  try {
    if (!hasActiveSwaps()) {
      cancelWake();
      return;
    }
    // One alarm serves every swap, so this is the whole schedule. It runs on
    // every state change, which is why it must stay this cheap - walking the
    // swaps for a deadline meant a db read each, and bought nothing a cadence
    // does not already cover.
    scheduleWake(Date.now() + WAKE_INTERVAL_MS);
  } catch (e) {
    console.warn('mbsx could not schedule wakes:', (e as Error).message);
  }
};

/**
 * The headless task an alarm starts. Registered in index.js.
 *
 * It resumes the core, re-arms the alarms — a reboot clears them, and the swaps
 * it cleared them for are still there — then holds the service briefly so the
 * engine can reach the chain before the process is let go.
 */
export const runWakeTask = async () => {
  try {
    await resumeIfNeeded();
    scheduleWakes();
  } catch (e) {
    await notifySwapProblem(
      `Could not check on your swap: ${(e as Error).message}`,
    );
    return;
  }

  const until = Date.now() + WAKE_HOLD_MS;
  while (Date.now() < until && hasActiveSwaps()) {
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }

  // ExistingWorkPolicy.KEEP drops an alarm that fires while this still holds
  // the worker, so the one armed above is gone whenever the hold outlasts it.
  scheduleWakes();
};
