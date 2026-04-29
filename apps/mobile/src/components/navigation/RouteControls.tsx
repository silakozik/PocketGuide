import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useRoute } from "@/src/context/RouteContext";

export function RouteControls() {
  const { t } = useTranslation();
  const { isActive, startRoute, resetRoute, isFetching, draftPOIs, error } = useRoute();

  const handleStartRoute = async () => {
    if (draftPOIs.length < 2) {
      Alert.alert(t("nav.map"), t("mobile.startRouteNeedTwo"));
      return;
    }
    await startRoute();
  };

  if (!isActive && draftPOIs.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {!isActive ? (
        <>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed ? { opacity: 0.9 } : null]}
            onPress={handleStartRoute}
            disabled={isFetching}
          >
            <Text style={styles.primaryBtnText}>
              {isFetching ? t("common.loading") : `${t("mobile.startRoute")} (${draftPOIs.length} Nokta)`}
            </Text>
          </Pressable>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </>
      ) : (
        <View style={styles.activeActions}>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed ? { opacity: 0.85 } : null]}
            onPress={resetRoute}
          >
            <Text style={styles.secondaryBtnText}>{t("mobile.resetRoute")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 20,
    zIndex: 120,
  },
  primaryBtn: {
    backgroundColor: "#0F1F3D",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  activeActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  secondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    color: "#0F1F3D",
    fontWeight: "800",
    fontSize: 13,
  },
  errorText: {
    marginTop: 8,
    color: "#9b1c1c",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
});

