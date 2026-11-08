import { UnauthorizedError } from "../lib/errors.js";
export function requireAuth(req, _res, next) {
    if (!req.user) {
        throw new UnauthorizedError("Authentication required");
    }
    next();
}
//# sourceMappingURL=require-auth.js.map