import { designTokens } from "@pocketguide/theme";
import { Platform } from "react-native";

/**
 * Mobile theme: shared numeric tokens from `@pocketguide/theme` + native font stacks.
 * Web should consume the same `designTokens` for CSS variables / Tailwind mapping.
 */
export const theme = {
  colors: designTokens.colors,
  spacing: designTokens.spacing,
  radius: designTokens.radius,
  button: designTokens.button,
  shadows: designTokens.shadows,
  typography: {
    fontFamilySerif: Platform.select({ ios: "Times New Roman", android: "serif", default: "serif" }),
    fontFamilySans: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
    ...designTokens.typography,
  },
} as const;

export type AppTheme = typeof theme;
