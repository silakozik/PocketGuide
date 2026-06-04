import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { FirstDayMiniMap, type FirstDayMapMarker } from "@/src/components/map/FirstDayMiniMap";
import { Text } from "@/components/Themed";
import {
  getCityStaticData,
  type StaticPOI,
  type TransportCardInfo,
} from "@/src/data/cityStaticData";
import { apiBaseUrl } from "@/src/lib/authApi";
import { theme } from "@/src/theme/tokens";

interface POI {
  id: string;
  name: string;
  category: string;
  address: string | null;
  lat: number;
  lng: number;
  openingHours?: string | null;
  tip?: string;
}

interface CityEvent {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
}

interface StaticExchangeDisplay {
  title?: string;
  tips?: string[];
}

const TABS = [
  { id: "sim", label: "SIM Kart", emoji: "📱", color: "#3b82f6", adaptCategory: "sim" },
  { id: "transport", label: "Ulaşım Kartı", emoji: "🚇", color: "#10b981", adaptCategory: "transport_card" },
  { id: "exchange", label: "Döviz", emoji: "💱", color: "#f59e0b", adaptCategory: "exchange" },
  { id: "route", label: "İlk Gün Rotası", emoji: "🗺️", color: "#8b5cf6", adaptCategory: null },
  { id: "events", label: "Bugünkü Etkinlikler", emoji: "🎭", color: "#e8c547", adaptCategory: null },
] as const;

const ADAPT_CATEGORIES = ["sim", "transport_card", "exchange"] as const;

type Props = {
  citySlug: string;
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

function staticPoiToPOI(p: StaticPOI): POI {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    openingHours: p.openingHours ?? null,
    tip: p.tip,
  };
}

function apiPoiToPOI(p: any): POI {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    address: p.address ?? null,
    lat: p.lat,
    lng: p.lng,
    openingHours: p.openingHours ?? null,
  };
}

function mergeApiAndStatic(apiPois: POI[], staticPois: StaticPOI[]): POI[] {
  const merged: POI[] = [];
  for (const cat of ADAPT_CATEGORIES) {
    const apiForCat = apiPois.filter((p) => p.category === cat);
    if (apiForCat.length > 0) {
      merged.push(...apiForCat);
    } else {
      merged.push(...staticPois.filter((p) => p.category === cat).map(staticPoiToPOI));
    }
  }
  return merged;
}

