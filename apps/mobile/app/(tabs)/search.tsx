import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/Themed";
import { theme } from "@/src/theme/tokens";
import { apiUrl } from "@/src/lib/api";
import { likePhoto as apiLikePhoto } from "@/src/lib/photosApi";

const CITY_EMOJIS: Record<string, string> = {
  istanbul: "🕌",
  paris: "🗼",
  tokyo: "🏯",
  londra: "🎡",
  roma: "🏛️",
  barcelona: "🌊",
  dubai: "🏙️",
  amsterdam: "🚲",
  sydney: "🦘",
  "new-york": "🗽",
};

const CITY_FILTERS = [
  { slug: "", label: "Tümü", emoji: "🌍" },
  { slug: "istanbul", label: "İstanbul", emoji: "🕌" },
  { slug: "paris", label: "Paris", emoji: "🗼" },
  { slug: "tokyo", label: "Tokyo", emoji: "🏯" },
  { slug: "londra", label: "Londra", emoji: "🎡" },
  { slug: "roma", label: "Roma", emoji: "🏛️" },
  { slug: "barcelona", label: "Barcelona", emoji: "🌊" },
  { slug: "dubai", label: "Dubai", emoji: "🏙️" },
  { slug: "amsterdam", label: "Amsterdam", emoji: "🚲" },
  { slug: "sydney", label: "Sydney", emoji: "🦘" },
];

async function searchAll(q: string) {
  if (q.trim().length < 2) return { cities: [], users: [], photos: [] };
  try {
    const res = await fetch(apiUrl(`/search?q=${encodeURIComponent(q)}`));
    return res.ok ? res.json() : { cities: [], users: [], photos: [] };
  } catch {
    return { cities: [], users: [], photos: [] };
  }
}

async function getDiscover(interests: string[], city: string, offset = 0) {
  const params = new URLSearchParams({ limit: "20", offset: String(offset) });
  if (interests.length) params.set("interests", interests.join(","));
  if (city) params.set("city", city);
  try {
    const res = await fetch(apiUrl(`/photos/discover?${params}`));
    return res.ok ? res.json() : { data: [] };
  } catch {
    return { data: [] };
  }
}

async function likePhoto(id: string) {
  try {
    await apiLikePhoto(id);
  } catch {}
}

