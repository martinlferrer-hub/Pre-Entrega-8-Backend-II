import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} no está definida en las variables de entorno.`);
  }

  return value;
};

export const env = {
  PORT: Number(process.env.PORT) || 8080,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URL: requiredEnv("MONGO_URL"),
  JWT_SECRET: requiredEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  MAIL_HOST: requiredEnv("MAIL_HOST"),
  MAIL_PORT: Number(process.env.MAIL_PORT) || 587,
  MAIL_USER: requiredEnv("MAIL_USER"),
  MAIL_PASS: requiredEnv("MAIL_PASS"),
  MAIL_FROM: requiredEnv("MAIL_FROM")
};
