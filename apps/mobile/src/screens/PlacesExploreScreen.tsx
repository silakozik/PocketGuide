import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DEFAULT_EXPLORE_CITY,
  HOME_CITIES,
  LAST_CITY_STORAGE_KEY,
  resolveExploreCitySlug,
} from "@/src/constants/homeCities";
import {
  getPlaceCategory,
  isExplorePlaceCategory,
  type ExplorePlaceCategory,
} from "@/src/constants/placeCategories";
import { fetchExplorePlaces, type ExplorePlaceItem } from "@/src/lib/placesExploreApi";
import { theme } from "@/src/theme/tokens";

const PAGE_SIZE = 30;

type Props = {
  placeCategory: string;
  initialCity?: string;
  onBack?: () => void;
};

function formatRating(rating: number | null): string {
  if (rating == null) return "";
  return rating.toFixed(1);
}

function priceLabel(level: number | null): string {
  if (level == null) return "";
  return "$".repeat(Math.min(4, Math.max(1, Math.round(level))));
}

export function PlacesExploreScreen({ placeCategory, initialCity, onBack }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const categoryMeta = getPlaceCategory(placeCategory);

  const [citySlug, setCitySlug] = useState(
    resolveExploreCitySlug(initialCity ?? DEFAULT_EXPLORE_CITY),
  );
  const [places, setPlaces] = useState<ExplorePlaceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const cityLabel = HOME_CITIES.find((c) => c.slug === citySlug)?.name ?? citySlug;

  useEffect(() => {
    if (initialCity) {
      setCitySlug(resolveExploreCitySlug(initialCity));
    }
  }, [initialCity]);

  useEffect(() => {
    void AsyncStorage.setItem(LAST_CITY_STORAGE_KEY, citySlug);
  }, [citySlug]);

  const loadPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (!isExplorePlaceCategory(placeCategory)) return;

      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetchExplorePlaces(
          citySlug,
          placeCategory as ExplorePlaceCategory,
          { limit: PAGE_SIZE, offset: nextOffset },
        );
        setTotal(res.meta.total);
        setOffset(nextOffset + res.data.length);
        setPlaces((prev) => (append ? [...prev, ...res.data] : res.data));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Mekanlar yüklenemedi.");
        if (!append) {
          setPlaces([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [placeCategory, citySlug],
  );

  useEffect(() => {
    if (!isExplorePlaceCategory(placeCategory)) return;
    setPlaces([]);
    setOffset(0);
    void loadPage(0, false);
  }, [placeCategory, citySlug, loadPage]);

  const hasMore = places.length < total;

  const openPlaceOnMap = (place: ExplorePlaceItem) => {
    router.push({
      pathname: "/(tabs)/map",
      params: {
        city: citySlug,
        lat: String(place.lat),
        lng: String(place.lng),
        name: place.name,
      },
    } as never);
  };

  const openCityMap = () => {
    router.push({
      pathname: "/(tabs)/map",
      params: { city: citySlug },
    } as never);
  };

  if (!categoryMeta) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.emptyText}>Geçersiz kategori.</Text>
        <Pressable style={styles.retryBtn} onPress={() => (onBack ? onBack() : router.back())}>
          <Text style={styles.retryBtnText}>Geri</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.hero,
          { backgroundColor: categoryMeta.color, paddingTop: insets.top + 12 },
        ]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => (onBack ? onBack() : router.back())}
          hitSlop={8}
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.heroEmoji}>{categoryMeta.emoji}</Text>
        <Text style={styles.heroTitle}>{categoryMeta.title}</Text>
        <Text style={styles.heroMeta}>
          {cityLabel}
          {loading ? "" : ` · ${total} mekan`}
        </Text>
        <Pressable style={styles.cityPicker} onPress={() => setShowCityPicker(true)}>
          <Text style={styles.cityPickerText}>Şehir: {cityLabel} ▾</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.statusText}>Mekanlar yükleniyor…</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => void loadPage(0, false)}>
              <Text style={styles.retryBtnText}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && places.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Bu şehirde henüz {categoryMeta.title.toLowerCase()} kaydı yok.
            </Text>
            <Pressable style={styles.mapLink} onPress={openCityMap}>
              <Text style={styles.mapLinkText}>Haritada keşfet</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && places.length > 0 ? (
          <View style={styles.rows}>
            {places.map((place) => (
              <Pressable
                key={place.id}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
                onPress={() => openPlaceOnMap(place)}
              >
                <Text style={styles.rowIcon}>{categoryMeta.emoji}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowName}>{place.name}</Text>
                  <Text style={styles.rowMeta} numberOfLines={2}>
                    {place.description || categoryMeta.subtitle}
                    {place.address ? ` · ${place.address}` : ""}
                  </Text>
                </View>
                <View style={styles.rowSide}>
                  {place.rating != null ? (
                    <Text style={styles.rating}>{formatRating(place.rating)} ★</Text>
                  ) : null}
                  {place.priceLevel != null ? (
                    <Text style={styles.price}>{priceLabel(place.priceLevel)}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!loading && !error && hasMore ? (
          <Pressable
            style={styles.moreBtn}
            disabled={loadingMore}
            onPress={() => void loadPage(offset, true)}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            ) : (
              <Text style={styles.moreBtnText}>Daha fazla göster</Text>
            )}
          </Pressable>
        ) : null}

        <View style={styles.footer}>
          <Pressable style={styles.mapCta} onPress={openCityMap}>
            <Text style={styles.mapCtaText}>Haritada gör</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL("https://foursquare.com")}>
            <Text style={styles.attribution}>
              Powered by <Text style={styles.attributionLink}>Foursquare</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showCityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCityPicker(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Şehir seç</Text>
            <ScrollView>
              {HOME_CITIES.map((city) => (
                <Pressable
                  key={city.slug}
                  style={[
                    styles.modalCityItem,
                    citySlug === city.slug && styles.modalCityItemActive,
                  ]}
                  onPress={() => {
                    setCitySlug(city.slug);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={styles.modalCityEmoji}>{city.emoji}</Text>
                  <Text
                    style={[
                      styles.modalCityName,
                      citySlug === city.slug && styles.modalCityNameActive,
                    ]}
                  >
                    {city.name}
                  </Text>
                  {citySlug === city.slug ? (
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
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  heroMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  cityPicker: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  cityPickerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  statusBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  statusText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  errorBox: {
    padding: 16,
    gap: 12,
    alignItems: "center",
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryBtnText: {
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
  mapLink: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
  },
  mapLinkText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    ...theme.shadows.card,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  rowMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  rowSide: {
    alignItems: "flex-end",
    gap: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f59e0b",
  },
  price: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  moreBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  moreBtnText: {
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  footer: {
    marginTop: 8,
    alignItems: "center",
    gap: 10,
  },
  mapCta: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#0f1f3d",
    alignItems: "center",
  },
  mapCtaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  attribution: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  attributionLink: {
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalCityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  modalCityItemActive: {
    backgroundColor: theme.colors.background,
  },
  modalCityEmoji: {
    fontSize: 22,
  },
  modalCityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  modalCityNameActive: {
    fontWeight: "800",
    color: theme.colors.accent,
  },
  modalCityCheck: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.accent,
  },
});
