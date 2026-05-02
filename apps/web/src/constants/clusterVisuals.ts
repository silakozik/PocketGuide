/** İstenilen ölçek: küçük (10–50), orta (51–200), büyük (200+) — count üstünden seçilir */
export type ClusterTier = "small" | "medium" | "large";

export function clusterCountTier(pointCount: number): ClusterTier {
  if (pointCount >= 200) return "large";
  if (pointCount >= 51) return "medium";
  return "small";
}

export const CLUSTER_TIER_DIMENSIONS_PX = {
  small: 42,
  medium: 54,
  large: 66,
} as const;

/** Küme dolgu tonları — zoom kümesinden bağımsız okunabilir kontrast */
export const CLUSTER_TIER_FILL = {
  small: "#1d9e75",
  medium: "#185fa5",
  large: "#3c3489",
} as const;
