import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

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
    backgroundColor: "#e8c547",
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
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(221,227,240,1)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  close: {
    fontSize: 22,
    color: "#6B7A99",
  },
  body: {
    padding: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#6B7A99",
    lineHeight: 18,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff",
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1F3D",
    flex: 1,
    marginRight: 8,
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0F1F3D",
    backgroundColor: "#f2f5fb",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardReason: {
    fontSize: 12,
    color: "#6B7A99",
    fontWeight: "600",
    lineHeight: 16,
  },
  cardMeta: {
    fontSize: 11.5,
    color: "#0F1F3D",
    fontWeight: "700",
  },
  primaryBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#0F1F3D",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "800",
  },
});

