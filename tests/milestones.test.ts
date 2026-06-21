import { describe, expect, it } from "vitest";
import { eligibleMilestones } from "../server/src/services/milestones";

describe("milestones", () => {
  it("celebrates first entry, action streak, and lower latest footprint", () => {
    expect(
      eligibleMilestones({
        entriesCount: 7,
        actionsCount: 3,
        averageKg: 12,
        latestKg: 9
      }).map((milestone) => milestone.code)
    ).toEqual(expect.arrayContaining(["first_entry", "week_tracker", "action_starter", "lower_than_average"]));
  });
});
