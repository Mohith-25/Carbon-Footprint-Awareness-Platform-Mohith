import { describe, expect, it } from "vitest";
import { calculateFootprint } from "../server/src/services/carbonCalculator";
import { buildRecommendations } from "../server/src/services/recommendations";

describe("carbon calculator", () => {
  it("calculates category and total emissions", () => {
    const result = calculateFootprint({
      entryDate: "2026-06-21",
      transportKm: 10,
      transportMode: "car",
      electricityKwh: 8,
      gasKwh: 2,
      dietType: "mixed",
      meals: 3,
      purchasesAmount: 20
    });

    expect(result.transport).toBe(1.92);
    expect(result.energy).toBe(3.45);
    expect(result.diet).toBe(9.9);
    expect(result.consumption).toBe(7);
    expect(result.total).toBe(22.27);
  });

  it("generates recommendations from high-impact categories", () => {
    const input = {
      entryDate: "2026-06-21",
      transportKm: 40,
      transportMode: "car" as const,
      electricityKwh: 20,
      gasKwh: 5,
      dietType: "meat_heavy" as const,
      meals: 3,
      purchasesAmount: 30
    };

    const recommendations = buildRecommendations(input, calculateFootprint(input));
    expect(recommendations.map((item) => item.id)).toEqual(
      expect.arrayContaining(["transport-transit", "energy-evening", "diet-plant-meal", "consumption-wait"])
    );
  });
});
