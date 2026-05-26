import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";
import { apiBaseUrl } from "@/src/lib/authApi";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

interface POI {
  id: string;
  name: string;
  category: string;
  address: string | null;
  lat: number;
  lng: number;
  openingHours?: string | null;
}

interface CityEvent {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
}

const TABS = [
  { id: "sim", label: "SIM Kart", emoji: "📱", color: "#3b82f6", adaptCategory: "sim" },
  { id: "transport", label: "Ulaşım Kartı", emoji: "🚇", color: "#10b981", adaptCategory: "transport_card" },
  { id: "exchange", label: "Döviz", emoji: "💱", color: "#f59e0b", adaptCategory: "exchange" },
  { id: "route", label: "İlk Gün Rotası", emoji: "🗺️", color: "#8b5cf6", adaptCategory: null },
  { id: "events", label: "Bugünkü Etkinlikler", emoji: "🎭", color: "#e8c547", adaptCategory: null },
] as const;

type Props = {
  citySlug: string;
  /** Stack’ten açıldığında geri düğmesi */
  onBack?: () => void;
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function FirstDayGuideScreen({ citySlug, onBack }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("sim");
  const [searchQuery, setSearchQuery] = useState("");
  const [pois, setPois] = useState<POI[]>([]);
  const [routePois, setRoutePois] = useState<POI[]>([]);
  const [cityEvents, setCityEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // location optional
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      fetch(`${apiBaseUrl()}/api/adaptation/${citySlug}`).then((r) => r.json()),
      fetch(`${apiBaseUrl()}/api/pois/city/${citySlug}?category=culture`).then((r) => r.json()),
      fetch(`${apiBaseUrl()}/api/pois/city/${citySlug}?category=food`).then((r) => r.json()),
      fetch(`${apiBaseUrl()}/api/events/city/${citySlug}`).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([adapt, culture, food, evts]) => {
        if (!mounted) return;
        setPois((adapt?.data ?? []) as POI[]);
        const cultureList = (culture?.data ?? []).slice(0, 3).map((p: any) => ({ ...p, category: "culture" }));
        const foodList = (food?.data ?? []).slice(0, 2).map((p: any) => ({ ...p, category: "food" }));
        setRoutePois([...(cultureList as POI[]), ...(foodList as POI[])]);
        setCityEvents((evts?.data ?? []) as CityEvent[]);
      })
      .catch(() => {
        if (!mounted) return;
        setPois([]);
        setRoutePois([]);
        setCityEvents([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [citySlug]);

  const activeAdaptCategory = TABS.find((tab) => tab.id === activeTab)?.adaptCategory;

  const filtered = useMemo(() => {
    if (!activeAdaptCategory) return [];
    return pois
      .filter((p) => p.category === activeAdaptCategory)
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((p) => ({
        ...p,
        distance: userLocation ? getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng) : null,
      }))
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }, [activeAdaptCategory, pois, searchQuery, userLocation]);

  const activeTabMeta = TABS.find((tab) => tab.id === activeTab);

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
        {activeTab !== "events" ? (
          <View style={styles.mapCard}>
            <Text style={styles.mapCardText}>
              {activeTab === "route" ? "🗺️ İlk Gün Rotası Harita Görünümü" : "📍 Seçili kategori noktaları"}
            </Text>
          </View>
        ) : null}

        <View style={styles.tabs}>
          {TABS.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => {
                setActiveTab(cat.id);
                setSearchQuery("");
              }}
              style={[
                styles.tabBtn,
                activeTab === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : null,
              ]}
            >
              <Text style={activeTab === cat.id ? styles.tabTextActive : styles.tabText}>
                {cat.emoji} {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "sim" || activeTab === "transport" || activeTab === "exchange" ? (
          <>
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
                  <View style={styles.poiHeader}>
                    <Text style={styles.poiTitle}>{p.name}</Text>
                    <Text style={[styles.poiChip, { color: activeTabMeta?.color ?? theme.colors.accent }]}>
                      {activeTabMeta?.emoji}
                    </Text>
                  </View>
                  <Text style={styles.poiMeta}>📍 {p.address ?? "Adres bilgisi yok"}</Text>
                  <View style={styles.poiMetaRow}>
                    {p.distance !== null && p.distance !== undefined ? (
                      <Text style={styles.poiMeta}>
                        {p.distance < 1 ? `${Math.round(p.distance * 1000)} m` : `${p.distance.toFixed(1)} km`}
                      </Text>
                    ) : null}
                    <Text style={styles.poiMeta}>{p.openingHours || "Hergün Açık"}</Text>
                  </View>
                  <Pressable
                    style={styles.mapsBtn}
                    onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`)}
                  >
                    <Text style={styles.mapsBtnText}>Haritada aç</Text>
                  </Pressable>
                </View>
              ))}
              {filtered.length === 0 ? <Text style={styles.emptyText}>Sonuç bulunamadı.</Text> : null}
            </View>
          </>
        ) : null}

        {activeTab === "route" ? (
          <View style={styles.listWrap}>
            <Text style={styles.sectionTitle}>Önerilen İlk Gün Rotası</Text>
            <Text style={styles.sectionSub}>
              Şehri tanımak için hazırlanmış temel rota — kültür noktaları ve yemek durakları.
            </Text>
            {routePois.length === 0 ? (
              <Text style={styles.emptyText}>Rota verisi yükleniyor...</Text>
            ) : (
              routePois.map((p, i) => (
                <View key={p.id} style={styles.poiCard}>
                  <Text style={styles.poiTitle}>
                    {i + 1}. {p.name}
                  </Text>
                  {p.address ? <Text style={styles.poiMeta}>📍 {p.address}</Text> : null}
                  <Text style={styles.poiMeta}>{p.category === "food" ? "🍽️ Yemek" : "🏛️ Kültür"}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {activeTab === "events" ? (
          <View style={styles.listWrap}>
            <Text style={styles.sectionTitle}>
              Bugün · {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
            {cityEvents.length === 0 && !loading ? (
              <Text style={styles.emptyText}>Bugün için kayıtlı etkinlik bulunamadı.</Text>
            ) : (
              cityEvents.map((ev) => {
                const start = new Date(ev.startDate);
                return (
                  <View key={ev.id} style={styles.poiCard}>
                    <Text style={styles.poiTitle}>{ev.name}</Text>
                    {ev.location ? <Text style={styles.poiMeta}>📍 {ev.location}</Text> : null}
                    <Text style={styles.poiMeta}>
                      🕐 {start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    {ev.description ? <Text style={styles.poiMeta}>{ev.description}</Text> : null}
                  </View>
                );
              })
            )}
          </View>
        ) : null}
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
  sectionTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: 8,
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
  poiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  poiTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  poiChip: {
    fontSize: 16,
    fontWeight: "800",
  },
  poiMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  poiMeta: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  mapsBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.background,
  },
  mapsBtnText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    paddingVertical: 14,
  },
});
