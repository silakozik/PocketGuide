import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text as RNText, View as RNView } from "react-native";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@/src/i18n";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

import { Text, View } from "@/components/Themed";

export default function TabTwoScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem("pg_has_onboarded");
        if (hasOnboarded !== "true") {
          router.replace("/onboarding" as any);
          return;
        }
      } catch {
        // If storage fails, allow rendering.
      }

      if (mounted) setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("nav.profile")}</Text>

      <RNView style={styles.section}>
        <RNText style={styles.sectionTitle}>Sıla Kozik</RNText>
        <RNText style={styles.sectionSub}>Profesyonel Gezgin</RNText>
      </RNView>

      <Pressable style={styles.primaryBtn} onPress={() => router.push("/transfer" as any)}>
        <Text style={styles.primaryBtnText}>{t("mobile.goTransfer")}</Text>
      </Pressable>

      <RNView style={styles.langRow}>
        <Pressable style={[styles.langBtn, i18n.language === "tr" ? styles.langBtnActive : null]} onPress={() => setAppLanguage("tr")}>
          <RNText style={[styles.langBtnText, i18n.language === "tr" ? styles.langBtnTextActive : null]}>TR</RNText>
        </Pressable>
        <Pressable style={[styles.langBtn, i18n.language === "en" ? styles.langBtnActive : null]} onPress={() => setAppLanguage("en")}>
          <RNText style={[styles.langBtnText, i18n.language === "en" ? styles.langBtnTextActive : null]}>EN</RNText>
        </Pressable>
      </RNView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
    width: "90%",
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  sectionSub: {
    marginTop: 6,
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "500",
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  primaryBtn: {
    ...presets.primaryButton,
    marginTop: 18,
    width: "90%",
  },
  primaryBtnText: {
    ...presets.primaryButtonText,
  },
  langRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  langBtn: {
    ...presets.chip,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
  },
  langBtnActive: {
    ...presets.chipActive,
  },
  langBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: theme.typography.caption.fontSize,
  },
  langBtnTextActive: {
    color: theme.colors.surface,
  },
});
