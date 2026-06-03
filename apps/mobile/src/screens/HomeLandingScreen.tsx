import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { HOME_CITIES, LAST_CITY_STORAGE_KEY, TICKER_CITIES } from "@/src/constants/homeCities";
import { PLACE_CATEGORIES } from "@/src/constants/placeCategories";
import { resolveCitySlug } from "@/src/lib/citySlug";
import { geocodeCity } from "@/src/lib/geocode";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

type FeatureRoute =
  | { type: "path"; path: "/map" | "/transfer" | "/first-day" | "/search" }
  | { type: "map-city"; slug: string }
  | { type: "place"; slug: string; title: string };

const FEATURES: {
  key: string;
  title: string;
  desc: string;
  emoji: string;
  bgColor: string;
  route: FeatureRoute;
}[] = [
  {
    key: "route",
    title: "Akıllı Rota Planlama",
    desc: "İlgi alanlarına göre AI tarafından optimize edilmiş günlük rotalar.",
    emoji: "🗺",
    bgColor: "#ecfdf5",
    route: { type: "map-city", slug: "istanbul" },
  },
  {
    key: "transfer",
    title: "Metro & Ulaşım Rehberi",
    desc: "Karmaşık toplu taşıma ağlarını sade şemalara dönüştürür.",
    emoji: "🚇",
    bgColor: "#eff6ff",
    route: { type: "path", path: "/transfer" },
  },
  {
    key: "food",
    title: "Gastronomi Önerileri",
    desc: "Yerel favori mekanlar ve konumuna en yakın lezzetler.",
    emoji: "🍜",
    bgColor: "#fff7ed",
    route: { type: "place", slug: "food", title: "Restoranlar" },
  },
  {
    key: "first-day",
    title: "İlk Gün Rehberi",
    desc: "SIM kart, ulaşım kartı, ATM — adaptasyon adımlarını geç.",
    emoji: "📋",
    bgColor: "#fffbe6",
    route: { type: "path", path: "/first-day" },
  },
  {
    key: "events",
    title: "Anlık Etkinlik Takibi",
    desc: "Konser, pazar, festival — bulunduğun bölgede ne var?",
    emoji: "⚡",
    bgColor: "#fdf4ff",
    route: { type: "path", path: "/search" },
  },
  {
    key: "offline",
    title: "Offline Erişim",
    desc: "İnternet olmasa da rotanı takip edebilir, haritayı görebilirsin.",
    emoji: "📡",
    bgColor: "#f0fdf4",
    route: { type: "path", path: "/map" },
  },
];

const STATS = [
  { value: "120+", label: "Aktif Şehir", icon: "🌍" },
  { value: "500K+", label: "Kullanıcı", icon: "👤" },
  { value: "2.1M", label: "Planlanan Rota", icon: "🗺" },
  { value: "4.9", label: "App Store", icon: "⭐" },
] as const;

const TESTIMONIALS = [
  {
    name: "Zeynep K.",
    location: "İstanbul → Tokyo",
    text: "Tokyo metrosunda kaybolmadan gezdim. İlk günü tapınakta geçirdim.",
    avatar: "🧑‍💻",
  },
  {
    name: "Emre T.",
    location: "Berlin → Barselona",
    text: "AI rota önerisiyle yerel pazarda tapas yedim. En iyi seyahat kararım.",
    avatar: "🎒",
  },
  {
    name: "Lina M.",
    location: "Amsterdam → Atina",
    text: "Offline haritalar hayat kurtardı. Artık Google'a bağımlı değilim.",
    avatar: "✈️",
  },
] as const;

const STEPS = [
  { n: "1", title: "Şehrini Seç", text: "Ziyaret edeceğin şehri gir; PocketGuide yükler." },
  { n: "2", title: "İlgi Alanlarını Belirle", text: "Tarih, sanat, yeme-içme — AI kişiselleştirir." },
  { n: "3", title: "Rotanı Al", text: "Optimize günlük planın hazır; düzenle veya kullan." },
  { n: "4", title: "Keşfe Çık", text: "Offline çalışır; sadece git ve keşfet." },
] as const;

