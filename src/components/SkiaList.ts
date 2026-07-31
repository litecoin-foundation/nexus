// SkiaList library from: https://github.com/samuelscheit/react-native-skia-list
// Copyright (c) Samuel Scheit
// MIT License

import { useCallback, useEffect, useMemo } from 'react';
import {Skia} from '@shopify/react-native-skia';
import type {SkCanvas, SkPicture} from '@shopify/react-native-skia';
import {
  runOnUI,
  useAnimatedReaction,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

export interface SkiaListCallbacks<T, B, C> {
  // All four run on the UI thread and must be module-scope worklets: a worklet
  // redeclared per render captures that render's values, and this list is
  // built once and then never re-created.
  keyExtractor: (item: T, index: number) => string;
  measureItem: (item: T, index: number, context: C) => number;
  // Cached under the row's key; this is where anything expensive belongs.
  buildItem: (item: T, index: number, context: C) => B;
  drawItem: (
    canvas: SkCanvas,
    item: T,
    built: B,
    index: number,
    y: number,
    context: C,
  ) => void;
  // Called when a built row is evicted, to release native memory promptly.
  disposeItem?: (built: B) => void;
}

export interface SkiaListParams<T, B, C> extends SkiaListCallbacks<T, B, C> {
  data: T[];
  // Anything the callbacks need that is not the row itself: fonts, images,
  // screen size. Replaced wholesale when it changes, which drops the cache.
  context: C;
  // Content offset of the viewport top, written on the UI thread.
  scrollY: SharedValue<number>;
  // Height of anything pinned above the first row (0 when absent).
  headerOffset: SharedValue<number>;
  viewportHeight: number;
  // Rows kept drawn beyond each edge of the viewport. Larger means fewer
  // re-records while scrolling and more drawn per record.
  overscan?: number;
  // False while the list is not on screen; the picture is emptied.
  enabled: boolean;
  // Built rows retained outside the window before the oldest are evicted.
  cacheLimit?: number;
}

export interface SkiaListState {
  // Draw with <Picture picture={picture} /> inside an existing canvas.
  picture: SharedValue<SkPicture>;
  // Sum of every row's height. Feed a scroller's content size from this.
  contentHeight: SharedValue<number>;
  // First row at or below a content-space y, for hit testing.
  rowAt: (contentY: number) => number;
  // Row tops and bottoms, resolved on the UI thread.
  rowBounds: (index: number) => {top: number; bottom: number};
}

const DEFAULT_OVERSCAN = 400;
const DEFAULT_CACHE_LIMIT = 120;

const emptyPicture = () => {
  'worklet';
  const recorder = Skia.PictureRecorder();
  recorder.beginRecording();
  return recorder.finishRecordingAsPicture();
};

export const useSkiaList = <T, B, C>(
  params: SkiaListParams<T, B, C>,
): SkiaListState => {
  const {
    data,
    context,
    scrollY,
    headerOffset,
    viewportHeight,
    enabled,
    keyExtractor,
    measureItem,
    buildItem,
    drawItem,
    disposeItem,
    overscan = DEFAULT_OVERSCAN,
    cacheLimit = DEFAULT_CACHE_LIMIT,
  } = params;

  const picture = useSharedValue<SkPicture>(useMemo(emptyPicture, []));
  const contentHeight = useSharedValue(0);

  // Props the worklets read every frame. Held as shared values rather than
  // captured, so changing one never has to rebuild the worklets.
  const items = useSharedValue<T[]>(data);
  const ctx = useSharedValue<C>(context);
  const viewport = useSharedValue(viewportHeight);
  const active = useSharedValue(enabled);

  // Row geometry, filled by measureItem and then reused.
  const heights = useSharedValue<number[]>([]);
  const tops = useSharedValue<number[]>([]);

  // Built rows, keyed as upstream's transformedData is, plus the insertion
  // order needed to evict the oldest.
  const built = useSharedValue<Record<string, B>>({});
  const builtOrder = useSharedValue<string[]>([]);

  // The incremental cursor. firstY is the content-space top of firstIndex.
  const firstIndex = useSharedValue(0);
  const firstY = useSharedValue(0);
  // Range covered by the current picture; -1 forces the first record.
  const drawnFrom = useSharedValue(-1);
  const drawnTo = useSharedValue(-1);
  // Retired pictures, released a generation late: the recorder still holds the
  // outgoing one until the next applyUpdates.
  const retired = useSharedValue<SkPicture | null>(null);

  const measureAll = useCallback(() => {
    'worklet';
    const list = items.value;
    const context_ = ctx.value;
    const nextHeights: number[] = [];
    const nextTops: number[] = [];
    let y = 0;
    for (let i = 0; i < list.length; i++) {
      const height = measureItem(list[i], i, context_);
      nextTops.push(y);
      nextHeights.push(height);
      y += height;
    }
    heights.value = nextHeights;
    tops.value = nextTops;
    contentHeight.value = y;
  }, [
    items,
    ctx,
    heights,
    tops,
    contentHeight,
    measureItem,
  ]);

  const getBuilt = useCallback(
    (item: T, index: number, key: string) => {
      'worklet';
      const cache = built.value;
      const hit = cache[key];
      if (hit !== undefined) {
        return hit;
      }
      const value = buildItem(item, index, ctx.value);
      cache[key] = value;
      builtOrder.value.push(key);
      return value;
    },
    [built, builtOrder, ctx, buildItem],
  );

  // Evicts in insertion order, skipping anything still drawn. A long scroll
  // through a large wallet would otherwise retain every paragraph it ever
  // shaped.
  const evict = useCallback(
    (from: number, to: number) => {
      'worklet';
      const order = builtOrder.value;
      if (order.length <= cacheLimit) {
        return;
      }
      const cache = built.value;
      const list = items.value;
      const keep: Record<string, true> = {};
      for (let i = from; i <= to; i++) {
        keep[keyExtractor(list[i], i)] = true;
      }
      const kept: string[] = [];
      for (let i = 0; i < order.length; i++) {
        const key = order[i];
        if (order.length - i <= cacheLimit || keep[key]) {
          kept.push(key);
          continue;
        }
        const value = cache[key];
        if (value !== undefined) {
          if (disposeItem) {
            disposeItem(value);
          }
          delete cache[key];
        }
      }
      builtOrder.value = kept;
    },
    [builtOrder, built, items, cacheLimit, keyExtractor, disposeItem],
  );

  const publish = useCallback(
    (next: SkPicture) => {
      'worklet';
      const stale = retired.value;
      retired.value = picture.value;
      picture.value = next;
      stale?.dispose?.();
    },
    [picture, retired],
  );

  const redrawItems = useCallback(() => {
    'worklet';
    const list = items.value;
    const rowHeights = heights.value;

    if (!active.value || list.length === 0 || rowHeights.length !== list.length) {
      if (drawnFrom.value !== -1) {
        drawnFrom.value = -1;
        drawnTo.value = -1;
        publish(emptyPicture());
      }
      return;
    }

    const top = scrollY.value - headerOffset.value - overscan;
    const bottom = top + viewport.value + overscan * 2;

    // Walk the cursor back over rows that came into view above, then forward
    // over rows that left below it. Both loops run at most as many steps as
    // rows crossed since the last call, which for a scroll is zero or one.
    let index = firstIndex.value;
    let y = firstY.value;
    if (index >= list.length) {
      index = list.length - 1;
      y = tops.value[index];
    }
    while (index > 0 && y > top) {
      index -= 1;
      y -= rowHeights[index];
    }
    while (index < list.length - 1 && y + rowHeights[index] < top) {
      y += rowHeights[index];
      index += 1;
    }
    firstIndex.value = index;
    firstY.value = y;

    let last = index;
    let lastY = y + rowHeights[index];
    while (last < list.length - 1 && lastY < bottom) {
      last += 1;
      lastY += rowHeights[last];
    }

    if (index === drawnFrom.value && last === drawnTo.value) {
      return;
    }
    // The picture being replaced stays alive one more generation (see publish),
    // so its rows have to survive this eviction too.
    const heldFrom = drawnFrom.value === -1 ? index : drawnFrom.value;
    const heldTo = drawnTo.value === -1 ? last : drawnTo.value;
    drawnFrom.value = index;
    drawnTo.value = last;

    const context_ = ctx.value;
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording();
    let rowY = y;
    for (let i = index; i <= last; i++) {
      const item = list[i];
      const key = keyExtractor(item, i);
      drawItem(canvas, item, getBuilt(item, i, key), i, rowY, context_);
      rowY += rowHeights[i];
    }
    publish(recorder.finishRecordingAsPicture());

    evict(Math.min(index, heldFrom), Math.max(last, heldTo));
  }, [
    items,
    heights,
    tops,
    active,
    scrollY,
    headerOffset,
    viewport,
    firstIndex,
    firstY,
    drawnFrom,
    drawnTo,
    ctx,
    overscan,
    keyExtractor,
    drawItem,
    getBuilt,
    evict,
    publish,
  ]);

  // Drops every cached row, then re-measures and re-records. Used when the
  // data or the context changes under the list. The rows are released rather
  // than disposed: the picture still on screen draws some of them, and it
  // outlives this call by a generation.
  const reset = useCallback(
    (nextItems: T[], nextContext: C) => {
      'worklet';
      built.value = {};
      builtOrder.value = [];
      items.value = nextItems;
      ctx.value = nextContext;
      firstIndex.value = 0;
      firstY.value = 0;
      drawnFrom.value = -1;
      drawnTo.value = -1;
      measureAll();
      redrawItems();
    },
    [
      built,
      builtOrder,
      items,
      ctx,
      firstIndex,
      firstY,
      drawnFrom,
      drawnTo,
      measureAll,
      redrawItems,
    ],
  );

  useEffect(() => {
    runOnUI(reset)(data, context);
  }, [data, context, reset]);

  useEffect(() => {
    active.value = enabled;
    runOnUI(redrawItems)();
  }, [enabled, active, redrawItems]);

  useEffect(() => {
    viewport.value = viewportHeight;
    runOnUI(redrawItems)();
  }, [viewportHeight, viewport, redrawItems]);

  // One number, so the reaction allocates nothing per frame. This is the only
  // thing that runs while scrolling.
  useAnimatedReaction(
    () => scrollY.value - headerOffset.value,
    () => {
      redrawItems();
    },
    [redrawItems],
  );

  const rowAt = useCallback(
    (contentY: number) => {
      'worklet';
      const rowTops = tops.value;
      let lo = 0;
      let hi = rowTops.length - 1;
      let found = rowTops.length - 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (rowTops[mid] + heights.value[mid] > contentY) {
          found = mid;
          hi = mid - 1;
        } else {
          lo = mid + 1;
        }
      }
      return found;
    },
    [tops, heights],
  );

  const rowBounds = useCallback(
    (index: number) => {
      'worklet';
      const top = tops.value[index] ?? 0;
      return {top, bottom: top + (heights.value[index] ?? 0)};
    },
    [tops, heights],
  );

  return useMemo(
    () => ({picture, contentHeight, rowAt, rowBounds}),
    [picture, contentHeight, rowAt, rowBounds],
  );
};
