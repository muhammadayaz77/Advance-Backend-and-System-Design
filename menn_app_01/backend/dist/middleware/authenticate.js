import passport from "passport";
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next();
    }
    passport.authenticate("jwt", { session: false }, (_err, user) => {
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
}
//# sourceMappingURL=authenticate.js.map