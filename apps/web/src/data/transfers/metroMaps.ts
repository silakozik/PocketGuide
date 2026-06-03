/** Şematik metro diyagramları — coğrafi değil, anlaşılır hat gösterimi */

export interface MetroStation {
  x: number;
  y: number;
  name: string;
  lineIds: string[];
  hub?: boolean;
}

export interface MetroLineDef {
  id: string;
  name: string;
  color: string;
  /** SVG line: x1,y1,x2,y2 veya path d */
  geometry:
    | { type: "line"; x1: number; y1: number; x2: number; y2: number }
    | { type: "path"; d: string };
}

export interface CityMetroMap {
  cityId: string;
  cityName: string;
  systemName: string;
  viewBox: string;
  lines: MetroLineDef[];
  stations: MetroStation[];
  tip: string;
}

export const CITY_METRO_MAPS: Record<string, CityMetroMap> = {
  istanbul: {
    cityId: "istanbul",
    cityName: "İstanbul",
    systemName: "İstanbul Metro & Marmaray",
    viewBox: "0 0 400 250",
    lines: [
      { id: "m1", name: "M1", color: "#e8c547", geometry: { type: "line", x1: 28, y1: 68, x2: 372, y2: 68 } },
      { id: "m2", name: "M2", color: "#4a8fd4", geometry: { type: "line", x1: 28, y1: 128, x2: 372, y2: 128 } },
      { id: "m3", name: "M3", color: "#2ecc8a", geometry: { type: "line", x1: 200, y1: 18, x2: 200, y2: 232 } },
      { id: "m4", name: "M4", color: "#a078d4", geometry: { type: "path", d: "M 38 196 Q 200 176 362 196" } },
    ],
    stations: [
      { x: 78, y: 68, name: "Levent", lineIds: ["m1"] },
      { x: 138, y: 68, name: "Osmanbey", lineIds: ["m1"] },
      { x: 200, y: 68, name: "Taksim", lineIds: ["m1", "m3"], hub: true },
      { x: 200, y: 128, name: "Şişhane", lineIds: ["m2", "m3"], hub: true },
      { x: 268, y: 128, name: "Haliç", lineIds: ["m2"] },
      { x: 200, y: 210, name: "Kadıköy", lineIds: ["m4"] },
    ],
    tip: "Taksim ve Şişhane ana aktarma noktalarıdır. M1–M2 aktarması için Taksim yürüyüş koridorunu kullanın.",
  },
  paris: {
    cityId: "paris",
    cityName: "Paris",
    systemName: "Paris Métro & RER",
    viewBox: "0 0 400 250",
    lines: [
      { id: "m1", name: "M1", color: "#ffcd00", geometry: { type: "line", x1: 30, y1: 125, x2: 370, y2: 125 } },
      { id: "m4", name: "M4", color: "#be4192", geometry: { type: "line", x1: 80, y1: 220, x2: 320, y2: 40 } },
      { id: "m12", name: "M12", color: "#008c5a", geometry: { type: "line", x1: 120, y1: 30, x2: 280, y2: 220 } },
      { id: "rer-a", name: "RER A", color: "#f7403a", geometry: { type: "path", d: "M 40 80 Q 200 50 360 90" } },
    ],
    stations: [
      { x: 120, y: 125, name: "Louvre", lineIds: ["m1", "m12"], hub: true },
      { x: 200, y: 125, name: "Châtelet", lineIds: ["m1", "m4", "rer-a"], hub: true },
      { x: 280, y: 125, name: "Bastille", lineIds: ["m1", "m4"] },
      { x: 200, y: 70, name: "Gare du Nord", lineIds: ["rer-a", "m4"] },
    ],
    tip: "Châtelet–Les Halles en büyük aktarma merkezidir. RER hızlı banliyö, Metro şehir içi için idealdir.",
  },
  tokyo: {
    cityId: "tokyo",
    cityName: "Tokyo",
    systemName: "Tokyo Metro & JR",
    viewBox: "0 0 400 250",
    lines: [
      { id: "yamanote", name: "Yamanote", color: "#9acd32", geometry: { type: "path", d: "M 80 125 Q 80 50 200 40 Q 320 50 320 125 Q 320 200 200 210 Q 80 200 80 125 Z" } },
      { id: "ginza", name: "Ginza", color: "#f39700", geometry: { type: "line", x1: 40, y1: 180, x2: 360, y2: 70 } },
      { id: "marunouchi", name: "Marunouchi", color: "#e60012", geometry: { type: "line", x1: 60, y1: 60, x2: 340, y2: 190 } },
    ],
    stations: [
      { x: 200, y: 125, name: "Shinjuku", lineIds: ["yamanote", "marunouchi"], hub: true },
      { x: 320, y: 125, name: "Shibuya", lineIds: ["yamanote", "ginza"], hub: true },
      { x: 200, y: 40, name: "Tokyo", lineIds: ["yamanote", "marunouchi"], hub: true },
      { x: 80, y: 125, name: "Ikebukuro", lineIds: ["yamanote"] },
    ],
    tip: "Yamanote hattı (JR) turistik aksın etrafında döner. Metro hatları için Suica ile ayrı giriş turnikeleri vardır.",
  },
  londra: {
    cityId: "londra",
    cityName: "Londra",
    systemName: "London Underground",
    viewBox: "0 0 400 250",
    lines: [
      { id: "central", name: "Central", color: "#e32017", geometry: { type: "line", x1: 30, y1: 125, x2: 370, y2: 125 } },
      { id: "northern", name: "Northern", color: "#000000", geometry: { type: "line", x1: 200, y1: 25, x2: 200, y2: 225 } },
      { id: "victoria", name: "Victoria", color: "#0098d4", geometry: { type: "line", x1: 100, y1: 200, x2: 300, y2: 50 } },
      { id: "circle", name: "Circle", color: "#ffd300", geometry: { type: "path", d: "M 90 125 Q 200 60 310 125 Q 200 190 90 125" } },
    ],
    stations: [
      { x: 200, y: 125, name: "Bank", lineIds: ["central", "northern", "circle"], hub: true },
      { x: 120, y: 125, name: "Oxford Circus", lineIds: ["central", "victoria"], hub: true },
      { x: 200, y: 70, name: "King's Cross", lineIds: ["northern", "victoria", "circle"] },
      { x: 280, y: 125, name: "Liverpool St", lineIds: ["central", "circle"] },
    ],
    tip: "Oxford Circus ve Bank yoğun aktarma noktalarıdır. Oyster veya temassız kart ile giriş yapın; günlük tavan (cap) uygulanır.",
  },
  roma: {
    cityId: "roma",
    cityName: "Roma",
    systemName: "Roma Metro",
    viewBox: "0 0 400 250",
    lines: [
      { id: "a", name: "Linea A", color: "#ff7f00", geometry: { type: "line", x1: 40, y1: 140, x2: 360, y2: 140 } },
      { id: "b", name: "Linea B", color: "#0066cc", geometry: { type: "line", x1: 200, y1: 30, x2: 200, y2: 220 } },
      { id: "c", name: "Linea C", color: "#00a651", geometry: { type: "line", x1: 60, y1: 200, x2: 340, y2: 80 } },
    ],
    stations: [
      { x: 200, y: 140, name: "Termini", lineIds: ["a", "b"], hub: true },
      { x: 120, y: 140, name: "Vatican", lineIds: ["a"] },
      { x: 200, y: 80, name: "Spagna", lineIds: ["b"] },
      { x: 280, y: 140, name: "San Giovanni", lineIds: ["a", "c"] },
    ],
    tip: "Termini ana istasyondur (havalimanı treni + Metro A/B). BIT biletini ilk kullanımda validate edin.",
  },
  barcelona: {
    cityId: "barcelona",
    cityName: "Barcelona",
    systemName: "TMB Metro",
    viewBox: "0 0 400 250",
    lines: [
      { id: "l1", name: "L1", color: "#ce1126", geometry: { type: "line", x1: 30, y1: 180, x2: 370, y2: 180 } },
      { id: "l3", name: "L3", color: "#2e8b57", geometry: { type: "line", x1: 50, y1: 60, x2: 350, y2: 200 } },
      { id: "l5", name: "L5", color: "#005eb8", geometry: { type: "line", x1: 200, y1: 30, x2: 200, y2: 220 } },
    ],
    stations: [
      { x: 200, y: 140, name: "Diagonal", lineIds: ["l3", "l5"], hub: true },
      { x: 200, y: 180, name: "Pl. Catalunya", lineIds: ["l1", "l3"], hub: true },
      { x: 120, y: 180, name: "Espanya", lineIds: ["l1", "l3"] },
      { x: 200, y: 70, name: "Sagrera", lineIds: ["l5"] },
    ],
    tip: "Plaça Catalunya merkez aktarmadır. L3 turistik aks (Liceu, Drassanes) için en kullanışlı hattır.",
  },
  dubai: {
    cityId: "dubai",
    cityName: "Dubai",
    systemName: "Dubai Metro",
    viewBox: "0 0 400 250",
    lines: [
      { id: "red", name: "Red Line", color: "#e4002b", geometry: { type: "line", x1: 200, y1: 25, x2: 200, y2: 225 } },
      { id: "green", name: "Green Line", color: "#00a651", geometry: { type: "line", x1: 40, y1: 160, x2: 360, y2: 160 } },
      { id: "branch", name: "Route 2020", color: "#f59e0b", geometry: { type: "path", d: "M 200 120 Q 280 100 320 60" } },
    ],
    stations: [
      { x: 200, y: 60, name: "Burj Khalifa", lineIds: ["red"], hub: true },
      { x: 200, y: 160, name: "Union", lineIds: ["red", "green"], hub: true },
      { x: 80, y: 160, name: "Creek", lineIds: ["green"] },
      { x: 200, y: 200, name: "Jebel Ali", lineIds: ["red"] },
    ],
    tip: "Union istasyonu Red–Green aktarma merkezidir. Gold Class vagonları daha az kalabalıktır.",
  },
  amsterdam: {
    cityId: "amsterdam",
    cityName: "Amsterdam",
    systemName: "GVB Metro & Tram",
    viewBox: "0 0 400 250",
    lines: [
      { id: "m52", name: "M52", color: "#f9e000", geometry: { type: "line", x1: 200, y1: 30, x2: 200, y2: 220 } },
      { id: "m54", name: "M54", color: "#00a0e2", geometry: { type: "line", x1: 60, y1: 125, x2: 340, y2: 125 } },
      { id: "t2", name: "Tram 2", color: "#e30613", geometry: { type: "path", d: "M 50 180 Q 200 100 350 70" } },
    ],
    stations: [
      { x: 200, y: 125, name: "Centraal", lineIds: ["m52", "m54", "t2"], hub: true },
      { x: 120, y: 125, name: "Rijksmuseum", lineIds: ["m54"] },
      { x: 200, y: 70, name: "Noord", lineIds: ["m52"] },
      { x: 280, y: 125, name: "Amstel", lineIds: ["m54"] },
    ],
    tip: "Centraal istasyonundan tram ve metro aktarmaları yapılır. OV-chipkaart ile check-in ve check-out zorunludur.",
  },
  sydney: {
    cityId: "sydney",
    cityName: "Sydney",
    systemName: "Sydney Metro & Light Rail",
    viewBox: "0 0 400 250",
    lines: [
      { id: "t1", name: "T1", color: "#f99d1c", geometry: { type: "path", d: "M 60 180 Q 200 40 340 100" } },
      { id: "t2", name: "T2", color: "#00954c", geometry: { type: "line", x1: 40, y1: 140, x2: 360, y2: 140 } },
      { id: "metro", name: "Metro", color: "#0085ca", geometry: { type: "line", x1: 200, y1: 30, x2: 200, y2: 220 } },
    ],
    stations: [
      { x: 200, y: 140, name: "Circular Quay", lineIds: ["t1", "t2", "metro"], hub: true },
      { x: 120, y: 140, name: "Town Hall", lineIds: ["t2", "metro"] },
      { x: 280, y: 100, name: "Central", lineIds: ["t1", "t2"] },
      { x: 200, y: 70, name: "Barangaroo", lineIds: ["metro"] },
    ],
    tip: "Circular Quay hem tren hem feribot iskelesidir. Opal kart ile tüm modlarda aynı kartı kullanın.",
  },
  "new-york": {
    cityId: "new-york",
    cityName: "New York",
    systemName: "NYC Subway",
    viewBox: "0 0 400 250",
    lines: [
      { id: "1", name: "1", color: "#ee352e", geometry: { type: "line", x1: 180, y1: 25, x2: 180, y2: 225 } },
      { id: "a", name: "A/C", color: "#0039a6", geometry: { type: "line", x1: 60, y1: 200, x2: 340, y2: 60 } },
      { id: "7", name: "7", color: "#b933ad", geometry: { type: "line", x1: 30, y1: 90, x2: 370, y2: 90 } },
      { id: "l", name: "L", color: "#a7a9ac", geometry: { type: "line", x1: 40, y1: 170, x2: 360, y2: 170 } },
    ],
    stations: [
      { x: 180, y: 125, name: "Times Sq", lineIds: ["1", "7", "l"], hub: true },
      { x: 180, y: 70, name: "Columbus Cir", lineIds: ["1", "a"] },
      { x: 260, y: 90, name: "Grand Central", lineIds: ["7", "l"] },
      { x: 120, y: 170, name: "14 St", lineIds: ["l", "a"] },
    ],
    tip: "Times Square–42 St en büyük aktarma merkezidir. Express (hızlı) ve Local (yerel) trenlere dikkat edin.",
  },
};

const CITY_NAME_TO_ID: Record<string, string> = {
  İstanbul: "istanbul",
  Paris: "paris",
  Tokyo: "tokyo",
  Londra: "londra",
  Roma: "roma",
  Barcelona: "barcelona",
  Dubai: "dubai",
  Amsterdam: "amsterdam",
  Sydney: "sydney",
  "New York": "new-york",
};

export function getMetroMapByCityName(cityNameTr: string): CityMetroMap | null {
  const id = CITY_NAME_TO_ID[cityNameTr];
  return id ? CITY_METRO_MAPS[id] ?? null : null;
}
