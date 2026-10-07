import passport from "../config/passport.config.js";

export const auth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (error, user) => {
    if (error) return next(error);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "No autenticado"
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};
