import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import type { Db } from "./db/database.js";
import { createRepositories } from "./repositories.js";
import { calculateFootprint } from "./services/carbonCalculator.js";
import { buildRecommendations } from "./services/recommendations.js";
import { requireAuth, setAuthCookie, signAuthToken } from "./http/auth.js";
import { asyncHandler, errorHandler, HttpError } from "./http/errors.js";
import { csrfProtection, csrfTokenHandler } from "./http/security.js";
import { actionSchema, footprintSchema, loginSchema, signupSchema } from "./validation.js";

export function createApp(db: Db) {
  const app = express();
  const repos = createRepositories(db);

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());
  app.use(csrfProtection);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/csrf", csrfTokenHandler);

  app.post(
    "/api/auth/signup",
    asyncHandler(async (req, res) => {
      const body = signupSchema.parse(req.body);
      if (repos.users.findByEmail(body.email)) {
        throw new HttpError(409, "An account with this email already exists");
      }
      const user = await repos.users.create(body.name, body.email, body.password);
      setAuthCookie(res, signAuthToken({ id: user.id, email: user.email }));
      res.status(201).json({ user });
    })
  );

  app.post(
    "/api/auth/login",
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const user = repos.users.findByEmail(body.email);
      if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
        throw new HttpError(401, "Invalid email or password");
      }
      setAuthCookie(res, signAuthToken({ id: user.id, email: user.email }));
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    })
  );

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token");
    res.json({ ok: true });
  });

  app.get(
    "/api/auth/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json({ user: repos.users.findPublicById(req.user!.id) });
    })
  );

  app.post(
    "/api/footprints",
    requireAuth,
    asyncHandler(async (req, res) => {
      const input = footprintSchema.parse(req.body);
      const breakdown = calculateFootprint(input);
      const id = repos.footprints.create(req.user!.id, input, breakdown.total);
      res.status(201).json({
        entry: { id, ...input, totalKg: breakdown.total },
        breakdown,
        recommendations: buildRecommendations(input, breakdown),
        progress: repos.progress.summary(req.user!.id)
      });
    })
  );

  app.get(
    "/api/footprints",
    requireAuth,
    asyncHandler(async (req, res) => {
      const limit = Math.min(Number(req.query.limit ?? 30), 90);
      res.json({ entries: repos.footprints.list(req.user!.id, limit) });
    })
  );

  app.get(
    "/api/dashboard",
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

  app.post(
    "/api/actions",
    requireAuth,
    asyncHandler(async (req, res) => {
      const input = actionSchema.parse(req.body);
      const id = repos.actions.create(req.user!.id, input);
      res.status(201).json({
        action: { id, ...input },
        progress: repos.progress.summary(req.user!.id)
      });
    })
  );

  app.use(errorHandler);
  return app;
}
