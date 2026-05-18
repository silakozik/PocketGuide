import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";
import { useAuth } from "@/src/context/AuthContext";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

export default function HomeTabScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
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
        // allow
      }
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) return null;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>PocketGuide</Text>
        <Text style={styles.heroTitle}>{t("mobile.landingTitle")}</Text>
        <Text style={styles.heroSub}>{t("mobile.landingSubtitle")}</Text>
        {!authLoading && !user ? (
          <View style={styles.authRow}>
            <Pressable
              style={({ pressed }) => [styles.authBtn, pressed ? { opacity: 0.9 } : null]}
              onPress={() => router.push("/login" as any)}
            >
              <Text style={styles.authBtnText}>Giriş yap</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.authBtnOutline,
                pressed ? { opacity: 0.9 } : null,
              ]}
              onPress={() => router.push("/register" as any)}
            >
              <Text style={styles.authBtnOutlineText}>Kayıt ol</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.grid}>
        <Pressable onPress={() => router.push("/map")} style={({ pressed }) => [styles.tile, pressed ? { opacity: 0.92 } : null]}>
          <Text style={styles.tileEmoji}>🗺️</Text>
          <Text style={styles.tileTitle}>{t("nav.map")}</Text>
          <Text style={styles.tileHint}>{t("mobile.goMap")}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/transfer")} style={({ pressed }) => [styles.tile, pressed ? { opacity: 0.92 } : null]}>
          <Text style={styles.tileEmoji}>🚌</Text>
          <Text style={styles.tileTitle}>{t("nav.transfer")}</Text>
          <Text style={styles.tileHint}>{t("mobile.transferTitle")}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/first-day")} style={({ pressed }) => [styles.tile, pressed ? { opacity: 0.92 } : null]}>
          <Text style={styles.tileEmoji}>💡</Text>
          <Text style={styles.tileTitle}>{t("nav.firstDayTab")}</Text>
          <Text style={styles.tileHint}>{t("mobile.firstDayGuide")}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/search")} style={({ pressed }) => [styles.tile, pressed ? { opacity: 0.92 } : null]}>
          <Text style={styles.tileEmoji}>🔍</Text>
          <Text style={styles.tileTitle}>{t("nav.search")}</Text>
          <Text style={styles.tileHint}>{t("common.search")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
  },
  hero: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  heroKicker: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "800",
    color: theme.colors.accent,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h1.fontSize,
    lineHeight: theme.typography.h1.lineHeight,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  heroSub: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    maxWidth: 360,
  },
  authRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  authBtn: {
    ...presets.primaryButton,
    flex: 1,
    backgroundColor: theme.colors.accent,
  },
  authBtnText: {
    ...presets.primaryButtonText,
    color: theme.colors.textPrimary,
  },
  authBtnOutline: {
    ...presets.secondaryButton,
    flex: 1,
  },
  authBtnOutlineText: {
    ...presets.secondaryButtonText,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    ...presets.card,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    minHeight: 132,
  },
  tileEmoji: {
    fontSize: 28,
  },
  tileTitle: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.bodyStrong.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  tileHint: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
});
