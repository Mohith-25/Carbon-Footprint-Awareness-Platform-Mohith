import type { NextFunction, Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";
import { HttpError } from "./errors.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfTokenHandler(_req: Request, res: Response): void {
  const token = randomBytes(32).toString("hex");
  res.cookie("XSRF-TOKEN", token, {
    sameSite: "strict",
    secure: config.cookieSecure,
    httpOnly: false
  });
  res.json({ csrfToken: token });
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (safeMethods.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.["XSRF-TOKEN"];
  const headerToken = req.header("x-csrf-token");
  if (!cookieToken || !headerToken) {
    throw new HttpError(403, "CSRF token missing");
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  if (cookieBuffer.length !== headerBuffer.length || !timingSafeEqual(cookieBuffer, headerBuffer)) {
    throw new HttpError(403, "CSRF token invalid");
  }

  next();
}
