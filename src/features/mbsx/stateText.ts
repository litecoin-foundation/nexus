import {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

import {readConfig} from './adapter';

const COIN_NAMES: Record<string, string> = {
  LTC: 'Litecoin',
  BTC: 'Bitcoin',
  PART: 'Particl',
  XMR: 'Monero',
  FIRO: 'Firo',
};

const coinName = (ticker: string) => COIN_NAMES[ticker] ?? ticker;

export const swapStateText = (
  state: string | undefined,
  coinFrom: string,
  coinTo: string,
  participating = false,
): string => {
  if (!state) {
    return '';
  }
  const sent = coinName(coinFrom);
  const got = coinName(coinTo);
  const text: Record<string, string> = {
    SENT: 'Waiting to send the offer',
    RECEIVING: 'Waiting for the offer',
    RECEIVED: 'The offer is ready to accept',
    RECEIVING_ACC: 'The offer is being accepted',
    AWAITING_LOCK_SIGS: "Waiting for the other side's signatures",
    ACCEPTED: 'The swap has been accepted',
    SCRIPT_COIN_LOCKED: `${sent} is locked`,
    NOSCRIPT_COIN_LOCKED: `${got} is locked`,
    SCRIPT_COIN_LOCK_RELEASED: `${sent} can be redeemed`,
    NOSCRIPT_COIN_LOCK_RELEASED: `${got} can be redeemed`,
    SCRIPT_COIN_LOCK_REDEEMED: `${sent} has been redeemed`,
    NOSCRIPT_TX_REDEEMED: `${got} has been redeemed`,
    NOSCRIPT_TX_RECOVERED: `${got} has been recovered`,
    SCRIPT_COIN_LOCK_PREREFUND: `Preparing to refund ${sent}`,
    COMPLETED: 'Swap complete',
    REJECTED: 'The offer was not accepted',
    EXPIRED: 'The offer ran out of time',
    TIMEDOUT: 'It ran out of time before it could finish',
    ABANDONED: 'It was left before it could finish',
    FAILED: 'The swap could not finish',
    FAILED_REFUNDED: `Swap failed. ${participating ? got : sent} was refunded`,
    ERROR: 'Something went wrong',
    FAILED_SWIPED: 'The other side took the locked coins',
    FAILED_SWIPED_SENDING_MERCY: 'Returning what can be recovered',
    FAILED_SWIPED_USING_MERCY: `Recovering ${got}`,
    FAILED_SWIPED_USED_MERCY: `${got} was recovered`,
    FAILED_SWIPED_MERCY_UNUSED: `${got} could not be recovered`,
  };
  return text[state] ?? state;
};

export const requestStateText = (state: string | undefined): string => {
  if (!state) {
    return '';
  }
  const text: Record<string, string> = {
    SENT: 'Waiting for an offer',
    OFFER_RECEIVED: 'An offer is ready to accept',
    ACCEPT_SENT: 'The offer is being accepted',
    REVOKED: 'The request was cancelled',
    EXPIRED: 'The request expired',
    ERROR: 'Something went wrong',
  };
  return text[state] ?? state;
};

export const depositStateText = (
  state: string | undefined,
  coin: string,
): string => {
  if (!state) {
    return '';
  }
  const paid = coinName(coin);
  const text: Record<string, string> = {
    WAITING: `Waiting for your ${paid}`,
    SEEN: 'Waiting for a confirmation',
    SHORT: 'Less than the amount due arrived',
    RECEIVED: 'The payment has arrived',
    REQUESTED: 'Waiting for a swap',
    NO_OFFER: 'No acceptable offer',
    SWEEPING: `Returning your ${paid}`,
    SWEPT: `Your ${paid} was returned`,
    SPENT: `Your ${paid} went into the swap`,
    EXPIRED: 'The pay-in expired unpaid',
    CANCELLED: 'The pay-in was cancelled',
  };
  return text[state] ?? state;
};

const useConfigFlag = (
  flag: 'show_raw_states' | 'show_debug' | 'show_utc_times',
) => {
  const [on, setOn] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      readConfig().then(config => {
        if (live) {
          setOn(config?.[flag] === true);
        }
      });
      return () => {
        live = false;
      };
    }, [flag]),
  );
  return on;
};

export const useShowRawStates = () => useConfigFlag('show_raw_states');

export const useShowDebug = () => useConfigFlag('show_debug');

export const useShowUtcTimes = () => useConfigFlag('show_utc_times');
