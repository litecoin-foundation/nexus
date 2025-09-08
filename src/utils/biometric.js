import TouchID from 'react-native-touch-id';

import {setBiometricAvailability} from '../reducers/authentication';

const biometricConfig = {
  title: 'Authentication Required',
  imageColor: '#e00606',
  imageErrorColor: '#ff0000',
  sensorDescription: 'Touch sensor',
  sensorErrorDescription: 'Failed',
  cancelText: 'Cancel',
  unifiedErrors: false,
  passcodeFallback: false,
};

const supportConfig = {
  passcodeFallback: false,
};

export const authenticate = reason => {
  return new Promise((resolve, reject) => {
    TouchID.authenticate(reason, biometricConfig)
      .then(success => resolve())
      .catch(error => reject(error));
  });
};

export const checkBiometricSupport = () => dispatch => {
  TouchID.isSupported(supportConfig)
    .then(biometryType => {
      if (biometryType === 'FaceID') {
        dispatch(setBiometricAvailability(true, true));
      } else {
        dispatch(setBiometricAvailability(true, false));
      }
    })
    .catch(() => dispatch(setBiometricAvailability(false, false)));
};
