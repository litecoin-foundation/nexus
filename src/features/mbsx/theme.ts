import {StyleSheet} from 'react-native';

export const colors = {
  primary: '#1162E6',
  secondary: '#F2F8FD',
  success: '#20BB74',
  danger: '#ef3329',
  warning: '#FF9500',
  gray: '#747E87',
  grayLight: '#F2F8FD',
  grayMedium: '#979797',
  white: '#FFFFFF',
  black: '#000000',
  lightBlack: '#484859',
  text: '#484859',
  textSecondary: '#747E87',
  border: '#9797974d',
  page: '#F2F8FD',
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

  const fontFamily = 'Satoshi Variable';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.page,
    },
    // For an action that sits outside the ScrollView, which carries the padding
    // the container does not.
    headerAction: {
      paddingHorizontal: spacing.md,
    },
    scroll: {
      flexGrow: 1,
      padding: spacing.md,
    },
    empty: {
      textAlign: 'center',
      padding: spacing.lg,
      fontFamily,
      fontSize: font.md,
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: 25,
      minHeight: 50,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
    },
    // For entries that are more than a label and a value. `row` puts everything
    // on one line, which for a swap id or an error message means it runs off the
    // screen - and those are the two things most worth reading in full.
    stackedRow: {
      alignItems: 'flex-start',
      paddingVertical: spacing.md,
      paddingHorizontal: 25,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
    },
    amountBox: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    amountLine: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },
    amountLineLower: {
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    amountInput: {
      flex: 1,
      fontFamily,
      fontSize: font.lg,
      color: colors.text,
      paddingVertical: spacing.md,
    },
    amountUnit: {
      fontFamily,
      fontSize: font.md,
      color: colors.textSecondary,
      paddingLeft: spacing.sm,
    },
    amountDisabled: {
      color: colors.grayMedium,
    },
    rowSelected: {
      backgroundColor: colors.grayLight,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    dropdown: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      marginTop: -spacing.md,
      marginBottom: spacing.md,
    },
    rowPrimary: {
      fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    rowSecondary: {
      fontFamily,
      fontSize: font.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    rowMessage: {
      fontFamily,
      fontSize: font.sm,
      color: colors.text,
      marginTop: spacing.xs,
    },
    rowDimmed: {
      opacity: 0.4,
    },
    rowLink: {
      fontFamily,
      fontSize: font.sm,
      color: colors.primary,
      fontWeight: '700',
      marginTop: spacing.xs,
    },
    label: {
      fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    value: {
      fontFamily,
      fontSize: font.md,
      color: colors.textSecondary,
    },
    valueLink: {
      fontFamily,
      fontSize: font.md,
      color: colors.primary,
      fontWeight: '700',
    },
    section: {
      fontFamily: 'SatoshiVariable-Bold',
      fontSize: screenHeight * 0.015,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      paddingVertical: spacing.md,
      paddingHorizontal: 25,
    },
    input: {
      fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      backgroundColor: '#F4F7FB',
      borderRadius: 22,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: spacing.md,
    },
    inputDisabled: {
      color: colors.grayMedium,
      borderColor: colors.grayLight,
    },
    inputLabel: {
      fontFamily,
      fontSize: font.sm,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    modeRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      marginBottom: spacing.sm,
    },
    modeOption: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      marginRight: spacing.sm,
      marginTop: spacing.xs,
      borderRadius: screenHeight * 0.012,
      backgroundColor: '#FEFEFE',
      borderWidth: 1,
      borderColor: 'rgba(216,210,210,0.75)',
    },
    modeOptionActive: {
      backgroundColor: '#2C72FF',
      borderWidth: 0,
    },
    modeText: {
      fontFamily,
      fontSize: font.sm,
      fontWeight: '700',
      color: '#2E2E2E',
    },
    modeTextActive: {
      color: colors.white,
    },
    certRow: {
      paddingVertical: spacing.sm,
      paddingHorizontal: 25,
      minHeight: 50,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.white,
    },
    pemInput: {
      minHeight: screenHeight * 0.12,
      textAlignVertical: 'top' as const,
    },
    button: {
      height: screenHeight * 0.06,
      backgroundColor: '#2C72FF',
      borderRadius: screenHeight * 0.012,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.sm,
    },
    buttonSecondary: {
      height: screenHeight * 0.06,
      backgroundColor: '#fff',
      borderRadius: screenHeight * 0.012,
      borderColor: '#e5e5e5',
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.sm,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontFamily,
      fontStyle: 'normal',
      color: colors.white,
      fontSize: screenHeight * 0.02,
      fontWeight: '700',
    },
    buttonSecondaryText: {
      fontFamily,
      fontStyle: 'normal',
      color: '#000',
      fontSize: screenHeight * 0.02,
      fontWeight: '700',
    },
    error: {
      fontFamily,
      color: colors.danger,
      fontSize: font.sm,
      fontWeight: '700',
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
    status: {
      fontFamily,
      color: colors.success,
      fontSize: font.sm,
      fontWeight: '700',
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
    link: {
      fontFamily,
      color: colors.primary,
      fontSize: font.sm,
      fontWeight: '700',
      textAlign: 'center',
      paddingVertical: spacing.sm,
      textDecorationLine: 'underline',
    },
    linkDisabled: {
      color: colors.grayMedium,
      textDecorationLine: 'none',
    },
    messageRow: {
      paddingVertical: spacing.sm,
      paddingHorizontal: 25,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
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
      borderRadius: screenHeight * 0.012,
      borderWidth: 1,
      borderColor: 'rgba(216,210,210,0.75)',
      backgroundColor: '#FEFEFE',
      marginRight: spacing.sm,
    },
    chipSelected: {
      backgroundColor: '#2C72FF',
      borderWidth: 0,
    },
    chipText: {
      fontFamily,
      fontSize: font.md,
      fontWeight: '700',
      color: '#2E2E2E',
    },
    chipTextSelected: {
      color: colors.white,
      fontWeight: '700',
    },
  });
};
