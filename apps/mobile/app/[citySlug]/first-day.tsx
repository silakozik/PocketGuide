import { useLocalSearchParams, useRouter } from "expo-router";

import { FirstDayGuideScreen } from "@/src/screens/FirstDayGuideScreen";

export default function FirstDayCityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ citySlug?: string }>();
  const citySlug = params.citySlug ?? "istanbul";

  return <FirstDayGuideScreen citySlug={String(citySlug)} onBack={() => router.back()} />;
}
