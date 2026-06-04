import AsyncStorage from "@react-native-async-storage/async-storage";
import type * as ImagePickerTypes from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { PROFILE_INTERESTS, INTERESTS_STORAGE_KEY } from "@/src/constants/interests";
import { useAuth } from "@/src/context/AuthContext";
import { setAppLanguage } from "@/src/i18n";
import { MOCK_POIS } from "@/src/data/mockPOIs";
import { getMyProfile, updateAvatar } from "@/src/lib/profileApi";
import { PhotoDetailModal, type PhotoDetailInitial } from "@/src/components/photos/PhotoDetailModal";
import {
  deletePhoto,
  getMyPhotos,
  uploadPhoto,
  type TravelPhoto,
} from "@/src/lib/photosApi";
import {
  deleteSavedTrip,
  getMySavedTrips,
  type SavedTrip,
} from "@/src/lib/savedTripsApi";
import { formatTripDate, isAiPlannerTrip } from "@/src/lib/savedTripUtils";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

type ProfileTab = "trips" | "saved" | "photos" | "interests" | "stats" | "settings";

const TABS: { id: ProfileTab; label: string; icon: string }[] = [
  { id: "trips", label: "Seyahatlerim", icon: "✈️" },
  { id: "saved", label: "Kaydedilenler", icon: "🔖" },
  { id: "photos", label: "Fotoğraflarım", icon: "📸" },
  { id: "interests", label: "İlgi Alanları", icon: "🎯" },
  { id: "stats", label: "İstatistikler", icon: "📊" },
  { id: "settings", label: "Ayarlar", icon: "⚙️" },
];

