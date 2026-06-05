import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/Themed";
import { RoutePlanDisplay } from "@/src/components/route/RoutePlanDisplay";
import { useAuth } from "@/src/context/AuthContext";
import { saveTrip } from "@/src/lib/savedTripsApi";
import { theme } from "@/src/theme/tokens";
import { PROFILE_INTERESTS } from "@/src/constants/interests";
import { generateRoute } from "@pocketguide/core";
import type { GeneratedRoute, RouteTheme } from "@pocketguide/core";

const CITIES = [
  { nameTr: "İstanbul", nameEn: "Istanbul", slug: "istanbul", emoji: "🕌" },
  { nameTr: "Paris", nameEn: "Paris", slug: "paris", emoji: "🗼" },
  { nameTr: "Tokyo", nameEn: "Tokyo", slug: "tokyo", emoji: "🏯" },
  { nameTr: "Londra", nameEn: "London", slug: "londra", emoji: "🎡" },
  { nameTr: "Roma", nameEn: "Rome", slug: "roma", emoji: "🏛️" },
  { nameTr: "Barcelona", nameEn: "Barcelona", slug: "barcelona", emoji: "🌊" },
  { nameTr: "Dubai", nameEn: "Dubai", slug: "dubai", emoji: "🏙️" },
  { nameTr: "Amsterdam", nameEn: "Amsterdam", slug: "amsterdam", emoji: "🚲" },
  { nameTr: "Sydney", nameEn: "Sydney", slug: "sydney", emoji: "🦘" },
  { nameTr: "New York", nameEn: "New York", slug: "new-york", emoji: "🗽" },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const INTERESTS_TO_THEMES: Record<string, RouteTheme> = {
  art: "culture",
  gastronomy: "food",
  history: "culture",
  nature: "nature",
  nightlife: "relaxation",
  shopping: "shopping",
  architecture: "culture",
  music_events: "culture",
  adventure: "adventure",
  relaxation: "relaxation",
  family: "family",
  budget: "budget",
};

function themesFromInterests(interests: string[]): RouteTheme[] {
  const themes = [
    ...new Set(interests.map((i) => INTERESTS_TO_THEMES[i]).filter(Boolean)),
  ] as RouteTheme[];
  return themes.length > 0 ? themes : ["culture"];
}

function routeToStops(route: GeneratedRoute) {
  return route.plan.flatMap((day) =>
    day.stops.map((stop) => ({
      id: `day${day.day}-stop${stop.order}`,
      name: stop.name,
      lat: 0,
      lng: 0,
      address: stop.address,
    })),
  );
}

function routePlannerErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes("invalid_api_key") ||
    raw.includes("Invalid API Key") ||
    /401/.test(raw)
  ) {
    return "Groq API anahtarı geçersiz. apps/mobile/.env içinde EXPO_PUBLIC_GROQ_API_KEY, web’deki VITE_GROQ_API_KEY ile aynı olmalı. Kaydettikten sonra Expo’yu tamamen yeniden başlatın (npx expo start -c).";
  }
  return raw || "Rota oluşturulurken hata oluştu.";
}

