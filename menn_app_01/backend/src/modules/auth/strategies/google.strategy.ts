import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from "passport-google-oauth20";
import { env } from "../../../config/env.js";

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export function registerGoogleStrategy(): void {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "⚠️  Google OAuth is disabled — GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set"
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email returned from Google"));
        }

        const googleProfile: GoogleProfile = {
          googleId: profile.id,
          email,
          fullName: profile.displayName ?? email,
          avatarUrl: profile.photos?.[0]?.value,
        };

        done(null, googleProfile);
      }
    )
  );
}
