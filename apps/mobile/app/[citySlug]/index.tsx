import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";

import { Text } from "@/components/Themed";
import { theme } from "@/src/theme/tokens";

interface Highlight {
  icon: string;
  name: string;
  type: string;
  badge: string;
  badgeColor: string;
}

interface CityMeta {
  name: string;
  country: string;
  region: string;
  emoji: string;
  bgColor: string;
  gradientColors: readonly [string, string];
  tags: string[];
  highlights: Highlight[];
}

type FeatureKey = "first-day" | "transfer" | "map" | "assistant";

interface Feature {
  key: FeatureKey;
  emoji: string;
  title: string;
  desc: string;
  accentColor: string;
  bgColor: string;
}

const CITY_META: Record<string, CityMeta> = {
  paris: {
    name: "Paris",
    country: "Fransa",
    region: "Avrupa",
    emoji: "🗼",
    bgColor: "#667eea",
    gradientColors: ["#667eea", "#764ba2"] as const,
    tags: ["Metro Haritası", "120+ POI", "AI Rehber"],
    highlights: [
      { icon: "🗼", name: "Eyfel Kulesi", type: "Anıt", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🎨", name: "Louvre Müzesi", type: "Müze", badge: "Ücretli", badgeColor: "#dbeafe" },
      { icon: "⛪", name: "Notre-Dame", type: "Tarih", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  tokyo: {
    name: "Tokyo",
    country: "Japonya",
    region: "Asya",
    emoji: "🏯",
    bgColor: "#e74c3c",
    gradientColors: ["#f5576c", "#c0392b"] as const,
    tags: ["JR Pass", "200+ POI", "AI Rehber"],
    highlights: [
      { icon: "⛩️", name: "Senso-ji", type: "Tapınak", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🚦", name: "Shibuya Kavşağı", type: "Keşif", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🗼", name: "Tokyo Skytree", type: "Manzara", badge: "Ücretli", badgeColor: "#fef3c7" },
    ],
  },
  "new-york": {
    name: "New York",
    country: "ABD",
    region: "Kuzey Amerika",
    emoji: "🗽",
    bgColor: "#2193b0",
    gradientColors: ["#2193b0", "#6dd5ed"] as const,
    tags: ["Metro Haritası", "150+ POI", "AI Rehber"],
    highlights: [
      { icon: "🗽", name: "Özgürlük Heykeli", type: "Anıt", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🌳", name: "Central Park", type: "Park", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🌃", name: "Times Square", type: "Keşif", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  londra: {
    name: "Londra",
    country: "İngiltere",
    region: "Avrupa",
    emoji: "🎡",
    bgColor: "#536976",
    gradientColors: ["#536976", "#292e49"] as const,
    tags: ["Tube Haritası", "130+ POI", "AI Rehber"],
    highlights: [
      { icon: "🕰️", name: "Big Ben", type: "Anıt", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🏛️", name: "British Museum", type: "Müze", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🌉", name: "Tower Bridge", type: "Tarih", badge: "Ücretli", badgeColor: "#fef3c7" },
    ],
  },
  roma: {
    name: "Roma",
    country: "İtalya",
    region: "Avrupa",
    emoji: "🏛️",
    bgColor: "#c79081",
    gradientColors: ["#c79081", "#dfa579"] as const,
    tags: ["Metro A/B/C", "110+ POI", "AI Rehber"],
    highlights: [
      { icon: "🏟️", name: "Colosseum", type: "Tarih", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "⛪", name: "Vatikan", type: "Dini", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "⛲", name: "Trevi Çeşmesi", type: "Anıt", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  barcelona: {
    name: "Barcelona",
    country: "İspanya",
    region: "Avrupa",
    emoji: "🌊",
    bgColor: "#f7971e",
    gradientColors: ["#f7971e", "#ffd200"] as const,
    tags: ["Metro L1–L5", "100+ POI", "AI Rehber"],
    highlights: [
      { icon: "⛪", name: "Sagrada Familia", type: "Mimari", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🎨", name: "Park Güell", type: "Park", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🚶", name: "La Rambla", type: "Keşif", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  dubai: {
    name: "Dubai",
    country: "BAE",
    region: "Orta Doğu",
    emoji: "🏙️",
    bgColor: "#d4a574",
    gradientColors: ["#d4a574", "#a0705a"] as const,
    tags: ["Metro Red", "90+ POI", "AI Rehber"],
    highlights: [
      { icon: "🏗️", name: "Burj Khalifa", type: "Manzara", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🌴", name: "Palm Jumeirah", type: "Keşif", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🛍️", name: "Dubai Mall", type: "Alışveriş", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  amsterdam: {
    name: "Amsterdam",
    country: "Hollanda",
    region: "Avrupa",
    emoji: "🚲",
    bgColor: "#f46b45",
    gradientColors: ["#f46b45", "#eea849"] as const,
    tags: ["Tram & Metro", "95+ POI", "AI Rehber"],
    highlights: [
      { icon: "🎨", name: "Rijksmuseum", type: "Müze", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "📖", name: "Anne Frank Evi", type: "Tarih", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🌿", name: "Vondelpark", type: "Park", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  sydney: {
    name: "Sydney",
    country: "Avustralya",
    region: "Okyanusya",
    emoji: "🦘",
    bgColor: "#11998e",
    gradientColors: ["#11998e", "#38ef7d"] as const,
    tags: ["Opal Card", "85+ POI", "AI Rehber"],
    highlights: [
      { icon: "🎭", name: "Opera House", type: "Mimari", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🌉", name: "Harbour Bridge", type: "Anıt", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🏖️", name: "Bondi Beach", type: "Plaj", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  istanbul: {
    name: "İstanbul",
    country: "Türkiye",
    region: "Avrupa & Asya",
    emoji: "🕌",
    bgColor: "#4facfe",
    gradientColors: ["#4facfe", "#00f2fe"] as const,
    tags: ["Metro & Tram", "140+ POI", "AI Rehber"],
    highlights: [
      { icon: "🕌", name: "Ayasofya", type: "Tarih", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🏰", name: "Topkapı Sarayı", type: "Müze", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🗼", name: "Galata Kulesi", type: "Manzara", badge: "Ücretli", badgeColor: "#fef3c7" },
    ],
  },
};

function HeroGradient({
  colors,
  style,
  children,
}: {
  colors: readonly [string, string];
  style: ViewStyle;
  children: ReactNode;
}) {
  return (
    <View style={[style, { backgroundColor: colors[1], overflow: "hidden" }]}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: "35%",
          backgroundColor: colors[0],
          opacity: 0.92,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "55%",
          height: "100%",
          backgroundColor: colors[0],
          opacity: 0.35,
        }}
      />
      {children}
    </View>
  );
}

const FEATURES: Feature[] = [
  {
    key: "first-day",
    emoji: "💡",
    title: "İlk Gün Rehberi",
    desc: "SIM kart, ulaşım kartı ve şehre adaptasyon adımları.",
    accentColor: "#e8c547",
    bgColor: "#fffbe6",
  },
  {
    key: "transfer",
    emoji: "🚇",
    title: "Transfer Guide",
    desc: "Havalimanından şehir merkezine ulaşım seçenekleri.",
    accentColor: "#3b82f6",
    bgColor: "#eff6ff",
  },
  {
    key: "map",
    emoji: "🗺️",
    title: "Şehir Haritası",
    desc: "POI'ler, rotalar ve katmanlarla interaktif harita.",
    accentColor: "#10b981",
    bgColor: "#ecfdf5",
  },
  {
    key: "assistant",
    emoji: "✨",
    title: "Gezi Asistanı",
    desc: "AI destekli öneriler ve kişiselleştirilmiş rota planlama.",
    accentColor: "#8b5cf6",
    bgColor: "#f5f3ff",
  },
];

export default function CityHubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ citySlug?: string }>();
  const citySlug = params.citySlug ?? "";
  const meta = CITY_META[citySlug];

  useEffect(() => {
    if (!meta) {
      router.replace("/(tabs)");
    }
  }, [meta, router]);

  if (!meta) {
    return null;
  }

  const handleFeature = (key: FeatureKey) => {
    switch (key) {
      case "first-day":
        router.push({
          pathname: "/[citySlug]/first-day",
          params: { citySlug },
        });
        break;
      case "transfer":
        router.push("/transfer");
        break;
      case "map":
      case "assistant":
        router.push({
          pathname: "/(tabs)/map",
          params: { city: citySlug, mapFrom: "city" },
        } as never);
        break;
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <HeroGradient colors={meta.gradientColors} style={styles.hero}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.heroBack, pressed ? { opacity: 0.85 } : null]}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Text style={styles.heroBackText}>←</Text>
        </Pressable>
        <Text style={styles.heroEmoji}>{meta.emoji}</Text>
        <Text style={styles.heroName}>{meta.name}</Text>
        <Text style={styles.heroCountry}>
          {meta.country} · {meta.region}
        </Text>
        <View style={styles.heroTags}>
          {meta.tags.map((tag) => (
            <View key={tag} style={styles.heroTag}>
              <Text style={styles.heroTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </HeroGradient>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Ne yapmak istersin?</Text>

        {FEATURES.map((feat) => (
          <Pressable
            key={feat.key}
            onPress={() => handleFeature(feat.key)}
            style={({ pressed }) => [styles.featCard, pressed ? { opacity: 0.92 } : null]}
          >
            <View style={[styles.featAccent, { backgroundColor: feat.accentColor }]} />
            <View style={[styles.featIcon, { backgroundColor: feat.bgColor }]}>
              <Text style={styles.featIconText}>{feat.emoji}</Text>
            </View>
            <View style={styles.featBody}>
              <Text style={styles.featTitle}>{feat.title}</Text>
              <Text style={styles.featDesc}>{feat.desc}</Text>
            </View>
            <Text style={styles.featArrow}>›</Text>
          </Pressable>
        ))}

        <View style={styles.highlights}>
          <Text style={styles.highlightsTitle}>{meta.name}&apos;da Öne Çıkanlar</Text>
          {meta.highlights.map((hl, index) => (
            <View
              key={hl.name}
              style={[styles.hlRow, index === meta.highlights.length - 1 ? styles.hlRowLast : null]}
            >
              <View style={styles.hlIcon}>
                <Text style={styles.hlIconText}>{hl.icon}</Text>
              </View>
              <View style={styles.hlInfo}>
                <Text style={styles.hlName}>{hl.name}</Text>
                <Text style={styles.hlType}>{hl.type}</Text>
              </View>
              <View style={[styles.hlBadge, { backgroundColor: hl.badgeColor }]}>
                <Text style={styles.hlBadgeText}>{hl.badge}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    minHeight: 240,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    justifyContent: "flex-end",
  },
  heroBack: {
    position: "absolute",
    top: theme.spacing.lg,
    left: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBackText: {
    fontSize: 20,
    color: theme.colors.surface,
    fontWeight: "600",
  },
  heroEmoji: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  heroName: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.surface,
    textAlign: "center",
  },
  heroCountry: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: theme.spacing.sm,
  },
  heroTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  heroTag: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroTagText: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: theme.spacing.xs,
  },
  featCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    marginBottom: theme.spacing.xs,
  },
  featAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  featIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  featIconText: {
    fontSize: 22,
  },
  featBody: {
    flex: 1,
    gap: 2,
  },
  featTitle: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  featDesc: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 12.5,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  featArrow: {
    fontSize: 22,
    color: theme.colors.border,
    fontWeight: "300",
  },
  highlights: {
    marginTop: theme.spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  highlightsTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  hlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  hlRowLast: {
    borderBottomWidth: 0,
  },
  hlIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  hlIconText: {
    fontSize: 18,
  },
  hlInfo: {
    flex: 1,
    gap: 2,
  },
  hlName: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  hlType: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  hlBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hlBadgeText: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
});
