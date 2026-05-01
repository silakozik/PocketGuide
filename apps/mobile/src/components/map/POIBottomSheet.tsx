import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import type { POI } from "@/src/types/poi";
import { PIN_COLORS, PIN_ICONS } from "@/src/constants/mapConfig";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

export type POIBottomSheetProps = {
  poi: POI;
  onClose: () => void;
  poiList?: POI[];
  isInDraft?: (poi: POI) => boolean;
  isSaved?: (poi: POI) => boolean;
  onToggleDraft?: (poi: POI) => void;
  onToggleSave?: (poi: POI) => void;
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

export function POIBottomSheet({
  poi,
  onClose,
  poiList,
  isInDraft,
  isSaved,
  onToggleDraft,
  onToggleSave,
}: POIBottomSheetProps) {
  const { t } = useTranslation();
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
    if (activePoi.isOpen === undefined) return { label: t("mobile.unknownStatus"), style: styles.badgeUnknown };
    if (activePoi.isOpen) return { label: t("mobile.open"), style: styles.badgeOpen };
    return { label: t("mobile.closed"), style: styles.badgeClosed };
  }, [activePoi.isOpen, t]);

  const ratingText = useMemo(() => {
    if (activePoi.rating === undefined) return "—";
    const r = Number(activePoi.rating);
    if (Number.isNaN(r)) return "—";
    return `${r.toFixed(1)}`;
  }, [activePoi.rating]);
  const inDraft = isInDraft?.(activePoi) ?? false;
  const saved = isSaved?.(activePoi) ?? false;

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
            <Text style={styles.distanceLabel}>{t("mobile.distance")}:</Text>
            <Text style={styles.distanceValue}>
              {activePoi.distance === undefined ? "—" : `${activePoi.distance.toFixed(1)} km`}
            </Text>
          </View>

          {activePoi.description ? (
            <Text style={styles.description}>{activePoi.description}</Text>
          ) : (
            <Text style={styles.descriptionFallback}>{t("mobile.noDescription")}</Text>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => onToggleDraft?.(activePoi)}>
              <Text style={styles.actionText}>{inDraft ? t("mobile.removeFromRoute") : t("mobile.addToRoute")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => onToggleSave?.(activePoi)}>
              <Text style={styles.actionText}>{saved ? t("mobile.saved") : t("mobile.savePlace")}</Text>
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
    backgroundColor: theme.colors.overlay,
    zIndex: 998,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },

  header: {
    paddingHorizontal: theme.spacing.md,
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
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
    fontWeight: "800",
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaText: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
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
    color: theme.colors.surface,
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
    borderBottomColor: theme.colors.border,
  },
  poiChip: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(26,35,64,0.06)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  poiChipSelected: {
    backgroundColor: "rgba(26,35,64,0.16)",
  },
  poiChipEmoji: {
    fontSize: 16,
  },
  poiChipText: {
    maxWidth: 160,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },

  content: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  distanceLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  distanceValue: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    fontWeight: "800",
  },
  description: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "400",
    marginBottom: 16,
  },
  descriptionFallback: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: "500",
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  actionButton: {
    ...presets.primaryButton,
    flex: 1,
  },
  actionText: {
    ...presets.primaryButtonText,
  },
});

