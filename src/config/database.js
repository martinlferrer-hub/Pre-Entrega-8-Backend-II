import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  if (!env.MONGO_URL) {
    throw new Error("MONGO_URL no está configurada.");
  }

  await mongoose.connect(env.MONGO_URL);
  console.log("Base de datos conectada");
};
