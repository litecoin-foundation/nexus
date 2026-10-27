import {NativeModules, Platform} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import {setBiometricAvailability} from '../reducers/authentication';
import {AppDispatch} from '../store';

export const authenticate = (reason: string) => {
  return new Promise<void>((resolve, reject) => {
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

// NOTE: android only, see BiometricEnrollmentModule.kt. null when it can't be read
const isFingerprintEnrolled = async (): Promise<boolean | null> => {
  if (Platform.OS !== 'android' || !NativeModules.BiometricEnrollment) {
    return null;
  }
  try {
    return await NativeModules.BiometricEnrollment.isFingerprintEnrolled();
  } catch {
    return null;
  }
};

export const checkBiometricSupport = () => (dispatch: AppDispatch) => {
  Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
    isFingerprintEnrolled(),
  ])
    .then(([hasHardware, isEnrolled, supportedTypes, fingerprintEnrolled]) => {
      if (hasHardware && isEnrolled) {
        const hasFace = supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        );
        const hasFingerprint = supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        );
        // NOTE: Android reports every biometric sensor present on the device, not
        // what the user enrolled. A biometric is enrolled here, so if it isn't a
        // fingerprint it's face. When both are enrolled the prompt accepts
        // either, and we label it fingerprint. Without the native check, fall
        // back to preferring fingerprint whenever the sensor exists.
        const isFaceID =
          Platform.OS === 'android'
            ? fingerprintEnrolled !== null
              ? !fingerprintEnrolled
              : hasFace && !hasFingerprint
            : hasFace;
        dispatch(setBiometricAvailability(true, isFaceID));
      } else {
        dispatch(setBiometricAvailability(false, false));
      }
    })
    .catch(() => dispatch(setBiometricAvailability(false, false)));
};
