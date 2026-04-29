import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import type { POI } from "@/src/types/poi";
import { PIN_COLORS, PIN_ICONS } from "@/src/constants/mapConfig";

export type POIBottomSheetProps = {
  poi: POI;
  onClose: () => void;
  poiList?: POI[];
};

function getHeaderStyle(category: POI["category"]) {
  switch (category) {
    case "restaurant":
      return styles.headerRestaurant;
    case "museum":
      return styles.headerMuseum;
    case "transport":
      return styles.headerTransport;
    case "event":
      return styles.headerEvent;
    case "hotel":
      return styles.headerHotel;
    default:
      return styles.headerRestaurant;
  }
}

export function POIBottomSheet({ poi, onClose, poiList }: POIBottomSheetProps) {
  const [activePoi, setActivePoi] = useState(poi);

  useEffect(() => {
    setActivePoi(poi);
  }, [poi.id]);

  const translateY = useSharedValue(60);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const headerStyle = useMemo(() => getHeaderStyle(activePoi.category), [activePoi.category]);
  const emoji = PIN_ICONS[activePoi.category];

  const openBadge = useMemo(() => {
    if (activePoi.isOpen === undefined) return { label: "Durum Yok", style: styles.badgeUnknown };
    if (activePoi.isOpen) return { label: "Açık", style: styles.badgeOpen };
    return { label: "Kapalı", style: styles.badgeClosed };
  }, [activePoi.isOpen]);

  const ratingText = useMemo(() => {
    if (activePoi.rating === undefined) return "—";
    const r = Number(activePoi.rating);
    if (Number.isNaN(r)) return "—";
    return `${r.toFixed(1)}`;
  }, [activePoi.rating]);

  return (
    <>
      <Pressable style={styles.overlay} onPress={onClose} />

      <Animated.View style={[styles.sheet, animatedStyle]}>
        {poiList && poiList.length > 0 && (
          <View style={styles.poiListWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {poiList.map((p) => {
                const selected = p.id === activePoi.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.poiChip, selected ? styles.poiChipSelected : null]}
                    onPress={() => setActivePoi(p)}
                  >
                    <Text style={styles.poiChipEmoji}>{PIN_ICONS[p.category]}</Text>
                    <Text style={styles.poiChipText} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerInner}>
            <Text style={styles.headerEmoji}>{emoji}</Text>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>{activePoi.name}</Text>
              <View style={styles.headerMetaRow}>
                <View style={[styles.badgeBase, openBadge.style]}>
                  <Text style={styles.badgeText}>{openBadge.label}</Text>
                </View>
                <Text style={styles.metaText}>★ {ratingText}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.distanceRow}>
            <Text style={styles.distanceLabel}>Mesafe:</Text>
            <Text style={styles.distanceValue}>
              {activePoi.distance === undefined ? "—" : `${activePoi.distance.toFixed(1)} km`}
            </Text>
          </View>

          {activePoi.description ? (
            <Text style={styles.description}>{activePoi.description}</Text>
          ) : (
            <Text style={styles.descriptionFallback}>Açıklama yok.</Text>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
              <Text style={styles.actionText}>Rota Al</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
              <Text style={styles.actionText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 998,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerEmoji: {
    fontSize: 26,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
  },
  headerRestaurant: { backgroundColor: PIN_COLORS.restaurant },
  headerMuseum: { backgroundColor: PIN_COLORS.museum },
  headerTransport: { backgroundColor: PIN_COLORS.transport },
  headerEvent: { backgroundColor: PIN_COLORS.event },
  headerHotel: { backgroundColor: PIN_COLORS.hotel },

  badgeBase: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  badgeOpen: {
    backgroundColor: "rgba(29, 158, 117, 0.35)",
  },
  badgeClosed: {
    backgroundColor: "rgba(216, 90, 48, 0.35)",
  },
  badgeUnknown: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },

  poiListWrap: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  poiChip: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  poiChipSelected: {
    backgroundColor: "rgba(29, 158, 117, 0.16)",
  },
  poiChipEmoji: {
    fontSize: 16,
  },
  poiChipText: {
    maxWidth: 160,
    fontSize: 12,
    fontWeight: "700",
  },

  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  distanceLabel: {
    fontSize: 13,
    color: "#5B6B84",
    fontWeight: "700",
  },
  distanceValue: {
    fontSize: 15,
    color: "#0F1F3D",
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    color: "#0F1F3D",
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 16,
  },
  descriptionFallback: {
    fontSize: 14,
    color: "#7B8AA8",
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#0F1F3D",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});

