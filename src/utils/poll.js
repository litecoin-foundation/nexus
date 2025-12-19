export const sleep = (milliseconds = 5000) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

// Polling registry to track and manage active pollers
const activePollers = new Map();
let pollerIdCounter = 0;

export const poll = async (api, interval = 5000, retries = Infinity) => {
  const pollerId = pollerIdCounter++;
  const cancelFlag = {cancelled: false};
  activePollers.set(pollerId, cancelFlag);

  try {
    while (retries-- && !cancelFlag.cancelled) {
      const response = await api();
      if (response) {
        activePollers.delete(pollerId);
        return response;
      }
      if (!cancelFlag.cancelled) {
        await sleep(interval);
      }
    }
    if (cancelFlag.cancelled) {
      console.log(`Poller ${pollerId} was cancelled`);
    } else {
      throw new Error('Maximum retries for polling reached');
    }
  } finally {
    activePollers.delete(pollerId);
  }
};

// Stop all active pollers
export const stopAllPollers = () => {
  console.log(`Stopping ${activePollers.size} active pollers`);
  activePollers.forEach(cancelFlag => {
    cancelFlag.cancelled = true;
  });
  activePollers.clear();
};

// Get count of active pollers (for debugging)
export const getActivePollerCount = () => {
  return activePollers.size;
};