export default function RoutePlannerTabScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCity, setSelectedCity] = useState<(typeof CITIES)[0] | null>(null);
  const [selectedDays, setSelectedDays] = useState(3);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
        // allow
      }
      try {
        const raw = await AsyncStorage.getItem("pg_user_interests");
        const interests: string[] = raw ? JSON.parse(raw) : [];
        if (mounted && interests.length > 0) {
          setSelectedInterests(interests);
        }
      } catch {
        // keep empty selection
      }
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();

  const handleGenerate = async () => {
    if (!selectedCity || !apiKey) {
      setError("API key bulunamadı. .env dosyasını kontrol edin.");
      return;
    }
    if (selectedInterests.length === 0) {
      setError("En az bir ilgi alanı seçmelisin.");
      return;
    }
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    try {
      const result = await generateRoute({
        city: selectedCity.nameTr,
        cityNameEn: selectedCity.nameEn,
        days: selectedDays,
        themes: themesFromInterests(selectedInterests),
        userInterests: selectedInterests,
        groqApiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      setRoute(result);
      setStep(3);
    } catch (err: unknown) {
      setError(routePlannerErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!route) return;
    if (!user) {
      setSaveMessage("Kaydetmek için giriş yapmalısın.");
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const saved = await saveTrip({
        title: route.title,
        cityName: route.city,
        stops: routeToStops(route),
        routeData: { type: "ai-route-planner", ...route },
      });
      router.push(`/plan/saved/${saved.id}` as any);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message === "LOGIN_REQUIRED"
          ? "Kaydetmek için giriş yapmalısın."
          : err instanceof Error
            ? err.message
            : "Kayıt başarısız.";
      setSaveMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!route) return;
    try {
      await Share.share({
        message: JSON.stringify(route, null, 2),
        title: `${route.city}-${route.days}-gun-rota.json`,
      });
    } catch {
      setSaveMessage("Rota paylaşılamadı.");
    }
  };

  const openFirstDayGuide = () => {
    const slug = selectedCity?.slug;
    if (!slug) return;
    router.push(`/${slug}/first-day` as any);
  };

  if (!ready) return <View style={styles.root} />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>AI Rota Planlayıcı</Text>
        <Text style={styles.heroSub}>
          Şehir ve temaları seç, yapay zeka gün gün rota oluştursun.
        </Text>
      </View>

      <View style={styles.stepsRow}>
        {[
          { n: 1, label: "Şehir" },
          { n: 2, label: "Detaylar" },
          { n: 3, label: "Rota" },
        ].map((s, i) => (
          <View key={s.n} style={styles.stepWrap}>
            <View style={[styles.stepBubble, step >= s.n && styles.stepBubbleActive]}>
              <Text style={[styles.stepNum, step >= s.n && styles.stepNumActive]}>
                {step > s.n ? "✓" : s.n}
              </Text>
            </View>
            <Text style={[styles.stepLabel, step >= s.n && styles.stepLabelActive]}>
              {s.label}
            </Text>
            {i < 2 && <View style={[styles.stepLine, step > s.n && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      {step === 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hangi şehre gidiyorsun?</Text>
          <View style={styles.cityGrid}>
            {CITIES.map((city) => (
              <Pressable
                key={city.slug}
                onPress={() => setSelectedCity(city)}
                style={[
                  styles.cityCard,
                  selectedCity?.slug === city.slug && styles.cityCardSelected,
                ]}
              >
                <Text style={styles.cityEmoji}>{city.emoji}</Text>
                <Text
                  style={[
                    styles.cityName,
                    selectedCity?.slug === city.slug && styles.cityNameSelected,
                  ]}
                >
                  {city.nameTr}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => selectedCity && setStep(2)}
            style={[styles.primaryBtn, !selectedCity && styles.primaryBtnDisabled]}
            disabled={!selectedCity}
          >
            <Text style={styles.primaryBtnText}>Devam Et →</Text>
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <View style={styles.section}>
          <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Geri</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>
            {selectedCity?.emoji} {selectedCity?.nameTr} için plan detayları
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Kaç gün?</Text>
            <View style={styles.daysRow}>
              {DAYS_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDays(d)}
                  style={[styles.dayBtn, selectedDays === d && styles.dayBtnActive]}
                >
                  <Text
                    style={[styles.dayBtnText, selectedDays === d && styles.dayBtnTextActive]}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>İlgi alanların</Text>
            {selectedInterests.length > 0 ? (
              <Text style={styles.personalizedHint}>
                ✨ Profilindeki ilgi alanların otomatik seçildi — istersen
                değiştirebilirsin.
              </Text>
            ) : null}
            <Text style={styles.themeHint}>Birden fazla seçebilirsin (en az 1)</Text>
            <View style={styles.themeGrid}>
              {PROFILE_INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest.id);
                return (
                  <Pressable
                    key={interest.id}
                    onPress={() => toggleInterest(interest.id)}
                    style={[styles.themeCard, selected && styles.themeCardSelected]}
                  >
                    <Text style={styles.themeEmoji}>{interest.icon}</Text>
                    <Text
                      style={[styles.themeLabel, selected && styles.themeLabelSelected]}
                    >
                      {interest.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleGenerate}
            style={[
              styles.primaryBtn,
              (loading || selectedInterests.length === 0) && styles.primaryBtnDisabled,
            ]}
            disabled={loading || selectedInterests.length === 0}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.primaryBtnText}>Rota oluşturuluyor...</Text>
              </View>
            ) : (
              <Text style={styles.primaryBtnText}>✨ Rotamı Oluştur</Text>
            )}
          </Pressable>
        </View>
      )}

      {step === 3 && route && (
        <View style={styles.section}>
          <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Yeniden Oluştur</Text>
          </Pressable>

          <RoutePlanDisplay route={route} />

          {saveMessage ? (
            <View
              style={[
                styles.saveMessageBox,
                saveMessage.includes("kaydedildi") && styles.saveMessageOk,
              ]}
            >
              <Text
                style={[
                  styles.saveMessageText,
                  saveMessage.includes("kaydedildi") && styles.saveMessageTextOk,
                ]}
              >
                {saveMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={openFirstDayGuide}
              disabled={!selectedCity}
            >
              <Text style={styles.secondaryBtnText}>💡 İlk Gün Rehberi</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void handleSave()}
              disabled={saving}
            >
              <Text style={styles.secondaryBtnText}>
                {saving ? "Kaydediliyor..." : "💾 Seyahatlerime Kaydet"}
              </Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => void handleDownload()}>
              <Text style={styles.primaryBtnText}>⬇️ Rotayı İndir</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 16, paddingBottom: 80, gap: 20 },

  hero: { gap: 6, paddingTop: 8 },
  heroTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamilySans,
  },

  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  stepWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBubbleActive: { backgroundColor: theme.colors.textPrimary },
  stepNum: { fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary },
  stepNumActive: { color: theme.colors.surface },
  stepLabel: { fontSize: 11, color: theme.colors.textMuted },
  stepLabelActive: { color: theme.colors.textPrimary, fontWeight: "700" },
  stepLine: { width: 20, height: 1, backgroundColor: theme.colors.border },
  stepLineActive: { backgroundColor: theme.colors.textPrimary },

  section: { gap: 16 },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  backBtn: { alignSelf: "flex-start" },
  backBtnText: { fontSize: 14, fontWeight: "600", color: theme.colors.textSecondary },

  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cityCard: {
    width: "18%",
    minWidth: 60,
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cityCardSelected: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  cityEmoji: { fontSize: 24 },
  cityName: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  cityNameSelected: { color: theme.colors.surface },

  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary },
  themeHint: { fontSize: 11, color: theme.colors.textMuted, marginTop: -4 },
  personalizedHint: {
    fontSize: 12,
    color: "#6b7a99",
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontStyle: "italic",
  },
  daysRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBtnActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  dayBtnText: { fontSize: 14, fontWeight: "700", color: theme.colors.textSecondary },
  dayBtnTextActive: { color: theme.colors.surface },

  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  themeCard: {
    width: "47%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 2,
  },
  themeCardSelected: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  themeEmoji: { fontSize: 20 },
  themeLabel: { fontSize: 12, fontWeight: "700", color: theme.colors.textPrimary },
  themeLabelSelected: { color: theme.colors.surface },
  themeDesc: { fontSize: 10, color: theme.colors.textSecondary },
  themeDescSelected: { color: "rgba(255,255,255,0.6)" },

  primaryBtn: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: theme.colors.surface },
  loadingRow: { flexDirection: "row", gap: 8, alignItems: "center" },

  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  errorText: { fontSize: 13, color: "#dc2626", fontWeight: "600" },

  saveMessageBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  saveMessageOk: {
    backgroundColor: "#ecfdf5",
    borderColor: "#6ee7b7",
  },
  saveMessageText: { fontSize: 13, color: "#dc2626", fontWeight: "600" },
  saveMessageTextOk: { color: "#059669" },

  actionRow: { gap: 10 },
  secondaryBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
});
