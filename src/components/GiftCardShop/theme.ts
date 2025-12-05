import {StyleSheet} from 'react-native';

export const colors = {
  primary: '#007AFF',
  primaryDark: '#0056b3',
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
  };
};

export const commonStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    // Layout
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      fontSize: getFontSize(screenHeight).xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: getSpacing(screenHeight).md,
    },
    subtitle: {
      fontSize: getFontSize(screenHeight).lg,
      fontWeight: '600',
      color: colors.text,
      marginBottom: getSpacing(screenHeight).sm,
    },
    body: {
      fontSize: getFontSize(screenHeight).md,
      color: colors.text,
    },
    caption: {
      fontSize: getFontSize(screenHeight).sm,
      color: colors.textSecondary,
    },
    label: {
      fontSize: getFontSize(screenHeight).sm,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: getSpacing(screenHeight).xs,
    },

    // Buttons
    button: {
      backgroundColor: colors.primary,
      paddingVertical: getSpacing(screenHeight).md,
      paddingHorizontal: getSpacing(screenHeight).lg,
      borderRadius: getBorderRadius(screenHeight).sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: getFontSize(screenHeight).md,
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
      borderRadius: getBorderRadius(screenHeight).sm,
      paddingVertical: getSpacing(screenHeight).md,
      paddingHorizontal: getSpacing(screenHeight).md,
      fontSize: getFontSize(screenHeight).md,
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
      fontSize: getFontSize(screenHeight).sm,
      marginTop: getSpacing(screenHeight).xs,
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
  commonStyles,
};
