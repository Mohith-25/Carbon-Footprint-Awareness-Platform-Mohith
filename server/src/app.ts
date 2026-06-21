import { existsSync } from "node:fs";
import { join } from "node:path";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import type { Db } from "./db/database.js";
import { createRepositories } from "./repositories.js";
import { errorHandler } from "./http/errors.js";
import { csrfProtection, csrfTokenHandler } from "./http/security.js";
import { createAuthRouter } from "./routes/auth.js";
import { createFootprintsRouter } from "./routes/footprints.js";
import { createActionsRouter } from "./routes/actions.js";
import { createDashboardRouter } from "./routes/dashboard.js";

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

  // Register modular routers
  app.use("/api/auth", createAuthRouter(repos));
  app.use("/api/footprints", createFootprintsRouter(repos));
  app.use("/api/actions", createActionsRouter(repos));
  app.use("/api/dashboard", createDashboardRouter(repos));

  const clientBuildPath = join(process.cwd(), "dist", "client");
  if (existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get(/.*/, (_req, res) => {
      res.sendFile(join(clientBuildPath, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}
