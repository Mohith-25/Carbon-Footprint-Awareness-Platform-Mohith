import express from "express";
import bcrypt from "bcryptjs";
import { requireAuth, setAuthCookie, signAuthToken } from "../http/auth.js";
import { asyncHandler, HttpError } from "../http/errors.js";
import { loginSchema, signupSchema } from "../validation.js";
import type { createRepositories } from "../repositories.js";

type Repositories = ReturnType<typeof createRepositories>;

export function createAuthRouter(repos: Repositories) {
  const router = express.Router();

  router.post(
    "/signup",
    asyncHandler(async (req, res) => {
      const body = signupSchema.parse(req.body);
      if (repos.users.findByEmail(body.email)) {
        throw new HttpError(409, "An account with this email already exists");
      }
      try {
        const user = await repos.users.create(body.name, body.email, body.password);
        setAuthCookie(res, signAuthToken({ id: user.id, email: user.email }));
        res.status(201).json({ user });
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        if (err.code === "SQLITE_CONSTRAINT" || err.message?.includes("UNIQUE constraint failed")) {
          throw new HttpError(409, "An account with this email already exists");
        }
        throw error;
      }
    })
  );

  router.post(
    "/login",
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

  router.post("/logout", (_req, res) => {
    res.clearCookie("auth_token");
    res.json({ ok: true });
  });

  router.get(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json({ user: repos.users.findPublicById(req.user!.id) });
    })
  );

  return router;
}
