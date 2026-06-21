import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../server/src/app";
import { createDatabase } from "../server/src/db/database";
import { runMigrations } from "../server/src/db/migrate";

async function createAgent() {
  const db = createDatabase(":memory:");
  runMigrations(db);
  const agent = request.agent(createApp(db));
  const csrf = await agent.get("/api/csrf");
  return { agent, csrfToken: csrf.body.csrfToken };
}

describe("api integration", () => {
  it("signs up, logs a footprint, and returns dashboard data", async () => {
    const { agent, csrfToken } = await createAgent();

    await agent
      .post("/api/auth/signup")
      .set("x-csrf-token", csrfToken)
      .send({ name: "Asha", email: "asha@example.com", password: "password123" })
      .expect(201);

    const footprint = await agent
      .post("/api/footprints")
      .set("x-csrf-token", csrfToken)
      .send({
        entryDate: "2026-06-21",
        transportKm: 6,
        transportMode: "public_transit",
        electricityKwh: 4,
        gasKwh: 1,
        dietType: "vegetarian",
        meals: 3,
        purchasesAmount: 5
      })
      .expect(201);

    expect(footprint.body.breakdown.total).toBeGreaterThan(0);

    const dashboard = await agent.get("/api/dashboard").expect(200);
    expect(dashboard.body.entries).toHaveLength(1);
    expect(dashboard.body.progress.milestones[0].code).toBe("first_entry");
  });

  it("rejects state changes without csrf", async () => {
    const { agent } = await createAgent();
    await agent.post("/api/auth/login").send({ email: "nobody@example.com", password: "x" }).expect(403);
  });
});
