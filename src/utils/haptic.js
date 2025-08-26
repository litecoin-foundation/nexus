import * as Haptics from 'expo-haptics';

export const triggerSelectionFeedback = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
};

export const triggerLightFeedback = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const triggerMediumFeedback = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const triggerHeavyFeedback = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};
