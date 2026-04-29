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
              placeholderTextColor="#9aa8c2"
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
  },
  floatingHeader: {
    position: "absolute",
    top: 12,
    left: 10,
    right: 10,
    zIndex: 200,
    gap: 8,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  firstDayBtn: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  firstDayBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0F1F3D",
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  searchBar: {
    backgroundColor: "rgba(255,255,255,0.93)",
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#0F1F3D",
    fontWeight: "600",
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: "#0F1F3D",
    borderColor: "#0F1F3D",
  },
  chipText: {
    color: "#0F1F3D",
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  savedMeta: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  savedMetaText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7A99",
  },
});
