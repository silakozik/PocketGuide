export interface StaticPOI {
  id: string;
  name: string;
  category: 'sim' | 'transport_card' | 'exchange';
  address: string;
  lat: number;
  lng: number;
  openingHours?: string;
  tip?: string;
}

export interface StaticRouteStop {
  order: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: 'culture' | 'food';
  tip: string;
}

export interface StaticEvent {
  id: string;
  name: string;
  location: string;
  time: string;
  category: string;
  tip?: string;
}

export interface TransportCardInfo {
  name: string;
  cost: string;
  whereToBuy: string;
  howToLoad: string;
  tip: string;
}

export interface CityStaticData {
  slug: string;
  nameTr: string;
  center: [number, number];
  pois: StaticPOI[];
  route: StaticRouteStop[];
  events: StaticEvent[];
  transportCard?: TransportCardInfo;
}

const SLUG_ALIASES: Record<string, string> = {
  london: 'londra',
  rome: 'roma',
};

const CITY_DATA: Record<string, CityStaticData> = {
  istanbul: {
    slug: 'istanbul',
    nameTr: 'İstanbul',
    center: [41.0082, 28.9784],
    transportCard: {
      name: 'Istanbulkart',
      cost: '70 ₺ (kart) + yükleme',
      whereToBuy: 'Metro istasyonları, biletmatikler, marketler',
      howToLoad: 'Biletmatik veya Istanbulkart mobil uygulaması',
      tip: 'Havalimanından şehre giderken kart almayı unutma — otobüs/metro için şart.',
    },
    pois: [
      { id: 'ist-sim-1', name: 'Turkcell Mağazası — Taksim', category: 'sim', address: 'Taksim Meydanı, Beyoğlu', lat: 41.037, lng: 28.985, openingHours: '09:00–21:00', tip: 'Pasaportunla git, eSIM de alabilirsin.' },
      { id: 'ist-sim-2', name: 'Vodafone Store — Kadıköy', category: 'sim', address: 'Bahariye Cad., Kadıköy', lat: 40.990, lng: 29.028, openingHours: '10:00–20:00' },
      { id: 'ist-trans-1', name: 'Istanbulkart Biletmatik — Eminönü', category: 'transport_card', address: 'Eminönü Metro İstasyonu', lat: 41.017, lng: 28.970, tip: 'En yoğun noktalardan biri, kart hemen hazır.' },
      { id: 'ist-ex-1', name: 'Döviz Bürosu — Grand Bazaar', category: 'exchange', address: 'Kapalıçarşı girişi, Fatih', lat: 41.011, lng: 28.968, openingHours: '09:00–19:00', tip: 'Merkez bankası kurlarına yakın oran ara.' },
    ],
    route: [
      { order: 1, name: 'Ayasofya', address: 'Sultanahmet Meydanı', lat: 41.0086, lng: 28.9802, category: 'culture', tip: 'Sabah erken git, kalabalıktan kaçın.' },
      { order: 2, name: 'Sultanahmet Camii', address: 'Sultanahmet', lat: 41.0054, lng: 28.9768, category: 'culture', tip: 'Giriş ücretsiz, namaz saatlerine dikkat et.' },
      { order: 3, name: 'Topkapı Sarayı', address: 'Cankurtaran, Fatih', lat: 41.0115, lng: 28.9833, category: 'culture', tip: 'Harem bölümü ayrı bilet.' },
      { order: 4, name: 'Hamdi Restaurant', address: 'Eminönü', lat: 41.0167, lng: 28.9706, category: 'food', tip: 'Manzaralı kebap — önceden rezervasyon önerilir.' },
      { order: 5, name: 'Galata Kulesi', address: 'Beyoğlu', lat: 41.0256, lng: 28.9744, category: 'culture', tip: 'Gün batımı için ideal.' },
    ],
    events: [
      { id: 'ist-ev-1', name: 'Boğaz Tekne Turu', location: 'Eminönü İskelesi', time: '10:00 – 18:00', category: 'Tur', tip: 'Kısa tur 1 saat, uzun tur 2 saat.' },
      { id: 'ist-ev-2', name: 'Türk Sanat Müziği Konseri', location: 'Galata Kulesi', time: '20:00', category: 'Müzik' },
    ],
  },
  londra: {
    slug: 'londra',
    nameTr: 'Londra',
    center: [51.5074, -0.1278],
    transportCard: {
      name: 'Oyster Card / Contactless',
      cost: '£7 (deposit) + yükleme',
      whereToBuy: 'Tube istasyonları, Heathrow Express, Visitor Centres',
      howToLoad: 'Tube istasyonundaki makineler veya contactless banka kartı',
      tip: 'Contactless kart günlük tavan uygular — turistler için genelde en kolay seçenek.',
    },
    pois: [
      { id: 'lon-sim-1', name: 'Three Store — Oxford Street', category: 'sim', address: 'Oxford St, London W1', lat: 51.515, lng: -0.142, openingHours: '09:00–21:00', tip: 'eSIM için pasaport yeterli.' },
      { id: 'lon-sim-2', name: 'EE Store — Covent Garden', category: 'sim', address: 'Covent Garden, WC2', lat: 51.512, lng: -0.122, openingHours: '10:00–20:00' },
      { id: 'lon-trans-1', name: 'Oyster Ticket Stop — King\'s Cross', category: 'transport_card', address: 'King\'s Cross St. Pancras', lat: 51.530, lng: -0.124, tip: 'Heathrow\'dan gelince burada kart alabilirsin.' },
      { id: 'lon-ex-1', name: 'Thomas Exchange Global', category: 'exchange', address: 'Strand, WC2', lat: 51.511, lng: -0.119, openingHours: '09:30–18:00', tip: 'Merkez bankası kurlarına yakın.' },
    ],
    route: [
      { order: 1, name: 'Big Ben & Westminster', address: 'Westminster, SW1', lat: 51.5007, lng: -0.1246, category: 'culture', tip: 'Fotoğraf için en iyi açı: Westminster Bridge.' },
      { order: 2, name: 'British Museum', address: 'Great Russell St, WC1', lat: 51.5194, lng: -0.1270, category: 'culture', tip: 'Giriş ücretsiz, Rosetta Taşı mutlaka gör.' },
      { order: 3, name: 'Borough Market', address: '8 Southwark St, SE1', lat: 51.5055, lng: -0.0910, category: 'food', tip: 'Öğle yemeği için ideal — Cuma-Cumartesi en canlı.' },
      { order: 4, name: 'Tower Bridge', address: 'Tower Bridge Rd, SE1', lat: 51.5055, lng: -0.0754, category: 'culture', tip: 'Köprü üstü yürüyüşü ücretli, dışarıdan ücretsiz.' },
    ],
    events: [
      { id: 'lon-ev-1', name: 'West End Müzikali', location: 'Covent Garden', time: '19:30', category: 'Tiyatro', tip: 'Son dakika biletleri tkts booth\'tan alınabilir.' },
      { id: 'lon-ev-2', name: 'Thames Nehir Turu', location: 'Westminster Pier', time: '11:00 – 17:00', category: 'Tur' },
    ],
  },
  paris: {
    slug: 'paris',
    nameTr: 'Paris',
    center: [48.8566, 2.3522],
    transportCard: {
      name: 'Navigo Easy / Ticket t+',
      cost: '2 € (tek bilet) veya 10\'lu carnet',
      whereToBuy: 'Metro istasyonları, tabac (tütüncü)',
      howToLoad: 'Biletmatik veya Navigo Easy kart',
      tip: 'Turist pass (Paris Visite) 1-5 gün için mantıklı olabilir.',
    },
    pois: [
      { id: 'par-sim-1', name: 'Orange Store — Champs-Élysées', category: 'sim', address: 'Av. des Champs-Élysées', lat: 48.869, lng: 2.307, openingHours: '10:00–20:00' },
      { id: 'par-trans-1', name: 'Navigo Satış — Gare du Nord', category: 'transport_card', address: 'Gare du Nord', lat: 48.880, lng: 2.355 },
      { id: 'par-ex-1', name: 'Change Group — Opéra', category: 'exchange', address: 'Place de l\'Opéra', lat: 48.872, lng: 2.332, openingHours: '09:00–19:00' },
    ],
    route: [
      { order: 1, name: 'Eyfel Kulesi', address: 'Champ de Mars, 5 Av. Anatole France', lat: 48.8584, lng: 2.2945, category: 'culture', tip: 'Bilet online al — kuyruk kısalır.' },
      { order: 2, name: 'Louvre Müzesi', address: 'Rue de Rivoli', lat: 48.8606, lng: 2.3376, category: 'culture', tip: 'Salı kapalı; Çarşamba-Pazar geç saate açık.' },
      { order: 3, name: 'Le Marais — Falafel', address: 'Rue des Rosiers', lat: 48.8575, lng: 2.3590, category: 'food', tip: 'L\'As du Fallafel sıra beklemeye değer.' },
    ],
    events: [
      { id: 'par-ev-1', name: 'Seine Nehir Turu', location: 'Bateaux-Mouches, Pont de l\'Alma', time: '14:00', category: 'Tur' },
    ],
  },
  roma: {
    slug: 'roma',
    nameTr: 'Roma',
    center: [41.9028, 12.4964],
    transportCard: {
      name: 'Roma Pass / BIT Metro Bileti',
      cost: '1,50 € (tek yolculuk)',
      whereToBuy: 'Tabacchi, metro istasyonları',
      howToLoad: 'Biletmatik veya tabacchi\'den',
      tip: 'Roma Pass 48/72 saat müze + ulaşım paketi sunar.',
    },
    pois: [
      { id: 'rom-sim-1', name: 'TIM Store — Via del Corso', category: 'sim', address: 'Via del Corso, Roma', lat: 41.902, lng: 12.480, openingHours: '09:30–19:30' },
      { id: 'rom-trans-1', name: 'Metro Bilet — Termini', category: 'transport_card', address: 'Stazione Termini', lat: 41.901, lng: 12.501 },
      { id: 'rom-ex-1', name: 'Cambio Valuta — Termini', category: 'exchange', address: 'Via Marsala, Termini', lat: 41.900, lng: 12.502, openingHours: '08:00–20:00' },
    ],
    route: [
      { order: 1, name: 'Colosseum', address: 'Piazza del Colosseo', lat: 41.8902, lng: 12.4922, category: 'culture', tip: 'Online bilet şart — kapıda uzun kuyruk.' },
      { order: 2, name: 'Vatican Museums', address: 'Vatican City', lat: 41.9065, lng: 12.4536, category: 'culture', tip: 'Cuma akşamı daha az kalabalık.' },
      { order: 3, name: 'Roscioli', address: 'Via dei Giubbonari', lat: 41.8956, lng: 12.4770, category: 'food', tip: 'Carbonara için rezervasyon yap.' },
    ],
    events: [
      { id: 'rom-ev-1', name: 'Vatican Papal Audience', location: 'St. Peter\'s Square', time: '10:00', category: 'Dini', tip: 'Çarşamba sabahları — ücretsiz bilet gerekir.' },
    ],
  },
  barcelona: {
    slug: 'barcelona',
    nameTr: 'Barcelona',
    center: [41.3874, 2.1686],
    transportCard: {
      name: 'T-Casual (10 yolculuk)',
      cost: '12,15 €',
      whereToBuy: 'Metro istasyonları, tabac',
      howToLoad: 'Biletmatik',
      tip: 'Havalimanı metro hattı ayrı ücret — Aerobús da alternatif.',
    },
    pois: [
      { id: 'bcn-sim-1', name: 'Movistar Store — Plaça Catalunya', category: 'sim', address: 'Plaça de Catalunya', lat: 41.387, lng: 2.170, openingHours: '10:00–21:00' },
      { id: 'bcn-trans-1', name: 'T-Mobilitat — Sants', category: 'transport_card', address: 'Estació de Sants', lat: 41.379, lng: 2.140 },
      { id: 'bcn-ex-1', name: 'Exact Change — La Rambla', category: 'exchange', address: 'La Rambla 124', lat: 41.381, lng: 2.173, openingHours: '09:00–21:00' },
    ],
    route: [
      { order: 1, name: 'Sagrada Familia', address: 'Carrer de Mallorca, 401', lat: 41.4036, lng: 2.1744, category: 'culture', tip: 'Zaman dilimli bilet al.' },
      { order: 2, name: 'Park Güell', address: 'Carrer d\'Olot', lat: 41.4145, lng: 2.1527, category: 'culture', tip: 'Monumental zone biletli, dış alan ücretsiz.' },
      { order: 3, name: 'La Boqueria', address: 'La Rambla, 91', lat: 41.3816, lng: 2.1715, category: 'food', tip: 'Sabah erken git — taze meyve suyu dene.' },
    ],
    events: [
      { id: 'bcn-ev-1', name: 'Flamenco Gösterisi', location: 'El Tablao de Carmen', time: '20:00', category: 'Müzik' },
    ],
  },
  amsterdam: {
    slug: 'amsterdam',
    nameTr: 'Amsterdam',
    center: [52.3676, 4.9041],
    transportCard: {
      name: 'OV-chipkaart',
      cost: '7,50 € (kart) + yükleme',
      whereToBuy: 'NS istasyonları, GVB ofisleri',
      howToLoad: 'Sarı makineler veya NS uygulaması',
      tip: 'Check-in/check-out yapmayı unutma — ceza uygulanır.',
    },
    pois: [
      { id: 'ams-sim-1', name: 'KPN Store — Damrak', category: 'sim', address: 'Damrak 1', lat: 52.374, lng: 4.896, openingHours: '10:00–18:00' },
      { id: 'ams-trans-1', name: 'OV-chipkaart — Centraal', category: 'transport_card', address: 'Amsterdam Centraal', lat: 52.379, lng: 4.900 },
      { id: 'ams-ex-1', name: 'GWK Travelex — Schiphol', category: 'exchange', address: 'Schiphol Airport', lat: 52.310, lng: 4.768, openingHours: '07:00–22:00' },
    ],
    route: [
      { order: 1, name: 'Rijksmuseum', address: 'Museumstraat 1', lat: 52.3600, lng: 4.8852, category: 'culture', tip: 'Rembrandt\'ın Gece Devriyesi burada.' },
      { order: 2, name: 'Anne Frank Evi', address: 'Westermarkt 20', lat: 52.3752, lng: 4.8840, category: 'culture', tip: 'Bilet haftalar öncesinden al.' },
      { order: 3, name: 'Foodhallen', address: 'Bellamyplein 51', lat: 52.3667, lng: 4.8677, category: 'food', tip: 'Street food çeşitliliği — akşam canlı.' },
    ],
    events: [
      { id: 'ams-ev-1', name: 'Canal Cruise', location: 'Central Station Pier', time: '10:00 – 18:00', category: 'Tur' },
    ],
  },
  tokyo: {
    slug: 'tokyo',
    nameTr: 'Tokyo',
    center: [35.6762, 139.6503],
    transportCard: {
      name: 'Suica / Pasmo',
      cost: '500 ¥ (deposit) + yükleme',
      whereToBuy: 'JR istasyonları, havalimanı',
      howToLoad: 'Biletmatik — İngilizce menü mevcut',
      tip: 'Apple/Google Pay\'e Suica eklenebilir — fiziksel kart şart değil.',
    },
    pois: [
      { id: 'tky-sim-1', name: 'SoftBank Store — Shibuya', category: 'sim', address: 'Shibuya, Tokyo', lat: 35.659, lng: 139.700, openingHours: '10:00–20:00' },
      { id: 'tky-trans-1', name: 'Suica Satış — Tokyo Station', category: 'transport_card', address: 'Tokyo Station JR', lat: 35.681, lng: 139.767 },
      { id: 'tky-ex-1', name: 'Travelex — Narita Airport', category: 'exchange', address: 'Narita T1', lat: 35.764, lng: 140.386, openingHours: '07:00–21:00' },
    ],
    route: [
      { order: 1, name: 'Senso-ji Temple', address: 'Asakusa, Taito', lat: 35.7148, lng: 139.7967, category: 'culture', tip: 'Nakamise caddesinde atıştırmalık dene.' },
      { order: 2, name: 'Shibuya Crossing', address: 'Shibuya, Tokyo', lat: 35.6595, lng: 139.7004, category: 'culture', tip: 'Starbucks\'tan yukarıdan fotoğraf çek.' },
      { order: 3, name: 'Tsukiji Outer Market', address: 'Tsukiji, Chuo', lat: 35.6654, lng: 139.7707, category: 'food', tip: 'Sabah erken git — taze sushi kahvaltısı.' },
    ],
    events: [
      { id: 'tky-ev-1', name: 'TeamLab Borderless', location: 'Azabudai Hills', time: '10:00 – 19:00', category: 'Sanat' },
    ],
  },
  'new-york': {
    slug: 'new-york',
    nameTr: 'New York',
    center: [40.7128, -74.006],
    transportCard: {
      name: 'MetroCard / OMNY Contactless',
      cost: '2,90 $ (tek yolculuk)',
      whereToBuy: 'Metro istasyonları, bilet makineleri',
      howToLoad: 'Makine veya contactless banka kartı',
      tip: '7 günlük unlimited pass yoğun gezginler için mantıklı.',
    },
    pois: [
      { id: 'nyc-sim-1', name: 'T-Mobile — Times Square', category: 'sim', address: 'Times Square, NY', lat: 40.758, lng: -73.985, openingHours: '09:00–21:00' },
      { id: 'nyc-trans-1', name: 'MetroCard — Penn Station', category: 'transport_card', address: 'Penn Station', lat: 40.750, lng: -73.994 },
      { id: 'nyc-ex-1', name: 'Travelex — JFK Airport', category: 'exchange', address: 'JFK Terminal 4', lat: 40.644, lng: -73.782, openingHours: '06:00–23:00' },
    ],
    route: [
      { order: 1, name: 'Statue of Liberty', address: 'Liberty Island', lat: 40.6892, lng: -74.0445, category: 'culture', tip: 'Ferry bileti online al — erken saat tercih et.' },
      { order: 2, name: 'Central Park', address: 'Manhattan', lat: 40.7829, lng: -73.9654, category: 'culture', tip: 'Yürüyüş veya bisiklet kiralama.' },
      { order: 3, name: 'Katz\'s Delicatessen', address: '205 E Houston St', lat: 40.7223, lng: -73.9874, category: 'food', tip: 'Pastrami sandviç efsanevi.' },
    ],
    events: [
      { id: 'nyc-ev-1', name: 'Broadway Müzikali', location: 'Times Square', time: '20:00', category: 'Tiyatro', tip: 'TKTS booth\'tan indirimli bilet.' },
    ],
  },
  dubai: {
    slug: 'dubai',
    nameTr: 'Dubai',
    center: [25.2048, 55.2708],
    transportCard: {
      name: 'Nol Card (Red / Silver)',
      cost: '25 AED (Silver kart) + yükleme',
      whereToBuy: 'Metro istasyonları, RTA ofisleri',
      howToLoad: 'Biletmatik veya Nol Pay uygulaması',
      tip: 'Metro sohbet ve yemek yasak — ceza uygulanır.',
    },
    pois: [
      { id: 'dxb-sim-1', name: 'Etisalat Store — Dubai Mall', category: 'sim', address: 'Dubai Mall', lat: 25.197, lng: 55.279, openingHours: '10:00–22:00' },
      { id: 'dxb-trans-1', name: 'Nol Card — Burj Khalifa/Dubai Mall Metro', category: 'transport_card', address: 'Burj Khalifa Metro', lat: 25.195, lng: 55.275 },
      { id: 'dxb-ex-1', name: 'Al Ansari Exchange — Deira', category: 'exchange', address: 'Al Rigga Rd, Deira', lat: 25.263, lng: 55.308, openingHours: '08:00–22:00' },
    ],
    route: [
      { order: 1, name: 'Burj Khalifa', address: '1 Sheikh Mohammed bin Rashid Blvd', lat: 25.1972, lng: 55.2744, category: 'culture', tip: 'At the Top biletini gün batımı için al.' },
      { order: 2, name: 'Dubai Mall', address: 'Financial Centre Rd', lat: 25.1985, lng: 55.2796, category: 'culture', tip: 'Akvaryum ve su gösterisi aynı kompleks.' },
      { order: 3, name: 'Al Mallah', address: 'Al Dhiyafah Rd', lat: 25.2340, lng: 55.2640, category: 'food', tip: 'Shawarma ve falafel — yerel favori.' },
    ],
    events: [
      { id: 'dxb-ev-1', name: 'Dubai Fountain Show', location: 'Dubai Mall Lake', time: '18:00 – 23:00', category: 'Gösteri', tip: 'Her 30 dakikada bir — ücretsiz.' },
    ],
  },
  sydney: {
    slug: 'sydney',
    nameTr: 'Sydney',
    center: [-33.8688, 151.2093],
    transportCard: {
      name: 'Opal Card',
      cost: 'Ücretsiz kart + yükleme',
      whereToBuy: 'Newsagent, metro istasyonları, havalimanı',
      howToLoad: 'Opal Travel uygulaması veya yükleme noktaları',
      tip: 'Pazar günleri günlük tavan 2,90 AUD — çok ekonomik.',
    },
    pois: [
      { id: 'syd-sim-1', name: 'Telstra Store — Pitt Street', category: 'sim', address: 'Pitt St Mall, Sydney', lat: -33.869, lng: 151.207, openingHours: '09:00–17:30' },
      { id: 'syd-trans-1', name: 'Opal Card — Central Station', category: 'transport_card', address: 'Central Station', lat: -33.883, lng: 151.206 },
      { id: 'syd-ex-1', name: 'Travelex — Sydney Airport', category: 'exchange', address: 'SYD T1', lat: -33.946, lng: 151.177, openingHours: '06:00–22:00' },
    ],
    route: [
      { order: 1, name: 'Sydney Opera House', address: 'Bennelong Point', lat: -33.8568, lng: 151.2153, category: 'culture', tip: 'Guided tour veya dışarıdan fotoğraf — ikisi de güzel.' },
      { order: 2, name: 'Harbour Bridge', address: 'Sydney Harbour', lat: -33.8523, lng: 151.2108, category: 'culture', tip: 'BridgeClimb pahalı ama eşsiz manzara.' },
      { order: 3, name: 'Bondi Beach', address: 'Bondi Beach NSW', lat: -33.8915, lng: 151.2767, category: 'food', tip: 'Icebergs Club\'ta brunch — manzara harika.' },
    ],
    events: [
      { id: 'syd-ev-1', name: 'Vivid Sydney Light Walk', location: 'Circular Quay', time: '18:00 – 23:00', category: 'Festival', tip: 'Mayıs-Haziran aylarında — ışık enstalasyonları.' },
    ],
  },
};

export function getCityStaticData(slug: string): CityStaticData | null {
  const resolved = SLUG_ALIASES[slug.toLowerCase()] ?? slug;
  return CITY_DATA[resolved] ?? null;
}
