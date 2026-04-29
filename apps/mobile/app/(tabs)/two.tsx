import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text as RNText, View as RNView } from "react-native";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@/src/i18n";

import { Text, View } from "@/components/Themed";

export default function TabTwoScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem("pg_has_onboarded");
        if (hasOnboarded !== "true") {
          router.replace("/onboarding" as any);
          return;
        }
      } catch {
        // If storage fails, allow rendering.
      }

      if (mounted) setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("nav.profile")}</Text>

      <RNView style={styles.section}>
        <RNText style={styles.sectionTitle}>Sıla Kozik</RNText>
        <RNText style={styles.sectionSub}>Profesyonel Gezgin</RNText>
      </RNView>

      <Pressable style={styles.primaryBtn} onPress={() => router.push("/transfer" as any)}>
        <Text style={styles.primaryBtnText}>{t("mobile.goTransfer")}</Text>
      </Pressable>

      <RNView style={styles.langRow}>
        <Pressable style={[styles.langBtn, i18n.language === "tr" ? styles.langBtnActive : null]} onPress={() => setAppLanguage("tr")}>
          <RNText style={[styles.langBtnText, i18n.language === "tr" ? styles.langBtnTextActive : null]}>TR</RNText>
        </Pressable>
        <Pressable style={[styles.langBtn, i18n.language === "en" ? styles.langBtnActive : null]} onPress={() => setAppLanguage("en")}>
          <RNText style={[styles.langBtnText, i18n.language === "en" ? styles.langBtnTextActive : null]}>EN</RNText>
        </Pressable>
      </RNView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    backgroundColor: "rgba(255,255,255,0.7)",
    width: "90%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F1F3D",
    textAlign: "center",
  },
  sectionSub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7A99",
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 18,
    width: "90%",
    borderRadius: 14,
    backgroundColor: "#0F1F3D",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  langRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  langBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  langBtnActive: {
    backgroundColor: "#0F1F3D",
    borderColor: "#0F1F3D",
  },
  langBtnText: {
    color: "#0F1F3D",
    fontWeight: "800",
    fontSize: 12,
  },
  langBtnTextActive: {
    color: "#fff",
  },
});
