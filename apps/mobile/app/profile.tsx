import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { ProfileScreen } from "@/src/screens/ProfileScreen";
import { theme } from "@/src/theme/tokens";

export default function ProfileRoute() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (authLoading) return;

      if (!user) {
        router.replace("/login" as never);
        return;
      }

      try {
        const hasOnboarded = await AsyncStorage.getItem("pg_has_onboarded");
        if (hasOnboarded !== "true") {
          router.replace("/onboarding" as never);
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

  if (authLoading || !ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.textPrimary} />
      </View>
    );
  }

  return <ProfileScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});
