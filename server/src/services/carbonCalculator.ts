import type { DietType, FootprintBreakdown, FootprintInput, TransportMode } from "../types.js";

const transportFactors: Record<TransportMode, number> = {
  walk_bike: 0,
  public_transit: 0.055,
  car: 0.192,
  electric_car: 0.053,
  flight: 0.255
};

const dietFactors: Record<DietType, number> = {
  plant_based: 1.7,
  vegetarian: 2.4,
  mixed: 3.3,
  meat_heavy: 5.0
};

export function roundKg(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateFootprint(input: FootprintInput): FootprintBreakdown {
  const transport = input.transportKm * transportFactors[input.transportMode];
  const energy = input.electricityKwh * 0.385 + input.gasKwh * 0.185;
  const diet = input.meals * dietFactors[input.dietType];
  const consumption = input.purchasesAmount * 0.35;
  const total = transport + energy + diet + consumption;

  return {
    transport: roundKg(transport),
    energy: roundKg(energy),
    diet: roundKg(diet),
    consumption: roundKg(consumption),
    total: roundKg(total)
  };
}
