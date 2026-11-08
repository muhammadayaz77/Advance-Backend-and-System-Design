import { ForbiddenError } from "../lib/errors.js";
export function requireClient(req, _res, next) {
    const user = req.user;
    if (!user || user.accountType !== "client") {
        throw new ForbiddenError("Client account required");
    }
    next();
}
//# sourceMappingURL=require-client.js.map