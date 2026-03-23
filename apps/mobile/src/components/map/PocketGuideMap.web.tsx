import { StyleSheet, Text, View } from "react-native";

export function PocketGuideMap() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Harita web önizlemesi yakında.</Text>
      <Text style={styles.subText}>Mobilde (iOS/Android) çalışır.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F1F3D",
    marginBottom: 8,
    textAlign: "center",
  },
  subText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B6B84",
    textAlign: "center",
  },
});

