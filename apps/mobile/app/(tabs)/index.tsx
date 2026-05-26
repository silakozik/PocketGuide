import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";
import { useAuth } from "@/src/context/AuthContext";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

const CITIES = [
  { name: "Paris", country: "Fransa", slug: "paris", emoji: "🗼", bg: "#667eea" },
  { name: "Tokyo", country: "Japonya", slug: "tokyo", emoji: "🏯", bg: "#e74c3c" },
  { name: "New York", country: "ABD", slug: "new-york", emoji: "🗽", bg: "#2193b0" },
  { name: "Londra", country: "İngiltere", slug: "londra", emoji: "🎡", bg: "#536976" },
  { name: "Roma", country: "İtalya", slug: "roma", emoji: "🏛️", bg: "#c79081" },
  { name: "Barcelona", country: "İspanya", slug: "barcelona", emoji: "🌊", bg: "#f7971e" },
  { name: "Dubai", country: "BAE", slug: "dubai", emoji: "🏙️", bg: "#d4a574" },
  { name: "Amsterdam", country: "Hollanda", slug: "amsterdam", emoji: "🚲", bg: "#f46b45" },
  { name: "Sydney", country: "Avustralya", slug: "sydney", emoji: "🦘", bg: "#11998e" },
  { name: "İstanbul", country: "Türkiye", slug: "istanbul", emoji: "🕌", bg: "#4facfe" },
] as const;

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

      <View style={styles.citiesSection}>
        <Text style={styles.citiesSectionTitle}>Şehirleri Keşfet</Text>
        <Text style={styles.citiesSectionSub}>
          Dünyanın en ikonik şehirlerine göz at — rotanı planlamaya hazır ol.
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.citiesScroll}
        >
          {CITIES.map((city) => (
            <Pressable
              key={city.name}
              style={styles.cityCard}
              onPress={() => router.push(`/${city.slug}` as never)}
            >
              <View style={[styles.cityCardImg, { backgroundColor: city.bg }]}>
                <Text style={styles.cityCardEmoji}>{city.emoji}</Text>
              </View>
              <View style={styles.cityCardBody}>
                <Text style={styles.cityCardName}>{city.name}</Text>
                <Text style={styles.cityCardCountry}>{city.country}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
  citiesSection: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  citiesSectionTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  citiesSectionSub: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  citiesScroll: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  cityCard: {
    width: 130,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cityCardImg: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  cityCardEmoji: {
    fontSize: 36,
  },
  cityCardBody: {
    padding: 10,
    gap: 2,
  },
  cityCardName: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  cityCardCountry: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 11,
    fontWeight: "500",
    color: theme.colors.textSecondary,
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
