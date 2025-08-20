import {RnTor} from 'react-native-nitro-tor';
import * as RNFS from '@dr.pogodin/react-native-fs';

// NOTE: takes 30 to 60 seconds to start for the first time
export const startTor = async () => {
  try {
    // NOTE: ensure directory already exists, otherwise tor won't start
    const torDataDir = `${RNFS.DocumentDirectoryPath}/tor_data`;
    await RNFS.mkdir(torDataDir).catch(err => {
      if (__DEV__) {
        console.error('Failed to create tor data directory:', err);
      }
    });

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
  try {
    const status = await RnTor.getServiceStatus();
    if (__DEV__) {
      console.log(`Current Tor service status: ${status}`);
    }
    return status;
  } catch (error) {
    console.error('Error checking Tor status:', error);
    return -1;
  }
};

export const isTorReady = async () => {
  try {
    const status = await RnTor.getServiceStatus();
    if (__DEV__) {
      console.log(`Current Tor service status: ${status}`);
    }
    return status === 1;
  } catch (error) {
    console.error('Error checking if Tor is ready:', error);
    return false;
  }
};

const fetchResolveRegular = (
  url: string,
  fetchOptions: {[key: string]: any},
) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        const errorBody = await res.text();
        console.warn(`Regular request failed with status: ${res.status}`);
        reject(
          new Error(`Request failed with status ${res.status}: ${errorBody}`),
        );
        return;
      }
      if (__DEV__) {
        console.log('Regular request passed successfully');
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const data = await res.json();
          resolve(data);
        } catch (jsonError) {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        try {
          const textData = await res.text();
          resolve(textData);
        } catch (textError) {
          reject(new Error('Failed to read response as text'));
        }
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
              headers: JSON.stringify(fetchOptions.headers || {}),
              body: fetchOptions.body || '',
              timeout_ms: 30000,
            })
          : await RnTor.httpGet({
              url,
              headers: JSON.stringify(fetchOptions.headers || {}),
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
      if (torResponse.body == null) {
        resolve('');
      } else {
        try {
          const data = JSON.parse(torResponse.body);
          resolve(data);
        } catch (jsonError) {
          resolve(torResponse.body);
        }
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
          return; // NOTE: exit if Tor request is successful
        } catch (torError) {
          console.warn(
            'Tor request failed, falling back to regular fetch:',
            torError,
          );
          // NOTE: proceed to fallback
        }
      }
      // NOTE: fallback to regular fetch if Tor is not used, not ready, or failed
      const data = await fetchResolveRegular(url, fetchOptions);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
