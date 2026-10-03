import {DEFAULT_SLIPPAGE, offerWarning, slippageFor} from './useSwapAmounts';

describe('slippageFor', () => {
  it('follows the glue up to the 5% cap, and 1% until it says', () => {
    expect(slippageFor(undefined)).toBe(DEFAULT_SLIPPAGE);
    expect(slippageFor(150)).toBe(0.015);
    expect(slippageFor(150n)).toBe(0.015);
    expect(slippageFor(0)).toBe(0);
    expect(slippageFor(900)).toBe(0.05);
    expect(slippageFor(-5)).toBe(0);
  });
});

describe('offerWarning', () => {
  const reference = {send: 80, receive: 100000, label: 'CoinGecko rate'};
  const offer = (receive: string, market?: string) => ({
    amount_send: '1',
    amount_receive: receive,
    market_amount_receive: market,
  });

  it('holds an offer to the independent rate, whatever the server says', () => {
    expect(offerWarning(offer('0.00072', '0.00072'), reference)).toBe(
      'You would receive 10% less than the CoinGecko rate.',
    );
    expect(offerWarning(offer('0.00078', '0.00072'), reference)).toBeNull();
    expect(offerWarning(offer('0.0009'), reference)).toBeNull();
  });

  it("falls back to the server's rate, either way", () => {
    expect(offerWarning(offer('0.9', '1'))).toBe(
      "You would receive 10% less than the server's rate.",
    );
    expect(offerWarning(offer('1.1', '1'))).toBe(
      "You would receive 10% more than the server's rate.",
    );
    expect(offerWarning(offer('0', '1'), reference)).toBe(
      'You would receive nothing for this offer.',
    );
  });
});
