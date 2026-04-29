import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useRoute } from "@/src/context/RouteContext";

function getStepIcon(type: number) {
  switch (type) {
    case 0:
      return "⬆️";
    case 1:
      return "➡️";
    case 2:
      return "⬅️";
    case 3:
      return "↗️";
    case 4:
      return "↖️";
    case 11:
      return "🔄";
    case 12:
      return "🏁";
    default:
      return "➡️";
  }
}

export function DirectionsPanel() {
  const { t } = useTranslation();
  const { isActive, routeData, activeLegIndex, activeStepIndex, nextStep, prevStep } = useRoute();

  if (!isActive || !routeData) return null;

  const activeLeg = routeData.legs[activeLegIndex];
  const activeStep = activeLeg.steps[activeStepIndex];

  const totalSteps = routeData.legs.reduce((acc, leg) => acc + leg.steps.length, 0);
  let currentStepAbsolute = 0;
  for (let i = 0; i < activeLegIndex; i++) currentStepAbsolute += routeData.legs[i].steps.length;
  currentStepAbsolute += activeStepIndex + 1;

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.summary}>
          {routeData.total_duration_min} dk ({routeData.total_distance_km.toFixed(1)} km)
        </Text>
        <Text style={styles.progress}>
          {t("mobile.step")} {currentStepAbsolute}/{totalSteps}
        </Text>
      </View>

      <View style={styles.stepCard}>
        <Text style={styles.stepIcon}>{getStepIcon(activeStep.type)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepText}>{activeStep.instruction}</Text>
          <Text style={styles.stepDistance}>
            {t("mobile.remaining")}:{" "}
            {activeStep.distance < 1000
              ? `${Math.round(activeStep.distance)} m`
              : `${(activeStep.distance / 1000).toFixed(1)} km`}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed ? { opacity: 0.85 } : null]}
          onPress={prevStep}
          disabled={activeLegIndex === 0 && activeStepIndex === 0}
        >
          <Text style={styles.secondaryBtnText}>{t("mobile.previous")}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed ? { opacity: 0.9 } : null]}
          onPress={nextStep}
          disabled={
            activeLegIndex === routeData.legs.length - 1 &&
            activeStepIndex === routeData.legs[routeData.legs.length - 1].steps.length - 1
          }
        >
          <Text style={styles.primaryBtnText}>{t("mobile.next")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 84,
    zIndex: 121,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summary: {
    color: "#0F1F3D",
    fontWeight: "800",
    fontSize: 12.5,
  },
  progress: {
    color: "#6B7A99",
    fontWeight: "700",
    fontSize: 12,
  },
  stepCard: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  stepIcon: {
    fontSize: 22,
  },
  stepText: {
    color: "#0F1F3D",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 4,
  },
  stepDistance: {
    color: "#6B7A99",
    fontWeight: "600",
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(221,227,240,1)",
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#0F1F3D",
    fontWeight: "700",
    fontSize: 13,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#0F1F3D",
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
});

