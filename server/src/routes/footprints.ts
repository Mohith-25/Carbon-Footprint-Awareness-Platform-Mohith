import express from "express";
import { requireAuth } from "../http/auth.js";
import { asyncHandler } from "../http/errors.js";
import { footprintSchema } from "../validation.js";
import { calculateFootprint } from "../services/carbonCalculator.js";
import { buildRecommendations } from "../services/recommendations.js";
import type { createRepositories } from "../repositories.js";

type Repositories = ReturnType<typeof createRepositories>;

export function createFootprintsRouter(repos: Repositories) {
  const router = express.Router();

  router.post(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      const input = footprintSchema.parse(req.body);
      const breakdown = calculateFootprint(input);
      const id = repos.footprints.create(req.user!.id, input, breakdown.total);
      repos.progress.checkAndInsertMilestones(req.user!.id);
      res.status(201).json({
        entry: { id, ...input, totalKg: breakdown.total },
        breakdown,
        recommendations: buildRecommendations(input, breakdown),
        progress: repos.progress.summary(req.user!.id)
      });
    })
  );

  router.get(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      const limit = Math.min(Number(req.query.limit ?? 30), 90);
      res.json({ entries: repos.footprints.list(req.user!.id, limit) });
    })
  );

  return router;
}
