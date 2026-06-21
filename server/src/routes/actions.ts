import express from "express";
import { requireAuth } from "../http/auth.js";
import { asyncHandler } from "../http/errors.js";
import { actionSchema } from "../validation.js";
import type { createRepositories } from "../repositories.js";

type Repositories = ReturnType<typeof createRepositories>;

export function createActionsRouter(repos: Repositories) {
  const router = express.Router();

  router.post(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      const input = actionSchema.parse(req.body);
      const id = repos.actions.create(req.user!.id, input);
      repos.progress.checkAndInsertMilestones(req.user!.id);
      res.status(201).json({
        action: { id, ...input },
        progress: repos.progress.summary(req.user!.id)
      });
    })
  );

  return router;
}
