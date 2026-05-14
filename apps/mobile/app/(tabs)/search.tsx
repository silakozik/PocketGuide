import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

const SUGGESTIONS = [
  { id: "1", title: "Ayasofya", tag: "Kültür", icon: "🏛" },
  { id: "2", title: "Galata Kulesi", tag: "Kültür", icon: "🗼" },
  { id: "3", title: "Karaköy Balık", tag: "Yeme-İçme", icon: "🍽" },
  { id: "4", title: "M11 Metro", tag: "Ulaşım", icon: "🚇" },
];

export default function SearchTabScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");

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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return SUGGESTIONS;
    return SUGGESTIONS.filter((x) => x.title.toLowerCase().includes(s) || x.tag.toLowerCase().includes(s));
  }, [q]);

  if (!ready) return null;

  return (
    <View style={styles.root}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t("mobile.searchMapPlaceholder")}
          style={styles.searchInput}
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <Text style={styles.sectionLabel}>{t("common.search")}</Text>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {filtered.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push("/map")}
            style={({ pressed }) => [styles.row, pressed ? { opacity: 0.9 } : null]}
          >
            <Text style={styles.rowIcon}>{item.icon}</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowTag}>{item.tag}</Text>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </Pressable>
        ))}
        {filtered.length === 0 ? (
          <Text style={styles.empty}>{t("mobile.aiNoResult")}</Text>
        ) : null}
      </ScrollView>

      <Pressable onPress={() => router.push("/map")} style={styles.mapCta}>
        <Text style={styles.mapCtaText}>{t("nav.map")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchBar: {
    ...presets.card,
    padding: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    height: 48,
    gap: theme.spacing.xs,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: "500",
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: theme.spacing.xs,
  },
  list: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    ...presets.card,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  rowTag: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  rowChevron: {
    fontSize: 22,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    fontWeight: "600",
  },
  mapCta: {
    ...presets.secondaryButton,
    alignItems: "center",
  },
  mapCtaText: {
    ...presets.secondaryButtonText,
  },
});
