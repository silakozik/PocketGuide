/** Rota planlayıcı ile aynı 10 şehir */
export const TRANSFER_CITIES = [
  { id: "istanbul", nameTr: "İstanbul", nameEn: "Istanbul", emoji: "🕌" },
  { id: "paris", nameTr: "Paris", nameEn: "Paris", emoji: "🗼" },
  { id: "tokyo", nameTr: "Tokyo", nameEn: "Tokyo", emoji: "🏯" },
  { id: "londra", nameTr: "Londra", nameEn: "London", emoji: "🎡" },
  { id: "roma", nameTr: "Roma", nameEn: "Rome", emoji: "🏛️" },
  { id: "barcelona", nameTr: "Barcelona", nameEn: "Barcelona", emoji: "🌊" },
  { id: "dubai", nameTr: "Dubai", nameEn: "Dubai", emoji: "🏙️" },
  { id: "amsterdam", nameTr: "Amsterdam", nameEn: "Amsterdam", emoji: "🚲" },
  { id: "sydney", nameTr: "Sydney", nameEn: "Sydney", emoji: "🦘" },
  { id: "new-york", nameTr: "New York", nameEn: "New York", emoji: "🗽" },
] as const;

export type TransferCityName = (typeof TRANSFER_CITIES)[number]["nameTr"];
