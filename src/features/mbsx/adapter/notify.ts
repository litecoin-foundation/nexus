import notifee, {AndroidImportance} from '@notifee/react-native';

import {readConfig} from './config';
import {swapStateText} from '../stateText';
import {swapSides, walletTitle} from '../walletText';
import type {SwapSummary} from '../types';

// A drawable react-native-nitro-bsx ships, merged into the app's resources
const SMALL_ICON = 'bsx_ic_stat_swap';

const channel = () =>
  notifee.createChannel({
    id: 'mbsx-swaps',
    name: 'Swaps',
    importance: AndroidImportance.HIGH,
  });

type EndedSwap = Pick<
  SwapSummary,
  | 'id'
  | 'state'
  | 'coin_from'
  | 'coin_to'
  | 'amount_from'
  | 'amount_to'
  | 'participating'
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
        ? `${swapSides(swap).sendCoin} for ${swapSides(swap).receiveCoin}`
        : swapStateText(
            swap.state,
            swap.coin_from,
            swap.coin_to,
            swap.participating,
          );
    await notifee.displayNotification({
      id: `mbsx-swap-${swap.id}`,
      title: walletTitle(swap.state),
      body,
      data: {swapId: swap.id},
      android: {
        channelId,
        smallIcon: SMALL_ICON,
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
export const notifySwapProblem = async (body: string) => {
  if (!(await notificationsOn())) {
    return;
  }
  try {
    const channelId = await channel();
    await notifee.displayNotification({
      title: 'Swaps Need Attention',
      body,
      android: {channelId, smallIcon: SMALL_ICON},
    });
  } catch (e) {
    console.warn('mbsx could not notify:', (e as Error).message);
  }
};
