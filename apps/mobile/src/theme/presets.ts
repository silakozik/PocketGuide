import { StyleSheet } from "react-native";

import { theme } from "@/src/theme/tokens";

export const presets = StyleSheet.create({
  primaryButton: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.button.vertical,
    paddingHorizontal: theme.button.horizontal,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "700",
    fontFamily: theme.typography.fontFamilySans,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    paddingVertical: theme.button.vertical,
    paddingHorizontal: theme.button.horizontal,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "700",
    fontFamily: theme.typography.fontFamilySans,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  chip: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    fontWeight: "700",
    fontFamily: theme.typography.fontFamilySans,
  },
  chipTextActive: {
    color: theme.colors.surface,
  },
});