function dedupeById<T extends { id?: string | null }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = item?.id;
    if (!id) {
      out.push(item);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

export default function SearchTabScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "discover">("search");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [discoverPhotos, setDiscoverPhotos] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverOffset, setDiscoverOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());

  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const has = await AsyncStorage.getItem("pg_has_onboarded");
        if (has !== "true") {
          router.replace("/onboarding" as any);
          return;
        }
        const raw = await AsyncStorage.getItem("pg_user_interests");
        if (raw && mounted) setUserInterests(JSON.parse(raw));
      } catch {}
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults(null);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      const res = await searchAll(query);
      setSearchResults(res);
      setSearchLoading(false);
    }, 400);
  }, [query]);

  const loadDiscover = useCallback(
    async (reset = false) => {
      setDiscoverLoading(true);
      try {
        const offset = reset ? 0 : discoverOffset;
        const res = await getDiscover(userInterests, cityFilter, offset);
        const photos = dedupeById(res.data ?? []);
        if (reset) {
          setDiscoverPhotos(photos);
          setDiscoverOffset(20);
        } else {
          setDiscoverPhotos((prev) => dedupeById([...prev, ...photos]));
          setDiscoverOffset((prev) => prev + 20);
        }
        setHasMore(photos.length === 20);
      } finally {
        setDiscoverLoading(false);
      }
    },
    [cityFilter, discoverOffset, userInterests],
  );

  useEffect(() => {
    if (activeTab === "discover" && discoverPhotos.length === 0) {
      loadDiscover(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "discover") {
      setDiscoverPhotos([]);
      setDiscoverOffset(0);
      loadDiscover(true);
    }
  }, [cityFilter]);

  const handleLike = async (photoId: string) => {
    await likePhoto(photoId);
    setLikedPhotos((prev) => new Set([...prev, photoId]));
  };

  const hasSearchResults =
    searchResults &&
    ((searchResults.cities?.length ?? 0) > 0 ||
      (searchResults.users?.length ?? 0) > 0 ||
      (searchResults.photos?.length ?? 0) > 0);

  if (!ready) return null;

  return (
    <View style={styles.root}>
      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => setActiveTab("search")}
          style={[styles.tab, activeTab === "search" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "search" && styles.tabTextActive]}>
            🔍 Ara
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("discover")}
          style={[styles.tab, activeTab === "discover" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "discover" && styles.tabTextActive]}>
            ✨ Keşfet
          </Text>
        </Pressable>
      </View>

      {activeTab === "search" && (
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Şehir, kullanıcı veya mekan ara..."
              style={styles.searchInput}
              placeholderTextColor={theme.colors.textMuted}
              autoFocus={false}
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setSearchResults(null);
                }}
              >
                <Text style={styles.clearBtn}>×</Text>
              </Pressable>
            )}
          </View>

          {!query && !searchResults && (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchTitle}>Ne aramak istersin?</Text>
              <View style={styles.hintPills}>
                {["İstanbul", "Paris", "Tokyo", "Roma", "Amsterdam"].map((city) => (
                  <Pressable key={city} onPress={() => setQuery(city)} style={styles.hintPill}>
                    <Text style={styles.hintPillText}>{city}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {searchLoading && (
            <ActivityIndicator
              size="small"
              color={theme.colors.textPrimary}
              style={{ marginTop: 20 }}
            />
          )}

          {!searchLoading && searchResults && (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
            >
              {searchResults.cities?.length > 0 && (
                <View style={styles.resultGroup}>
                  <Text style={styles.resultGroupTitle}>📍 Şehirler</Text>
                  {searchResults.cities.map((city: any) => (
                    <Pressable
                      key={city.slug}
                      style={styles.resultItem}
                      onPress={() => router.push(`/${city.slug}` as any)}
                    >
                      <Text style={styles.resultItemIcon}>
                        {CITY_EMOJIS[city.slug] ?? "🏙️"}
                      </Text>
                      <View style={styles.resultItemInfo}>
                        <Text style={styles.resultItemName}>
                          {city.nameTr || city.nameEn}
                        </Text>
                        <Text style={styles.resultItemMeta}>{city.countryCode}</Text>
                      </View>
                      <Text style={styles.resultItemArrow}>›</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {searchResults.users?.length > 0 && (
                <View style={styles.resultGroup}>
                  <Text style={styles.resultGroupTitle}>👤 Kullanıcılar</Text>
                  {searchResults.users.map((user: any) => (
                    <View key={user.id} style={styles.resultItem}>
                      <View style={styles.resultAvatar}>
                        <Text style={styles.resultAvatarText}>
                          {user.userName?.[0]?.toUpperCase() ?? "?"}
                        </Text>
                      </View>
                      <View style={styles.resultItemInfo}>
                        <Text style={styles.resultItemName}>{user.userName}</Text>
                        <Text style={styles.resultItemMeta}>{user.email}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {searchResults.photos?.length > 0 && (
                <View style={styles.resultGroup}>
                  <Text style={styles.resultGroupTitle}>📸 Fotoğraflar</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoRow}
                  >
                    {searchResults.photos.map((photo: any) => (
                      <View key={photo.id} style={styles.photoThumb}>
                        <Image
                          source={{ uri: photo.imageUrl }}
                          style={styles.photoThumbImg}
                          resizeMode="cover"
                        />
                        {photo.cityName && (
                          <View style={styles.photoThumbCity}>
                            <Text style={styles.photoThumbCityText}>{photo.cityName}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {!hasSearchResults && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsEmoji}>🔍</Text>
                  <Text style={styles.noResultsText}>
                    "{query}" için sonuç bulunamadı.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {activeTab === "discover" && (
        <View style={styles.discoverSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityFilters}
          >
            {CITY_FILTERS.map((f) => (
              <Pressable
                key={f.slug}
                onPress={() => setCityFilter(f.slug)}
                style={[styles.cityChip, cityFilter === f.slug && styles.cityChipActive]}
              >
                <Text
                  style={[
                    styles.cityChipText,
                    cityFilter === f.slug && styles.cityChipTextActive,
                  ]}
                >
                  {f.emoji} {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {userInterests.length > 0 && (
            <View style={styles.personalizedBar}>
              <Text style={styles.personalizedLabel}>✨ Senin için</Text>
            </View>
          )}

          {discoverLoading && discoverPhotos.length === 0 ? (
            <ActivityIndicator
              size="large"
              color={theme.colors.textPrimary}
              style={{ marginTop: 40 }}
            />
          ) : discoverPhotos.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsEmoji}>📸</Text>
              <Text style={styles.noResultsText}>
                Henüz fotoğraf yok. İlk paylaşımı sen yap!
              </Text>
            </View>
          ) : (
            <FlatList
              data={discoverPhotos}
              keyExtractor={(item, index) => item?.id ?? `discover-${index}`}
              numColumns={2}
              columnWrapperStyle={styles.photoGrid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.photoGridContent}
              onEndReached={() => hasMore && !discoverLoading && loadDiscover()}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                discoverLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.textPrimary}
                    style={{ marginVertical: 16 }}
                  />
                ) : null
              }
              renderItem={({ item: photo }) => (
                <View style={styles.discoverCard}>
                  <View style={styles.discoverImgWrap}>
                    <Image
                      source={{ uri: photo.imageUrl }}
                      style={styles.discoverImg}
                      resizeMode="cover"
                    />
                    <Pressable
                      style={[
                        styles.likeBtn,
                        likedPhotos.has(photo.id) && styles.likeBtnActive,
                      ]}
                      onPress={() => handleLike(photo.id)}
                    >
                      <Text style={styles.likeBtnText}>
                        {likedPhotos.has(photo.id) ? "❤️" : "🤍"}
                      </Text>
                      <Text style={styles.likeBtnCount}>
                        {(photo.likeCount ?? 0) + (likedPhotos.has(photo.id) ? 1 : 0)}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.discoverInfo}>
                    <View style={styles.discoverUser}>
                      <View style={styles.discoverAvatar}>
                        <Text style={styles.discoverAvatarText}>
                          {photo.userName?.[0]?.toUpperCase() ?? "?"}
                        </Text>
                      </View>
                      <Text style={styles.discoverUsername} numberOfLines={1}>
                        {photo.userName}
                      </Text>
                    </View>
                    {photo.cityName && (
                      <Text style={styles.discoverCity} numberOfLines={1}>
                        📍 {photo.cityName}
                      </Text>
                    )}
                    {photo.caption && (
                      <Text style={styles.discoverCaption} numberOfLines={2}>
                        {photo.caption}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: theme.colors.textPrimary },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamilySans,
  },
  tabTextActive: { color: theme.colors.textPrimary },

  searchSection: { flex: 1, padding: theme.spacing.md },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  searchIcon: { fontSize: 14, color: theme.colors.textSecondary },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilySans,
  },
  clearBtn: { fontSize: 20, color: theme.colors.textMuted, paddingHorizontal: 4 },

  emptySearch: { paddingTop: 16 },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 14,
    fontFamily: theme.typography.fontFamilySans,
  },
  hintPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hintPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  hintPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },

  resultsList: { gap: 20, paddingBottom: 40 },
  resultGroup: { gap: 6 },
  resultGroupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  resultItemIcon: { fontSize: 24, width: 36, textAlign: "center" },
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  resultAvatarText: { fontSize: 14, fontWeight: "700", color: theme.colors.surface },
  resultItemInfo: { flex: 1 },
  resultItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  resultItemMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  resultItemArrow: {
    fontSize: 20,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  photoRow: { gap: 8 },
  photoThumb: {
    width: 110,
    height: 110,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  photoThumbImg: { width: "100%", height: "100%" },
  photoThumbCity: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  photoThumbCityText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  noResults: { alignItems: "center", paddingVertical: 40, gap: 10 },
  noResultsEmoji: { fontSize: 32 },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },

  discoverSection: { flex: 1 },
  cityFilters: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cityChipActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  cityChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  cityChipTextActive: { color: theme.colors.surface },

  personalizedBar: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  personalizedLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },

  photoGrid: { gap: 10, paddingHorizontal: 16 },
  photoGridContent: { paddingBottom: 80, gap: 10 },
  discoverCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  discoverImgWrap: { position: "relative", aspectRatio: 1 },
  discoverImg: { width: "100%", height: "100%" },
  likeBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeBtnActive: { backgroundColor: "#fee2e2" },
  likeBtnText: { fontSize: 13 },
  likeBtnCount: { fontSize: 11, fontWeight: "700", color: theme.colors.textPrimary },

  discoverInfo: { padding: 8, gap: 3 },
  discoverUser: { flexDirection: "row", alignItems: "center", gap: 5 },
  discoverAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverAvatarText: { fontSize: 9, fontWeight: "700", color: theme.colors.surface },
  discoverUsername: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    flex: 1,
  },
  discoverCity: { fontSize: 10, color: theme.colors.textSecondary },
  discoverCaption: { fontSize: 11, color: theme.colors.textPrimary, lineHeight: 15 },
});
