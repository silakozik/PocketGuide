import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

export default function LandingScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.logo}>PocketGuide</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t("mobile.landingTitle")}</Text>
        <Text style={styles.subtitle}>
          {t("mobile.landingSubtitle")}
        </Text>

        <View style={styles.actions}>
          <Pressable onPress={() => router.push("/")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t("mobile.goMap")}</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/transfer" as any)} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>{t("mobile.goTransfer")}</Text>
          </Pressable>
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Aşama 1</Text>
          <Text style={styles.hintText}>
            Landing, onboarding, profile ve transfer sayfaları iskelet olarak hazır.
            Harita paritesi ve i18n iyileştirmeleri sonraki aşamalarda gelecek.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  logo: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: "center",
  },
  title: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h1.fontSize,
    lineHeight: theme.typography.h1.lineHeight,
    fontWeight: theme.typography.h1.fontWeight,
    textAlign: "center",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "500",
    textAlign: "center",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  actions: {
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  primaryBtn: {
    ...presets.primaryButton,
    width: "90%",
  },
  primaryBtnText: {
    ...presets.primaryButtonText,
  },
  secondaryBtn: {
    ...presets.secondaryButton,
    width: "90%",
  },
  secondaryBtnText: {
    ...presets.secondaryButtonText,
  },
  hintCard: {
    ...presets.card,
    marginTop: theme.spacing.md,
  },
  hintTitle: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "900",
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
  },
  hintText: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
});

