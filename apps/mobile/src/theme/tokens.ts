import { Platform } from "react-native";

export const theme = {
  colors: {
    background: "#F5F0E8",
    surface: "#FFFFFF",
    textPrimary: "#1A2340",
    textSecondary: "#5F677C",
    textMuted: "#8B92A3",
    accent: "#E0B84D",
    border: "#D7DCE8",
    overlay: "rgba(26, 35, 64, 0.3)",
    danger: "#9B1C1C",
  },
  typography: {
    fontFamilySerif: Platform.select({ ios: "Times New Roman", android: "serif", default: "serif" }),
    fontFamilySans: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
    h1: { fontSize: 30, lineHeight: 38, fontWeight: "700" as const },
    h2: { fontSize: 24, lineHeight: 30, fontWeight: "600" as const },
    body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
    bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 20,
    pill: 999,
  },
  button: {
    vertical: 16,
    horizontal: 24,
  },
  shadows: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
  },
};

export type AppTheme = typeof theme;
