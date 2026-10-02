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
): string => {
  if (!state) {
    return '';
  }
  const sent = coinName(coinFrom);
  const got = coinName(coinTo);
  const text: Record<string, string> = {
    SENT: 'Offer sent',
    RECEIVING: 'Receiving the offer',
    RECEIVED: 'Offer ready to accept',
    RECEIVING_ACC: 'Accepting the offer',
    ACCEPTED: 'Swap accepted',
    SCRIPT_COIN_LOCKED: `${sent} is locked`,
    NOSCRIPT_COIN_LOCKED: `${got} is locked`,
    SCRIPT_COIN_LOCK_RELEASED: `${sent} can be redeemed`,
    NOSCRIPT_COIN_LOCK_RELEASED: `${got} can be redeemed`,
    SCRIPT_COIN_LOCK_REDEEMED: `${sent} has been redeemed`,
    NOSCRIPT_TX_REDEEMED: `${got} has been redeemed`,
    NOSCRIPT_TX_RECOVERED: `${got} has been recovered`,
    SCRIPT_COIN_LOCK_PREREFUND: `Preparing to refund ${sent}`,
    COMPLETED: 'Swap complete',
    REJECTED: 'Offer rejected',
    EXPIRED: 'Offer expired',
    TIMEDOUT: 'Swap timed out',
    ABANDONED: 'Swap abandoned',
    FAILED: 'Swap failed',
    FAILED_REFUNDED: `Swap failed. ${sent} was refunded`,
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
    OFFER_RECEIVED: 'Offer ready to accept',
    ACCEPT_SENT: 'Accepting the offer',
    REVOKED: 'Request cancelled',
    EXPIRED: 'Request expired',
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
    SEEN: 'Payment seen, waiting for a confirmation',
    SHORT: 'Less than the amount due arrived',
    RECEIVED: 'Payment received',
    REQUESTED: 'Finding a swap',
    NO_QUOTE: 'No acceptable offer',
    SWEEPING: `Returning your ${paid}`,
    SWEPT: `Your ${paid} was returned`,
    SPENT: 'Swapping',
    EXPIRED: 'Expired unpaid',
    CANCELLED: 'Cancelled',
  };
  return text[state] ?? state;
};

export const useShowRawStates = () => {
  const [showRaw, setShowRaw] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      readConfig().then(config => {
        if (live) {
          setShowRaw(config?.show_raw_states === true);
        }
      });
      return () => {
        live = false;
      };
    }, []),
  );
  return showRaw;
};
