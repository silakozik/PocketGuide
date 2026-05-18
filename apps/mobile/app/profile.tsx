import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as RNText,
  View as RNView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Text, View } from "@/components/Themed";
import { useAuth } from "@/src/context/AuthContext";
import { setAppLanguage } from "@/src/i18n";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const [ready, setReady] = useState(false);

  const displayName = user?.userName ?? "Gezgin";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("nav.profile") });
  }, [navigation, t]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (authLoading) return;

      if (!user) {
        router.replace("/login" as any);
        return;
      }

      try {
        const hasOnboarded = await AsyncStorage.getItem("pg_has_onboarded");
        if (hasOnboarded !== "true") {
          router.replace("/onboarding" as any);
          return;
        }
      } catch {
        // allow
      }

      if (mounted) setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [router, user, authLoading]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as any);
  };

  if (authLoading || !ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNView style={styles.section}>
        <RNView style={styles.avatar}>
          <RNText style={styles.avatarText}>{avatarLetter}</RNText>
        </RNView>
        <RNText style={styles.sectionTitle}>{displayName}</RNText>
        <RNText style={styles.sectionSub}>{user?.email}</RNText>
      </RNView>

      <Pressable style={styles.primaryBtn} onPress={() => router.push("/transfer")}>
        <Text style={styles.primaryBtnText}>{t("mobile.goTransfer")}</Text>
      </Pressable>

      <RNView style={styles.langRow}>
        <Pressable
          style={[styles.langBtn, i18n.language === "tr" ? styles.langBtnActive : null]}
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
          style={[styles.langBtn, i18n.language === "en" ? styles.langBtnActive : null]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
    width: "90%",
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
  primaryBtn: {
    ...presets.primaryButton,
    marginTop: 18,
    width: "90%",
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
