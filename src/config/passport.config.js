import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { env } from "./env.js";
import { sessionsService } from "../services/sessions.service.js";

const cookieExtractor = (req) => req?.cookies?.currentUser ?? null;

passport.use(
  "register",
  new CustomStrategy(async (req, done) => {
    try {
      const user = await sessionsService.register(req.body);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.use(
  "login",
  new LocalStrategy(
    { usernameField: "email", passwordField: "password", session: false },
    async (email, password, done) => {
      try {
        const user = await sessionsService.login(email, password);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  "jwt",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: env.JWT_SECRET
    },
    async (payload, done) => {
      try {
        if (!payload?.id || !payload?.email || !payload?.role) {
          return done(null, false);
        }
        return done(null, {
          id: payload.id,
          email: payload.email,
          role: payload.role
        });
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
