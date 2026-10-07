import {useEffect} from 'react';
import notifee, {EventType} from '@notifee/react-native';

import {navigationRef} from '../../../navigation/NavigationService';

const openScreen = (screen: string, params: Record<string, string>) => {
  (
    navigationRef.navigate as (
      name: string,
      params?: Record<string, unknown>,
    ) => void
  )('NewWalletStack', {
    screen: 'MbsxStack',
    params: {screen, params, initial: false},
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
    let pending: {screen: string; params: Record<string, string>} | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;

    const flush = () => {
      if (!pending || !walletIsOpen()) {
        return;
      }
      const target = pending;
      pending = null;
      openScreen(target.screen, target.params);
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const queue = (data: {swapId?: unknown; requestId?: unknown} | undefined) => {
      const swapId = data?.swapId;
      const requestId = data?.requestId;
      if (typeof requestId === 'string' && requestId !== '') {
        pending = {screen: 'RequestDetail', params: {requestId}};
      } else if (typeof swapId === 'string' && swapId !== '') {
        pending = {screen: 'SwapDetail', params: {swapId}};
      } else {
        return;
      }
      flush();
      if (pending && !timer) {
        timer = setInterval(flush, 400);
      }
    };

    const unsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        queue(detail.notification?.data);
      }
    });
    notifee.getInitialNotification().then(initial => {
      queue(initial?.notification.data);
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
