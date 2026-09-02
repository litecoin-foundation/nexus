import notifee from '@notifee/react-native';

/**
 * A local notification for a problem the user must act on, reachable from the
 * headless wake task where no ui exists. A no-op when notification permission
 * was never granted, so callers must not rely on it alone.
 */
export const notifySwapProblem = async (body: string) => {
  try {
    const channelId = await notifee.createChannel({
      id: 'mbsx',
      name: 'Swaps',
    });
    await notifee.displayNotification({
      title: 'Swaps need attention',
      body,
      android: {channelId},
    });
  } catch (e) {
    console.warn('mbsx could not notify:', (e as Error).message);
  }
};
