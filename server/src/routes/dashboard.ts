import express from "express";
import { requireAuth } from "../http/auth.js";
import { asyncHandler } from "../http/errors.js";
import { calculateFootprint } from "../services/carbonCalculator.js";
import { buildRecommendations } from "../services/recommendations.js";
import type { createRepositories } from "../repositories.js";

type Repositories = ReturnType<typeof createRepositories>;

export function createDashboardRouter(repos: Repositories) {
  const router = express.Router();

  router.get(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      const entries = repos.footprints.list(req.user!.id, 30);
      const actions = repos.actions.list(req.user!.id, 10);
      const progress = repos.progress.summary(req.user!.id);
      const latest = repos.footprints.latest(req.user!.id);
      const recommendations = latest
        ? buildRecommendations(latest, calculateFootprint(latest))
        : [
            {
              id: "first-log",
              title: "Log today to unlock personal insights",
              detail: "Add transport, energy, meals, and purchases. The calculator turns them into simple next steps.",
              impactKg: 0,
              category: "Getting started"
            }
          ];
      res.json({ entries, actions, progress, recommendations });
    })
  );

  return router;
}
