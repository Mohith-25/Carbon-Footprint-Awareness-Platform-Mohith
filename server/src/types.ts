export type TransportMode = "walk_bike" | "public_transit" | "car" | "electric_car" | "flight";
export type DietType = "plant_based" | "vegetarian" | "mixed" | "meat_heavy";

export interface FootprintInput {
  entryDate: string;
  transportKm: number;
  transportMode: TransportMode;
  electricityKwh: number;
  gasKwh: number;
  dietType: DietType;
  meals: number;
  purchasesAmount: number;
  notes?: string;
}

export interface FootprintBreakdown {
  transport: number;
  energy: number;
  diet: number;
  consumption: number;
  total: number;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  impactKg: number;
  category: string;
}
