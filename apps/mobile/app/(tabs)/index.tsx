import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PocketGuideMap } from "@/src/components/map/PocketGuideMap";

export default function PocketGuideMapScreen() {
  const router = useRouter();
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
        // If storage fails, don't block the user from using the app.
      }

      if (mounted) setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PocketGuideMap />
      <View style={styles.topLeftOverlay}>
        <Pressable
          onPress={() => router.push("/landing" as any)}
          style={({ pressed }) => [styles.backBtn, pressed ? { opacity: 0.85 } : null]}
        >
          <Text style={styles.backBtnText}>Geri</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/istanbul/first-day" as any)}
          style={({ pressed }) => [styles.firstDayBtn, pressed ? { opacity: 0.85 } : null]}
        >
          <Text style={styles.firstDayBtnText}>İlk Gün</Text>
        </Pressable>
      </View>
      <StatusBar hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topLeftOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 200,
    gap: 8,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  firstDayBtn: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  firstDayBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1F3D",
  },
});
