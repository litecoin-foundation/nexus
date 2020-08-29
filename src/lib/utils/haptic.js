import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

export const triggerSelectionFeedback = () => {
  ReactNativeHapticFeedback.trigger('selection', options);
};

export const triggerLightFeedback = () => {
  ReactNativeHapticFeedback.trigger('impactLight', options);
};

export const triggerMediumFeedback = () => {
  ReactNativeHapticFeedback.trigger('impactMedium', options);
};

export const triggerHeavyFeedback = () => {
  ReactNativeHapticFeedback.trigger('impactHeavy', options);
};
