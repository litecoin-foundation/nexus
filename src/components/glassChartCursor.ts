import {makeMutable} from 'react-native-reanimated';
import type {SharedValue} from 'react-native-reanimated';

export interface CursorLut {
  cols: number;
  cx: Float32Array; // crosshair x, == x(d.x)
  cy: Float32Array; // crosshair y, == y(d.y)
  idx: Int32Array; // index into `data`, for haptic de-dupe and the readout
  pill: string[]; // in-chart fiat label
  pillW: Float32Array;
}

export const EMPTY_LUT: CursorLut = {
  cols: 0,
  cx: new Float32Array(0),
  cy: new Float32Array(0),
  idx: new Int32Array(0),
  pill: [],
  pillW: new Float32Array(0),
};

// module singleton; only one chart is mounted at a time
export const cursorLut: SharedValue<CursorLut> = makeMutable(EMPTY_LUT);
export const cursorActive = makeMutable(0);
export const cursorCol = makeMutable(-1);
export const cursorIdx = makeMutable(-1);
export const cursorX = makeMutable(0);
export const cursorY = makeMutable(0);

// module state outlives the component, so clear it on unmount
export const resetCursor = () => {
  'worklet';
  cursorActive.value = 0;
  cursorCol.value = -1;
  cursorIdx.value = -1;
};
