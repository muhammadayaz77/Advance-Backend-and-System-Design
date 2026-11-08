import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import type { Request } from "express";
import { env } from "../../config/env.js";

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies["refresh_token"] || null;
  }
  return null;
};

export function registerJwtRefreshStrategy(): void {
  passport.use(
    "jwt-refresh",
    new JwtStrategy(
      {
        jwtFromRequest: cookieExtractor,
        secretOrKey: env.JWT_REFRESH_SECRET,
      },
      (payload, done) => {
        if (!payload || !payload.sub) {
          return done(null, false);
        }
        return done(null, payload);
      }
    )
  );
}

