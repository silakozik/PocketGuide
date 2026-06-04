import type { GeneratedRoute } from "@pocketguide/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ROUTE_CATEGORY_COLORS,
  ROUTE_CATEGORY_LABELS,
  formatRouteThemes,
} from "@/src/lib/aiRoutePlanner";
import { openDayOnMap, openStopOnMap } from "@/src/lib/aiRouteMap";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

type Props = {
  route: GeneratedRoute;
  tripId?: string;
};

export function RoutePlanDisplay({ route, tripId }: Props) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(route.plan[0]?.day ?? 1);
  const [mapLoadingDay, setMapLoadingDay] = useState<number | null>(null);
  const [mapLoadingStop, setMapLoadingStop] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const day = route.plan.find((d) => d.day === activeDay);

  const handleDayMap = async (dayNumber: number) => {
    setMapError(null);
    setMapLoadingDay(dayNumber);
    try {
      const result = await openDayOnMap(router, route, dayNumber, tripId);
      if (!result.ok) {
        setMapError("Bu günün mekanları haritada bulunamadı.");
        return;
      }
      if (result.found < result.total) {
        setMapError(
          `${result.found}/${result.total} mekan haritaya eklendi.`,
        );
      }
    } catch {
      setMapError("Harita yüklenirken hata oluştu.");
    } finally {
      setMapLoadingDay(null);
    }
  };

  const handleStopMap = async (stopKey: string, stop: (typeof route.plan)[0]["stops"][0]) => {
    setMapError(null);
    setMapLoadingStop(stopKey);
    try {
      const ok = await openStopOnMap(router, stop, route.city, route.cityNameEn);
      if (!ok) setMapError("Mekan haritada bulunamadı.");
    } catch {
      setMapError("Harita yüklenirken hata oluştu.");
    } finally {
      setMapLoadingStop(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{route.title}</Text>
        <Text style={styles.summary}>{route.summary}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>📍 {route.city}</Text>
          <Text style={styles.meta}>📅 {route.days} Gün</Text>
        </View>
        <Text style={styles.metaThemes}>{formatRouteThemes(route)}</Text>
      </View>

      {mapError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabs}
      >
        {route.plan.map((d) => (
          <Pressable
            key={d.day}
            style={[styles.dayTab, activeDay === d.day && styles.dayTabActive]}
            onPress={() => setActiveDay(d.day)}
          >
            <Text
              style={[
                styles.dayTabNum,
                activeDay === d.day && styles.dayTabTextActive,
              ]}
            >
              {d.day}. Gün
            </Text>
            <Text
              style={[
                styles.dayTabTitle,
                activeDay === d.day && styles.dayTabTextActive,
              ]}
              numberOfLines={1}
            >
              {d.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {day ? (
        <View style={styles.dayPlan}>
          <View style={styles.dayHead}>
            <Text style={styles.dayTheme}>{day.theme}</Text>
            <Pressable
              style={styles.dayMapBtn}
              disabled={mapLoadingDay === day.day}
              onPress={() => void handleDayMap(day.day)}
            >
              {mapLoadingDay === day.day ? (
                <ActivityIndicator size="small" color={theme.colors.textPrimary} />
              ) : (
                <Text style={styles.dayMapBtnText}>
                  🗺 {day.day}. Günü Haritada Gör
                </Text>
              )}
            </Pressable>
          </View>

          {day.stops.map((stop, i) => {
            const stopKey = `day${day.day}-stop${stop.order}`;
            const catColor = ROUTE_CATEGORY_COLORS[stop.category] ?? "#6b7a99";
            const loading = mapLoadingStop === stopKey;

            return (
              <View key={stop.order} style={styles.stopRow}>
                <View style={styles.timeline}>
                  <Text style={styles.stopTime}>{stop.time}</Text>
                  <View style={[styles.stopDot, { backgroundColor: catColor }]} />
                  {i < day.stops.length - 1 ? <View style={styles.stopLine} /> : null}
                </View>
                <View style={styles.stopBody}>
                  <View style={styles.stopHeader}>
                    <Pressable
                      disabled={loading}
                      onPress={() => void handleStopMap(stopKey, stop)}
                    >
                      <Text style={styles.stopName}>
                        {loading ? "…" : stop.name}
                      </Text>
                    </Pressable>
                    <View style={[styles.stopCat, { backgroundColor: catColor + "22" }]}>
                      <Text style={[styles.stopCatText, { color: catColor }]}>
                        {ROUTE_CATEGORY_LABELS[stop.category] ?? "📍 Diğer"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.stopType}>
                    {stop.type} · {stop.duration}
                  </Text>
                  <Text style={styles.stopDesc}>{stop.description}</Text>
                  {stop.address ? (
                    <Pressable onPress={() => void handleStopMap(stopKey, stop)}>
                      <Text style={styles.stopAddress}>📍 {stop.address}</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => void handleStopMap(stopKey, stop)}>
                      <Text style={styles.stopMapLink}>🗺 Haritada göster</Text>
                    </Pressable>
                  )}
                  <View style={styles.tipBox}>
                    <Text style={styles.tipText}>💡 {stop.tip}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {route.tips.length > 0 ? (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>✈️ Genel Seyahat İpuçları</Text>
          {route.tips.map((tip, i) => (
            <Text key={i} style={styles.tipItem}>
              • {tip}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  header: {
    ...presets.card,
    gap: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  summary: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  meta: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: "600" },
  metaThemes: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
  errorBox: {
    backgroundColor: "#fef2f2",
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  errorText: { color: theme.colors.danger, fontSize: 13 },
  dayTabs: { gap: theme.spacing.xs, paddingVertical: 4 },
  dayTab: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.xs,
  },
  dayTabActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  dayTabNum: { fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary },
  dayTabTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary },
  dayTabTextActive: { color: theme.colors.surface },
  dayPlan: { gap: theme.spacing.sm },
  dayHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
  },
  dayTheme: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: theme.colors.accent,
    textTransform: "uppercase",
  },
  dayMapBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    minWidth: 160,
    alignItems: "center",
  },
  dayMapBtnText: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  stopRow: { flexDirection: "row", gap: theme.spacing.sm },
  timeline: { width: 52, alignItems: "center" },
  stopTime: { fontSize: 11, fontWeight: "700", color: theme.colors.textMuted },
  stopDot: { width: 10, height: 10, borderRadius: 5, marginVertical: 4 },
  stopLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
    minHeight: 40,
  },
  stopBody: {
    flex: 1,
    ...presets.card,
    marginBottom: theme.spacing.xs,
    gap: 4,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  stopName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  stopCat: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stopCatText: { fontSize: 10, fontWeight: "700" },
  stopType: { fontSize: 12, color: theme.colors.textMuted },
  stopDesc: { fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary },
  stopAddress: {
    fontSize: 13,
    fontWeight: "600",
    color: "#c45c26",
    marginTop: 4,
  },
  stopMapLink: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  tipBox: {
    backgroundColor: "#eef4fb",
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.xs,
  },
  tipText: { fontSize: 12, lineHeight: 18, color: theme.colors.textSecondary },
  tipsSection: { ...presets.card, gap: theme.spacing.xs },
  tipsTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary },
  tipItem: { fontSize: 13, lineHeight: 20, color: theme.colors.textSecondary },
});
