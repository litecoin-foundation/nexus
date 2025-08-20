import {RnTor} from 'react-native-nitro-tor';
import * as RNFS from '@dr.pogodin/react-native-fs';

// NOTE: takes 30 to 60 seconds to start for the first time
export const startTor = async () => {
  try {
    // NOTE: ensure directory already exists, otherwise tor won't start
    const torDataDir = `${RNFS.DocumentDirectoryPath}/tor_data`;
    await RNFS.mkdir(torDataDir).catch(() => {});

    const result = await RnTor.startTorIfNotRunning({
      data_dir: torDataDir,
      socks_port: 9150,
      target_port: 8080,
      timeout_ms: 60000,
    });

    if (result.is_success) {
      if (__DEV__) {
        console.log('Tor initialized successfully');
      }
      return true;
    } else {
      console.error('Tor initialization failed:', result.error_message);
      return false;
    }
  } catch (error) {
    console.error('Error starting Tor:', error);
    return false;
  }
};

export const checkTorStatus = async () => {
  const status = await RnTor.getServiceStatus();
  if (__DEV__) {
    console.log(`Current Tor service status: ${status}`);
  }
};

export const isTorReady = async () => {
  const status = await RnTor.getServiceStatus();
  if (__DEV__) {
    console.log(`Current Tor service status: ${status}`);
  }
  return status === 1;
};

const fetchResolveRegular = (
  url: string,
  fetchOptions: {[key: string]: any},
) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        console.warn('Regular request failed with status:');
        const error = await res.json();
        reject(error);
        return;
      }
      if (__DEV__) {
        console.log('Regular request passed successfully');
      }
      try {
        const data = await res.json();
        resolve(data);
      } catch (jsonError) {
        // Note: response has no JSON content, resolve with empty object
        resolve({});
      }
    } catch (error) {
      reject(error);
    }
  });
};

const fetchResolveWithTor = (
  url: string,
  fetchOptions: {[key: string]: any},
) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const torResponse =
        fetchOptions.method === 'POST'
          ? await RnTor.httpPost({
              url,
              headers: JSON.stringify(fetchOptions.headers),
              body: fetchOptions.body || '',
              timeout_ms: 30000,
            })
          : await RnTor.httpGet({
              url,
              headers: JSON.stringify(fetchOptions.headers),
              timeout_ms: 30000,
            });
      if (torResponse.status_code < 200 || torResponse.status_code >= 300) {
        console.warn(
          'Tor request failed with status:',
          torResponse.status_code,
          'Error:',
          torResponse.error,
        );
        throw new Error(
          torResponse.error ||
            `Tor request failed with status ${torResponse.status_code}`,
        );
      }
      if (__DEV__) {
        console.log('Tor request passed successfully');
      }
      try {
        const data = JSON.parse(torResponse.body);
        resolve(data);
      } catch (jsonError) {
        // Note: response has no JSON content, resolve with empty object
        resolve({});
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const fetchResolve = (
  url: string,
  fetchOptions: {[key: string]: any},
  useTor: boolean,
) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      if (useTor && (await isTorReady())) {
        try {
          const data = await fetchResolveWithTor(url, fetchOptions);
          resolve(data);
        } catch (torError) {
          // fallback to regular fetch when tor unavailable
          const data = await fetchResolveRegular(url, fetchOptions);
          resolve(data);
        }
      } else {
        const data = await fetchResolveRegular(url, fetchOptions);
        resolve(data);
      }
    } catch (error) {
      reject(error);
    }
  });
};
