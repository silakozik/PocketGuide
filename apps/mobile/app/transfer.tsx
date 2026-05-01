import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

type TransferType = "all" | "airport" | "intercity" | "city";
type TransferMode = "all" | "metro" | "bus" | "train" | "ferry" | "taxi" | "tram";

const TRANSPORT_CARDS = [
  {
    city: "İstanbul",
    name: "İstanbulkart",
    whereToBuy: "Biletmatik makineleri, büfeler ve yetkili satış noktaları.",
    howToTopUp: "Biletmatikler, mobil uygulama ve NFC.",
    initialCost: "₺70.00",
  },
  {
    city: "London",
    name: "Oyster Card",
    whereToBuy: "Tube stations and ticket stops.",
    howToTopUp: "Ticket machines, online, app.",
    initialCost: "£7.00",
  },
];

const TRANSFER_ROUTES = [
  { id: "ist-1", city: "İstanbul", type: "airport", mode: "bus", name: "Havaist HVİST-14", from: "IST", to: "Taksim", duration: 90, fee: "₺170.00" },
  { id: "ist-2", city: "İstanbul", type: "airport", mode: "metro", name: "M11 Gayrettepe", from: "IST", to: "Gayrettepe", duration: 35, fee: "₺22.00" },
  { id: "ist-3", city: "İstanbul", type: "city", mode: "train", name: "Marmaray", from: "Halkalı", to: "Gebze", duration: 115, fee: "₺15-₺44" },
  { id: "lon-1", city: "London", type: "airport", mode: "train", name: "Heathrow Express", from: "Heathrow", to: "Paddington", duration: 15, fee: "£25.00" },
];

export default function TransferScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState("İstanbul");
  const [activeType, setActiveType] = useState<TransferType>("all");
  const [activeMode, setActiveMode] = useState<TransferMode>("all");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");

  const filteredRoutes = useMemo(() => {
    return TRANSFER_ROUTES.filter((route) => {
      const cityMatch = route.city === selectedCity;
      const typeMatch = activeType === "all" || route.type === activeType;
      const modeMatch = activeMode === "all" || route.mode === activeMode;
      const fromMatch = route.from.toLowerCase().includes(fromQuery.toLowerCase());
      const toMatch = route.to.toLowerCase().includes(toQuery.toLowerCase());
      return cityMatch && typeMatch && modeMatch && fromMatch && toMatch;
    });
  }, [activeMode, activeType, fromQuery, selectedCity, toQuery]);

  const transportCard = TRANSPORT_CARDS.find((c) => c.city === selectedCity);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Geri</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t("mobile.transferTitle")}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filterRow}>
          <Pressable onPress={() => setSelectedCity("İstanbul")} style={[styles.chip, selectedCity === "İstanbul" ? styles.chipActive : null]}>
            <Text style={selectedCity === "İstanbul" ? styles.chipTextActive : styles.chipText}>İstanbul</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedCity("London")} style={[styles.chip, selectedCity === "London" ? styles.chipActive : null]}>
            <Text style={selectedCity === "London" ? styles.chipTextActive : styles.chipText}>London</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(["all", "airport", "intercity", "city"] as TransferType[]).map((type) => (
            <Pressable key={type} onPress={() => setActiveType(type)} style={[styles.chip, activeType === type ? styles.chipActive : null]}>
              <Text style={activeType === type ? styles.chipTextActive : styles.chipText}>{type}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(["all", "metro", "bus", "train", "ferry", "taxi", "tram"] as TransferMode[]).map((mode) => (
            <Pressable key={mode} onPress={() => setActiveMode(mode)} style={[styles.chip, activeMode === mode ? styles.chipActive : null]}>
              <Text style={activeMode === mode ? styles.chipTextActive : styles.chipText}>{mode}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.searchRow}>
          <TextInput
            value={fromQuery}
            onChangeText={setFromQuery}
            placeholder={t("mobile.transferFromPlaceholder")}
            style={styles.input}
            placeholderTextColor={theme.colors.textMuted}
          />
          <TextInput
            value={toQuery}
            onChangeText={setToQuery}
            placeholder={t("mobile.transferToPlaceholder")}
            style={styles.input}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {transportCard ? (
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{transportCard.name}</Text>
            <Text style={styles.cardMeta}>{transportCard.whereToBuy}</Text>
            <Text style={styles.cardMeta}>{transportCard.howToTopUp}</Text>
            <Text style={styles.cardMeta}>{transportCard.initialCost}</Text>
          </View>
        ) : null}

        <View style={styles.routesWrap}>
          {filteredRoutes.map((route) => (
            <View key={route.id} style={styles.routeCard}>
              <Text style={styles.routeName}>{route.name}</Text>
              <Text style={styles.routePath}>
                {route.from} {"->"} {route.to}
              </Text>
              <Text style={styles.routeMeta}>
                {route.duration} dk · {route.fee} · {route.mode}
              </Text>
            </View>
          ))}
          {filteredRoutes.length === 0 ? (
            <Text style={styles.emptyText}>No routes found.</Text>
          ) : null}
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
    height: 64,
  },
  backBtn: {
    width: 60,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
    alignItems: "center",
  },
  backBtnText: {
    ...presets.secondaryButtonText,
    fontSize: theme.typography.caption.fontSize,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.textPrimary,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  chip: {
    ...presets.chip,
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
  searchRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
    fontWeight: "500",
    fontFamily: theme.typography.fontFamilySans,
  },
  cardInfo: {
    ...presets.card,
    backgroundColor: theme.colors.textPrimary,
    gap: 6,
  },
  cardTitle: {
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
    fontWeight: "800",
    color: theme.colors.surface,
    fontFamily: theme.typography.fontFamilySerif,
  },
  cardMeta: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  routesWrap: {
    gap: theme.spacing.xs,
  },
  routeCard: {
    ...presets.card,
    gap: 6,
  },
  routeName: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  routePath: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  routeMeta: {
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "500",
    paddingVertical: 16,
  },
});

