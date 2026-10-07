import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    first_name: {
      type: String,
      required: [true, "El nombre del usuario es obligatorio."],
      trim: true
    },
    last_name: {
      type: String,
      required: [true, "El apellido del usuario es obligatorio."],
      trim: true
    },
    email: {
      type: String,
      required: [true, "El email del usuario es obligatorio."],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "La contraseña del usuario es obligatoria."],
      select: false
    },
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user"
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = model("users", userSchema);
