import {
  isOpenRequestState,
  isTerminalState,
  listDeposits,
  listRequests,
  listSwaps,
} from './adapter';

const countLine = (count: number, one: string, many: string) =>
  count <= 0 ? '' : count === 1 ? one : `${count} ${many}`;

export type MenuMarks = {
  swaps: string;
  requests: string;
};

const counts = () => {
  const swaps = (listSwaps() ?? []).filter(
    swap => !isTerminalState(swap.state),
  ).length;
  const requests = listRequests() ?? [];
  const offers = requests.filter(
    request => request.state === 'OFFER_RECEIVED',
  ).length;
  const waiting = requests.filter(
    request =>
      isOpenRequestState(request.state) && request.state !== 'OFFER_RECEIVED',
  ).length;
  const short = (listDeposits() ?? []).filter(
    deposit => deposit.state === 'SHORT',
  ).length;
  return {swaps, offers, waiting, short};
};

export const readMenuMarks = (): MenuMarks => {
  const {swaps, offers, waiting, short} = counts();
  const requests =
    short > 0
      ? countLine(short, 'Short payment', 'short payments')
      : offers > 0
        ? countLine(offers, 'Offer ready', 'offers ready')
        : countLine(waiting, 'In progress', 'in progress');
  return {
    swaps: countLine(swaps, 'In progress', 'in progress'),
    requests,
  };
};

export const entryScreen = (): 'SwapList' | 'RequestList' | null => {
  const {swaps, offers, waiting, short} = counts();
  if (short > 0 || offers > 0) {
    return 'RequestList';
  }
  if (swaps > 0) {
    return 'SwapList';
  }
  if (waiting > 0) {
    return 'RequestList';
  }
  return null;
};
