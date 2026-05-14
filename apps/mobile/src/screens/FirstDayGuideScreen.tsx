import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

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

type Props = {
  citySlug: string;
  /** Stack’ten açıldığında geri düğmesi */
  onBack?: () => void;
};

export function FirstDayGuideScreen({ citySlug, onBack }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<(typeof CATEGORIES)[number]["id"]>("sim");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return POIS.filter((p) => p.category === activeTab).filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [activeTab, searchQuery]);

  return (
    <View style={styles.root}>
      {onBack ? (
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{t("common.back")}</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t("mobile.firstDayGuide")}</Text>
            <Text style={styles.headerSub}>{citySlug}</Text>
          </View>

          <View style={{ width: 60 }} />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          !onBack ? { paddingTop: Math.max(theme.spacing.sm, insets.top) } : null,
        ]}
        keyboardShouldPersistTaps="handled"
      >
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
          placeholderTextColor={theme.colors.textMuted}
        />

        <View style={styles.listWrap}>
          {filtered.map((p) => (
            <View key={p.id} style={styles.poiCard}>
              <Text style={styles.poiTitle}>{p.name}</Text>
              <Text style={styles.poiMeta}>{p.address}</Text>
              <Text style={styles.poiMeta}>
                {t("mobile.distance")}: {p.distance}
              </Text>
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
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
  },
  backBtn: {
    width: 60,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  backBtnText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  headerSub: {
    marginTop: 2,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  mapCard: {
    height: 120,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.card,
  },
  mapCardText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  tabs: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  tabBtn: {
    flex: 1,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  tabText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  tabTextActive: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
    color: theme.colors.surface,
  },
  searchInput: {
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontWeight: "600",
    fontFamily: theme.typography.fontFamilySans,
  },
  listWrap: {
    gap: theme.spacing.xs,
  },
  poiCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    gap: 4,
    ...theme.shadows.card,
  },
  poiTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  poiMeta: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  emptyText: {
    textAlign: "center",
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    paddingVertical: 14,
  },
});