const CATEGORY_ICONS: Record<string, string> = {
  museum: "🏛",
  restaurant: "🍽",
  park: "🌳",
  hotel: "🏨",
  transport: "🚇",
};

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("trips");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  const [savedPlaces, setSavedPlaces] = useState<
    { id: string; name: string; type: string; rating: number; icon: string }[]
  >([]);

  const [photos, setPhotos] = useState<TravelPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCity, setUploadCity] = useState("");
  const [uploadLocation, setUploadLocation] = useState("");
  const [uploadIsPublic, setUploadIsPublic] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetailInitial | null>(null);

  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [isEditingInterests, setIsEditingInterests] = useState(false);

  const displayName = user?.userName ?? "Gezgin";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    savedTrips.forEach((t) => {
      if (t.cityName) set.add(t.cityName);
    });
    return set.size;
  }, [savedTrips]);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        if (p?.avatarUrl) setAvatarUrl(p.avatarUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(INTERESTS_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        setUserInterests(JSON.parse(raw) as string[]);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const loadTrips = useCallback(async () => {
    setTripsLoading(true);
    try {
      setSavedTrips(await getMySavedTrips());
    } catch {
      setSavedTrips([]);
    } finally {
      setTripsLoading(false);
    }
  }, []);

  const loadSavedPlaces = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("pg_saved_poi_ids");
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const places = ids
        .map((id) => MOCK_POIS.find((p) => p.id === id))
        .filter(Boolean)
        .map((poi) => ({
          id: poi!.id,
          name: poi!.name,
          type: poi!.category,
          rating: poi!.rating ?? 0,
          icon: CATEGORY_ICONS[poi!.category] ?? "📍",
        }));
      setSavedPlaces(places);
    } catch {
      setSavedPlaces([]);
    }
  }, []);

  const loadPhotos = useCallback(async () => {
    setPhotosLoading(true);
    setPhotoError(null);
    try {
      setPhotos(await getMyPhotos());
    } catch (e) {
      setPhotos([]);
      setPhotoError(e instanceof Error ? e.message : "Fotoğraflar yüklenemedi");
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "trips") void loadTrips();
    if (activeTab === "saved") void loadSavedPlaces();
    if (activeTab === "photos") void loadPhotos();
  }, [activeTab, loadTrips, loadSavedPlaces, loadPhotos]);

  const pickImage = async (): Promise<string | null> => {
    let ImagePicker: typeof ImagePickerTypes;
    try {
      ImagePicker = await import("expo-image-picker");
    } catch {
      Alert.alert(
        "Galeri modülü yok",
        "Proje kökünden: pnpm install && cd apps/mobile && npx expo install expo-image-picker",
      );
      return null;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Galeri erişimine izin ver.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    if (asset.base64) {
      const mime = asset.mimeType ?? "image/jpeg";
      return `data:${mime};base64,${asset.base64}`;
    }
    return asset.uri;
  };

  const handleAvatarPress = async () => {
    const dataUrl = await pickImage();
    if (!dataUrl) return;
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      await updateAvatar(dataUrl);
      setAvatarUrl(dataUrl);
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : "Yükleme başarısız");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    const dataUrl = await pickImage();
    if (!dataUrl) return;
    setUploadPreview(dataUrl);
    setShowUploadModal(true);
    setPhotoError(null);
  };

  const handlePhotoUpload = async () => {
    if (!uploadPreview) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const newPhoto = await uploadPhoto({
        imageUrl: uploadPreview,
        caption: uploadCaption || undefined,
        cityName: uploadCity || undefined,
        locationName: uploadLocation || undefined,
        isPublic: uploadIsPublic,
      });
      setPhotos((prev) => [newPhoto, ...prev]);
      setShowUploadModal(false);
      setUploadPreview(null);
      setUploadCaption("");
      setUploadCity("");
      setUploadLocation("");
      setUploadIsPublic(true);
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Yükleme başarısız");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeleteTrip = (id: string) => {
    Alert.alert("Rotayı sil", "Bu kayıtlı rotayı silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteSavedTrip(id);
          setSavedTrips((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const openTrip = (trip: SavedTrip) => {
    if (isAiPlannerTrip(trip)) {
      router.push(`/plan/saved/${trip.id}` as never);
      return;
    }
    router.push({
      pathname: "/(tabs)/map",
      params: {
        savedTrip: trip.id,
        q: trip.cityName ?? trip.title,
        mapFrom: "profile",
      },
    } as never);
  };

  const saveInterests = async () => {
    await AsyncStorage.setItem(INTERESTS_STORAGE_KEY, JSON.stringify(userInterests));
    setIsEditingInterests(false);
  };

  const toggleInterest = (id: string) => {
    setUserInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as never);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Kapak */}
        <View style={[styles.cover, { paddingTop: insets.top + 4 }]}>
          <Pressable
            style={[styles.backBtn, { top: insets.top + 6 }]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
          <View style={styles.coverInner}>
            <Pressable style={styles.avatarWrap} onPress={() => void handleAvatarPress()}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              )}
              {avatarLoading ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View style={[styles.avatarOverlay, styles.avatarHover]}>
                  <Text style={styles.avatarCam}>📷</Text>
                </View>
              )}
            </Pressable>
            {avatarError ? <Text style={styles.avatarErr}>{avatarError}</Text> : null}
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Pressable
              style={styles.ctaBtn}
              onPress={() => router.push("/(tabs)/map" as never)}
            >
              <Text style={styles.ctaBtnText}>🗺 Yeni Rota Oluştur</Text>
            </Pressable>
          </View>
        </View>

        {/* Sekmeler */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.badgeBox}>
          <Text style={styles.badgeIcon}>👑</Text>
          <Text style={styles.badgeTitle}>Kaşif Paketi Aktif</Text>
          <Text style={styles.badgeSub}>Sınırsız AI rota önerisi kullanabilirsiniz.</Text>
        </View>

        <View style={styles.content}>
          {activeTab === "trips" && (
            <>
              <Text style={styles.sectionTitle}>Seyahatlerim</Text>
              {tripsLoading ? (
                <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
              ) : (
                <>
                  {savedTrips.map((trip) => (
                    <View key={trip.id} style={styles.tripCard}>
                      <View style={styles.tripTop}>
                        <Text style={styles.tripCity}>
                          {trip.cityName || trip.title}
                        </Text>
                        <Text style={styles.tripStatus}>
                          {trip.status === "planned" ? "Planlandı" : trip.status ?? ""}
                        </Text>
                      </View>
                      <Text style={styles.tripMeta}>📅 {formatTripDate(trip.createdAt)}</Text>
                      <Text style={styles.tripMeta}>
                        {trip.stops.length} durak
                        {trip.durationMinutes != null ? ` · ${trip.durationMinutes} dk` : ""}
                        {trip.distanceKm != null
                          ? ` · ${trip.distanceKm.toFixed(1)} km`
                          : ""}
                      </Text>
                      {isAiPlannerTrip(trip) ? (
                        <Text style={styles.tripAiTag}>✨ AI Rota</Text>
                      ) : null}
                      <View style={styles.tripActions}>
                        <Pressable
                          style={styles.tripBtn}
                          onPress={() => openTrip(trip)}
                        >
                          <Text style={styles.tripBtnText}>
                            {isAiPlannerTrip(trip)
                              ? "Planı Görüntüle →"
                              : "Haritada aç →"}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={styles.tripBtnOutline}
                          onPress={() => handleDeleteTrip(trip.id)}
                        >
                          <Text style={styles.tripBtnOutlineText}>Sil</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  {savedTrips.length === 0 && (
                    <View style={styles.empty}>
                      <Text style={styles.emptyIcon}>✈️</Text>
                      <Text style={styles.emptyText}>
                        Henüz kayıtlı rota yok. Haritada rota oluşturup kaydedebilirsin.
                      </Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.addCard}
                    onPress={() => router.push("/(tabs)/map" as never)}
                  >
                    <Text style={styles.addIcon}>+</Text>
                    <Text style={styles.addLabel}>Yeni Rota Oluştur</Text>
                  </Pressable>
                </>
              )}
            </>
          )}

          {activeTab === "saved" && (
            <>
              <Text style={styles.sectionTitle}>Kaydedilen Mekanlar</Text>
              {savedPlaces.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🔖</Text>
                  <Text style={styles.emptyText}>
                    Haritada kaydettiğin mekanlar burada listelenir.
                  </Text>
                  <Pressable
                    style={styles.linkBtn}
                    onPress={() => router.push("/(tabs)/map" as never)}
                  >
                    <Text style={styles.linkBtnText}>Haritaya git</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.placeGrid}>
                  {savedPlaces.map((place) => (
                    <View key={place.id} style={styles.placeCard}>
                      <Text style={styles.placeIcon}>{place.icon}</Text>
                      <Text style={styles.placeName} numberOfLines={2}>
                        {place.name}
                      </Text>
                      <Text style={styles.placeType}>{place.type}</Text>
                      <Text style={styles.placeRating}>★ {place.rating}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === "photos" && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Seyahat Fotoğraflarım</Text>
                <Pressable style={styles.smallCta} onPress={() => void handleAddPhoto()}>
                  <Text style={styles.smallCtaText}>+ Ekle</Text>
                </Pressable>
              </View>
              {photosLoading ? (
                <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
              ) : photoError && photos.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>⚠️</Text>
                  <Text style={styles.emptyText}>{photoError}</Text>
                </View>
              ) : photos.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>📸</Text>
                  <Text style={styles.emptyText}>Henüz fotoğraf yok. İlk fotoğrafını ekle!</Text>
                </View>
              ) : (
                <View style={styles.photoGrid}>
                  {photos.map((photo) => (
                    <View key={photo.id} style={styles.photoCard}>
                      <Pressable
                        onPress={() =>
                          setSelectedPhoto({
                            id: photo.id,
                            imageUrl: photo.imageUrl,
                            caption: photo.caption,
                            cityName: photo.cityName,
                            locationName: photo.locationName,
                            createdAt: photo.createdAt,
                            userId: photo.userId,
                            userName: displayName,
                            isPublic: photo.isPublic,
                          })
                        }
                      >
                        <Image source={{ uri: photo.imageUrl }} style={styles.photoImg} />
                      </Pressable>
                      <Pressable
                        style={styles.photoDelete}
                        onPress={() => {
                          Alert.alert("Sil", "Bu fotoğrafı silmek istiyor musun?", [
                            { text: "Vazgeç", style: "cancel" },
                            {
                              text: "Sil",
                              style: "destructive",
                              onPress: async () => {
                                await deletePhoto(photo.id);
                                setPhotos((p) => p.filter((x) => x.id !== photo.id));
                              },
                            },
                          ]);
                        }}
                      >
                        <Text style={styles.photoDeleteText}>×</Text>
                      </Pressable>
                      {!photo.isPublic ? (
                        <Text style={styles.photoPrivate}>🔒</Text>
                      ) : null}
                      {photo.cityName ? (
                        <Text style={styles.photoCaption} numberOfLines={1}>
                          📍 {photo.cityName}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === "interests" && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>İlgi Alanlarım</Text>
                <Pressable
                  style={styles.smallCtaDark}
                  onPress={() => {
                    if (isEditingInterests) void saveInterests();
                    else setIsEditingInterests(true);
                  }}
                >
                  <Text style={styles.smallCtaDarkText}>
                    {isEditingInterests ? "Kaydet" : "Düzenle"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.interestGrid}>
                {PROFILE_INTERESTS.map((interest) => {
                  const selected = userInterests.includes(interest.id);
                  if (!isEditingInterests && !selected) return null;
                  return (
                    <Pressable
                      key={interest.id}
                      style={[
                        styles.interestCard,
                        selected && styles.interestCardOn,
                      ]}
                      onPress={() =>
                        isEditingInterests && toggleInterest(interest.id)
                      }
                      disabled={!isEditingInterests}
                    >
                      <Text style={styles.interestIcon}>{interest.icon}</Text>
                      <Text
                        style={[
                          styles.interestLabel,
                          selected && styles.interestLabelOn,
                        ]}
                      >
                        {interest.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {!isEditingInterests && userInterests.length === 0 && (
                <Text style={styles.muted}>Henüz ilgi alanı seçilmemiş.</Text>
              )}
            </>
          )}

          {activeTab === "stats" && (
            <>
              <Text style={styles.sectionTitle}>Keşif İstatistikleri</Text>
              <View style={styles.statGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{uniqueCities || savedTrips.length}</Text>
                  <Text style={styles.statLabel}>Ziyaret Edilen Şehir</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{Math.min(uniqueCities, 4) || 1}</Text>
                  <Text style={styles.statLabel}>Farklı Ülke</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{savedTrips.length}</Text>
                  <Text style={styles.statLabel}>Oluşturulan Rota</Text>
                </View>
              </View>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <Text style={styles.sectionTitle}>Ayarlar</Text>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsEmail}>Hesap: {user?.email}</Text>
                <Text style={styles.settingsLabel}>Dil</Text>
                <View style={styles.langRow}>
                  <Pressable
                    style={[styles.langBtn, i18n.language === "tr" && styles.langOn]}
                    onPress={() => setAppLanguage("tr")}
                  >
                    <Text
                      style={[
                        styles.langBtnText,
                        i18n.language === "tr" && styles.langBtnTextOn,
                      ]}
                    >
                      Türkçe
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.langBtn, i18n.language === "en" && styles.langOn]}
                    onPress={() => setAppLanguage("en")}
                  >
                    <Text
                      style={[
                        styles.langBtnText,
                        i18n.language === "en" && styles.langBtnTextOn,
                      ]}
                    >
                      English
                    </Text>
                  </Pressable>
                </View>
                <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutText}>Çıkış yap</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={showUploadModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowUploadModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Fotoğraf Paylaş</Text>
            {uploadPreview ? (
              <Image source={{ uri: uploadPreview }} style={styles.modalPreview} />
            ) : null}
            <TextInput
              style={styles.modalInput}
              placeholder="Açıklama ekle..."
              placeholderTextColor={theme.colors.textMuted}
              value={uploadCaption}
              onChangeText={setUploadCaption}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Şehir (örn. İstanbul)"
              placeholderTextColor={theme.colors.textMuted}
              value={uploadCity}
              onChangeText={setUploadCity}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Mekan adı (opsiyonel)"
              placeholderTextColor={theme.colors.textMuted}
              value={uploadLocation}
              onChangeText={setUploadLocation}
            />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Herkese açık paylaş</Text>
              <Switch value={uploadIsPublic} onValueChange={setUploadIsPublic} />
            </View>
            {photoError ? <Text style={styles.modalError}>{photoError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowUploadModal(false)}>
                <Text style={styles.modalCancel}>İptal</Text>
              </Pressable>
              <Pressable
                style={styles.modalSubmit}
                onPress={() => void handlePhotoUpload()}
                disabled={photoUploading}
              >
                <Text style={styles.modalSubmitText}>
                  {photoUploading ? "Yükleniyor…" : "Paylaş"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {selectedPhoto ? (
        <PhotoDetailModal
          photoId={selectedPhoto.id}
          initialPhoto={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  cover: {
    backgroundColor: theme.colors.textPrimary,
    paddingBottom: theme.spacing.sm,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    position: "absolute",
    left: theme.spacing.md,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  coverInner: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingTop: 28,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarLetter: { fontSize: 28, fontWeight: "800", color: theme.colors.textPrimary },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  avatarHover: { opacity: 0.85 },
  avatarCam: { fontSize: 18 },
  avatarErr: { color: "#ffb4b4", fontSize: 12, marginTop: 6 },
  displayName: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginTop: theme.spacing.sm,
  },
  email: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  ctaBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
  },
  ctaBtnText: { fontWeight: "800", color: theme.colors.textPrimary, fontSize: 13 },
  tabRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.xs,
  },
  tabChipActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary },
  tabLabelActive: { color: theme.colors.surface },
  badgeBox: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...presets.card,
    alignItems: "center",
    backgroundColor: "#fffbe6",
    borderColor: theme.colors.accent,
  },
  badgeIcon: { fontSize: 28 },
  badgeTitle: { fontWeight: "800", fontSize: 15, color: theme.colors.textPrimary },
  badgeSub: { fontSize: 12, color: theme.colors.textSecondary, textAlign: "center" },
  content: { paddingHorizontal: theme.spacing.md },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  loader: { marginVertical: theme.spacing.lg },
  tripCard: { ...presets.card, marginBottom: theme.spacing.sm, gap: 4 },
  tripTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  tripCity: { fontSize: 17, fontWeight: "800", color: theme.colors.textPrimary, flex: 1 },
  tripStatus: { fontSize: 11, fontWeight: "700", color: theme.colors.accent },
  tripMeta: { fontSize: 13, color: theme.colors.textSecondary },
  tripAiTag: { fontSize: 11, color: "#8b5cf6", fontWeight: "600" },
  tripActions: { flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  tripBtn: {
    flex: 1,
    backgroundColor: theme.colors.textPrimary,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  tripBtnText: { color: theme.colors.surface, fontWeight: "700", fontSize: 13 },
  tripBtnOutline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(180,35,24,0.35)",
  },
  tripBtnOutlineText: { color: "#b42318", fontWeight: "700", fontSize: 13 },
  empty: { ...presets.card, alignItems: "center", gap: 8, marginBottom: theme.spacing.sm },
  emptyIcon: { fontSize: 32 },
  emptyText: { textAlign: "center", color: theme.colors.textSecondary, lineHeight: 20 },
  addCard: {
    ...presets.card,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: "transparent",
  },
  addIcon: { fontSize: 32, color: theme.colors.textMuted },
  addLabel: { fontWeight: "700", color: theme.colors.textSecondary },
  placeGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  placeCard: {
    width: "31%",
    ...presets.card,
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  placeIcon: { fontSize: 28 },
  placeName: { fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 4 },
  placeType: { fontSize: 10, color: theme.colors.textSecondary },
  placeRating: { fontSize: 11, color: theme.colors.accent, marginTop: 2 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  smallCta: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  smallCtaText: { fontWeight: "800", fontSize: 12, color: theme.colors.textPrimary },
  smallCtaDark: {
    backgroundColor: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallCtaDarkText: { fontWeight: "700", fontSize: 12, color: theme.colors.accent },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  photoCard: {
    width: "48%",
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  photoImg: { width: "100%", height: 120 },
  photoDelete: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoDeleteText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  photoPrivate: { position: "absolute", top: 6, left: 6, fontSize: 12 },
  photoCaption: { fontSize: 11, padding: 6, color: theme.colors.textSecondary },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  interestCard: {
    width: "47%",
    ...presets.card,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  interestCardOn: { backgroundColor: theme.colors.textPrimary },
  interestIcon: { fontSize: 28 },
  interestLabel: { fontWeight: "600", fontSize: 13, color: theme.colors.textPrimary, marginTop: 4 },
  interestLabelOn: { color: theme.colors.accent },
  muted: { color: theme.colors.textMuted, fontSize: 14 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  statCard: {
    width: "31%",
    ...presets.card,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  statValue: { fontSize: 24, fontWeight: "800", color: theme.colors.textPrimary },
  statLabel: { fontSize: 10, color: theme.colors.textSecondary, textAlign: "center", marginTop: 4 },
  settingsCard: { ...presets.card, gap: theme.spacing.md },
  settingsEmail: { color: theme.colors.textSecondary, fontSize: 14 },
  settingsLabel: { fontWeight: "700", color: theme.colors.textPrimary },
  langRow: { flexDirection: "row", gap: theme.spacing.sm },
  langBtn: {
    ...presets.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  langOn: { backgroundColor: theme.colors.textPrimary },
  langBtnText: { fontWeight: "700", fontSize: 13, color: theme.colors.textPrimary },
  langBtnTextOn: { color: theme.colors.accent },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "rgba(180,35,24,0.35)",
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: { color: "#b42318", fontWeight: "700" },
  linkBtn: {
    marginTop: 8,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  linkBtnText: { fontWeight: "700", color: theme.colors.textPrimary },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  modalPreview: { width: "100%", height: 180, borderRadius: theme.radius.md },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 12,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleLabel: { fontSize: 14, color: theme.colors.textSecondary },
  modalError: { color: theme.colors.danger, fontSize: 13 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: theme.spacing.md, marginTop: 8 },
  modalCancel: { color: theme.colors.textSecondary, fontWeight: "600" },
  modalSubmit: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  modalSubmitText: { fontWeight: "800", color: theme.colors.textPrimary },
});
