import type {SwapSummary} from './types';

const ENDED_TITLES: Record<string, string> = {
  COMPLETED: 'Swap Complete',
  FAILED_REFUNDED: 'Swap refunded',
  TIMEDOUT: 'Swap timed out',
  ABANDONED: 'Swap abandoned',
  REJECTED: 'Offer rejected',
  EXPIRED: 'Offer expired',
  FAILED: 'Swap failed',
  ERROR: 'Swap failed',
  FAILED_SWIPED: 'Swap failed',
  FAILED_SWIPED_USED_MERCY: 'Swap failed',
  FAILED_SWIPED_MERCY_UNUSED: 'Swap failed',
};

export const walletTitle = (state: string): string =>
  ENDED_TITLES[state] ?? 'Swap in progress';

export const isSwapComplete = (state: string) => state === 'COMPLETED';

export const swapSides = (
  swap: Pick<
    SwapSummary,
    'coin_from' | 'coin_to' | 'amount_from' | 'amount_to' | 'participating'
  >,
) =>
  swap.participating
    ? {
        sendCoin: swap.coin_to,
        sendAmount: swap.amount_to,
        receiveCoin: swap.coin_from,
        receiveAmount: swap.amount_from,
      }
    : {
        sendCoin: swap.coin_from,
        sendAmount: swap.amount_from,
        receiveCoin: swap.coin_to,
        receiveAmount: swap.amount_to,
      };
