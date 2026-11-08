import passport from "passport";
import { UnauthorizedError } from "../lib/errors.js";
export function requireRefreshToken(req, res, next) {
    passport.authenticate("jwt-refresh", { session: false }, (err, payload) => {
        if (err || !payload) {
            return next(new UnauthorizedError("Invalid or expired refresh token"));
        }
        req.user = payload;
        next();
    })(req, res, next);
}
//# sourceMappingURL=require-refresh-token.js.map