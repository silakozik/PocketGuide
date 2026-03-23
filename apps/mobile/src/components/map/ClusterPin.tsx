import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CLUSTER_SIZE_BREAKPOINTS } from "@/src/constants/mapConfig";

export type ClusterPinProps = {
  count: number;
  onPress?: () => void;
};

function getClusterConfig(count: number) {
  return CLUSTER_SIZE_BREAKPOINTS.find((b) => count <= b.max) ?? CLUSTER_SIZE_BREAKPOINTS.at(-1)!;
}

export function ClusterPin({ count, onPress }: ClusterPinProps) {
  const config = getClusterConfig(count);
  const label = count >= 100 ? "99+" : String(count);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.touchable}>
      <View style={styles.pinWrap}>
        {config.size === 36 && <View style={styles.outerRing36} />}
        {config.size === 46 && <View style={styles.outerRing46} />}
        {config.size === 58 && <View style={styles.outerRing58} />}
        {config.size === 70 && <View style={styles.outerRing70} />}

        <View
          style={[
            styles.innerCircleBase,
            config.size === 36 && styles.innerCircle36,
            config.size === 46 && styles.innerCircle46,
            config.size === 58 && styles.innerCircle58,
            config.size === 70 && styles.innerCircle70,
          ]}
        >
          <Text style={styles.countText}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  outerRingBase: {
    borderRadius: 999,
    borderWidth: 3,
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },

  outerRing36: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "rgba(29, 158, 117, 0.35)",
    transform: [{ translateX: -28 }, { translateY: -28 }],
  },
  outerRing46: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: "rgba(24, 95, 165, 0.35)",
    transform: [{ translateX: -33 }, { translateY: -33 }],
  },
  outerRing58: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: "rgba(153, 60, 29, 0.35)",
    transform: [{ translateX: -39 }, { translateY: -39 }],
  },
  outerRing70: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "rgba(60, 52, 137, 0.35)",
    transform: [{ translateX: -45 }, { translateY: -45 }],
  },

  innerCircleBase: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle36: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1D9E75",
  },
  innerCircle46: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#185FA5",
  },
  innerCircle58: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#993C1D",
  },
  innerCircle70: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#3C3489",
  },

  countText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});

