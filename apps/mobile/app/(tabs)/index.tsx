import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { PocketGuideMap } from "@/src/components/map/PocketGuideMap";

export default function PocketGuideMapScreen() {
  return (
    <View style={styles.container}>
      <PocketGuideMap />
      <StatusBar hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
