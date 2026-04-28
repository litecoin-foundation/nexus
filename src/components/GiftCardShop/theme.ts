import {StyleSheet} from 'react-native';

export const colors = {
  primary: '#0070F0',
  secondary: '#F2F2F7',
  success: '#34C759',
  danger: '#ef3329',
  dangerLight: '#f8d7da',
  warning: '#FF9500',
  gray: '#8E8E93',
  grayLight: '#F2F2F7',
  grayMedium: '#dddddd',
  grayDark: '#636366',
  white: '#FFFFFF',
  black: '#000000',
  lightBlack: '#333',
  text: '#000000',
  textSecondary: '#717174',
  border: '#E5E5EA',
};

export const getSpacing = (screenWidth: number, screenHeight: number) => {
  return {
    xs: screenHeight * 0.004,
    sm: screenHeight * 0.008,
    md: screenHeight * 0.016,
    lg: screenHeight * 0.024,
    xl: screenHeight * 0.032,
    xxl: screenHeight * 0.048,
    header: screenHeight * 0.055,
    headerAndroid: screenHeight * 0.06,
  };
};

export const getBorderRadius = (screenHeight: number) => {
  return {
    sm: screenHeight * 0.008,
    md: screenHeight * 0.012,
    lg: screenHeight * 0.016,
  };
};

export const getFontSize = (screenHeight: number) => {
  return {
    sm: screenHeight * 0.014,
    md: screenHeight * 0.016,
    lg: screenHeight * 0.018,
    xl: screenHeight * 0.024,
    xxl: screenHeight * 0.032,
    xxxl: screenHeight * 0.036,
  };
};

export const getCommonStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    // Layout
    container: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: getSpacing(screenWidth, screenHeight).md,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: getSpacing(screenWidth, screenHeight).lg,
    },

    // Typography
    title: {
      fontSize: getFontSize(screenHeight).xxl,
      fontWeight: '700',
      color: colors.white,
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    titleBlack: {
      fontSize: getFontSize(screenHeight).xxl,
      fontWeight: '700',
      color: colors.lightBlack,
      marginBottom: getSpacing(screenWidth, screenHeight).md,
    },
    subtitle: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.white,
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
    },
    caption: {
      fontSize: getFontSize(screenHeight).sm,
      color: colors.textSecondary,
    },
    label: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '700',
      color: colors.white,
      textTransform: 'uppercase',
      marginBottom: getSpacing(screenWidth, screenHeight).sm,
    },

    // Buttons
    button: {
      height: screenHeight * 0.06,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
    },
    buttonRoundedGreen: {
      height: screenHeight * 0.06,
      backgroundColor: colors.success,
      borderRadius: screenHeight * 0.03,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
    },
    buttonRoundedSecondary: {
      height: screenHeight * 0.06,
      backgroundColor: colors.secondary,
      borderRadius: screenHeight * 0.03,
      borderWidth: 1,
      borderColor: colors.grayMedium,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).lg,
    },
    buttonText: {
      color: colors.white,
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '700',
    },
    buttonTextBlack: {
      color: colors.lightBlack,
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '700',
    },
    // Inputs
    input: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '500',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: getBorderRadius(screenHeight).md,
      paddingVertical: getSpacing(screenWidth, screenHeight).md,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
    },
    errorText: {
      color: colors.danger,
      fontSize: screenHeight * 0.018,
      fontWeight: '600',
      letterSpacing: 0.6,
      alignSelf: 'center',
      marginTop: getSpacing(screenWidth, screenHeight).xs,
      paddingVertical: getSpacing(screenWidth, screenHeight).xs,
      paddingHorizontal: getSpacing(screenWidth, screenHeight).md,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: getSpacing(screenWidth, screenHeight).lg,
    },
  });

export default {
  colors,
  getCommonStyles,
};
