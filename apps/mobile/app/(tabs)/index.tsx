import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AIAssistant } from "@/src/components/AIAssistant";
import { PocketGuideMap } from "@/src/components/map/PocketGuideMap";
import { DirectionsPanel } from "@/src/components/navigation/DirectionsPanel";
import { RouteControls } from "@/src/components/navigation/RouteControls";
import { RouteProvider } from "@/src/context/RouteContext";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";
import type { POI } from "@/src/types/poi";

type CategoryFilter = "all" | "culture" | "food" | "transit" | "accommodation";

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: "all", label: "all", icon: "✨" },
  { id: "culture", label: "Kültür", icon: "🏛" },
  { id: "food", label: "Yeme-İçme", icon: "🍔" },
  { id: "transit", label: "Ulaşım", icon: "🚇" },
  { id: "accommodation", label: "Konaklama", icon: "🏨" },
];

export default function PocketGuideMapScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPoiIds, setSavedPoiIds] = useState<Set<string>>(new Set());

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
        // If storage fails, don't block the user from using the app.
      }

      if (mounted) setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("pg_saved_poi_ids");
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as string[];
        setSavedPoiIds(new Set(parsed));
      } catch {
        // ignore malformed data
      }
    })();
  }, []);

  const onToggleSave = async (poi: POI) => {
    const next = new Set(savedPoiIds);
    if (next.has(poi.id)) next.delete(poi.id);
    else next.add(poi.id);
    setSavedPoiIds(next);
    await AsyncStorage.setItem("pg_saved_poi_ids", JSON.stringify(Array.from(next)));
  };

  const savedCount = useMemo(() => savedPoiIds.size, [savedPoiIds]);

  if (!ready) {
    return null;
  }

  return (
    <RouteProvider>
      <View style={styles.container}>
        <PocketGuideMap
          categoryFilter={activeCategory}
          searchQuery={searchQuery}
          savedPoiIds={savedPoiIds}
          onToggleSave={onToggleSave}
        />
        <View style={styles.floatingHeader}>
          <View style={styles.headerTopRow}>
            <Pressable
              onPress={() => router.push("/landing" as any)}
              style={({ pressed }) => [styles.backBtn, pressed ? { opacity: 0.85 } : null]}
            >
              <Text style={styles.backBtnText}>{t("common.back")}</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/istanbul/first-day" as any)}
              style={({ pressed }) => [styles.firstDayBtn, pressed ? { opacity: 0.85 } : null]}
            >
              <Text style={styles.firstDayBtnText}>💡 {t("mobile.firstDayGuide")}</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/two" as any)}
              style={({ pressed }) => [styles.profileBtn, pressed ? { opacity: 0.85 } : null]}
            >
              <Text style={styles.profileBtnText}>S</Text>
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("mobile.searchMapPlaceholder")}
              style={styles.searchInput}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setActiveCategory(c.id)}
                style={({ pressed }) => [
                  styles.chip,
                  activeCategory === c.id ? styles.chipActive : null,
                  pressed ? { opacity: 0.9 } : null,
                ]}
              >
                <Text style={activeCategory === c.id ? styles.chipTextActive : styles.chipText}>
                  {c.icon} {c.id === "all" ? t("common.all") : c.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.savedMeta}>
            <Text style={styles.savedMetaText}>{t("mobile.savedCount")}: {savedCount}</Text>
          </View>
        </View>

        <DirectionsPanel />
        <RouteControls />
        <AIAssistant />
        <StatusBar hidden />
      </View>
    </RouteProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  floatingHeader: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 200,
    gap: theme.spacing.xs,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
  },
  backBtn: {
    ...presets.secondaryButton,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  backBtnText: {
    ...presets.secondaryButtonText,
    fontSize: theme.typography.caption.fontSize,
  },
  firstDayBtn: {
    ...presets.secondaryButton,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
    alignItems: "center",
  },
  firstDayBtnText: {
    ...presets.secondaryButtonText,
    fontSize: theme.typography.caption.fontSize,
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtnText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: "900",
  },
  searchBar: {
    ...presets.card,
    padding: 0,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 48,
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: "500",
  },
  chipRow: {
    gap: theme.spacing.xs,
    paddingRight: 20,
  },
  chip: {
    ...presets.chip,
    borderColor: theme.colors.textPrimary,
  },
  chipActive: {
    ...presets.chipActive,
  },
  chipText: {
    ...presets.chipText,
  },
  chipTextActive: {
    ...presets.chipText,
    ...presets.chipTextActive,
  },
  savedMeta: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  savedMetaText: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
});
