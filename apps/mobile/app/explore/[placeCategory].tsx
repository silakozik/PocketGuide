import { useLocalSearchParams, useRouter } from "expo-router";

import { PlacesExploreScreen } from "@/src/screens/PlacesExploreScreen";

function paramStr(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : "";
}

export default function ExploreCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ placeCategory?: string; city?: string }>();
  const placeCategory = paramStr(params.placeCategory);
  const city = paramStr(params.city) || undefined;

  return (
    <PlacesExploreScreen
      placeCategory={placeCategory}
      initialCity={city}
      onBack={() => router.back()}
    />
  );
}
