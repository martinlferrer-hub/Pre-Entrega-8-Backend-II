import { env } from "../config/env.js";
import { sessionsService } from "../services/sessions.service.js";
import { generateToken } from "../utils/jwt.js";

const getCookieOptions = (nodeEnv) => ({
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 1000,
  secure: nodeEnv === "production"
});

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await sessionsService.getSessions();
    res.status(200).json({ status: "success", payload: sessions });
  } catch (error) {
    next(error);
  }
};

export const register = (req, res) => {
  res.status(201).json({ status: "success", payload: req.user });
};

export const login = (req, res) => {
  const user = req.user;
  const token = generateToken(user);
  res.cookie("currentUser", token, getCookieOptions(env.NODE_ENV));
  res.status(200).json({ status: "success", message: "Login correcto" });
};

export const current = (req, res) => {
  res.status(200).json({ status: "success", payload: sessionsService.current(req.user) });
};

export const logout = (req, res) => {
  res.clearCookie("currentUser", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production"
  });
  res.status(200).json({ status: "success", message: "Sesión cerrada" });
};
