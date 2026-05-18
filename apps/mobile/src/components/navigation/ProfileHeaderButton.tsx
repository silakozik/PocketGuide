import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { theme } from "@/src/theme/tokens";

/** Sol üst profil; giriş yoksa login, varsa profil. */
export function ProfileHeaderButton() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const letter = user?.userName?.charAt(0).toUpperCase() ?? "?";

  const onPress = () => {
    if (user) {
      router.push("/profile");
    } else {
      router.push("/login" as any);
    }
  };

  if (loading) {
    return (
      <Pressable style={styles.circle} disabled>
        <ActivityIndicator size="small" color={theme.colors.surface} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.circle, pressed ? { opacity: 0.88 } : null]}
      accessibilityRole="button"
      accessibilityLabel={user ? "Profile" : "Sign in"}
    >
      <Text style={styles.letter}>{letter}</Text>
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
