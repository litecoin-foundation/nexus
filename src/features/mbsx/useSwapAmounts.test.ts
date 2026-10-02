import {DEFAULT_SLIPPAGE, slippageFor} from './useSwapAmounts';

describe('slippageFor', () => {
  it('follows the glue up to the 5% cap, and 1% until it says', () => {
    expect(slippageFor(undefined)).toBe(DEFAULT_SLIPPAGE);
    expect(slippageFor(150)).toBe(0.015);
    expect(slippageFor(0)).toBe(0);
    expect(slippageFor(900)).toBe(0.05);
    expect(slippageFor(-5)).toBe(0);
  });
});
