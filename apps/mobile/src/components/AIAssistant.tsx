import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { resolveCityFromPrompt } from "@pocketguide/core";

import { MAP_INITIAL_LAT, MAP_INITIAL_LNG } from "@/src/constants/osmMapStyle";
import {
  askGroqTravelAssistant,
  fetchTravelRecommendationsFromGroq,
  type TravelRecommendation,
} from "@/src/lib/groqRecommendations";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

export type AIAssistantPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type AIAssistantProps = {
  lat?: number;
  lng?: number;
  onPinsChange?: (pins: AIAssistantPin[]) => void;
  onFlyTo?: (lat: number, lng: number) => void;
};

function formatApiError(err: unknown): string {
  const rawMessage = err instanceof Error ? err.message : "Öneriler getirilirken bir hata oluştu.";
  if (rawMessage.includes("HTTP 429") || rawMessage.toLowerCase().includes("too many requests")) {
    return "Çok hızlı istek gönderildi. 8-10 saniye bekleyip tekrar deneyin.";
  }
  return rawMessage;
}

function buildAnswerText(recs: TravelRecommendation[], askedQuestion: string | null) {
  if (!recs.length) return "";
  const top = recs.slice(0, 3);
  const lines = top.map(
    (rec, idx) =>
      `${idx + 1}. ${rec.name} (${rec.category}) - ${rec.reason} [${Math.round(rec.walkingDistanceMeters)}m]`,
  );
  if (askedQuestion?.trim()) {
    return `Soruna göre en uygun öneriler:\n${lines.join("\n")}`;
  }
  return `Bulunduğun konuma göre en uygun öneriler:\n${lines.join("\n")}`;
}

