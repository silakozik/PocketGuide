import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Themed";

export default function LandingScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.logo}>PocketGuide</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t("mobile.landingTitle")}</Text>
        <Text style={styles.subtitle}>
          {t("mobile.landingSubtitle")}
        </Text>

        <View style={styles.actions}>
          <Pressable onPress={() => router.push("/")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t("mobile.goMap")}</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/transfer" as any)} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>{t("mobile.goTransfer")}</Text>
          </Pressable>
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Aşama 1</Text>
          <Text style={styles.hintText}>
            Landing, onboarding, profile ve transfer sayfaları iskelet olarak hazır.
            Harita paritesi ve i18n iyileştirmeleri sonraki aşamalarda gelecek.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f7f4ee",
  },
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  logo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: "#0F1F3D",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    color: "#6B7A99",
    marginBottom: 24,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
    alignItems: "center",
  },
  primaryBtn: {
    width: "90%",
    backgroundColor: "#0F1F3D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryBtn: {
    width: "90%",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
  },
  secondaryBtnText: {
    color: "#0F1F3D",
    fontSize: 14,
    fontWeight: "800",
  },
  hintCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F1F3D",
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#6B7A99",
    lineHeight: 18,
  },
});

