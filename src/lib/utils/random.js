import {NativeModules} from 'react-native';
const {RNRandomBytes} = NativeModules;

export const getRandomBytes = () => {
  return new Promise((resolve, reject) => {
    return RNRandomBytes.randomBytes(32, (err, bytes) => {
      if (err) {
        reject(err);
      } else {
        resolve(bytes);
      }
    });
  });
};
