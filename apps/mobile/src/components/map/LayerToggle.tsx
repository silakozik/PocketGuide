import { StyleSheet, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { theme } from "@/src/theme/tokens";

export type LayerToggleProps = {
  layers: {
    pins: boolean;
    route: boolean;
    heatmap: boolean;
  };
  onChange: (layers: { pins: boolean; route: boolean; heatmap: boolean }) => void;
};

function LayerRow({
  label,
  dotStyle,
  trackColorTrue,
  value,
  onValueChange,
}: {
  label: string;
  dotStyle: object;
  trackColorTrue: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, dotStyle]} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "rgba(26,35,64,0.2)", true: trackColorTrue }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );
}

export function LayerToggle({ layers, onChange }: LayerToggleProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <LayerRow
        label={t("nav.map")}
        dotStyle={styles.dotPins}
        trackColorTrue="#1D9E75"
        value={layers.pins}
        onValueChange={(pins) => onChange({ ...layers, pins })}
      />
      <LayerRow
        label={t("mobile.startRoute")}
        dotStyle={styles.dotRoute}
        trackColorTrue="#185FA5"
        value={layers.route}
        onValueChange={(route) => onChange({ ...layers, route })}
      />
      <LayerRow
        label="Heatmap"
        dotStyle={styles.dotHeatmap}
        trackColorTrue="#BA7517"
        value={layers.heatmap}
        onValueChange={(heatmap) => onChange({ ...layers, heatmap })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    zIndex: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  dotPins: { backgroundColor: "#1D9E75" },
  dotRoute: { backgroundColor: "#185FA5" },
  dotHeatmap: { backgroundColor: "#BA7517" },
});

