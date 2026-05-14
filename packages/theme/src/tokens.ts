/**
 * Platform-agnostic design tokens (colors, spacing, type scale, radius).
 * Apps merge platform-specific values (e.g. React Native font family mapping).
 */

export const colorTokens = {
  background: "#F5F0E8",
  surface: "#FFFFFF",
  textPrimary: "#1A2340",
  textSecondary: "#5F677C",
  textMuted: "#8B92A3",
  accent: "#E0B84D",
  border: "#D7DCE8",
  overlay: "rgba(26, 35, 64, 0.3)",
  danger: "#9B1C1C",
} as const;

export const spacingTokens = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radiusTokens = {
  sm: 10,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

/** Numeric type scale only — bind to platform font stacks in each app. */
export const typographyScale = {
  h1: { fontSize: 30, lineHeight: 38, fontWeight: "700" as const },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
} as const;

export const buttonTokens = {
  vertical: 16,
  horizontal: 24,
} as const;

export const shadowTokens = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
} as const;

export const designTokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  typography: typographyScale,
  button: buttonTokens,
  shadows: shadowTokens,
} as const;

export type DesignTokens = typeof designTokens;
