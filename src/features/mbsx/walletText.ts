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
