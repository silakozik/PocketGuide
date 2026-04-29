import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";

export default function TransferScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Geri</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Transfer Rehberi</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholderTitle}>Aşama 1: Yakında</Text>
        <Text style={styles.placeholderText}>
          Web’deki “Transfer” ekranını mobilde port etmek için bu sayfayı genişleteceğiz.
        </Text>

        <Pressable onPress={() => router.push("/")} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Haritaya Dön</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f7f4ee",
  },
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  backBtn: {
    width: 60,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(221, 227, 240, 1)",
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F1F3D",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F1F3D",
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7A99",
    textAlign: "center",
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: "#0F1F3D",
    paddingVertical: 14,
    borderRadius: 14,
    width: "90%",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});

