import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";

const CATEGORIES = [
  { id: "sim", label: "SIM", icon: "📱" },
  { id: "transport_card", label: "Ulaşım", icon: "🚇" },
  { id: "exchange", label: "Döviz", icon: "💱" },
] as const;

const POIS = [
  { id: "1", category: "sim", name: "Turkcell Shop", address: "City Center", distance: "0.8 km" },
  { id: "2", category: "sim", name: "Vodafone", address: "Main Street", distance: "1.2 km" },
  { id: "3", category: "transport_card", name: "Metro Card Office", address: "Central Station", distance: "0.5 km" },
  { id: "4", category: "exchange", name: "Exchange Point", address: "Old Town", distance: "1.4 km" },
];

export default function FirstDayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ citySlug?: string }>();
  const citySlug = params.citySlug ?? "city";
  const [activeTab, setActiveTab] = useState<(typeof CATEGORIES)[number]["id"]>("sim");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return POIS.filter((p) => p.category === activeTab).filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{t("common.back")}</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t("mobile.firstDayGuide")}</Text>
          <Text style={styles.headerSub}>{String(citySlug)}</Text>
        </View>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapCard}>
          <Text style={styles.mapCardText}>{t("mobile.firstDayNeeds")}</Text>
        </View>

        <View style={styles.tabs}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveTab(cat.id)}
              style={[styles.tabBtn, activeTab === cat.id ? styles.tabBtnActive : null]}
            >
              <Text style={activeTab === cat.id ? styles.tabTextActive : styles.tabText}>
                {cat.icon} {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("common.search")}
          style={styles.searchInput}
          placeholderTextColor="#9aa8c2"
        />

        <View style={styles.listWrap}>
          {filtered.map((p) => (
            <View key={p.id} style={styles.poiCard}>
              <Text style={styles.poiTitle}>{p.name}</Text>
              <Text style={styles.poiMeta}>{p.address}</Text>
              <Text style={styles.poiMeta}>{t("mobile.distance")}: {p.distance}</Text>
            </View>
          ))}
          {filtered.length === 0 ? <Text style={styles.emptyText}>No results.</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f7f4ee",
  },
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  backBtn: {
    width: 60,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7A99",
  },
  content: {
    padding: 16,
    gap: 10,
  },
  mapCard: {
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapCardText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 8,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#0F1F3D",
    borderColor: "#0F1F3D",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F1F3D",
  },
  tabTextActive: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  searchInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    color: "#0F1F3D",
    fontWeight: "600",
  },
  listWrap: {
    gap: 8,
  },
  poiCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    backgroundColor: "#fff",
    padding: 12,
    gap: 4,
  },
  poiTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  poiMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7A99",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 13,
    color: "#6B7A99",
    fontWeight: "600",
    paddingVertical: 14,
  },
});

