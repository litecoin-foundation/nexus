import React from 'react';
import {PixelRatio, View} from 'react-native';
import {act, fireEvent, render} from '@testing-library/react-native';
import {makeImageFromView} from '@shopify/react-native-skia';
import type {SkImage, SkImageFilter} from '@shopify/react-native-skia';
import {useAnimatedReaction} from 'react-native-reanimated';
import type {SharedValue} from 'react-native-reanimated';

import NativeCardBackdrop from './NativeCardBackdrop';
import {prepareNativeCardBackdrop} from './nativeCardBackdropTexture';
import type {PreparedCardBackdrop} from './nativeCardBackdropTexture';

const mockBackdrop: {value: PreparedCardBackdrop | null} = {value: null};

jest.mock('./cardUnderlay', () => ({
  useNativeCardBackdrop: () => mockBackdrop,
}));
jest.mock('@shopify/react-native-skia', () => ({
  makeImageFromView: jest.fn(),
}));
jest.mock('./nativeCardBackdropTexture', () => ({
  prepareNativeCardBackdrop: jest.fn(),
}));
jest.mock('react-native-reanimated', () => ({
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
  useAnimatedReaction: jest.fn(),
}));

const capture = jest.mocked(makeImageFromView);
const prepare = jest.mocked(prepareNativeCardBackdrop);
const reaction = jest.mocked(useAnimatedReaction);
const sheetY = {value: 400} as SharedValue<number>;
const cardOpacity = {value: 0} as SharedValue<number>;
const image = () => ({dispose: jest.fn()}) as unknown as SkImage;
const card = (activeTab = 4, requestedTab = activeTab) => (
  <NativeCardBackdrop
    activeTab={activeTab}
    requestedTab={requestedTab}
    sheetY={sheetY}
    cardOpacity={cardOpacity}
    expandedY={300}>
    <View testID="card" />
  </NativeCardBackdrop>
);

const layout = (result: ReturnType<typeof render>, width = 390) => {
  const target = result.UNSAFE_getAllByType(View).find(v => v.props.onLayout)!;
  fireEvent(target, 'layout', {
    nativeEvent: {layout: {x: 0, y: 0, width, height: 520}},
  });
};
const notifyPosition = () => {
  const [read, react] = reaction.mock.calls[reaction.mock.calls.length - 1];
  act(() => react(read(), null));
};
const settle = () => {
  sheetY.value = 300;
  cardOpacity.value = 1;
  notifyPosition();
};
const tick = async (ms = 200) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  capture.mockReset();
  reaction.mockClear();
  prepare
    .mockReset()
    .mockImplementation((source, width, height, pixelRatio) => ({
      image: source,
      filter: {} as SkImageFilter,
      width,
      height,
      pixelRatio,
    }));
  mockBackdrop.value = null;
  sheetY.value = 400;
  cardOpacity.value = 0;
});

afterEach(() => {
  jest.clearAllTimers();
});

it('does no capture during opening or fading, then prepares one idle texture', async () => {
  const source = image();
  capture.mockResolvedValue(source);
  const result = render(card(), {createNodeMock: () => ({})});
  layout(result);
  notifyPosition();
  await tick(1000);
  expect(capture).not.toHaveBeenCalled();
  sheetY.value = 300;
  cardOpacity.value = 0.5;
  notifyPosition();
  await tick(1000);
  expect(capture).not.toHaveBeenCalled();
  settle();
  await tick(199);
  expect(capture).not.toHaveBeenCalled();
  await tick(1);
  expect(mockBackdrop.value?.image).toBe(source);
  expect(prepare).toHaveBeenCalledWith(source, 390, 520, PixelRatio.get());
  await tick(2000);
  expect(capture).toHaveBeenCalledTimes(1);
  expect(prepare).toHaveBeenCalledTimes(1);
});