const PLANS = [
  {
    name: "Gezgin",
    price: "Ücretsiz",
    period: "",
    desc: "Tek şehir, temel özellikler",
    perks: ["1 şehir rehberi", "Temel rota", "İlk gün rehberi", "Offline haritalar"],
    highlight: false,
  },
  {
    name: "Kaşif",
    price: "₺79",
    period: "/ ay",
    desc: "Sınırsız şehir, AI destekli",
    perks: ["Sınırsız şehir", "AI rota", "Etkinlikler", "Metro rehberi", "Gastronomi"],
    highlight: true,
  },
  {
    name: "Profesyonel",
    price: "₺149",
    period: "/ ay",
    desc: "Takım & iş seyahatleri",
    perks: ["Kaşif özellikleri", "Takım paylaşımı", "API", "7/24 destek"],
    highlight: false,
  },
] as const;

const ITINERARY_STOPS = [
  { time: "09:00", name: "Ayasofya", chip: "Kültür", active: true },
  { time: "11:30", name: "Topkapı Sarayı", chip: "Kültür", active: false },
  { time: "13:30", name: "Karaköy'de Öğle", chip: "Yemek", active: false },
  { time: "15:00", name: "Galata Kulesi", chip: "Keşif", active: false },
] as const;

const GRID_GAP = theme.spacing.sm;
const SCREEN_W = Dimensions.get("window").width;
const CITY_CARD_W = (SCREEN_W - theme.spacing.md * 2 - GRID_GAP) / 2;

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  dark,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, dark && styles.eyebrowDark]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.sectionTitle, dark && styles.sectionTitleDark]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSub, dark && styles.sectionSubDark]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

type HomeLandingScreenProps = {
  /** Sekme içinde kullanıldığında alt navigasyon zaten mevcut */
  embeddedInTabs?: boolean;
};

