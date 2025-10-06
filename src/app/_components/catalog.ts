// catalog.ts
export type CatalogItem = {
  name: string;
  basePrice: number;   // unit price
  unit?: string;       // optional: "each", "bundle", etc.
};

export const itemsCatalog: Record<string, CatalogItem> = {
  balloonGarland: { name: "Balloon Garland", basePrice: 250, unit: "set" },
  backdropArch: { name: "Backdrop Arch", basePrice: 150, unit: "each" },
  teddyBear: { name: "Teddy Bear Prop", basePrice: 50, unit: "each" },
  hotAirBalloon: { name: "Hot Air Balloon Prop", basePrice: 100, unit: "each" },
  rocket: { name: "Rocket Prop", basePrice: 80, unit: "each" },
  airplaneTeddy: { name: "Airplane Teddy Prop", basePrice: 120, unit: "each" },
  cakePlinth: { name: "Cake Plinth", basePrice: 60, unit: "each" },
  neonSign: { name: "Neon Sign 'Happy Birthday'", basePrice: 90, unit: "each" },
  extraBalloons: { name: "Extra Balloons (bundle)", basePrice: 50, unit: "bundle" },
};
