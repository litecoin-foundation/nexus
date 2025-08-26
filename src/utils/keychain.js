import * as Keychain from 'react-native-keychain';

const VERSION = '0';
const USER = 'lightning';

export const setItem = async (key, value) => {
  const options = {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
  const vKey = `${VERSION}_${key}`;
  await Keychain.setInternetCredentials(vKey, USER, value, options);
};

export const getItem = async (key) => {
  const vKey = `${VERSION}_${key}`;
  const credentials = await Keychain.getInternetCredentials(vKey);
  if (credentials) {
    return credentials.password;
  } else {
    return null;
  }
};

export const resetItem = async (key) => {
  const vKey = `${VERSION}_${key}`;
  await Keychain.resetInternetCredentials(vKey);
};
