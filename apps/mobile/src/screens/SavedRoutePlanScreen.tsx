import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { GeneratedRoute } from "@pocketguide/core";

import { RoutePlanDisplay } from "@/src/components/route/RoutePlanDisplay";
import {
  citySlugForRoute,
  parseAiRouteFromSavedTrip,
} from "@/src/lib/aiRoutePlanner";
import { getSavedTrip } from "@/src/lib/savedTripsApi";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

export function SavedRoutePlanScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = typeof tripId === "string" ? tripId : tripId?.[0];

  useEffect(() => {
    if (!id) {
      setError("Seyahat bulunamadı.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void getSavedTrip(id)
      .then((trip) => {
        if (cancelled) return;
        const parsed = parseAiRouteFromSavedTrip(trip);
        if (!parsed) {
          setError("Bu kayıt AI rota planı formatında değil.");
          return;
        }
        setRoute(parsed);
      })
      .catch(() => {
        if (!cancelled) setError("Seyahat yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const citySlug = route ? citySlugForRoute(route) : null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Seyahatlerim</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={theme.colors.accent}
            size="large"
          />
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.btnSecondary} onPress={() => router.back()}>
              <Text style={styles.btnSecondaryText}>Profile dön</Text>
            </Pressable>
          </View>
        ) : null}

        {route && id ? (
          <>
            <RoutePlanDisplay route={route} tripId={id} />
            <View style={styles.actions}>
              {citySlug ? (
                <Pressable
                  style={styles.btnSecondary}
                  onPress={() => router.push(`/${citySlug}/first-day` as never)}
                >
                  <Text style={styles.btnSecondaryText}>💡 İlk Gün Rehberi</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={styles.btnSecondary}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/map",
                    params: { mapFrom: "saved-route", tripId: String(tripId) },
                  } as never)
                }
              >
                <Text style={styles.btnSecondaryText}>🗺 Haritaya Git</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  back: { marginBottom: theme.spacing.md },
  backText: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  loader: { marginVertical: 40 },
  errorBox: { ...presets.card, gap: theme.spacing.md },
  errorText: { color: theme.colors.danger, fontSize: 14 },
  actions: { gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  btnSecondary: {
    ...presets.secondaryButton,
    alignItems: "center",
  },
  btnSecondaryText: { ...presets.secondaryButtonText },
});
