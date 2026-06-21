import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { config } from "../config.js";
import { HttpError } from "./errors.js";

export interface AuthUser {
  id: number;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"] });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie("auth_token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: config.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token;
  if (!token) {
    throw new HttpError(401, "Authentication required");
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthUser;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }
}