it('cancels a pending idle capture when closing starts', async () => {
  const result = render(card(), {createNodeMock: () => ({})});
  layout(result);
  settle();
  await tick(100);
  result.rerender(card(4, 0));
  await tick(1000);
  expect(capture).not.toHaveBeenCalled();
});

it('cancels capture during a drag and waits for settling again', async () => {
  capture.mockResolvedValue(image());
  const result = render(card(), {createNodeMock: () => ({})});
  layout(result);
  settle();
  await tick(100);
  sheetY.value = 320;
  notifyPosition();
  await tick(1000);
  expect(capture).not.toHaveBeenCalled();
  settle();
  await tick();
  expect(capture).toHaveBeenCalledTimes(1);
});

it('reuses the prepared texture while closing and reopening without capturing', async () => {
  const source = image();
  capture.mockResolvedValue(source);
  const result = render(card(), {createNodeMock: () => ({})});
  layout(result);
  settle();
  await tick();
  result.rerender(card(4, 0));
  expect(mockBackdrop.value?.image).toBe(source);
  result.rerender(card(0));
  expect(mockBackdrop.value).toBeNull();
  sheetY.value = 400;
  cardOpacity.value = 0;
  result.rerender(card(4));
  layout(result);
  notifyPosition();
  expect(mockBackdrop.value?.image).toBe(source);
  await tick(1000);
  expect(capture).toHaveBeenCalledTimes(1);
  expect(prepare).toHaveBeenCalledTimes(1);
});

it('discards a late capture when the user has already switched cards', async () => {
  let finish!: (source: SkImage) => void;
  capture.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const result = render(card(), {createNodeMock: () => ({})});
  layout(result);
  settle();
  await tick();
  result.rerender(card(5));
  const current = image();
  capture.mockResolvedValue(current);
  settle();
  await tick();
  const stale = image();
  await act(async () => {
    finish(stale);
  });
  expect(mockBackdrop.value?.image).toBe(current);
  expect(stale.dispose).toHaveBeenCalledTimes(1);
  expect(prepare).toHaveBeenCalledTimes(1);
});

it('skips GPU preparation if motion starts before a capture resolves', async () => {
  let finish!: (source: SkImage) => void;
  capture.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const result = render(card(), {createNodeMock: () => ({})});
  layout(result);
  settle();
  await tick();
  sheetY.value = 330;
  // Simulate the UI thread moving before its JS cancellation is delivered.
  await act(async () => {
    finish(image());
  });
  expect(prepare).not.toHaveBeenCalled();
  expect(mockBackdrop.value).toBeNull();
});

it('bounds the retained texture cache to the two most recent cards', async () => {
  capture.mockImplementation(async () => image());
  const result = render(card(1), {createNodeMock: () => ({})});
  layout(result);
  settle();
  await tick();
  for (const tab of [4, 5]) {
    result.rerender(card(tab));
    settle();
    await tick();
  }
  result.rerender(card(4));
  expect(mockBackdrop.value).not.toBeNull();
  result.rerender(card(1));
  expect(mockBackdrop.value).toBeNull();
  expect(capture).toHaveBeenCalledTimes(3);
});

it('keeps a usable texture if an idle refresh fails', async () => {
  const source = image();
  capture
    .mockResolvedValueOnce(source)
    .mockRejectedValue(new Error('capture failed'));
  const result = render(card(), {createNodeMock: () => ({})});
  layout(result);
  settle();
  await tick();
  sheetY.value = 320;
  notifyPosition();
  settle();
  await tick();
  expect(mockBackdrop.value?.image).toBe(source);
  expect(prepare).toHaveBeenCalledTimes(1);
});

it('invalidates a cached texture on resize and cancels pending work on unmount', async () => {
  capture.mockResolvedValue(image());
  const result = render(card(), {createNodeMock: () => ({})});
  layout(result);
  settle();
  await tick();
  layout(result, 420);
  expect(mockBackdrop.value).toBeNull();
  result.unmount();
  await tick(1000);
  expect(capture).toHaveBeenCalledTimes(1);
});
