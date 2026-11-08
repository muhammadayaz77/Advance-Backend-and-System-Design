import { ForbiddenError } from "../lib/errors.js";
export function requireFreelancer(req, _res, next) {
    const user = req.user;
    if (!user || user.accountType !== "freelancer") {
        throw new ForbiddenError("Freelancer account required");
    }
    next();
}
//# sourceMappingURL=require-freelancer.js.map