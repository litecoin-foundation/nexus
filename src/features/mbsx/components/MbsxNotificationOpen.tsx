import {useEffect} from 'react';
import notifee, {EventType} from '@notifee/react-native';

import {navigationRef} from '../../../navigation/NavigationService';

const openSwap = (swapId: string) => {
  (
    navigationRef.navigate as (
      name: string,
      params?: Record<string, unknown>,
    ) => void
  )('NewWalletStack', {
    screen: 'MbsxStack',
    params: {
      screen: 'SwapDetail',
      params: {swapId},
      initial: false,
    },
  });
};

const walletIsOpen = () => {
  if (!navigationRef.isReady()) {
    return false;
  }
  const root = navigationRef.getRootState();
  return root?.routes[root.index ?? 0]?.name === 'NewWalletStack';
};

const MbsxNotificationOpen = () => {
  useEffect(() => {
    let pending = '';
    let timer: ReturnType<typeof setInterval> | undefined;

    const flush = () => {
      if (!pending || !walletIsOpen()) {
        return;
      }
      const swapId = pending;
      pending = '';
      openSwap(swapId);
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const queue = (swapId: unknown) => {
      if (typeof swapId !== 'string' || swapId === '') {
        return;
      }
      pending = swapId;
      flush();
      if (pending && !timer) {
        timer = setInterval(flush, 400);
      }
    };

    const unsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        queue(detail.notification?.data?.swapId);
      }
    });
    notifee.getInitialNotification().then(initial => {
      queue(initial?.notification.data?.swapId);
    });

    return () => {
      unsubscribe();
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  return null;
};

export default MbsxNotificationOpen;
