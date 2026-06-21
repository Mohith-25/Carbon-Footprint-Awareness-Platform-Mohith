export interface ProgressStats {
  entriesCount: number;
  actionsCount: number;
  averageKg: number;
  latestKg: number;
}

export function eligibleMilestones(stats: ProgressStats): Array<{ code: string; title: string }> {
  const milestones = [];
  if (stats.entriesCount >= 1) milestones.push({ code: "first_entry", title: "First footprint logged" });
  if (stats.entriesCount >= 7) milestones.push({ code: "week_tracker", title: "Seven days of climate awareness" });
  if (stats.actionsCount >= 3) milestones.push({ code: "action_starter", title: "Three eco-actions completed" });
  if (stats.entriesCount >= 2 && stats.latestKg < stats.averageKg) {
    milestones.push({ code: "lower_than_average", title: "Latest footprint beat your average" });
  }
  return milestones;
}
