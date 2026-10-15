import {useEffect, useState} from 'react';

import {
  getOffersEstimate,
  requestOffersEstimate,
  type OffersEstimateRequest,
} from './adapter';
import type {OffersEstimate} from './types';

const POLL_MS = 1000;
const REFRESH_MS = 60 * 1000;

// null while the first answer is awaited, and while there is no request.
export const useOffersEstimate = (
  request: OffersEstimateRequest | null,
  refresh: boolean = false,
): OffersEstimate | null => {
  const [estimate, setEstimate] = useState<OffersEstimate | null>(null);
  const key = request === null ? '' : JSON.stringify(request);

  useEffect(() => {
    setEstimate(null);
    if (key === '') {
      return;
    }
    const data: OffersEstimateRequest = JSON.parse(key);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = (next: OffersEstimate) => {
      setEstimate(next);
      if (refresh) {
        timer = setTimeout(ask, REFRESH_MS);
      }
    };
    const poll = (messageId: string) => {
      const got = getOffersEstimate(messageId);
      if (got !== null && got.state === 'waiting') {
        timer = setTimeout(() => poll(messageId), POLL_MS);
        return;
      }
      settle(got ?? {state: 'none'});
    };
    const ask = () => {
      const rv = requestOffersEstimate(data);
      if (rv.retry_in !== undefined) {
        timer = setTimeout(ask, Number(rv.retry_in) * 1000);
      } else if (rv.message_id) {
        poll(rv.message_id);
      } else {
        settle({state: 'none'});
      }
    };
    ask();
    return () => clearTimeout(timer);
  }, [key, refresh]);

  return estimate;
};

export const offersAvailable = (estimate: OffersEstimate) =>
  (estimate.num_private ?? 0n) +
    (estimate.num_providers ?? 0n) +
    (estimate.num_bridged ?? 0n) >
  0n;

export const offersEstimateText = (estimate: OffersEstimate | null): string => {
  if (estimate === null) {
    return 'Checking…';
  }
  if (estimate.state !== 'answered') {
    return 'No estimate, the swap server did not answer';
  }
  const parts: string[] = [];
  if (estimate.num_private) {
    parts.push(`${estimate.num_private} private`);
  }
  if (estimate.num_bridged) {
    parts.push(
      `${estimate.num_bridged} bridged` +
        (estimate.num_below_minimum
          ? ` (${estimate.num_below_minimum} below your minimum)`
          : ''),
    );
  }
  return parts.length ? parts.join(', ') : 'None';
};

export const providersText = (estimate: OffersEstimate | null): string => {
  const providers = estimate?.num_providers ?? 0n;
  if (!providers) {
    return '';
  }
  return providers === 1n
    ? '1 market maker will be asked.'
    : `${providers} market makers will be asked.`;
};

export const NO_OFFERS_WARNING =
  'No offers are available for this request right now. If you pay in, your coins may wait or come back, less network fees.';
