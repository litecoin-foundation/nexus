// Adapted from react-native-fast-confetti
// https://github.com/AlirezaHadjar/react-native-fast-confetti
// MIT LICENSE
// Copyright (c) 2024 Alireza Hadjar

import {makeMutable} from 'react-native-reanimated';

type AnyFunction = (...args: Array<any>) => any;

const PENDING_TIMEOUTS = makeMutable<Record<string, boolean>>({});
const TIMEOUT_ID = makeMutable(0);

export type AnimatedTimeoutID = number;

const removeFromPendingTimeouts = (id: AnimatedTimeoutID): void => {
  'worklet';
  PENDING_TIMEOUTS.modify(pendingTimeouts => {
    'worklet';
    delete pendingTimeouts[id];
    return pendingTimeouts;
  });
};

export const setAnimatedTimeout = <F extends AnyFunction>(
  callback: F,
  delay: number,
): AnimatedTimeoutID => {
  'worklet';
  let startTimestamp: number;

  const currentId = TIMEOUT_ID.value;
  PENDING_TIMEOUTS.value[currentId] = true;
  TIMEOUT_ID.value += 1;

  const step = (newTimestamp: number) => {
    if (!PENDING_TIMEOUTS.value[currentId]) {
      return;
    }
    if (startTimestamp === undefined) {
      startTimestamp = newTimestamp;
    }
    if (newTimestamp >= startTimestamp + delay) {
      removeFromPendingTimeouts(currentId);
      callback();
      return;
    }
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  return currentId;
};

export const clearAnimatedTimeout = (handle: AnimatedTimeoutID): void => {
  'worklet';
  removeFromPendingTimeouts(handle);
};
