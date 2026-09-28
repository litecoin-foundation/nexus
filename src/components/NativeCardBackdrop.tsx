import React, {useCallback, useEffect, useRef} from 'react';
import {PixelRatio, View} from 'react-native';
import type {LayoutChangeEvent} from 'react-native';
import {makeImageFromView} from '@shopify/react-native-skia';
import {
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';

import {useNativeCardBackdrop} from './cardUnderlay';
import {prepareNativeCardBackdrop} from './nativeCardBackdropTexture';
import type {PreparedCardBackdrop} from './nativeCardBackdropTexture';

const CAPTURE_IDLE_MS = 200;
const CACHE_SIZE = 2;

const isCardSettled = (sheetY: number, expandedY: number, opacity: number) => {
  'worklet';
  return Math.abs(sheetY - expandedY) <= 0.5 && opacity >= 0.999;
};

interface Props {
  children: React.ReactNode;
  activeTab: number;
  requestedTab: number;
  sheetY: SharedValue<number>;
  cardOpacity: SharedValue<number>;
  expandedY: number;
}

// UIKit's view capture blocks the main thread. Capture only after the sheet
// AND the card fade have settled, never on mount, close, or drag start. Keep
// two prepared textures for returning to Send/Receive without another capture
// on the animation path. These images are inputs to the lens, not visible UI.
const NativeCardBackdrop: React.FC<Props> = ({
  children,
  activeTab,
  requestedTab,
  sheetY,
  cardOpacity,
  expandedY,
}) => {
  const backdrop = useNativeCardBackdrop();
  const pixelRatio = PixelRatio.get();
  const view = useRef<View>(null);
  const layout = useRef({width: 0, height: 0});
  const cache = useRef(new Map<number, PreparedCardBackdrop>());
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = useRef(false);

  const cancelCapture = useCallback(() => {
    // Invalidate pending timers and any capture already awaiting completion.
    generation.current += 1;
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const publish = useCallback(
    (token: number, prepared: PreparedCardBackdrop | null) => {
      if (!prepared) {
        return;
      }
      if (token !== generation.current) {
        prepared.image.dispose();
        return;
      }
      cache.current.delete(activeTab);
      cache.current.set(activeTab, prepared);
      if (cache.current.size > CACHE_SIZE) {
        cache.current.delete(cache.current.keys().next().value!);
      }
      // Let Skia release evicted textures when existing filters finish.
      backdrop.value = prepared;
    },
    [activeTab, backdrop],
  );

  const scheduleCapture = useCallback(() => {
    cancelCapture();
    if (!ready.current || activeTab === 0 || requestedTab !== activeTab) {
      return;
    }
    const token = generation.current;
    timer.current = setTimeout(async () => {
      timer.current = null;
      const {width, height} = layout.current;
      if (
        token !== generation.current ||
        !view.current ||
        width <= 0 ||
        height <= 0 ||
        !isCardSettled(sheetY.value, expandedY, cardOpacity.value)
      ) {
        return;
      }
      try {
        const image = await makeImageFromView(view);
        if (!image || token !== generation.current) {
          image?.dispose();
          return;
        }
        runOnUI(() => {
          'worklet';
          // A drag can start while UIKit is finishing the idle capture.
          const settled = isCardSettled(
            sheetY.value,
            expandedY,
            cardOpacity.value,
          );
          const prepared = settled
            ? prepareNativeCardBackdrop(image, width, height, pixelRatio)
            : null;
          runOnJS(publish)(token, prepared);
        })();
      } catch {
        // A failed idle refresh leaves the last prepared frame available.
      }
    }, CAPTURE_IDLE_MS);
  }, [
    activeTab,
    requestedTab,
    cancelCapture,
    sheetY,
    cardOpacity,
    expandedY,
    pixelRatio,
    publish,
  ]);

  const onReady = useCallback(
    (settled: boolean) => {
      ready.current = settled;
      if (settled) {
        scheduleCapture();
      } else {
        cancelCapture();
      }
    },
    [scheduleCapture, cancelCapture],
  );

  useAnimatedReaction(
    () =>
      activeTab !== 0 &&
      requestedTab === activeTab &&
      isCardSettled(sheetY.value, expandedY, cardOpacity.value),
    (settled, wasSettled) => {
      if (settled !== wasSettled) {
        runOnJS(onReady)(settled);
      }
    },
  );

  useEffect(() => {
    const cached = cache.current.get(activeTab);
    backdrop.value = cached?.pixelRatio === pixelRatio ? cached : null;
    return () => {
      cancelCapture();
      backdrop.value = null;
    };
  }, [activeTab, pixelRatio, backdrop, cancelCapture]);

  useEffect(() => {
    if (requestedTab !== activeTab) {
      ready.current = false;
      cancelCapture();
    }
  }, [requestedTab, activeTab, cancelCapture]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      layout.current = event.nativeEvent.layout;
      const {width, height} = layout.current;
      const cached = cache.current.get(activeTab);
      if (cached && (cached.width !== width || cached.height !== height)) {
        cache.current.delete(activeTab);
        backdrop.value = null;
      }
      scheduleCapture();
    },
    [activeTab, backdrop, scheduleCapture],
  );

  return (
    <View ref={view} collapsable={false} onLayout={onLayout}>
      {children}
    </View>
  );
};

export default NativeCardBackdrop;
