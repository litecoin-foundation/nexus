import notifee, {AndroidImportance} from '@notifee/react-native';

import {readConfig} from './config';
import {swapStateText} from '../stateText';
import {walletTitle} from '../walletText';
import type {SwapSummary} from '../types';

const channel = () =>
  notifee.createChannel({
    id: 'mbsx-swaps',
    name: 'Swaps',
    importance: AndroidImportance.HIGH,
  });

type EndedSwap = Pick<
  SwapSummary,
  'id' | 'state' | 'coin_from' | 'coin_to'
>;

const notificationsOn = async () =>
  (await readConfig())?.notify_swaps !== false;

export const notifySwapEnded = async (swap: EndedSwap) => {
  if (!(await notificationsOn())) {
    return;
  }
  try {
    const channelId = await channel();
    const body =
      swap.state === 'COMPLETED'
        ? `${swap.coin_from} for ${swap.coin_to}`
        : swapStateText(swap.state, swap.coin_from, swap.coin_to);
    await notifee.displayNotification({
      id: `mbsx-swap-${swap.id}`,
      title: walletTitle(swap.state),
      body,
      data: {swapId: swap.id},
      android: {
        channelId,
        pressAction: {id: 'mbsx-swap', launchActivity: 'default'},
      },
    });
  } catch (e) {
    console.warn('mbsx could not notify:', (e as Error).message);
  }
};

/**
 * A local notification for a problem the user must act on, reachable from the
 * headless wake task where no ui exists. A no-op when notification permission
 * was never granted, so callers must not rely on it alone.
 */
export const notifyOfferReady = async (requestId?: string) => {
  if (!(await notificationsOn())) {
    return;
  }
  try {
    const channelId = await channel();
    await notifee.displayNotification({
      id: requestId ? `mbsx-offer-${requestId}` : 'mbsx-offer-ready',
      title: 'Offer ready',
      body: 'An offer is ready to accept',
      data: requestId ? {requestId} : undefined,
      android: {
        channelId,
        pressAction: {id: 'mbsx-request', launchActivity: 'default'},
      },
    });
  } catch (e) {
    console.warn('mbsx could not notify:', (e as Error).message);
  }
};

export const notifySwapProblem = async (body: string) => {
  if (!(await notificationsOn())) {
    return;
  }
  try {
    const channelId = await channel();
    await notifee.displayNotification({
      title: 'Swaps need attention',
      body,
      android: {channelId},
    });
  } catch (e) {
    console.warn('mbsx could not notify:', (e as Error).message);
  }
};
