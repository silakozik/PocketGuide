import { POI } from '../types/poi';

export const MOCK_POIS: POI[] = [
  {
    id: "harput-calesi",
    name: "Harput Kalesi",
    category: "museum",
    coordinate: { lat: 38.6329, lng: 39.2218 },
    rating: 4.8,
    isOpen: true,
    description: "Harput’un tarihi dokusunu en iyi seyir noktalarından birinde keşfedin.",
    distance: 4.2
  },
  {
    id: "harput-ulu-cami",
    name: "Harput Ulu Camii",
    category: "museum",
    coordinate: { lat: 38.6333, lng: 39.2226 },
    rating: 4.7,
    isOpen: true,
    description: "Selçuklu izlerini taşıyan zarif mimari detaylar.",
    distance: 4.0
  },
  {
    id: "elazig-arkeoloji",
    name: "Elazığ Arkeoloji Müzesi",
    category: "museum",
    coordinate: { lat: 38.6852, lng: 39.2201 },
    rating: 4.6,
    isOpen: false,
    description: "Bölgenin tarihine kısa ama etkili bir zaman yolculuğu.",
    distance: 1.5
  },
  {
    id: "harput-tarihi-carsi",
    name: "Harput Tarihi Çarşı",
    category: "restaurant",
    coordinate: { lat: 38.6339, lng: 39.2232 },
    rating: 4.5,
    isOpen: true,
    description: "Lezzet rotanı çarşı içinde hızlıca kur: tatlı + kebap + çay.",
    distance: 3.9
  },
  {
    id: "diyar-kebap",
    name: "Diyar Elazığ Kebapçısı",
    category: "restaurant",
    coordinate: { lat: 38.6738, lng: 39.2247 },
    rating: 4.7,
    isOpen: true,
    description: "Et severlerin favorisi: köz tadı ve sıcak servis.",
    distance: 2.1
  },
  {
    id: "harput-cig-kofte",
    name: "Harput Çiğ Köfte",
    category: "restaurant",
    coordinate: { lat: 38.6691, lng: 39.2285 },
    rating: 4.6,
    isOpen: true,
    description: "Usta ellerden gelen klasik lezzet; hızlı atıştırmalık için ideal.",
    distance: 2.5
  },
  {
    id: "sultan-sofrasi",
    name: "Sultan Sofrası",
    category: "restaurant",
    coordinate: { lat: 38.6813, lng: 39.2149 },
    rating: 4.4,
    isOpen: false,
    description: "Gün batımına yakın saatlerde uğramalık, doyurucu menü.",
    distance: 1.2
  },
  {
    id: "fethi-sekin-stadi",
    name: "Fethi Sekin Şehir Stadyumu",
    category: "event",
    coordinate: { lat: 38.6888, lng: 39.2321 },
    rating: 4.3,
    isOpen: true,
    description: "Maç günleri ve etkinlik akışını yakından takip et.",
    distance: 2.8
  },
  {
    id: "kultur-park",
    name: "Kültür Park Etkinlik Alanı",
    category: "event",
    coordinate: { lat: 38.6727, lng: 39.2392 },
    rating: 4.6,
    isOpen: true,
    description: "Hafta sonu etkinlikleri ve canlı atmosfer.",
    distance: 2.3
  },
  {
    id: "firat-konser",
    name: "Fırat Konser Salonu",
    category: "event",
    coordinate: { lat: 38.6796, lng: 39.2099 },
    rating: 4.5,
    isOpen: false,
    description: "Önceden plan yap: anlık programlar için uygulama önerileri.",
    distance: 0.9
  },
  {
    id: "elazig-otogar",
    name: "Elazığ Otogarı",
    category: "transport",
    coordinate: { lat: 38.6859, lng: 39.2141 },
    rating: 4.2,
    isOpen: true,
    description: "Şehir içi ve şehirlerarası geçişler için merkezi nokta.",
    distance: 1.6
  },
  {
    id: "elazig-tren-gari",
    name: "Elazığ Tren Garı",
    category: "transport",
    coordinate: { lat: 38.6714, lng: 39.2272 },
    rating: 4.4,
    isOpen: true,
    description: "Günlük rotaya kolay entegre edilen ulaşım durağı.",
    distance: 1.8
  },
  {
    id: "elazig-havalimani",
    name: "Elazığ Havalimanı",
    category: "transport",
    coordinate: { lat: 38.5449, lng: 39.2284 },
    rating: 4.1,
    isOpen: true,
    description: "Varış-çıkış planını optimize etmek için ideal başlangıç noktası.",
    distance: 14.5
  },
  {
    id: "grand-elazig-hotel",
    name: "Grand Elazığ Otel",
    category: "hotel",
    coordinate: { lat: 38.6841, lng: 39.2186 },
    rating: 4.7,
    isOpen: true,
    description: "Konforlu konaklama ve şehir merkezine yakın konum.",
    distance: 1.1
  },
  {
    id: "harput-konak",
    name: "Harput Konakları",
    category: "hotel",
    coordinate: { lat: 38.6322, lng: 39.2212 },
    rating: 4.6,
    isOpen: true,
    description: "Harput’un tarihi atmosferi içinde sakin bir konaklama deneyimi.",
    distance: 4.4
  },
  {
    id: "perla-hotel",
    name: "Perla Elazığ Otel",
    category: "hotel",
    coordinate: { lat: 38.6723, lng: 39.2363 },
    rating: 4.4,
    isOpen: true,
    description: "Hem şehir merkezine yakın hem de dinlenme odaklı.",
    distance: 2.1
  },
  {
    id: "mesa-coffee",
    name: "Mesa Coffee Roastery",
    category: "restaurant",
    coordinate: { lat: 38.6755, lng: 39.2128 },
    rating: 4.5,
    isOpen: true,
    description: "Kahve tutkunları için aromatik bir durak.",
    distance: 0.8
  },
  {
    id: "city-bazaar",
    name: "Şehir Pazarı (Yerel Ürünler)",
    category: "event",
    coordinate: { lat: 38.6871, lng: 39.2173 },
    rating: 4.4,
    isOpen: false,
    description: "Yerel lezzetleri hızlıca deneyimlemek için kısa ziyaret rotası.",
    distance: 1.5
  }
];
