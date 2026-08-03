import {StyleSheet} from 'react-native';

export const colors = {
  primary: '#0070F0',
  secondary: '#F2F2F7',
  success: '#34C759',
  danger: '#ef3329',
  warning: '#FF9500',
  gray: '#8E8E93',
  grayLight: '#F2F2F7',
  grayMedium: '#dddddd',
  white: '#FFFFFF',
  black: '#000000',
  lightBlack: '#333',
  text: '#000000',
  textSecondary: '#717174',
  border: '#E5E5EA',
};

export const getSpacing = (screenHeight: number) => ({
  xs: screenHeight * 0.004,
  sm: screenHeight * 0.008,
  md: screenHeight * 0.016,
  lg: screenHeight * 0.024,
  xl: screenHeight * 0.032,
});

export const getFontSize = (screenHeight: number) => ({
  sm: screenHeight * 0.014,
  md: screenHeight * 0.016,
  lg: screenHeight * 0.018,
  xl: screenHeight * 0.024,
});

export const getBorderRadius = (screenHeight: number) => ({
  sm: screenHeight * 0.008,
  md: screenHeight * 0.012,
});

export const getMbsxStyles = (screenHeight: number) => {
  const spacing = getSpacing(screenHeight);
  const font = getFontSize(screenHeight);
  const radius = getBorderRadius(screenHeight);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    scroll: {
      flexGrow: 1,
      padding: spacing.md,
    },
    empty: {
      textAlign: 'center',
      padding: spacing.lg,
      fontSize: font.md,
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontSize: font.md,
      fontWeight: '700',
      color: colors.text,
    },
    value: {
      fontSize: font.md,
      color: colors.textSecondary,
    },
    coins: {
      fontSize: font.md,
      fontWeight: '700',
      color: colors.text,
    },
    section: {
      fontSize: font.lg,
      fontWeight: '700',
      color: colors.text,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    input: {
      fontSize: font.lg,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    inputLabel: {
      fontSize: font.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    button: {
      height: screenHeight * 0.06,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.sm,
    },
    buttonDisabled: {
      backgroundColor: colors.grayMedium,
    },
    buttonText: {
      color: colors.white,
      fontSize: font.lg,
      fontWeight: '700',
    },
    error: {
      color: colors.danger,
      fontSize: font.sm,
      fontWeight: '600',
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
    status: {
      color: colors.success,
      fontSize: font.sm,
      fontWeight: '600',
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
    messageRow: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    messages: {
      flex: 1,
      alignSelf: 'stretch',
    },
    chipRow: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    chip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: font.md,
      color: colors.text,
    },
    chipTextSelected: {
      color: colors.white,
      fontWeight: '700',
    },
  });
};
