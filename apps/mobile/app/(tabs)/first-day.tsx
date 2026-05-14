import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { FirstDayGuideScreen } from "@/src/screens/FirstDayGuideScreen";
import { theme } from "@/src/theme/tokens";

/** Web’deki `/istanbul/first-day` ile aynı varsayılan şehir slug’ı */
const DEFAULT_CITY_SLUG = "istanbul";

export default function FirstDayTabScreen() {
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
        // allow
      }
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) return <View style={styles.fill} />;

  return (
    <View style={styles.fill}>
      <FirstDayGuideScreen citySlug={DEFAULT_CITY_SLUG} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
