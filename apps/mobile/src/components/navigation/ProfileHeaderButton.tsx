import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { theme } from "@/src/theme/tokens";

/** Spotify tarzı sol üst profil; tam ekran profil stack’ine gider. */
export function ProfileHeaderButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/profile")}
      style={({ pressed }) => [styles.circle, pressed ? { opacity: 0.88 } : null]}
      accessibilityRole="button"
      accessibilityLabel="Profile"
    >
      <Text style={styles.letter}>S</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  letter: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "900",
  },
});
