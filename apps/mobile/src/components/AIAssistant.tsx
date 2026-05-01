import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

type Recommendation = {
  name: string;
  category: string;
  reason: string;
  badge: string;
  walkingDistanceMeters: number;
  estimatedVisitMinutes: number;
};

type AIAssistantProps = {
  lat?: number;
  lng?: number;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function AIAssistant({ lat, lng }: AIAssistantProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const latitude = lat ?? 38.6748;
      const longitude = lng ?? 39.2225;
      const res = await fetch(`${API_BASE_URL}/api/ai/recommendations?lat=${latitude}&lng=${longitude}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data?.error) throw new Error(data?.message ?? data.error);
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !recommendations && !loading) fetchRecommendations();
  };

  return (
    <>
      <Pressable onPress={handleToggle} style={styles.fab}>
        <Text style={styles.fabText}>✨</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("mobile.aiAssistantTitle")}</Text>
            <Pressable onPress={() => setIsOpen(false)} hitSlop={8}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {loading ? (
              <Text style={styles.infoText}>{t("mobile.aiLoading")}</Text>
            ) : error ? (
              <>
                <Text style={styles.infoText}>{error}</Text>
                <Pressable onPress={fetchRecommendations} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>{t("mobile.aiRetry")}</Text>
                </Pressable>
              </>
            ) : recommendations && recommendations.length > 0 ? (
              <>
                {recommendations.map((rec, idx) => (
                  <View key={`${rec.name}-${idx}`} style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardName}>{rec.name}</Text>
                      <Text style={styles.cardBadge}>{rec.badge}</Text>
                    </View>
                    <Text style={styles.cardReason}>{rec.reason}</Text>
                    <Text style={styles.cardMeta}>
                      📍 {rec.walkingDistanceMeters}m · 🕒 {rec.estimatedVisitMinutes} dk
                    </Text>
                  </View>
                ))}
                <Pressable onPress={fetchRecommendations} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>{t("mobile.aiRefresh")}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.infoText}>{t("mobile.aiNoResult")}</Text>
                <Pressable onPress={fetchRecommendations} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>{t("mobile.aiFetch")}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    bottom: 150,
    zIndex: 210,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    ...theme.shadows.card,
  },
  fabText: {
    fontSize: 22,
  },
  panel: {
    position: "absolute",
    right: 12,
    left: 12,
    bottom: 210,
    maxHeight: 330,
    zIndex: 209,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  close: {
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  body: {
    padding: 12,
    gap: theme.spacing.xs,
  },
  infoText: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    fontWeight: "400",
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.body.lineHeight,
  },
  card: {
    ...presets.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  cardBadge: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardReason: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    lineHeight: theme.typography.caption.lineHeight,
  },
  cardMeta: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: "700",
  },
  primaryBtn: {
    ...presets.primaryButton,
    marginTop: 4,
    paddingVertical: 12,
  },
  primaryBtnText: {
    ...presets.primaryButtonText,
    fontSize: theme.typography.caption.fontSize,
  },
});