export function AIAssistant({ lat, lng, onPinsChange, onFlyTo }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<TravelRecommendation[] | null>(null);
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [effectiveCoords, setEffectiveCoords] = useState({
    lat: lat ?? MAP_INITIAL_LAT,
    lng: lng ?? MAP_INITIAL_LNG,
  });

  useEffect(() => {
    if (lat != null && lng != null) {
      setEffectiveCoords({ lat, lng });
    }
  }, [lat, lng]);

  const setPinsFromRecs = useCallback(
    (data: TravelRecommendation[]) => {
      const pins = data
        .filter((rec) => typeof rec.lat === "number" && typeof rec.lng === "number")
        .map((rec) => ({
          id: rec.placeId,
          name: rec.name,
          lat: rec.lat as number,
          lng: rec.lng as number,
        }));
      onPinsChange?.(pins);
    },
    [onPinsChange],
  );

  const fetchRecommendations = async (askedQuestion?: string) => {
    setLoading(true);
    setError(null);
    Keyboard.dismiss();
    try {
      const normalizedQuestion = askedQuestion?.trim() || undefined;
      let targetCoords = effectiveCoords;
      const cityRef = normalizedQuestion ? resolveCityFromPrompt(normalizedQuestion) : null;
      if (cityRef) {
        targetCoords = { lat: cityRef.lat, lng: cityRef.lng };
        setEffectiveCoords(targetCoords);
        onFlyTo?.(targetCoords.lat, targetCoords.lng);
      }

      const data = await fetchTravelRecommendationsFromGroq(
        targetCoords.lat,
        targetCoords.lng,
        normalizedQuestion,
        cityRef?.slug,
      );
      setRecommendations(data);
      setPinsFromRecs(data);
      setLastQuestion(normalizedQuestion ?? null);

      if (normalizedQuestion) {
        const reply = await askGroqTravelAssistant(
          normalizedQuestion,
          targetCoords,
          data.length > 0 ? data : undefined,
        );
        setAssistantReply(reply || null);
      } else {
        setAssistantReply(null);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch AI recommendations", err);
      setError(formatApiError(err));
      onPinsChange?.([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) {
      onPinsChange?.([]);
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setEffectiveCoords(nextCoords);
        onFlyTo?.(nextCoords.lat, nextCoords.lng);
      }
    } catch {
      /* keep map center / fallback */
    }

    void fetchRecommendations(question);
  };

  const renderRecCard = (rec: TravelRecommendation) => (
    <View key={rec.placeId} style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName} numberOfLines={2}>
          {rec.name}
        </Text>
        <View style={styles.cardBadges}>
          <Text style={styles.cardCategory}>{rec.category}</Text>
          <Text style={styles.cardBadge}>{rec.badge}</Text>
        </View>
      </View>
      <Text style={styles.cardReason}>{rec.reason}</Text>
      <Text style={styles.cardMeta}>
        📍 {rec.walkingDistanceMeters}m · 🕒 {rec.estimatedVisitMinutes} dk
      </Text>
    </View>
  );

  const emptyCityRef = lastQuestion ? resolveCityFromPrompt(lastQuestion) : null;

  return (
    <>
      <Pressable onPress={() => void handleOpen()} style={styles.fab}>
        <Text style={styles.fabText}>✨</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerSparkle}>✨</Text>
              <Text style={styles.headerTitle}>Gezi Asistanı</Text>
            </View>
            <Pressable
              onPress={() => {
                setIsOpen(false);
                onPinsChange?.([]);
              }}
              hitSlop={8}
            >
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={theme.colors.textPrimary} />
                <Text style={styles.infoText}>Öneriler hazırlanıyor...</Text>
              </View>
            ) : error ? (
              <>
                <Text style={styles.emptyIcon}>⚠️</Text>
                <Text style={styles.infoText}>{error}</Text>
                <Pressable
                  onPress={() => void fetchRecommendations(question)}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Tekrar Dene</Text>
                </Pressable>
              </>
            ) : assistantReply ? (
              <>
                {lastQuestion ? (
                  <Text style={styles.questionChip}>Soru: {lastQuestion}</Text>
                ) : null}
                <Text style={styles.answerText}>{assistantReply}</Text>
                {recommendations?.slice(0, 3).map(renderRecCard)}
                <Pressable
                  onPress={() => void fetchRecommendations(question)}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Yeniden Sor</Text>
                </Pressable>
              </>
            ) : recommendations && recommendations.length > 0 ? (
              <>
                {lastQuestion ? (
                  <Text style={styles.questionChip}>Soru: {lastQuestion}</Text>
                ) : null}
                <Text style={styles.answerText}>
                  {buildAnswerText(recommendations, lastQuestion)}
                </Text>
                {recommendations.map(renderRecCard)}
                <Pressable
                  onPress={() => void fetchRecommendations(question)}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Önerileri Yenile</Text>
                </Pressable>
              </>
            ) : recommendations && recommendations.length === 0 ? (
              <>
                <Text style={styles.emptyIcon}>🏜️</Text>
                <Text style={styles.infoText}>
                  {emptyCityRef
                    ? `${emptyCityRef.nameTr} için veritabanında mekan bulunamadı. API'nin çalıştığından emin olun; ardından apps/api içinde pnpm seed:places ile 10 şehir verisini yükleyin.`
                    : lastQuestion
                      ? "Sorun alındı ancak bu bölgede uygun mekan bulunamadı. Haritayı merkez/kalabalık bir bölgeye kaydırıp tekrar sor."
                      : "Bu harita merkezinin yakınında uygun yer bulunamadı. Haritayı pinlerin yoğun olduğu bir alana kaydırıp yeniden deneyin."}
                </Text>
                <Pressable
                  onPress={() => void fetchRecommendations(question)}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Yenile</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📍</Text>
                <Text style={styles.infoText}>Çevrendeki en iyi deneyimler için hazır mısın?</Text>
                <Pressable
                  onPress={() => void fetchRecommendations(question)}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Bana Öneriler Getir</Text>
                </Pressable>
              </>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Örn: Romantik bir kahve + gün batımı öner"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.questionInput}
              editable={!loading}
              returnKeyType="search"
              onSubmitEditing={() => void fetchRecommendations(question)}
            />
            <Pressable
              onPress={() => void fetchRecommendations(question)}
              style={[styles.askBtn, loading ? styles.askBtnDisabled : null]}
              disabled={loading}
            >
              <Text style={styles.askBtnText}>Sor</Text>
            </Pressable>
          </View>
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
    maxHeight: 400,
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerSparkle: {
    fontSize: 18,
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
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  body: {
    padding: 12,
    gap: theme.spacing.xs,
    paddingBottom: 8,
  },
  loadingWrap: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  infoText: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    fontWeight: "400",
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.body.lineHeight,
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 28,
    textAlign: "center",
  },
  questionChip: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  answerText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
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
    alignItems: "flex-start",
    gap: 8,
  },
  cardName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    flex: 1,
  },
  cardBadges: {
    alignItems: "flex-end",
    gap: 4,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
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
    marginTop: 8,
    paddingVertical: 12,
  },
  primaryBtnText: {
    ...presets.primaryButtonText,
    fontSize: theme.typography.caption.fontSize,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  questionInput: {
    flex: 1,
    height: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilySans,
  },
  askBtn: {
    ...presets.primaryButton,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
  },
  askBtnDisabled: {
    opacity: 0.6,
  },
  askBtnText: {
    ...presets.primaryButtonText,
    fontSize: 13,
  },
});
