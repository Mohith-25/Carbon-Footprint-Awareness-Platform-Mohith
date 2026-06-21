import type { FootprintBreakdown, FootprintInput, Recommendation } from "../types.js";

export function buildRecommendations(input: FootprintInput, breakdown: FootprintBreakdown): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (breakdown.transport > 4 && input.transportMode === "car") {
    recommendations.push({
      id: "transport-transit",
      title: "Swap one car trip for transit or cycling",
      detail: "Start with one repeatable trip this week, such as a commute or errand under 8 km.",
      impactKg: 2.5,
      category: "Transportation"
    });
  }

  if (breakdown.energy > 5) {
    recommendations.push({
      id: "energy-evening",
      title: "Trim evening energy peaks",
      detail: "Run heavy appliances off-peak and set AC/heating one degree closer to outdoor temperature.",
      impactKg: 1.8,
      category: "Energy"
    });
  }

  if (input.dietType === "meat_heavy" || breakdown.diet > 9) {
    recommendations.push({
      id: "diet-plant-meal",
      title: "Make two meals plant-forward",
      detail: "Choose lentils, beans, tofu, or seasonal vegetables for two meals instead of red meat.",
      impactKg: 3.2,
      category: "Diet"
    });
  }

  if (breakdown.consumption > 3) {
    recommendations.push({
      id: "consumption-wait",
      title: "Use a 48-hour purchase pause",
      detail: "For non-essential purchases, wait two days and check whether repair, borrowing, or second-hand options work.",
      impactKg: 1.5,
      category: "Consumption"
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "steady-progress",
      title: "Protect your low-impact habits",
      detail: "Your latest entry is balanced. Pick one habit to repeat three times this week.",
      impactKg: 0.8,
      category: "Progress"
    });
  }

  return recommendations;
}
