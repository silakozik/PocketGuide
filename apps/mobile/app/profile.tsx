import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View as RNView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Text, View } from "@/components/Themed";
import { useAuth } from "@/src/context/AuthContext";
import { setAppLanguage } from "@/src/i18n";
import {
  deleteSavedTrip,
  getMySavedTrips,
  type SavedTrip,
} from "@/src/lib/savedTripsApi";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

function formatTripDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const [ready, setReady] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState<string | null>(null);

  const displayName = user?.userName ?? "Gezgin";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("nav.profile") });
  }, [navigation, t]);

  const loadTrips = useCallback(async () => {
    if (!user) return;
    setTripsLoading(true);
    setTripsError(null);
    try {
      const trips = await getMySavedTrips();
      setSavedTrips(trips);
    } catch (e) {
      setSavedTrips([]);
      setTripsError(
        e instanceof Error ? e.message : "Seyahatler yüklenemedi",
      );
    } finally {
      setTripsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (authLoading) return;

      if (!user) {
        router.replace("/login" as never);
        return;
      }

      try {
        const hasOnboarded = await AsyncStorage.getItem("pg_has_onboarded");
        if (hasOnboarded !== "true") {
          router.replace("/onboarding" as never);
          return;
        }
      } catch {
        // allow
      }

      if (mounted) {
        setReady(true);
        await loadTrips();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, user, authLoading, loadTrips]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as never);
  };

  const handleDeleteTrip = (id: string) => {
    Alert.alert("Rotayı sil", "Bu kayıtlı rotayı silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSavedTrip(id);
            setSavedTrips((prev) => prev.filter((x) => x.id !== id));
          } catch (e) {
            Alert.alert(
              "Hata",
              e instanceof Error ? e.message : "Silinemedi",
            );
          }
        },
      },
    ]);
  };

  const openTripOnMap = (trip: SavedTrip) => {
    const city = trip.cityName ?? trip.title;
    router.push({
      pathname: "/(tabs)/map",
      params: { q: city },
    } as never);
  };

  if (authLoading || !ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.textPrimary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <RNView style={styles.section}>
        <RNView style={styles.avatar}>
          <RNText style={styles.avatarText}>{avatarLetter}</RNText>
        </RNView>
        <RNText style={styles.sectionTitle}>{displayName}</RNText>
        <RNText style={styles.sectionSub}>{user?.email}</RNText>
      </RNView>

      <RNView style={styles.tripsSection}>
        <RNText style={styles.tripsHeading}>Kayıtlı rotalarım</RNText>
        <RNText style={styles.tripsSub}>
          Web’de kaydettiğin rotalar burada görünür — aynı hesap, aynı veri.
        </RNText>

        {tripsLoading ? (
          <ActivityIndicator
            style={styles.tripsLoader}
            color={theme.colors.accent}
          />
        ) : tripsError ? (
          <RNView style={styles.errorBox}>
            <RNText style={styles.errorText}>{tripsError}</RNText>
            <Pressable onPress={() => void loadTrips()}>
              <RNText style={styles.retryText}>Tekrar dene</RNText>
            </Pressable>
          </RNView>
        ) : savedTrips.length === 0 ? (
          <RNView style={styles.emptyBox}>
            <RNText style={styles.emptyText}>
              Henüz kayıtlı rota yok. Web’de rota oluşturup kaydettiğinde burada
              listelenir.
            </RNText>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push("/(tabs)/map" as never)}
            >
              <RNText style={styles.emptyBtnText}>Haritaya git</RNText>
            </Pressable>
          </RNView>
        ) : (
          savedTrips.map((trip) => (
            <RNView key={trip.id} style={styles.tripCard}>
              <RNText style={styles.tripCity}>
                {trip.cityName || trip.title}
              </RNText>
              <RNText style={styles.tripMeta}>
                📅 {formatTripDate(trip.createdAt)}
              </RNText>
              <RNText style={styles.tripMeta}>
                {trip.stops.length} durak
                {trip.durationMinutes != null
                  ? ` · ${trip.durationMinutes} dk`
                  : ""}
                {trip.distanceKm != null
                  ? ` · ${trip.distanceKm.toFixed(1)} km`
                  : ""}
              </RNText>
              {trip.status ? (
                <RNText style={styles.tripStatus}>
                  {trip.status === "planned" ? "Planlandı" : trip.status}
                </RNText>
              ) : null}
              <RNView style={styles.tripActions}>
                <Pressable
                  style={styles.tripBtn}
                  onPress={() => openTripOnMap(trip)}
                >
                  <RNText style={styles.tripBtnText}>Haritada aç</RNText>
                </Pressable>
                <Pressable
                  style={styles.tripBtnDanger}
                  onPress={() => handleDeleteTrip(trip.id)}
                >
                  <RNText style={styles.tripBtnDangerText}>Sil</RNText>
                </Pressable>
              </RNView>
            </RNView>
          ))
        )}
      </RNView>

      <Pressable
        style={styles.primaryBtn}
        onPress={() => router.push("/transfer" as never)}
      >
        <Text style={styles.primaryBtnText}>{t("mobile.goTransfer")}</Text>
      </Pressable>

      <RNView style={styles.langRow}>
        <Pressable
          style={[
            styles.langBtn,
            i18n.language === "tr" ? styles.langBtnActive : null,
          ]}
          onPress={() => setAppLanguage("tr")}
        >
          <RNText
            style={[
              styles.langBtnText,
              i18n.language === "tr" ? styles.langBtnTextActive : null,
            ]}
          >
            TR
          </RNText>
        </Pressable>
        <Pressable
          style={[
            styles.langBtn,
            i18n.language === "en" ? styles.langBtnActive : null,
          ]}
          onPress={() => setAppLanguage("en")}
        >
          <RNText
            style={[
              styles.langBtnText,
              i18n.language === "en" ? styles.langBtnTextActive : null,
            ]}
          >
            EN
          </RNText>
        </Pressable>
      </RNView>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <RNText style={styles.logoutText}>Çıkış yap</RNText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    alignItems: "center",
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
    width: "100%",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: 22,
    fontWeight: "800",
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  sectionSub: {
    marginTop: 6,
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "500",
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  tripsSection: {
    width: "100%",
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tripsHeading: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  tripsSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  tripsLoader: {
    marginVertical: theme.spacing.md,
  },
  errorBox: {
    ...presets.card,
    gap: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  retryText: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  emptyBox: {
    ...presets.card,
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyBtn: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  emptyBtnText: {
    fontWeight: "700",
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  tripCard: {
    ...presets.card,
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  tripCity: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  tripMeta: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tripStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.accent,
  },
  tripActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  tripBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textPrimary,
  },
  tripBtnText: {
    color: theme.colors.surface,
    fontWeight: "700",
    fontSize: 13,
  },
  tripBtnDanger: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(180, 35, 24, 0.35)",
  },
  tripBtnDangerText: {
    color: "#b42318",
    fontWeight: "700",
    fontSize: 13,
  },
  primaryBtn: {
    ...presets.primaryButton,
    marginTop: theme.spacing.lg,
    width: "100%",
  },
  primaryBtnText: {
    ...presets.primaryButtonText,
  },
  langRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  langBtn: {
    ...presets.chip,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.textPrimary,
  },
  langBtnActive: {
    ...presets.chipActive,
  },
  langBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: theme.typography.caption.fontSize,
  },
  langBtnTextActive: {
    color: theme.colors.surface,
  },
  logoutBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(180, 35, 24, 0.35)",
  },
  logoutText: {
    color: "#b42318",
    fontWeight: "700",
    fontSize: theme.typography.body.fontSize,
  },
});
