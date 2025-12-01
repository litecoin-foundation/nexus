/**
 * Theme and styling for Gift Card components
 * 
 * Customize these to match your app's design system
 */

import { StyleSheet } from "react-native";

export const colors = {
  primary: "#007AFF",
  primaryDark: "#0056b3",
  success: "#34C759",
  successLight: "#d4edda",
  successDark: "#155724",
  danger: "#FF3B30",
  dangerLight: "#f8d7da",
  warning: "#FF9500",
  warningLight: "#fff3cd",
  warningDark: "#856404",
  gray: "#8E8E93",
  grayLight: "#F2F2F7",
  grayMedium: "#C7C7CC",
  grayDark: "#636366",
  white: "#FFFFFF",
  black: "#000000",
  background: "#F2F2F7",
  card: "#FFFFFF",
  text: "#000000",
  textSecondary: "#636366",
  border: "#E5E5EA",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const commonStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },

  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Typography
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  caption: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  // Buttons
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: colors.grayMedium,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonOutlineText: {
    color: colors.primary,
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  // Inputs
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
  },
  inputFocused: {
    borderColor: colors.primary,
  },

  // Status badges
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  badgeActive: {
    backgroundColor: colors.successLight,
  },
  badgeActiveText: {
    color: colors.successDark,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  badgeRedeemed: {
    backgroundColor: colors.grayLight,
  },
  badgeRedeemedText: {
    color: colors.grayDark,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  badgeExpired: {
    backgroundColor: colors.warningLight,
  },
  badgeExpiredText: {
    color: colors.warningDark,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },

  // Misc
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
});

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  commonStyles,
};
