const CITIES = [
  { flag: "🇹🇷", name: "İstanbul" },
  { flag: "🇫🇷", name: "Paris" },
  { flag: "🇯🇵", name: "Tokyo" },
  { flag: "🇬🇧", name: "Londra" },
  { flag: "🇮🇹", name: "Roma" },
  { flag: "🇪🇸", name: "Barselona" },
  { flag: "🇩🇪", name: "Berlin" },
  { flag: "🇺🇸", name: "New York" },
  { flag: "🇳🇱", name: "Amsterdam" },
  { flag: "🇬🇷", name: "Atina" },
  { flag: "🇵🇹", name: "Lizbon" },
  { flag: "🇸🇬", name: "Singapur" },
];

export function Ticker() {
  const items = CITIES.flatMap((c) => [
    <div key={`${c.name}-a`} className="tick-item"><span>{c.flag}</span><strong>{c.name}</strong></div>,
    <div key={`${c.name}-sep`} className="tick-item tick-sep">·</div>,
  ]);

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {items}
        {CITIES.flatMap((c) => [
          <div key={`${c.name}-b`} className="tick-item"><span>{c.flag}</span><strong>{c.name}</strong></div>,
          <div key={`${c.name}-sep2`} className="tick-item tick-sep">·</div>,
        ])}
      </div>
    </div>
  );
}
