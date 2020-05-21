const sleep = (milliseconds = 5000) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const poll = async (api, interval = 5000, retries = Infinity) => {
  while (retries--) {
    const response = await api();
    if (response) {
      return response;
    }
    await sleep(interval);
  }
  throw new Error('Maximum retries for polling reached');
};
