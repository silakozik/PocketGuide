import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE, resources, SUPPORTED_LANGUAGES } from "@pocketguide/i18n";

const LANGUAGE_STORAGE_KEY = "pg_language";

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

export async function hydrateLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!saved) return;
    if (SUPPORTED_LANGUAGES.includes(saved as any)) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // no-op
  }
}

export async function setAppLanguage(lng: string) {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
}

export { LANGUAGE_STORAGE_KEY };
export default i18n;

