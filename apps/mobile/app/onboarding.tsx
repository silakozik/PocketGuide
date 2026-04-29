import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";

const INTERESTS = [
  { id: "art", label: "Sanat", icon: "🎨" },
  { id: "gastronomy", label: "Gastronomi", icon: "🍽️" },
  { id: "history", label: "Tarih", icon: "🏛️" },
  { id: "nature", label: "Doğa", icon: "🌲" },
  { id: "nightlife", label: "Gece Hayatı", icon: "🍸" },
  { id: "shopping", label: "Alışveriş", icon: "🛍️" },
  { id: "architecture", label: "Mimari", icon: "🏢" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If user already onboarded, just redirect to the app.
    (async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem("pg_has_onboarded");
        if (hasOnboarded === "true") router.replace("/landing" as any);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleInterest = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await AsyncStorage.setItem("pg_has_onboarded", "true");
      await AsyncStorage.setItem("pg_user_interests", JSON.stringify(selected));
      router.replace("/landing" as any);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("mobile.onboardingTitle")}</Text>
        <Text style={styles.subtitle}>
          {t("mobile.onboardingSubtitle")}
        </Text>

        <View style={styles.grid}>
          {INTERESTS.map((interest) => {
            const isSelected = selectedSet.has(interest.id);
            return (
              <Pressable
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected ? styles.cardSelected : null,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <View style={styles.cardInner}>
                  <Text style={styles.cardEmoji}>{interest.icon}</Text>
                  <Text style={styles.cardLabel}>{interest.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleComplete}
          disabled={selected.length === 0 || submitting}
          style={({ pressed }) => [
            styles.submitBtn,
            (selected.length === 0 || submitting) ? { opacity: 0.6 } : null,
            pressed && selected.length > 0 && !submitting ? { opacity: 0.9 } : null,
          ]}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? t("common.loading") : t("mobile.onboardingStart")}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  cardSelected: {
    backgroundColor: "#0F1F3D",
    borderColor: "#0F1F3D",
  },
  cardInner: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    textAlign: "center",
  },
  submitBtn: {
    marginTop: 18,
    backgroundColor: "#0F1F3D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});

