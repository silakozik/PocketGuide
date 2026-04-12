import { TransferRoute, TransportCard } from "../types/transfer";

export const TRANSPORT_CARDS: TransportCard[] = [
  {
    city: "İstanbul",
    name: "İstanbulkart",
    whereToBuy: "Biletmatik makineleri, büfeler ve yetkili satış noktaları.",
    howToTopUp: "Biletmatikler, İstanbulkart mobil uygulaması ve NFC destekli telefonlar.",
    initialCost: "₺70.00 (Boş kart ücreti)",
    depositWarning: "Kart bedeli iade edilemez, ancak bakiye aktarılabilir."
  },
  {
    city: "London",
    name: "Oyster Card",
    whereToBuy: "Tube stations, Oyster Ticket Stops, and Visitor Centres.",
    howToTopUp: "Ticket machines, online, or via the TfL Oyster app.",
    initialCost: "£7.00 (Deposit)",
    depositWarning: "The deposit is refundable if you return the card."
  }
];

export const TRANSFER_ROUTES: TransferRoute[] = [
  {
    id: "ist-havaist-1",
    city: "İstanbul",
    type: "airport",
    mode: "bus",
    name: "Havaist HVİST-14",
    from: "İstanbul Havalimanı (IST)",
    to: "Taksim Meydanı",
    duration: 90,
    fee: "₺170.00",
    frequency: "30 dakikada bir",
    hours: "24 Saat",
    steps: [
      { instruction: "Havalimanı -2. katındaki otobüs peronlarına inin.", subInstruction: "14 numaralı peronu bulun." },
      { instruction: "Havaist HVİST-14 otobüsüne binin.", subInstruction: "Ödemeyi kredi kartı veya İstanbulkart ile yapabilirsiniz." },
      { instruction: "Taksim durağında inin.", subInstruction: "Durağın hemen yanında M2 Metro hattı girişi bulunur." }
    ]
  },
  {
    id: "ist-m11",
    city: "İstanbul",
    type: "airport",
    mode: "metro",
    name: "M11 Gayrettepe Metrosu",
    from: "İstanbul Havalimanı (IST)",
    to: "Gayrettepe / Kağıthane",
    duration: 35,
    fee: "₺22.00",
    frequency: "20 dakikada bir",
    hours: "06:00 - 00:00",
    steps: [
      { instruction: "Havalimanı içinden 'Metro' tabelalarını takip edin.", subInstruction: "Yaklaşık 10-15 dk yürüme mesafesindedir." },
      { instruction: "M11 Kağıthane/Gayrettepe yönüne binin.", subInstruction: "Gayrettepe istasyonunda M2 hattına aktarma yapabilirsiniz." }
    ]
  },
  {
    id: "ist-marmaray",
    city: "İstanbul",
    type: "city",
    mode: "train",
    name: "Marmaray (Banliyö)",
    from: "Halkalı",
    to: "Gebze",
    duration: 115,
    fee: "₺15.00 - ₺44.00",
    frequency: "8-15 dakikada bir",
    hours: "06:00 - 00:00",
    steps: [
      { instruction: "İstasyon girişindeki turnikelerden İstanbulkart ile geçin.", subInstruction: "Girişte tam ücret çekilir, çıkışta iade almayı unutmayın." },
      { instruction: "Trenin yönüne dikkat ederek perona inin.", subInstruction: "Anadolu yakası için Gebze, Avrupa yakası için Halkalı yönü." }
    ],
    isNight: false
  },
  {
    id: "lon-heathrow-exp",
    city: "London",
    type: "airport",
    mode: "train",
    name: "Heathrow Express",
    from: "Heathrow Airport",
    to: "Paddington Station",
    duration: 15,
    fee: "£25.00",
    frequency: "Every 15 mins",
    hours: "05:00 - 00:00",
    steps: [
      { instruction: "Follow 'Trains' signs in the terminal.", subInstruction: "Available from Terminals 2, 3, and 5." },
      { instruction: "Board the non-stop train to Paddington.", subInstruction: "Wifi and power sockets available on board." }
    ]
  },
  {
    id: "lon-elizabeth",
    city: "London",
    type: "city",
    mode: "train",
    name: "Elizabeth Line",
    from: "Heathrow / Reading",
    to: "Abbey Wood / Shenfield",
    duration: 45,
    fee: "£12.80",
    frequency: "Every 10-15 mins",
    hours: "05:30 - 00:00",
    steps: [
      { instruction: "Enter the station using Oyster or Contactless.", subInstruction: "Look for the purple 'Elizabeth Line' signs." },
      { instruction: "Travel through central London (Paddington, Bond St, Liverpool St).", subInstruction: "Air-conditioned and very fast." }
    ]
  }
];
