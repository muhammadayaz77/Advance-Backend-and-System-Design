import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
export function registerJwtStrategy() {
    passport.use("jwt", new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: env.JWT_ACCESS_SECRET,
    }, async (payload, done) => {
        try {
            if (!payload?.sub) {
                return done(null, false);
            }
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || user.status !== "active") {
                return done(null, false);
            }
            return done(null, {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                accountType: user.accountType,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
            });
        }
        catch (error) {
            return done(error, false);
        }
    }));
}
//# sourceMappingURL=jwt.strategy.js.map