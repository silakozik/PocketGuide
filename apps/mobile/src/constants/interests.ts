export const PROFILE_INTERESTS = [
  { id: "art", label: "Sanat", icon: "🎨" },
  { id: "gastronomy", label: "Gastronomi", icon: "🍽️" },
  { id: "history", label: "Tarih", icon: "🏛️" },
  { id: "nature", label: "Doğa", icon: "🌲" },
  { id: "nightlife", label: "Gece Hayatı", icon: "🍸" },
  { id: "shopping", label: "Alışveriş", icon: "🛍️" },
  { id: "architecture", label: "Mimari", icon: "🏢" },
  { id: "music_events", label: "Müzik & Etkinlik", icon: "🎵" },
] as const;

export const INTERESTS_STORAGE_KEY = "pg_user_interests";
