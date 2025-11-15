import * as LocalAuthentication from 'expo-local-authentication';

import {setBiometricAvailability} from '../reducers/authentication';

export const authenticate = reason => {
  return new Promise((resolve, reject) => {
    LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    })
      .then(result => {
        if (result.success) {
          resolve();
        } else {
          reject(new Error(result.error || 'Authentication failed'));
        }
      })
      .catch(error => reject(error));
  });
};

export const checkBiometricSupport = () => dispatch => {
  Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ])
    .then(([hasHardware, isEnrolled, supportedTypes]) => {
      if (hasHardware && isEnrolled) {
        const isFaceID = supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        );
        dispatch(setBiometricAvailability(true, isFaceID));
      } else {
        dispatch(setBiometricAvailability(false, false));
      }
    })
    .catch(() => dispatch(setBiometricAvailability(false, false)));
};
