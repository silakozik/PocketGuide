import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Modal,
} from "react-native";
import { Text } from "@/components/Themed";
import { theme } from "@/src/theme/tokens";
import {
  TRANSFER_CITIES,
  TRANSPORT_CARDS,
  TRANSFER_ROUTES,
} from "@/src/data/transfers";
import type { TransferType, TransferMode } from "@/src/data/transfers";

const MODE_ICONS: Record<string, string> = {
  metro: "🚇",
  bus: "🚌",
  train: "🚆",
  ferry: "⛴️",
  taxi: "🚕",
  tram: "🚃",
};

export default function TransferTabScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selectedCity, setSelectedCity] = useState("İstanbul");
  const [activeType, setActiveType] = useState<TransferType>("all");
  const [activeMode, setActiveMode] = useState<TransferMode | "all">("all");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const has = await AsyncStorage.getItem("pg_has_onboarded");
        if (has !== "true") {
          router.replace("/onboarding" as any);
          return;
        }
      } catch {}
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setActiveType("all");
    setActiveMode("all");
    setFromQuery("");
    setToQuery("");
    setExpandedRoute(null);
    setShowCityPicker(false);
  };

  const filteredRoutes = useMemo(() => {
    return TRANSFER_ROUTES.filter((route) => {
      const cityMatch = route.city === selectedCity;
      const typeMatch = activeType === "all" || route.type === activeType;
      const modeMatch = activeMode === "all" || route.mode === activeMode;
      const fromMatch =
        !fromQuery ||
        route.from.toLowerCase().includes(fromQuery.toLowerCase());
      const toMatch =
        !toQuery || route.to.toLowerCase().includes(toQuery.toLowerCase());
      return cityMatch && typeMatch && modeMatch && fromMatch && toMatch;
    });
  }, [selectedCity, activeType, activeMode, fromQuery, toQuery]);

  const fastestRouteId = useMemo(() => {
    if (!filteredRoutes.length) return null;
    return [...filteredRoutes].sort((a, b) => a.duration - b.duration)[0].id;
  }, [filteredRoutes]);

  const transportCard = TRANSPORT_CARDS.find((c) => c.city === selectedCity);
  const selectedCityObj = TRANSFER_CITIES.find((c) => c.nameTr === selectedCity);

  if (!ready) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Şehir içi Ulaşım Rehberi</Text>
          <Text style={styles.headerSub}>
            Havalimanından merkeze, şehir içi ve şehirlerarası en iyi rotalar.
          </Text>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>ŞEHİR SEÇİN</Text>
            <Pressable
              onPress={() => setShowCityPicker(true)}
              style={styles.citySelector}
            >
              <Text style={styles.citySelectorEmoji}>
                {selectedCityObj?.emoji ?? "🏙️"}
              </Text>
              <Text style={styles.citySelectorText}>{selectedCity}</Text>
              <Text style={styles.citySelectorArrow}>▾</Text>
            </Pressable>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>ROTA TİPİ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {(["all", "airport", "intercity", "city"] as const).map(
                  (type) => (
                    <Pressable
                      key={type}
                      onPress={() => setActiveType(type)}
                      style={[
                        styles.chip,
                        activeType === type && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          activeType === type && styles.chipTextActive,
                        ]}
                      >
                        {type === "all"
                          ? "Tümü"
                          : type === "airport"
                            ? "Havalimanı"
                            : type === "intercity"
                              ? "Şehirlerarası"
                              : "Şehir İçi"}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>ULAŞIM MODU</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {(
                  [
                    "all",
                    "metro",
                    "bus",
                    "train",
                    "ferry",
                    "taxi",
                    "tram",
                  ] as const
                ).map((mode) => (
                  <Pressable
                    key={mode}
                    onPress={() => setActiveMode(mode)}
                    style={[
                      styles.chip,
                      activeMode === mode && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        activeMode === mode && styles.chipTextActive,
                      ]}
                    >
                      {mode === "all"
                        ? "Tümü"
                        : `${MODE_ICONS[mode] ?? ""} ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.fromToRow}>
            <View style={styles.fromToInput}>
              <Text style={styles.fromToIcon}>📍</Text>
              <TextInput
                value={fromQuery}
                onChangeText={setFromQuery}
                placeholder="Nereden..."
                style={styles.fromToTextInput}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
            <View style={styles.fromToInput}>
              <Text style={styles.fromToIcon}>🏁</Text>
              <TextInput
                value={toQuery}
                onChangeText={setToQuery}
                placeholder="Nereye..."
                style={styles.fromToTextInput}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>
        </View>

        {transportCard ? (
          <View style={styles.transportCard}>
            <Text style={styles.tcName}>{transportCard.name}</Text>
            <View style={styles.tcRows}>
              <View style={styles.tcRow}>
                <Text style={styles.tcRowLabel}>Nereden alınır</Text>
                <Text style={styles.tcRowValue}>{transportCard.whereToBuy}</Text>
              </View>
              <View style={styles.tcRow}>
                <Text style={styles.tcRowLabel}>Nasıl yüklenir</Text>
                <Text style={styles.tcRowValue}>{transportCard.howToTopUp}</Text>
              </View>
              <View style={styles.tcRow}>
                <Text style={styles.tcRowLabel}>İlk maliyet</Text>
                <Text style={styles.tcCost}>{transportCard.initialCost}</Text>
              </View>
            </View>
            {transportCard.depositWarning ? (
              <View style={styles.tcWarning}>
                <Text style={styles.tcWarningText}>
                  ⚠️ {transportCard.depositWarning}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>
          {filteredRoutes.length} Rota Bulundu
        </Text>

        {filteredRoutes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>
              Filtrelere uygun rota bulunamadı.
            </Text>
          </View>
        ) : (
          filteredRoutes.map((route) => (
            <Pressable
              key={route.id}
              onPress={() =>
                setExpandedRoute(
                  expandedRoute === route.id ? null : route.id
                )
              }
              style={styles.routeCard}
            >
              <View style={styles.routeBadges}>
                {route.id === fastestRouteId ? (
                  <View style={[styles.badge, styles.badgeFast]}>
                    <Text style={styles.badgeText}>HIZLI</Text>
                  </View>
                ) : null}
                {route.type === "airport" ? (
                  <View style={[styles.badge, styles.badgeAirport]}>
                    <Text style={styles.badgeText}>HAVALI.</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.routeHeader}>
                <Text style={styles.routeMode}>
                  {MODE_ICONS[route.mode] ?? "🚌"}
                </Text>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routePath}>
                    {route.from} → {route.to}
                  </Text>
                  <View style={styles.routeMeta}>
                    <Text style={styles.routeMetaItem}>
                      ⏱ {route.duration} dk
                    </Text>
                    <Text style={styles.routeMetaItem}>💰 {route.fee}</Text>
                    <Text style={styles.routeMetaItem}>{route.mode}</Text>
                  </View>
                </View>
                <Text style={styles.routeChevron}>
                  {expandedRoute === route.id ? "▲" : "▼"}
                </Text>
              </View>

              {expandedRoute === route.id && route.steps ? (
                <View style={styles.routeSteps}>
                  {route.frequency ? (
                    <Text style={styles.routeDetail}>
                      🔁 Sıklık: {route.frequency}
                    </Text>
                  ) : null}
                  {route.hours ? (
                    <Text style={styles.routeDetail}>
                      🕐 Saat: {route.hours}
                    </Text>
                  ) : null}
                  {route.steps.map((step, i) => (
                    <View key={i} style={styles.step}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepInstruction}>
                          {step.instruction}
                        </Text>
                        {step.subInstruction ? (
                          <Text style={styles.stepSub}>
                            {step.subInstruction}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showCityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCityPicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Şehir Seç</Text>
            <ScrollView>
              {TRANSFER_CITIES.map((city) => (
                <Pressable
                  key={city.id}
                  onPress={() => handleCityChange(city.nameTr)}
                  style={[
                    styles.modalCityItem,
                    selectedCity === city.nameTr && styles.modalCityItemActive,
                  ]}
                >
                  <Text style={styles.modalCityEmoji}>{city.emoji}</Text>
                  <Text
                    style={[
                      styles.modalCityName,
                      selectedCity === city.nameTr &&
                        styles.modalCityNameActive,
                    ]}
                  >
                    {city.nameTr}
                  </Text>
                  {selectedCity === city.nameTr ? (
                    <Text style={styles.modalCityCheck}>✓</Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    paddingBottom: 80,
  },

  header: { gap: 6 },
  headerTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamilySans,
    lineHeight: 18,
  },

  filterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 14,
  },
  filterRow: { gap: 8 },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  citySelectorEmoji: { fontSize: 18 },
  citySelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  citySelectorArrow: { fontSize: 14, color: theme.colors.textSecondary },

  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  chipTextActive: { color: theme.colors.surface },

  fromToRow: { flexDirection: "row", gap: 8 },
  fromToInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    height: 40,
  },
  fromToIcon: { fontSize: 14 },
  fromToTextInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilySans,
  },

  transportCard: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: 10,
  },
  tcName: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.surface,
    fontFamily: theme.typography.fontFamilySerif,
  },
  tcRows: { gap: 8 },
  tcRow: { gap: 2 },
  tcRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tcRowValue: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontFamily: theme.typography.fontFamilySans,
    lineHeight: 18,
  },
  tcCost: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.accent,
  },
  tcWarning: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
  },
  tcWarningText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: theme.typography.fontFamilySans,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  emptyState: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyEmoji: { fontSize: 32 },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },

  routeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 10,
  },
  routeBadges: { flexDirection: "row", gap: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeFast: { backgroundColor: "#dbeafe" },
  badgeAirport: { backgroundColor: "#fef9c3" },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },

  routeHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routeMode: { fontSize: 24, width: 32 },
  routeInfo: { flex: 1, gap: 3 },
  routeName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  routePath: { fontSize: 13, color: theme.colors.textSecondary },
  routeMeta: { flexDirection: "row", gap: 10, marginTop: 4 },
  routeMetaItem: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  routeChevron: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },

  routeSteps: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    gap: 6,
  },
  routeDetail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  step: { flexDirection: "row", gap: 10 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.surface,
  },
  stepContent: { flex: 1, gap: 2 },
  stepInstruction: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  stepSub: { fontSize: 12, color: theme.colors.textSecondary },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  modalCityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalCityItemActive: { backgroundColor: theme.colors.background },
  modalCityEmoji: { fontSize: 22, width: 30, textAlign: "center" },
  modalCityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  modalCityNameActive: { fontWeight: "800" },
  modalCityCheck: { fontSize: 16, color: "#10b981", fontWeight: "800" },
});
