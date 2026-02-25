import {createMMKV} from 'react-native-mmkv';
import {Storage} from 'redux-persist';
import Crypto from 'react-native-quick-crypto';
import {getItem, setItem} from 'expo-secure-store';

// generate 16 byte randomKey on startup
const randomKey = Crypto.randomBytes(16).toString();

// fetch encryptionKey, return existing key (if exists) or use randomKey
const encryptionKey = getItem('plasmaKey');
const plasmaKey = encryptionKey === null ? randomKey : encryptionKey;

// if keychain doesn't include plasmaKey set to randomBytes()
if (encryptionKey === null) {
  setItem('plasmaKey', randomKey);
}

const storage = createMMKV({
  id: 'plasma-storage',
  encryptionKey: plasmaKey,
});

const reduxStorage: Storage = {
  setItem: (key, value) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: key => {
    const value = storage.getString(key);
    return Promise.resolve(value);
  },
  removeItem: key => {
    storage.remove(key);
    return Promise.resolve();
  },
};

export {reduxStorage as storage};