export function HomeLandingScreen({ embeddedInTabs = false }: HomeLandingScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const [cityQuery, setCityQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const goMapWithCity = useCallback(
    async (slug: string) => {
      await AsyncStorage.setItem(LAST_CITY_STORAGE_KEY, slug);
      router.push({ pathname: "/map", params: { city: slug } } as never);
    },
    [router],
  );

  const handleHeroSearch = async () => {
    const q = cityQuery.trim();
    if (!q) {
      setSearchError("Lütfen bir şehir girin.");
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const slug = resolveCitySlug(q);
      if (slug) {
        await goMapWithCity(slug);
        return;
      }
      const place = await geocodeCity(q);
      if (!place) {
        setSearchError("Şehir bulunamadı. Yazımı kontrol edip tekrar deneyin.");
        return;
      }
      router.push({
        pathname: "/map",
        params: {
          lat: String(place.lat),
          lng: String(place.lng),
          name: place.displayName,
        },
      } as never);
    } finally {
      setSearching(false);
    }
  };

  const goPlaceCategory = async (slug: string) => {
    const stored = await AsyncStorage.getItem(LAST_CITY_STORAGE_KEY);
    router.push({
      pathname: "/search",
      params: { q: slug, city: stored ?? "istanbul" },
    } as never);
  };

  const goFeature = async (route: FeatureRoute) => {
    if (route.type === "path") {
      router.push(route.path);
      return;
    }
    if (route.type === "map-city") {
      await goMapWithCity(route.slug);
      return;
    }
    await goPlaceCategory(route.slug);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingBottom: insets.bottom + theme.spacing.xl + (embeddedInTabs ? 72 : 0),
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Üst bar — web Nav karşılığı; sekme başlığı kapalı */}
      <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.sm }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>PocketGuide</Text>
        </View>
        {!authLoading && !user ? (
          <View style={styles.topAuth}>
            <Pressable onPress={() => router.push("/login" as never)} hitSlop={8}>
              <Text style={styles.topLogin}>Giriş</Text>
            </Pressable>
            <Pressable
              style={styles.topRegister}
              onPress={() => router.push("/register" as never)}
            >
              <Text style={styles.topRegisterText}>Kayıt ol</Text>
            </Pressable>
          </View>
        ) : !authLoading && user ? (
          <Pressable
            style={styles.avatar}
            onPress={() => router.push("/profile" as never)}
          >
            <Text style={styles.avatarLetter}>
              {user.userName?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </Pressable>
        ) : (
          <ActivityIndicator size="small" color={theme.colors.accent} />
        )}
      </View>

      {!embeddedInTabs ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickNav}
        >
          {[
            { label: "Harita", path: "/map" as const },
            { label: "Transfer", path: "/transfer" as const },
            { label: "Rota", path: "/map" as const },
            { label: "Arama", path: "/search" as const },
            { label: "İlk Gün", path: "/first-day" as const },
          ].map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(item.path)}
            >
              <Text style={styles.quickChipText}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <View style={styles.badgeDot} />
          <Text style={styles.heroBadgeText}>
            Yapay Zeka Destekli Şehir Asistanı · Dünya genelinde şehirler
          </Text>
        </View>
        <Text style={styles.heroTitle}>
          Gittiğin şehri{"\n"}
          <Text style={styles.heroTitleEm}>ilk günden</Text> bil.
        </Text>
        <Text style={styles.heroSub}>
          Rota planlaması, metro rehberi, gastronomi önerileri ve anlık etkinlikler — hepsi tek
          yerde, sana özel.
        </Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Hangi şehri keşfetmek istiyorsun?"
            placeholderTextColor={theme.colors.textMuted}
            value={cityQuery}
            onChangeText={(v) => {
              setCityQuery(v);
              if (searchError) setSearchError(null);
            }}
            editable={!searching}
            returnKeyType="search"
            onSubmitEditing={handleHeroSearch}
          />
        </View>
        {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}
        <Pressable
          style={({ pressed }) => [
            styles.searchBtn,
            pressed && { opacity: 0.9 },
            searching && { opacity: 0.7 },
          ]}
          onPress={handleHeroSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator color={theme.colors.textPrimary} />
          ) : (
            <Text style={styles.searchBtnText}>Rotanı Oluştur →</Text>
          )}
        </Pressable>
        <View style={styles.heroHints}>
          {["Ücretsiz başla", "Kredi kartı gerekmez", "Offline çalışır"].map((hint) => (
            <View key={hint} style={styles.heroHintItem}>
              <View style={styles.heroHintDot} />
              <Text style={styles.heroHintText}>{hint}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Dashboard önizleme */}
      <View style={styles.sectionPad}>
        <View style={styles.previewCard}>
          <View style={styles.previewBar}>
            <View style={styles.browserDots}>
              <View style={[styles.dot, { backgroundColor: "#ff5f57" }]} />
              <View style={[styles.dot, { backgroundColor: "#febc2e" }]} />
              <View style={[styles.dot, { backgroundColor: "#28c840" }]} />
            </View>
            <Text style={styles.previewUrl} numberOfLines={1}>
              İstanbul · Gün 1 / 4
            </Text>
          </View>
          <View style={styles.previewBody}>
            <View style={styles.previewCityRow}>
              <Text style={styles.previewFlag}>🇹🇷</Text>
              <View>
                <Text style={styles.previewCityName}>İstanbul</Text>
                <Text style={styles.previewCityMeta}>14–17 Mar · 4 gün</Text>
              </View>
            </View>
            {ITINERARY_STOPS.map((stop) => (
              <View key={stop.name} style={styles.stopRow}>
                <View style={styles.stopTimeline}>
                  <View style={[styles.stopDot, stop.active && styles.stopDotOn]} />
                </View>
                <View style={styles.stopBody}>
                  <Text style={styles.stopTime}>{stop.time}</Text>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopChip}>{stop.chip}</Text>
                </View>
              </View>
            ))}
            <View style={styles.previewStats}>
              {[
                { n: "6", l: "Durak" },
                { n: "8.2", l: "km" },
                { n: "11s", l: "Süre" },
              ].map((s) => (
                <View key={s.l} style={styles.previewStat}>
                  <Text style={styles.previewStatNum}>{s.n}</Text>
                  <Text style={styles.previewStatLbl}>{s.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Şehirler */}
      <View style={styles.sectionPad}>
        <SectionHeader
          title="Şehirleri Keşfet"
          subtitle="Dünyanın en ikonik şehirlerine göz at — rotanı planlamaya hazır ol."
        />
        <View style={styles.citiesGrid}>
          {HOME_CITIES.map((city) => (
            <Pressable
              key={city.slug}
              style={({ pressed }) => [
                styles.cityCard,
                { width: CITY_CARD_W },
                pressed && { opacity: 0.92 },
              ]}
              onPress={() => router.push(`/${city.slug}` as never)}
            >
              <View style={[styles.cityCardImg, { backgroundColor: city.color }]}>
                <Text style={styles.cityEmoji}>{city.emoji}</Text>
              </View>
              <View style={styles.cityCardBody}>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.cityCountry}>{city.country}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Mekanlar */}
      <View style={styles.sectionPad}>
        <SectionHeader
          title="Mekanları Keşfet"
          subtitle="Restoranlardan tarihi mekanlara — şehrini seç, listele, haritada gör."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.placesRow}
        >
          {PLACE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.slug}
              style={({ pressed }) => [styles.placeCard, pressed && { opacity: 0.92 }]}
              onPress={() => goPlaceCategory(cat.slug)}
            >
              <View style={[styles.placeCardImg, { backgroundColor: cat.color }]}>
                <Text style={styles.placeEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={styles.placeTitle}>{cat.title}</Text>
              <Text style={styles.placeSub}>{cat.subtitle}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.attribution}>
          Mekan verileri Foursquare üzerinden sağlanır.
        </Text>
      </View>

      {/* Ticker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.ticker}
        contentContainerStyle={styles.tickerContent}
      >
        {[...TICKER_CITIES, ...TICKER_CITIES].map((c, i) => (
          <View key={`${c.name}-${i}`} style={styles.tickItem}>
            <Text style={styles.tickFlag}>{c.flag}</Text>
            <Text style={styles.tickName}>{c.name}</Text>
            <Text style={styles.tickSep}> · </Text>
          </View>
        ))}
      </ScrollView>

      {/* Özellikler */}
      <View style={styles.sectionPad}>
        <View style={styles.sectionHeader}>
          <Text style={styles.eyebrow}>Özellikler</Text>
          <Text style={styles.sectionTitle}>
            Tek uygulama,{"\n"}
            <Text style={styles.heroTitleEm}>sonsuz keşif.</Text>
          </Text>
        </View>
        <View style={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <Pressable
              key={f.key}
              style={({ pressed }) => [
                styles.featureCard,
                { backgroundColor: f.bgColor },
                pressed && { opacity: 0.92 },
              ]}
              onPress={() => goFeature(f.route)}
            >
              <Text style={styles.featureIcon}>{f.emoji}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Sosyal kanıt */}
      <View style={styles.sectionPad}>
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
        <SectionHeader
          eyebrow="Kullanıcılarımız"
          title="Gerçek gezginler, gerçek deneyimler."
        />
        {TESTIMONIALS.map((t) => (
          <View key={t.name} style={styles.testimonial}>
            <View style={styles.testimonialTop}>
              <Text style={styles.testimonialAvatar}>{t.avatar}</Text>
              <View>
                <Text style={styles.testimonialName}>{t.name}</Text>
                <Text style={styles.testimonialLoc}>{t.location}</Text>
              </View>
            </View>
            <Text style={styles.testimonialText}>"{t.text}"</Text>
            <Text style={styles.testimonialStars}>★★★★★</Text>
          </View>
        ))}
      </View>

      {/* Ulaşım */}
      <View style={[styles.sectionPad, styles.transitSection]}>
        <SectionHeader
          eyebrow="Ulaşım"
          title="Metro kaotik olmak zorunda değil."
          subtitle="Tokyo, Londra veya İstanbul — adım adım rehberlik."
          dark
        />
        <View style={styles.metroBox}>
          <View style={styles.metroTop}>
            <Text style={styles.metroCity}>İstanbul Metro</Text>
            <Text style={styles.metroLive}>Canlı</Text>
          </View>
          <View style={styles.metroLines}>
            <View style={[styles.metroLine, { backgroundColor: "#e8c547" }]} />
            <View style={[styles.metroLine, { backgroundColor: "#4a8fd4", marginTop: 20 }]} />
            <View style={[styles.metroLineV, { backgroundColor: "#2ecc8a" }]} />
          </View>
          <Text style={styles.metroStep}>
            <Text style={styles.metroStepBold}>Osmanbey → Taksim</Text> · M1 ile 4 dk, M2 aktarma
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.9 }]}
          onPress={() => router.push("/transfer")}
        >
          <Text style={styles.linkBtnText}>Transfer rehberine git →</Text>
        </Pressable>
      </View>

      {/* Nasıl çalışır */}
      <View style={styles.sectionPad}>
        <SectionHeader eyebrow="Nasıl Çalışır" title="Dört adımda hazırsın." />
        {STEPS.map((step) => (
          <View key={step.n} style={styles.stepCard}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNum}>{step.n}</Text>
            </View>
            <View style={styles.stepTextWrap}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Fiyatlar */}
      <View style={styles.sectionPad}>
        <SectionHeader eyebrow="Fiyatlar" title="Her gezgin için uygun plan." />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pricingRow}
        >
          {PLANS.map((plan) => (
            <View
              key={plan.name}
              style={[styles.pricingCard, plan.highlight && styles.pricingHighlight]}
            >
              {plan.highlight ? (
                <Text style={styles.pricingBadge}>En Popüler</Text>
              ) : null}
              <Text style={styles.pricingName}>{plan.name}</Text>
              <Text style={styles.pricingPrice}>
                {plan.price}
                {plan.period ? (
                  <Text style={styles.pricingPeriod}>{plan.period}</Text>
                ) : null}
              </Text>
              <Text style={styles.pricingDesc}>{plan.desc}</Text>
              {plan.perks.map((f) => (
                <Text key={f} style={styles.pricingFeature}>
                  ✓ {f}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* CTA */}
      <View style={styles.sectionPad}>
        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>
            Bir sonraki şehrin{"\n"}
            <Text style={styles.heroTitleEm}>seni bekliyor.</Text>
          </Text>
          <Text style={styles.ctaSub}>İlk şehrin tamamen ücretsiz. Kredi kartı gerekmez.</Text>
          <Pressable
            style={({ pressed }) => [styles.ctaPrimary, pressed && { opacity: 0.9 }]}
            onPress={() => router.push("/onboarding" as never)}
          >
            <Text style={styles.ctaPrimaryText}>🚀 Ücretsiz Başla</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.ctaOutline, pressed && { opacity: 0.9 }]}
            onPress={() => goMapWithCity("istanbul")}
          >
            <Text style={styles.ctaOutlineText}>Haritayı Keşfet →</Text>
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>PocketGuide</Text>
        </View>
        <Text style={styles.footerCopy}>© 2026 PocketGuide</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  logoText: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  topAuth: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  topLogin: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  topRegister: {
    backgroundColor: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  topRegisterText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: theme.colors.surface,
    fontWeight: "800",
    fontSize: 14,
  },
  quickNav: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  quickChip: {
    ...presets.chip,
    marginRight: theme.spacing.xs,
  },
  quickChipText: {
    ...presets.chipText,
    fontSize: 13,
  },
  hero: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.lg,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ecc8a",
  },
  heroBadgeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    flexShrink: 1,
  },
  heroTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "300",
    color: theme.colors.textPrimary,
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: theme.spacing.sm,
  },
  heroTitleEm: {
    fontStyle: "italic",
    color: theme.colors.accent,
    fontWeight: "400",
  },
  heroSub: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    maxWidth: 340,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    width: "100%",
    marginBottom: theme.spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  searchError: {
    color: theme.colors.danger,
    fontSize: 13,
    marginBottom: theme.spacing.xs,
    alignSelf: "flex-start",
  },
  searchBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    width: "100%",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  searchBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  heroHints: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  heroHintItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroHintDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.textMuted,
  },
  heroHintText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  sectionPad: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: theme.colors.accent,
  },
  eyebrowDark: {
    color: theme.colors.accent,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    lineHeight: 30,
  },
  sectionTitleDark: {
    color: theme.colors.surface,
  },
  sectionSub: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  sectionSubDark: {
    color: "rgba(255,255,255,0.75)",
  },
  previewCard: {
    ...presets.card,
    padding: 0,
    overflow: "hidden",
  },
  previewBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: "#eef1f6",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  browserDots: {
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewUrl: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  previewBody: {
    padding: theme.spacing.md,
  },
  previewCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  previewFlag: {
    fontSize: 28,
  },
  previewCityName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  previewCityMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  stopRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
  },
  stopTimeline: {
    width: 20,
    alignItems: "center",
    paddingTop: 4,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  stopDotOn: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  stopBody: {
    flex: 1,
    gap: 2,
  },
  stopTime: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  stopName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  stopChip: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  previewStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  previewStat: {
    alignItems: "center",
  },
  previewStatNum: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  previewStatLbl: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  citiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  cityCard: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  cityCardImg: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  cityEmoji: {
    fontSize: 40,
  },
  cityCardBody: {
    padding: theme.spacing.sm,
    gap: 2,
  },
  cityName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  cityCountry: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  placesRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  placeCard: {
    width: 140,
    ...presets.card,
    padding: theme.spacing.sm,
  },
  placeCardImg: {
    height: 72,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xs,
  },
  placeEmoji: {
    fontSize: 32,
  },
  placeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  placeSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  attribution: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  ticker: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.textPrimary,
  },
  tickerContent: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  tickItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tickFlag: {
    fontSize: 14,
    marginRight: 4,
  },
  tickName: {
    color: theme.colors.surface,
    fontWeight: "700",
    fontSize: 13,
  },
  tickSep: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  featureCard: {
    width: "47%",
    ...presets.card,
    gap: theme.spacing.xs,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    width: "47%",
    ...presets.card,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  testimonial: {
    ...presets.card,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  testimonialTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  testimonialAvatar: {
    fontSize: 28,
  },
  testimonialName: {
    fontWeight: "700",
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  testimonialLoc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  testimonialText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  testimonialStars: {
    color: theme.colors.accent,
    fontSize: 14,
  },
  transitSection: {
    backgroundColor: theme.colors.textPrimary,
    marginHorizontal: 0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderRadius: 0,
  },
  metroBox: {
    backgroundColor: "#0d1829",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  metroCity: {
    color: theme.colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },
  metroLive: {
    color: "#2ecc8a",
    fontSize: 12,
    fontWeight: "600",
  },
  metroLines: {
    height: 80,
    marginBottom: theme.spacing.md,
    position: "relative",
  },
  metroLine: {
    height: 4,
    borderRadius: 2,
    width: "100%",
  },
  metroLineV: {
    position: "absolute",
    width: 4,
    height: "70%",
    left: "48%",
    top: 0,
    borderRadius: 2,
  },
  metroStep: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 19,
  },
  metroStepBold: {
    fontWeight: "700",
    color: theme.colors.surface,
  },
  linkBtn: {
    alignSelf: "flex-start",
  },
  linkBtnText: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  stepCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...presets.card,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  stepTextWrap: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  stepText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  pricingRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  pricingCard: {
    width: 260,
    ...presets.card,
    gap: theme.spacing.xs,
  },
  pricingHighlight: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  pricingBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  pricingName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  pricingPeriod: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  pricingDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  pricingFeature: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  ctaBox: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.md,
  },
  ctaTitle: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: theme.colors.surface,
    textAlign: "center",
  },
  ctaSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  ctaPrimary: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    width: "100%",
    alignItems: "center",
  },
  ctaPrimaryText: {
    fontWeight: "800",
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  ctaOutline: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
    width: "100%",
    alignItems: "center",
  },
  ctaOutlineText: {
    color: theme.colors.surface,
    fontWeight: "600",
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  footerCopy: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
