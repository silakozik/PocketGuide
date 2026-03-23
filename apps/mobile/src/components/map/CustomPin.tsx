import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import type { POICategory } from "@/src/types/poi";
import { PIN_COLORS } from "@/src/constants/mapConfig";

export type CustomPinProps = {
  category: POICategory;
  selected?: boolean;
  onPress?: () => void;
};

function getCategoryStyles(category: POICategory) {
  switch (category) {
    case "restaurant":
      return { circle: styles.circleRestaurant, triangle: styles.triangleRestaurant };
    case "museum":
      return { circle: styles.circleMuseum, triangle: styles.triangleMuseum };
    case "transport":
      return { circle: styles.circleTransport, triangle: styles.triangleTransport };
    case "event":
      return { circle: styles.circleEvent, triangle: styles.triangleEvent };
    case "hotel":
      return { circle: styles.circleHotel, triangle: styles.triangleHotel };
    default:
      return { circle: styles.circleRestaurant, triangle: styles.triangleRestaurant };
  }
}

export function CustomPin({ category, selected, onPress }: CustomPinProps) {
  const { circle, triangle } = getCategoryStyles(category);
  const shadowStyle = Platform.OS === "ios" ? styles.shadowIOS : styles.shadowAndroid;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.touchable}>
      <View style={[styles.pinWrap, shadowStyle, selected ? styles.selected : null]}>
        <View style={[styles.pinCircle, circle]} />
        <View style={[styles.pinTriangle, triangle]} />
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
    alignItems: "center",
    justifyContent: "flex-start",
  },
  selected: {
    transform: [{ scale: 1.2 }],
  },

  shadowIOS: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  shadowAndroid: {
    elevation: 6,
  },

  pinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  pinTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },

  circleRestaurant: { backgroundColor: PIN_COLORS.restaurant },
  circleMuseum: { backgroundColor: PIN_COLORS.museum },
  circleTransport: { backgroundColor: PIN_COLORS.transport },
  circleEvent: { backgroundColor: PIN_COLORS.event },
  circleHotel: { backgroundColor: PIN_COLORS.hotel },

  triangleRestaurant: { borderTopColor: PIN_COLORS.restaurant },
  triangleMuseum: { borderTopColor: PIN_COLORS.museum },
  triangleTransport: { borderTopColor: PIN_COLORS.transport },
  triangleEvent: { borderTopColor: PIN_COLORS.event },
  triangleHotel: { borderTopColor: PIN_COLORS.hotel },
});