function formatCitySlug(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

export function FirstDayGuideScreen({ citySlug, onBack }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const staticData = useMemo(() => getCityStaticData(citySlug), [citySlug]);

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("sim");
  const [searchQuery, setSearchQuery] = useState("");
  const [pois, setPois] = useState<POI[]>([]);
  const [routePois, setRoutePois] = useState<POI[]>([]);
  const [cityEvents, setCityEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [staticExchange, setStaticExchange] = useState<StaticExchangeDisplay | null>(null);
  const [cityName, setCityName] = useState(staticData?.nameTr ?? formatCitySlug(citySlug));

  const mapCenter = useMemo(
    () => ({
      lat: staticData?.center[0] ?? 41.0082,
      lng: staticData?.center[1] ?? 28.9784,
    }),
    [staticData],
  );

  useEffect(() => {
    if (staticData?.nameTr) setCityName(staticData.nameTr);
  }, [staticData]);

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
    setStaticExchange(null);

    const sd = getCityStaticData(citySlug);
    if (sd?.nameTr) setCityName(sd.nameTr);

    Promise.all([
      fetch(`${apiBaseUrl()}/api/adaptation/${citySlug}`).then((r) => r.json()),
      fetch(`${apiBaseUrl()}/api/pois/city/${citySlug}?category=culture`).then((r) => r.json()),
      fetch(`${apiBaseUrl()}/api/pois/city/${citySlug}?category=food`).then((r) => r.json()),
      fetch(`${apiBaseUrl()}/api/events/city/${citySlug}?days=2`)
        .then((r) => r.json())
        .catch(() => ({ days: [] })),
    ])
      .then(([adapt, culture, food, evts]) => {
        if (!mounted) return;

        if (adapt?.city?.nameTr || adapt?.city?.nameEn) {
          setCityName(adapt.city.nameTr ?? adapt.city.nameEn);
        }

        const apiPois = ((adapt?.data ?? []) as any[]).map(apiPoiToPOI);
        const staticPois = sd?.pois ?? [];

        let mergedPois: POI[];
        if (apiPois.length > 0) {
          mergedPois = mergeApiAndStatic(apiPois, staticPois);
        } else if (sd) {
          mergedPois = staticPois.map(staticPoiToPOI);
        } else {
          mergedPois = [];
        }
        setPois(mergedPois);

        const cultureList = (culture?.data ?? []).slice(0, 3).map((p: any) => ({ ...apiPoiToPOI(p), category: "culture" }));
        const foodList = (food?.data ?? []).slice(0, 2).map((p: any) => ({ ...apiPoiToPOI(p), category: "food" }));
        const apiRoute = [...cultureList, ...foodList] as POI[];

        if (apiRoute.length === 0 && sd?.route) {
          setRoutePois(
            sd.route.map((stop) => ({
              id: `static-route-${stop.order}`,
              name: stop.name,
              category: stop.category,
              address: stop.address,
              lat: stop.lat,
              lng: stop.lng,
              openingHours: stop.tip,
            })),
          );
        } else {
          setRoutePois(apiRoute);
        }

        const days = (evts?.days ?? []) as { data?: CityEvent[] }[];
        const apiEvents = days.flatMap((d) => d.data ?? []) as CityEvent[];

        if (apiEvents.length === 0 && sd?.events) {
          setCityEvents(
            sd.events.map((ev) => ({
              id: ev.id,
              name: ev.name,
              description: ev.tip ?? null,
              location: ev.location ?? null,
              startDate: ev.time ?? "",
              endDate: "",
            })),
          );
        } else {
          setCityEvents(apiEvents);
        }

        const hasExchangePoi = mergedPois.some((p) => p.category === "exchange");
        if (!hasExchangePoi && sd) {
          const exchangePois = sd.pois.filter((p) => p.category === "exchange");
          if (exchangePois.length > 0) {
            setStaticExchange({
              title: "Döviz Bozdurma",
              tips: exchangePois.map((p) => {
                const parts = [p.name, p.address];
                if (p.tip) parts.push(p.tip);
                return parts.join(" — ");
              }),
            });
          }
        }
      })
      .catch(() => {
        if (!mounted) return;
        if (sd) {
          setPois(sd.pois.map(staticPoiToPOI));
          setRoutePois(
            sd.route.map((stop) => ({
              id: `static-route-${stop.order}`,
              name: stop.name,
              category: stop.category,
              address: stop.address,
              lat: stop.lat,
              lng: stop.lng,
              openingHours: stop.tip,
            })),
          );
          setCityEvents(
            sd.events.map((ev) => ({
              id: ev.id,
              name: ev.name,
              description: ev.tip ?? null,
              location: ev.location ?? null,
              startDate: ev.time ?? "",
              endDate: "",
            })),
          );
          const exchangePois = sd.pois.filter((p) => p.category === "exchange");
          if (exchangePois.length > 0) {
            setStaticExchange({
              title: "Döviz Bozdurma",
              tips: exchangePois.map((p) => {
                const parts = [p.name, p.address];
                if (p.tip) parts.push(p.tip);
                return parts.join(" — ");
              }),
            });
          }
        } else {
          setPois([]);
          setRoutePois([]);
          setCityEvents([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [citySlug]);

  const activeAdaptCategory = TABS.find((tab) => tab.id === activeTab)?.adaptCategory;
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab);

  const mapSourcePois = useMemo(() => {
    if (activeTab === "route") return routePois;
    if (!activeAdaptCategory) return [];
    return pois.filter((p) => p.category === activeAdaptCategory);
  }, [activeTab, activeAdaptCategory, pois, routePois]);

  const miniMapMarkers: FirstDayMapMarker[] = useMemo(() => {
    if (activeTab === "route") {
      return mapSourcePois.map((p, i) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        name: p.name,
        order: i + 1,
      }));
    }
    return mapSourcePois.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      name: p.name,
      color: activeTabMeta?.color,
      emoji: activeTabMeta?.emoji,
    }));
  }, [activeTab, mapSourcePois, activeTabMeta]);

  const computedCenter = useMemo(() => {
    if (miniMapMarkers.length > 0) {
      return { lat: miniMapMarkers[0].lat, lng: miniMapMarkers[0].lng };
    }
    return mapCenter;
  }, [miniMapMarkers, mapCenter]);

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

  const transportCard = staticData?.transportCard;

  return (
    <View style={styles.root}>
      {onBack ? (
        <View style={[styles.header, { paddingTop: Math.max(insets.top, theme.spacing.sm) }]}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{cityName} · İlk Gün Rehberi</Text>
            <Text style={styles.headerSub}>Şehre ilk adımın için her şey burada</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((cat) => {
          const isActive = activeTab === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                setActiveTab(cat.id);
                setSearchQuery("");
              }}
              style={[
                styles.tabBtn,
                isActive
                  ? { backgroundColor: "#fff", borderColor: cat.color }
                  : { backgroundColor: theme.colors.surface, borderColor: "transparent" },
              ]}
            >
              <View style={[styles.tabDot, isActive ? { backgroundColor: cat.color, opacity: 1 } : { opacity: 0.4 }]} />
              <Text style={[styles.tabText, isActive ? { color: cat.color } : null]}>
                {cat.emoji} {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeTab !== "events" ? (
        <FirstDayMiniMap center={computedCenter} markers={miniMapMarkers} height={220} />
      ) : null}

      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[
          styles.content,
          !onBack ? { paddingTop: Math.max(theme.spacing.sm, insets.top) } : null,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "sim" || activeTab === "transport" || activeTab === "exchange" ? (
          <>
            {activeTab === "transport" && transportCard ? (
              <TransportCardBlock card={transportCard} />
            ) : null}

            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="İsime göre ara..."
                style={styles.searchInput}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.listWrap}>
              {filtered.map((p) => (
                <View key={p.id} style={styles.poiCard}>
                  <View
                    style={[
                      styles.poiIcon,
                      { backgroundColor: `${activeTabMeta?.color ?? "#3b82f6"}18` },
                    ]}
                  >
                    <Text style={styles.poiIconEmoji}>{activeTabMeta?.emoji}</Text>
                  </View>
                  <View style={styles.poiBody}>
                    <Text style={styles.poiTitle}>{p.name}</Text>
                    <Text style={styles.poiMeta}>📍 {p.address ?? "Adres bilgisi yok"}</Text>
                    {p.tip ? <Text style={styles.poiTip}>💡 {p.tip}</Text> : null}
                    <View style={styles.poiTags}>
                      {p.distance != null ? (
                        <View style={styles.tagDist}>
                          <Text style={styles.tagDistText}>
                            {p.distance < 1
                              ? `${Math.round(p.distance * 1000)} m`
                              : `${p.distance.toFixed(1)} km`}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{p.openingHours || "Hergün Açık"}</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    style={styles.mapsBtn}
                    onPress={() =>
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`)
                    }
                  >
                    <Text style={styles.mapsBtnIcon}>📍</Text>
                  </Pressable>
                </View>
              ))}

              {filtered.length === 0 && activeTab === "exchange" && staticExchange ? (
                <View style={styles.staticCardBox}>
                  <Text style={styles.staticCardName}>{staticExchange.title ?? "Döviz Bozdurma"}</Text>
                  {staticExchange.tips?.map((tip, i) => (
                    <View key={i} style={styles.staticTipRow}>
                      <Text style={styles.staticTipDot}>•</Text>
                      <Text style={styles.staticTipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {filtered.length === 0 &&
              !(activeTab === "transport" && transportCard) &&
              !(activeTab === "exchange" && staticExchange) ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyText}>
                    {loading ? "Yükleniyor..." : "Sonuç bulunamadı."}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {activeTab === "route" ? (
          <View style={styles.listWrap}>
            <Text style={styles.routeDesc}>
              Şehri ilk günde tanımak için önerilen temel rota.
            </Text>
            {routePois.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🗺️</Text>
                <Text style={styles.emptyText}>
                  {loading ? "Rota verisi yükleniyor..." : "Bu şehir için henüz rota eklenmemiş."}
                </Text>
              </View>
            ) : (
              routePois.map((p, i) => (
                <View key={p.id} style={styles.stopRow}>
                  <View style={styles.stopLineCol}>
                    <View
                      style={[
                        styles.stopNum,
                        p.category === "food" ? styles.stopNumFood : styles.stopNumCulture,
                      ]}
                    >
                      <Text style={styles.stopNumText}>{i + 1}</Text>
                    </View>
                    {i < routePois.length - 1 ? <View style={styles.stopSeg} /> : null}
                  </View>
                  <View style={styles.stopBody}>
                    <Text style={styles.stopName}>{p.name}</Text>
                    {p.address ? <Text style={styles.poiMeta}>📍 {p.address}</Text> : null}
                    {p.openingHours ? <Text style={styles.poiTip}>💡 {p.openingHours}</Text> : null}
                    <View
                      style={[
                        styles.stopChip,
                        p.category === "food" ? styles.stopChipFood : styles.stopChipCulture,
                      ]}
                    >
                      <Text style={styles.stopChipText}>
                        {p.category === "food" ? "🍽️ Yemek" : "🏛️ Kültür"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {activeTab === "events" ? (
          <View style={styles.listWrap}>
            <Text style={styles.sectionTitle}>
              Bugün · {new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            {cityEvents.length === 0 && !loading ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🎭</Text>
                <Text style={styles.emptyText}>Bugün için kayıtlı etkinlik bulunamadı.</Text>
              </View>
            ) : (
              cityEvents.map((ev) => {
                const start = ev.startDate ? new Date(ev.startDate) : null;
                const timeLabel = start && !isNaN(start.getTime())
                  ? start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                  : ev.startDate;
                const dayNum = start && !isNaN(start.getTime()) ? start.getDate() : "—";
                const monthLabel = start && !isNaN(start.getTime())
                  ? start.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase()
                  : "";
                return (
                  <View key={ev.id} style={styles.eventCard}>
                    <View style={styles.eventDate}>
                      <Text style={styles.eventDay}>{dayNum}</Text>
                      {monthLabel ? <Text style={styles.eventMon}>{monthLabel}</Text> : null}
                    </View>
                    <View style={styles.eventBody}>
                      <Text style={styles.eventName}>{ev.name}</Text>
                      {ev.location ? <Text style={styles.poiMeta}>📍 {ev.location}</Text> : null}
                      {timeLabel ? <Text style={styles.poiMeta}>🕐 {timeLabel}</Text> : null}
                      {ev.description ? <Text style={styles.eventDesc}>{ev.description}</Text> : null}
                    </View>
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

function TransportCardBlock({ card }: { card: TransportCardInfo }) {
  return (
    <View style={styles.transportCard}>
      <View style={styles.tcHeader}>
        <Text style={styles.tcName}>🚇 {card.name}</Text>
        <Text style={styles.tcCost}>{card.cost}</Text>
      </View>
      <View style={styles.tcRow}>
        <Text style={styles.tcLabel}>Nereden alınır</Text>
        <Text style={styles.tcVal}>{card.whereToBuy}</Text>
      </View>
      <View style={styles.tcRow}>
        <Text style={styles.tcLabel}>Nasıl yüklenir</Text>
        <Text style={styles.tcVal}>{card.howToLoad}</Text>
      </View>
      {card.tip ? <Text style={styles.tcTip}>💡 {card.tip}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  headerCenter: {
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  tabsScroll: {
    flexGrow: 0,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.textMuted,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  listScroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  searchWrap: {
    position: "relative",
    marginBottom: 4,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: 13,
    zIndex: 1,
    fontSize: 14,
  },
  searchInput: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingLeft: 40,
    paddingRight: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontWeight: "600",
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 14,
  },
  listWrap: {
    gap: 10,
  },
  routeDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  poiCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    ...theme.shadows.card,
  },
  poiIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  poiIconEmoji: {
    fontSize: 20,
  },
  poiBody: {
    flex: 1,
    gap: 3,
  },
  poiTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  poiMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  poiTip: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  poiTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.colors.background,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  tagDist: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "#eff6ff",
  },
  tagDistText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3b82f6",
  },
  mapsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0f1f3d",
    alignItems: "center",
    justifyContent: "center",
  },
  mapsBtnIcon: {
    fontSize: 16,
  },
  transportCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
    marginBottom: 4,
  },
  tcHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tcName: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    flex: 1,
  },
  tcCost: {
    fontSize: 15,
    fontWeight: "800",
    color: "#e8c547",
  },
  tcRow: {
    gap: 2,
  },
  tcLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tcVal: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  tcTip: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  stopRow: {
    flexDirection: "row",
    gap: 14,
  },
  stopLineCol: {
    alignItems: "center",
  },
  stopNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stopNumCulture: {
    backgroundColor: "#8b5cf6",
  },
  stopNumFood: {
    backgroundColor: "#10b981",
  },
  stopNumText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  stopSeg: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  stopBody: {
    flex: 1,
    paddingBottom: 18,
    gap: 3,
  },
  stopName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  stopChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    marginTop: 4,
  },
  stopChipCulture: {
    backgroundColor: "#f3e8ff",
  },
  stopChipFood: {
    backgroundColor: "#d1fae5",
  },
  stopChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  eventCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    ...theme.shadows.card,
  },
  eventDate: {
    width: 44,
    alignItems: "center",
    paddingTop: 2,
  },
  eventDay: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
  eventMon: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  eventBody: {
    flex: 1,
    gap: 4,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  eventDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  staticCardBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  staticCardName: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  staticTipRow: {
    flexDirection: "row",
    gap: 8,
  },
  staticTipDot: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  staticTipText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
});
