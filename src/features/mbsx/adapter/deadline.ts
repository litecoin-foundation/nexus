export const LND_CALL_MS = 30_000;

// nitro-lndltc's calls settle only when lndmobile answers; before lnd starts they never do.
export const withDeadline = <T>(
  call: Promise<T>,
  what: string,
  ms = LND_CALL_MS,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${what} did not answer in ${ms / 1000}s`)),
      ms,
    );
    call.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
