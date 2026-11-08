import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import { env } from "../../config/env.js";
const cookieExtractor = (req) => {
    if (req && req.cookies) {
        return req.cookies["refresh_token"] || null;
    }
    return null;
};
export function registerJwtRefreshStrategy() {
    passport.use("jwt-refresh", new JwtStrategy({
        jwtFromRequest: cookieExtractor,
        secretOrKey: env.JWT_REFRESH_SECRET,
    }, (payload, done) => {
        if (!payload || !payload.sub) {
            return done(null, false);
        }
        return done(null, payload);
    }));
}
//# sourceMappingURL=jwt-refresh.strategy.js.map