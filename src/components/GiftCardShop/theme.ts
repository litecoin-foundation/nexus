import {StyleSheet} from 'react-native';

export const colors = {
  primary: '#0070F0',
  primaryDark: '#0056b3',
  primaryLight: '#5ca0ee',
  secondary: '#F2F2F7',
  success: '#34C759',
  successLight: '#d4edda',
  successDark: '#155724',
  danger: '#FF3B30',
  dangerLight: '#f8d7da',
  warning: '#FF9500',
  warningLight: '#fff3cd',
  warningDark: '#856404',
  gray: '#8E8E93',
  grayLight: '#F2F2F7',
  grayMedium: '#C7C7CC',
  grayDark: '#636366',
  white: '#FFFFFF',
  black: '#000000',
  lightBlack: '#333',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#636366',
  border: '#E5E5EA',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const getSpacing = (screenHeight: number) => {
  return {
    xs: screenHeight * 0.004,
    sm: screenHeight * 0.008,
    md: screenHeight * 0.016,
    lg: screenHeight * 0.024,
    xl: screenHeight * 0.032,
    xxl: screenHeight * 0.048,
    header: screenHeight * 0.055,
  };
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const getBorderRadius = (screenHeight: number) => {
  return {
    sm: screenHeight * 0.008,
    md: screenHeight * 0.012,
    lg: screenHeight * 0.016,
    xl: screenHeight * 0.024,
    full: 9999,
  };
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const getFontSize = (screenHeight: number) => {
  return {
    xs: screenHeight * 0.012,
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
      backgroundColor: colors.background,
    },
    containerPrimary: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: getSpacing(screenHeight).md,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: getSpacing(screenHeight).lg,
    },

    // Cards
    card: {
      backgroundColor: colors.card,
      borderRadius: getBorderRadius(screenHeight).md,
      padding: getSpacing(screenHeight).md,
      marginBottom: getSpacing(screenHeight).md,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    // Typography
    title: {
      fontSize: getFontSize(screenHeight).xxl,
      fontWeight: '700',
      color: colors.white,
      marginBottom: getSpacing(screenHeight).md,
    },
    titleBlack: {
      fontSize: getFontSize(screenHeight).xxl,
      fontWeight: '700',
      color: colors.lightBlack,
      marginBottom: getSpacing(screenHeight).md,
    },
    subtitle: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.white,
      marginBottom: getSpacing(screenHeight).sm,
    },
    body: {
      fontSize: getFontSize(screenHeight).md,
      color: colors.white,
    },
    caption: {
      fontSize: getFontSize(screenHeight).sm,
      color: colors.textSecondary,
    },
    label: {
      fontSize: getFontSize(screenHeight).md,
      fontWeight: '600',
      color: colors.white,
      textTransform: 'uppercase',
      marginBottom: getSpacing(screenHeight).sm,
    },

    // Buttons
    button: {
      height: screenHeight * 0.06,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getSpacing(screenHeight).md,
      paddingHorizontal: getSpacing(screenHeight).lg,
    },
    buttonRounded: {
      height: screenHeight * 0.06,
      backgroundColor: colors.primary,
      borderRadius: screenHeight * 0.03,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getSpacing(screenHeight).md,
      paddingHorizontal: getSpacing(screenHeight).lg,
    },
    buttonRoundedGreen: {
      height: screenHeight * 0.06,
      backgroundColor: colors.success,
      borderRadius: screenHeight * 0.03,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getSpacing(screenHeight).md,
      paddingHorizontal: getSpacing(screenHeight).lg,
    },
    buttonRoundedSecondary: {
      height: screenHeight * 0.06,
      backgroundColor: colors.secondary,
      borderRadius: screenHeight * 0.03,
      borderWidth: 1,
      borderColor: colors.grayMedium,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getSpacing(screenHeight).md,
      paddingHorizontal: getSpacing(screenHeight).lg,
    },
    buttonText: {
      color: colors.white,
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
    },
    buttonTextBlack: {
      color: colors.lightBlack,
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
    },
    buttonDisabled: {
      backgroundColor: colors.grayMedium,
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    buttonOutlineText: {
      color: colors.primary,
    },
    buttonSmall: {
      paddingVertical: getSpacing(screenHeight).sm,
      paddingHorizontal: getSpacing(screenHeight).md,
    },

    // Inputs
    input: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: getBorderRadius(screenHeight).md,
      paddingVertical: getSpacing(screenHeight).md,
      paddingHorizontal: getSpacing(screenHeight).md,
      fontSize: getFontSize(screenHeight).lg,
    },
    inputFocused: {
      borderColor: colors.primary,
    },

    // Status badges
    badge: {
      paddingVertical: getSpacing(screenHeight).xs,
      paddingHorizontal: getSpacing(screenHeight).sm,
      borderRadius: getBorderRadius(screenHeight).sm,
    },
    badgeActive: {
      backgroundColor: colors.successLight,
    },
    badgeActiveText: {
      color: colors.successDark,
      fontSize: getFontSize(screenHeight).xs,
      fontWeight: '600',
    },
    badgeRedeemed: {
      backgroundColor: colors.grayLight,
    },
    badgeRedeemedText: {
      color: colors.grayDark,
      fontSize: getFontSize(screenHeight).xs,
      fontWeight: '600',
    },
    badgeExpired: {
      backgroundColor: colors.warningLight,
    },
    badgeExpiredText: {
      color: colors.warningDark,
      fontSize: getFontSize(screenHeight).xs,
      fontWeight: '600',
    },

    // Misc
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: getSpacing(screenHeight).md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    errorText: {
      color: colors.danger,
      fontSize: getFontSize(screenHeight).lg,
      alignSelf: 'center',
      marginTop: getSpacing(screenHeight).xs,
      paddingVertical: getSpacing(screenHeight).xs,
      paddingHorizontal: getSpacing(screenHeight).md,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: getSpacing(screenHeight).lg,
    },
  });

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  getCommonStyles,
};
