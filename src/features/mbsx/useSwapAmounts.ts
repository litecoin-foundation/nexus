import {useCallback, useState} from 'react';

import type {Reference} from './rates';

export type AmountUnit = 'coin' | 'usd';
export type AmountSide = 'from' | 'to';

// Applied whenever min_amount_to is derived rather than typed. The reference
// price is what the feed said, and a real offer sits below it by the
// counterparty's margin, so a floor set exactly at the reference would reject
// every honest offer. The glue announces the margin it allows; this is used
// until it has.
export const DEFAULT_SLIPPAGE = 0.01;
export const MAX_SLIPPAGE_BPS = 500;

export const slippageFor = (maxMarginBps?: bigint | number): number =>
  maxMarginBps === undefined
    ? DEFAULT_SLIPPAGE
    : Math.min(Math.max(Number(maxMarginBps), 0), MAX_SLIPPAGE_BPS) / 10000;

export const RATE_TOLERANCE = 0.05;

export const UNCHECKED_RATE =
  "This offer is not checked against an independent rate, only the swap server's.";

export type SwapAmounts = {
  fromCoin: string;
  fromUsd: string;
  toCoin: string;
  toUsd: string;
};

const EMPTY: SwapAmounts = {fromCoin: '', fromUsd: '', toCoin: '', toUsd: ''};

const num = (value: string): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const percent = (fraction: number): number =>
  Math.round(Math.abs(fraction) * 100);

export const offerWarning = (
  offer: {
    amount_send: string;
    amount_receive: string;
    market_amount_receive?: string;
  },
  reference?: Reference | null,
  requireReference = false,
): string | null => {
  const got = num(offer.amount_receive);
  if (got === null) {
    return 'You would receive nothing for this offer.';
  }
  if (reference) {
    const sent = num(offer.amount_send);
    if (sent === null) {
      return null;
    }
    const deviation = got / ((sent * reference.send) / reference.receive) - 1;
    return deviation < -RATE_TOLERANCE
      ? `You would receive ${percent(deviation)}% less than the ${
          reference.label
        }.`
      : null;
  }
  const market = num(offer.market_amount_receive ?? '');
  const deviation = market === null ? 0 : got / market - 1;
  const serverWarning =
    Math.abs(deviation) > RATE_TOLERANCE
      ? `You would receive ${percent(deviation)}% ${
          deviation < 0 ? 'less' : 'more'
        } than the server's rate.`
      : null;
  return (
    [requireReference ? UNCHECKED_RATE : null, serverWarning]
      .filter(Boolean)
      .join(' ') || null
  );
};

export const coinString = (n: number | null): string => {
  if (n === null || !Number.isFinite(n) || n <= 0) {
    return '';
  }
  // The coin's own scale, so the module's parseAmount accepts it: it rejects
  // more decimals than the coin has rather than rounding.
  return n.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
};

const usdString = (n: number | null): string =>
  n === null || !Number.isFinite(n) || n <= 0 ? '' : n.toFixed(2);

/**
 * The four values behind two amount fields, each with a fiat twin.
 *
 * Every edit rewrites all four from the one the user typed, so no field is ever
 * derived from a derived value and there is no feedback loop. The typed field is
 * authoritative and travels to the module verbatim.
 */
export const useSwapAmounts = (
  priceFrom: string | undefined,
  priceTo: string | undefined,
  slippage: number = DEFAULT_SLIPPAGE,
) => {
  const [amounts, setAmounts] = useState<SwapAmounts>(EMPTY);
  // basicswap's rate_lock, "Fix rate", and on by default for the same reason:
  // holding the rate and deriving the other amount is what a user wants almost
  // always. Off, both amounts stand as typed and the rate is whatever they imply.
  const [fixedRate, setFixedRate] = useState(true);

  const pFrom = priceFrom ? num(priceFrom) : null;
  const pTo = priceTo ? num(priceTo) : null;
  const canConvert = pFrom !== null && pTo !== null;

  const setAmount = useCallback(
    (side: AmountSide, unit: AmountUnit, raw: string) => {
      setAmounts(prev => {
        // The typed string is kept exactly as typed - reformatting it under the
        // cursor makes a decimal point impossible to enter.
        const typed = num(raw);
        const price = side === 'from' ? pFrom : pTo;

        // Kept unrounded.
        const sideUsdValue =
          unit === 'usd'
            ? typed
            : typed !== null && price
              ? typed * price
              : null;
        const sideCoin =
          unit === 'coin'
            ? raw
            : coinString(typed !== null && price ? typed / price : null);
        const sideUsd = unit === 'usd' ? raw : usdString(sideUsdValue);

        const next = {...EMPTY};
        if (side === 'from') {
          next.fromCoin = sideCoin;
          next.fromUsd = sideUsd;
        } else {
          next.toCoin = sideCoin;
          next.toUsd = sideUsd;
        }
        if (!canConvert || !fixedRate) {
          // Either the two sides cannot be related, or the user has said they
          // should not be: the other one is left alone rather than guessed at.
          return side === 'from'
            ? {...next, toCoin: prev.toCoin, toUsd: prev.toUsd}
            : {...next, fromCoin: prev.fromCoin, fromUsd: prev.fromUsd};
        }

        const usd = sideUsdValue;
        if (usd === null || usd <= 0) {
          return next;
        }
        if (side === 'from') {
          const otherUsd = usd * (1 - slippage);
          next.toUsd = usdString(otherUsd);
          next.toCoin = coinString(otherUsd / (pTo as number));
        } else {
          const otherUsd = usd / (1 - slippage);
          next.fromUsd = usdString(otherUsd);
          next.fromCoin = coinString(otherUsd / (pFrom as number));
        }
        return next;
      });
    },
    [canConvert, fixedRate, pFrom, pTo, slippage],
  );

  const reset = useCallback(() => setAmounts(EMPTY), []);

  // How far the receive side sits from the send side in value. Negative means
  // receiving less than sending, which is the direction that costs the user.
  const fromUsd = num(amounts.fromUsd);
  const toUsd = num(amounts.toUsd);
  const valueDeviation =
    canConvert && fromUsd !== null && toUsd !== null
      ? (toUsd - fromUsd) / fromUsd
      : null;

  return {
    fixedRate,
    setFixedRate,
    amounts,
    setAmount,
    reset,
    canConvert,
    valueDeviation,
  };
};
