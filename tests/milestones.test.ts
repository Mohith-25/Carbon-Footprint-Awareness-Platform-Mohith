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

  it("returns no milestones when counts are zero", () => {
    expect(
      eligibleMilestones({
        entriesCount: 0,
        actionsCount: 0,
        averageKg: 0,
        latestKg: 0
      })
    ).toEqual([]);
  });

  it("does not award lower_than_average when entriesCount is less than 2", () => {
    expect(
      eligibleMilestones({
        entriesCount: 1,
        actionsCount: 0,
        averageKg: 10,
        latestKg: 5
      }).map((milestone) => milestone.code)
    ).toEqual(["first_entry"]);
  });
});
