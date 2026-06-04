import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PocketGuideMap } from "@/src/components/map/PocketGuideMap";
import { AIAssistant, type AIAssistantPin } from "@/src/components/AIAssistant";
import { getSavedTrip, saveTrip, type SavedTripStop } from "@/src/lib/savedTripsApi";
import { DirectionsPanel } from "@/src/components/navigation/DirectionsPanel";
import { RouteControls } from "@/src/components/navigation/RouteControls";
import { RouteProvider, useRoute } from "@/src/context/RouteContext";
import { useAuth } from "@/src/context/AuthContext";
import { geocodeVenue, searchPlaces, type NominatimPlace } from "@/src/lib/geocode";
import {
  clearAiRouteMapDraft,
  clearAiRouteMapPois,
  geocodeDraftStopsToPois,
  loadAiRouteMapDraft,
  loadAiRouteMapPois,
} from "@/src/lib/aiRouteMap";
import { getCityStaticData } from "@/src/data/cityStaticData";
import { HOME_CITIES } from "@/src/constants/homeCities";
import { theme } from "@/src/theme/tokens";
import type { POI } from "@/src/types/poi";

type NominatimResult = NominatimPlace;

type RouteStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
};

type ActiveSheet = "route" | "nearby" | "firstday";

function paramStr(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : "";
}

/** Web MapPage readMapLocationFromParams ile aynı mantık */
function readMapLocationFromParams(params: {
  lat?: string;
  lng?: string;
  name?: string;
  city?: string;
}): { center?: { lat: number; lng: number }; label?: string } {
  const latS = paramStr(params.lat);
  const lngS = paramStr(params.lng);
  if (latS && lngS) {
    const la = parseFloat(latS);
    const ln = parseFloat(lngS);
    if (!Number.isNaN(la) && !Number.isNaN(ln)) {
      return {
        center: { lat: la, lng: ln },
        label: paramStr(params.name) || undefined,
      };
    }
  }

  const citySlug = paramStr(params.city);
  if (citySlug) {
    const data = getCityStaticData(citySlug);
    if (data) {
      const [lat, lng] = data.center;
      return { center: { lat, lng }, label: data.nameTr };
    }
    const home = HOME_CITIES.find((c) => c.slug === citySlug);
    if (home) {
      return { center: undefined, label: home.name };
    }
  }

  return {};
}

function MapScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    draftPOIs,
    addToRouteDraft,
    removeFromRouteDraft,
    setRouteDraft,
    startRoute,
    isFetching,
    routeData,
    error,
  } = useRoute();

  const { q, savedTrip, loadAiRoute, lat, lng, name, city } = useLocalSearchParams<{
    q?: string;
    savedTrip?: string;
    loadAiRoute?: string;
    lat?: string;
    lng?: string;
    name?: string;
    city?: string;
  }>();

  const [ready, setReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number } | undefined>();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>("route");
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveTripMsg, setSaveTripMsg] = useState<string | null>(null);
  const [aiRouteLoading, setAiRouteLoading] = useState(false);
  const [aiRecommendationPins, setAiRecommendationPins] = useState<AIAssistantPin[]>([]);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiRouteLoadRef = useRef(false);

  const routeStops = useMemo<RouteStop[]>(
    () =>
      draftPOIs.map((poi) => ({
        id: poi.id,
        name: poi.name,
        lat: poi.coordinate.latitude,
        lng: poi.coordinate.longitude,
        address: poi.description,
      })),
    [draftPOIs],
  );

  const tabBarPad = 56 + insets.bottom;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const has = await AsyncStorage.getItem("pg_has_onboarded");
        if (has !== "true") {
          router.replace("/onboarding" as any);
          return;
        }
      } catch {
        /* ignore */
      }
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    const initial = paramStr(q);
    if (initial) setSearchQuery(initial);
  }, [q]);

  useEffect(() => {
    const loc = readMapLocationFromParams({ lat, lng, name, city });
    if (loc.center) {
      setMapCenter(loc.center);
      setSearchMarker(undefined);
    }
    if (loc.label) {
      setSearchQuery(loc.label);
    }
  }, [lat, lng, name, city]);

  useEffect(() => {
    const tripId = paramStr(savedTrip);
    if (!tripId) return;
    let cancelled = false;
    void getSavedTrip(tripId)
      .then((trip) => {
        if (cancelled) return;
        const stops = trip.stops as SavedTripStop[];
        setRouteDraft(
          stops.map((s) => ({
            id: s.id,
            name: s.name,
            category: "event",
            coordinate: { latitude: s.lat, longitude: s.lng },
            description: s.address,
          })),
        );
        if (trip.cityName) setSearchQuery(trip.cityName);
        setActiveSheet("route");
      })
      .catch(() => {
        if (!cancelled) setSaveTripMsg("Seyahat yüklenemedi");
      });
    return () => {
      cancelled = true;
    };
  }, [savedTrip, setRouteDraft]);

  useEffect(() => {
    if (paramStr(loadAiRoute) !== "1") {
      aiRouteLoadRef.current = false;
      return;
    }
    if (aiRouteLoadRef.current) return;
    aiRouteLoadRef.current = true;

    let cancelled = false;
    (async () => {
      const draft = await loadAiRouteMapDraft();
      const preloaded = await loadAiRouteMapPois();

      if (preloaded?.length) {
        setRouteDraft(preloaded);
        setActiveSheet("route");
        const label = draft
          ? `${draft.city} · ${draft.day}. Gün (${preloaded.length} durak)`
          : `AI Rota (${preloaded.length} durak)`;
        setSearchQuery(label);
        setMapCenter({
          lat: preloaded[0].coordinate.latitude,
          lng: preloaded[0].coordinate.longitude,
        });
        if (preloaded.length >= 2) void startRoute();
        await clearAiRouteMapDraft();
        await clearAiRouteMapPois();
        return;
      }

      if (!draft?.stops.length) {
        if (!cancelled) setSaveTripMsg("Günlük rota verisi bulunamadı.");
        return;
      }

      setAiRouteLoading(true);
      try {
        const pois = await geocodeDraftStopsToPois(
          draft.stops,
          draft.city,
          draft.day,
          draft.cityNameEn,
        );
        if (cancelled) return;
        if (!pois.length) {
          setSaveTripMsg("Mekanlar haritada bulunamadı.");
          return;
        }
        setRouteDraft(pois);
        setActiveSheet("route");
        setSearchQuery(`${draft.city} · ${draft.day}. Gün (${pois.length}/${draft.stops.length} durak)`);
        setMapCenter({ lat: pois[0].coordinate.latitude, lng: pois[0].coordinate.longitude });
        if (pois.length >= 2) void startRoute();
        await clearAiRouteMapDraft();
        await clearAiRouteMapPois();
      } catch {
        if (!cancelled) setSaveTripMsg("Günlük rota haritaya yüklenemedi.");
      } finally {
        if (!cancelled) setAiRouteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAiRoute, setRouteDraft, startRoute]);

  useEffect(() => {
    const query = paramStr(q);
    if (!query.trim() || paramStr(loadAiRoute) === "1") return;
    let cancelled = false;
    void geocodeVenue(query.trim()).then((geo) => {
      if (cancelled || !geo) return;
      setMapCenter({ lat: geo.lat, lng: geo.lng });
      setSearchQuery(geo.displayName);
    });
    return () => {
      cancelled = true;
    };
  }, [q, loadAiRoute]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setSearchLoading(false);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCenter({ lat, lng });
    setSearchMarker({ lat, lng });
    setSearchQuery(result.display_name.split(",")[0]);
    setShowResults(false);
    Keyboard.dismiss();
  };

  const addToRoute = (result: NominatimResult) => {
    const stopId = `nm_${result.place_id}`;
    if (draftPOIs.some((p) => p.id === stopId)) {
      setShowResults(false);
      setActiveSheet("route");
      return;
    }
    addToRouteDraft({
      id: stopId,
      name: result.display_name.split(",")[0],
      category: "event",
      coordinate: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      },
      description: result.display_name.split(",").slice(1, 3).join(",").trim(),
    });
    setShowResults(false);
    setSearchQuery("");
    setActiveSheet("route");
    Keyboard.dismiss();
  };

  const handleLocate = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({});
    setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setSearchMarker(undefined);
  };

  const handleSaveToTrips = async () => {
    if (routeStops.length < 2) return;
    if (!user) {
      router.push("/login" as any);
      return;
    }
    setSavingTrip(true);
    setSaveTripMsg(null);
    const cityLabel = searchQuery.trim() || routeStops[0]?.name;
    try {
      await saveTrip({
        title: cityLabel ? `${cityLabel} Rotası` : undefined,
        cityName: cityLabel,
        stops: routeStops,
        routeData: routeData ?? undefined,
        durationMinutes: routeData?.total_duration_min,
        distanceKm: routeData?.total_distance_km,
      });
      setSaveTripMsg("Seyahatlerime kaydedildi ✓");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "LOGIN_REQUIRED") {
        router.push("/login" as any);
        return;
      }
      setSaveTripMsg("Kayıt başarısız");
    } finally {
      setSavingTrip(false);
    }
  };

  if (!ready) return null;

  return (
    <View style={styles.container}>
      <PocketGuideMap
        categoryFilter="all"
        searchQuery=""
        showPins={false}
        showLayerToggle={false}
        forcedCenter={mapCenter}
        searchMarker={searchMarker}
        aiRecommendationPins={aiRecommendationPins}
        onMapCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>

        <View style={styles.searchWrap}>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Yer, mekan, adres ara..."
              style={styles.searchInput}
              placeholderTextColor={theme.colors.textMuted}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            ) : null}
            {searchQuery && !searchLoading ? (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
              >
                <Text style={styles.searchClear}>×</Text>
              </Pressable>
            ) : null}
          </View>

          {showResults && searchResults.length > 0 ? (
            <View style={styles.resultsDropdown}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.place_id)}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                renderItem={({ item }) => (
                  <View style={styles.resultItem}>
                    <Pressable style={styles.resultMain} onPress={() => handleSelectResult(item)}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {item.display_name.split(",")[0]}
                      </Text>
                      <Text style={styles.resultAddr} numberOfLines={1}>
                        {item.display_name.split(",").slice(1, 3).join(",")}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.addRouteBtn} onPress={() => addToRoute(item)}>
                      <Text style={styles.addRouteBtnText}>+ Rotaya Ekle</Text>
                    </Pressable>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.resultDivider} />}
              />
            </View>
          ) : null}
        </View>

        <Pressable onPress={() => void handleLocate()} style={styles.locateBtn}>
          <Text style={styles.locateBtnText}>◎</Text>
        </Pressable>
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: tabBarPad }]}>
        <View style={styles.sheetHandle} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sheetTabs}
        >
          {(["route", "nearby", "firstday"] as ActiveSheet[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveSheet(tab)}
              style={[styles.sheetTab, activeSheet === tab && styles.sheetTabActive]}
            >
              <Text style={[styles.sheetTabText, activeSheet === tab && styles.sheetTabTextActive]}>
                {tab === "route"
                  ? `Rota Planla${routeStops.length > 0 ? ` (${routeStops.length})` : ""}`
                  : tab === "nearby"
                    ? "Yakınımda"
                    : "💡 İlk Gün"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {activeSheet === "route" && (
          <View style={styles.routePanel}>
            {routeStops.length === 0 ? (
              <View style={styles.routeEmpty}>
                <Text style={styles.routeEmptyText}>
                  Aramadan yer seçerek rotana ekleyebilirsin.
                </Text>
                <Text style={styles.routeHint}>En az 2 nokta ekle, sonra rotayı başlat.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 160 }}>
                {routeStops.map((stop, i) => (
                  <View key={stop.id} style={styles.routeStop}>
                    <View style={styles.stopNum}>
                      <Text style={styles.stopNumText}>{i + 1}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      <Text style={styles.stopName} numberOfLines={1}>
                        {stop.name}
                      </Text>
                      {stop.address ? (
                        <Text style={styles.stopAddr} numberOfLines={1}>
                          {stop.address}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => removeFromRouteDraft(stop.id)}
                      style={styles.stopRemove}
                    >
                      <Text style={styles.stopRemoveText}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            {routeStops.length >= 2 && (
              <View style={styles.routeActions}>
                <Pressable
                  onPress={() => void startRoute()}
                  style={[styles.routeStartBtn, isFetching && styles.routeBtnDisabled]}
                  disabled={isFetching}
                >
                  <Text style={styles.routeStartBtnText}>
                    {isFetching ? "Hesaplanıyor..." : "Rotayı Başlat →"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleSaveToTrips()}
                  style={[styles.routeSaveBtn, savingTrip && styles.routeBtnDisabled]}
                  disabled={savingTrip}
                >
                  <Text style={styles.routeSaveBtnText}>
                    {savingTrip ? "Kaydediliyor..." : "Seyahatlerime Kaydet"}
                  </Text>
                </Pressable>
                {saveTripMsg ? (
                  <Text
                    style={[
                      styles.routeHint,
                      { color: saveTripMsg.includes("✓") ? "#059669" : "#dc2626" },
                    ]}
                  >
                    {saveTripMsg}
                  </Text>
                ) : null}
                {error ? (
                  <Text style={[styles.routeHint, { color: "#dc2626" }]}>{error}</Text>
                ) : null}
              </View>
            )}

            {aiRouteLoading ? (
              <Text style={styles.routeHint}>Günlük rota haritaya yükleniyor…</Text>
            ) : null}
          </View>
        )}

        {activeSheet === "nearby" && (
          <View style={styles.nearbyPanel}>
            <Text style={styles.nearbyHint}>
              Yakınındaki mekanları görmek için konum izni gerekiyor.
            </Text>
            <Pressable onPress={() => void handleLocate()} style={styles.nearbyBtn}>
              <Text style={styles.nearbyBtnText}>Konumuma Git</Text>
            </Pressable>
          </View>
        )}

        {activeSheet === "firstday" && (
          <Pressable onPress={() => router.push("/first-day" as any)} style={styles.firstDayLink}>
            <Text style={styles.firstDayLinkText}>💡</Text>
            <Text style={styles.firstDayLinkLabel}>İlk Gün Rehberini Aç</Text>
            <Text style={styles.firstDayLinkArrow}>→</Text>
          </Pressable>
        )}
      </View>

      <DirectionsPanel />
      <RouteControls />
      <AIAssistant
        lat={mapCenter?.lat}
        lng={mapCenter?.lng}
        onPinsChange={setAiRecommendationPins}
        onFlyTo={(flyLat, flyLng) => {
          setMapCenter({ lat: flyLat, lng: flyLng });
          setSearchMarker(undefined);
        }}
      />
      <StatusBar hidden />
    </View>
  );
}

export default function PocketGuideMapScreen() {
  return (
    <RouteProvider>
      <MapScreenContent />
    </RouteProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  topBar: {
    position: "absolute",
    top: 0,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 200,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  backBtnText: { fontSize: 20, color: theme.colors.textPrimary },

  searchWrap: { flex: 1, position: "relative" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 14, color: theme.colors.textSecondary },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilySans,
  },
  searchClear: { fontSize: 20, color: theme.colors.textSecondary, paddingHorizontal: 4 },

  resultsDropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    zIndex: 300,
    maxHeight: 280,
  },
  resultItem: { flexDirection: "row", alignItems: "center", padding: 12 },
  resultMain: { flex: 1 },
  resultName: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  resultAddr: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  addRouteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 8,
    marginLeft: 8,
  },
  addRouteBtnText: { fontSize: 11, fontWeight: "700", color: theme.colors.surface },
  resultDivider: { height: 1, backgroundColor: theme.colors.border },

  locateBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  locateBtnText: { fontSize: 20, color: "#3b82f6" },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 200,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  sheetTabs: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  sheetTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  sheetTabActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  sheetTabText: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary },
  sheetTabTextActive: { color: theme.colors.surface },

  routePanel: { paddingHorizontal: 16, gap: 8 },
  routeEmpty: { paddingVertical: 12 },
  routeEmptyText: { fontSize: 13, color: theme.colors.textSecondary, textAlign: "center" },
  routeHint: { fontSize: 12, color: theme.colors.textMuted, textAlign: "center", marginTop: 4 },

  routeStop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stopNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  stopNumText: { fontSize: 12, fontWeight: "700", color: "#3b82f6" },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  stopAddr: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  stopRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stopRemoveText: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 20 },

  routeActions: { gap: 8, marginTop: 8 },
  routeStartBtn: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  routeStartBtnText: { fontSize: 14, fontWeight: "700", color: theme.colors.surface },
  routeSaveBtn: {
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeSaveBtnText: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },
  routeBtnDisabled: { opacity: 0.6 },

  nearbyPanel: { paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", gap: 10 },
  nearbyHint: { fontSize: 13, color: theme.colors.textSecondary, textAlign: "center" },
  nearbyBtn: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  nearbyBtnText: { fontSize: 13, fontWeight: "700", color: theme.colors.surface },

  firstDayLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff8e0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0d870",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  firstDayLinkText: { fontSize: 20 },
  firstDayLinkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginLeft: 10,
  },
  firstDayLinkArrow: { fontSize: 16, color: theme.colors.textSecondary },
});
