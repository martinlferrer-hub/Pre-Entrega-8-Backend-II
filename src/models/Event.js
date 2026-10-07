import { Schema, model } from "mongoose";

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "El título del evento es obligatorio."],
      trim: true
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria."],
      trim: true
    },
    category: {
      type: String,
      required: [true, "La categoría es obligatoria."],
      trim: true,
      lowercase: true
    },
    date: {
      type: Date,
      required: [true, "La fecha del evento es obligatoria."]
    },
    location: {
      type: String,
      required: [true, "La ubicación del evento es obligatoria."],
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, "La capacidad del evento es obligatoria."],
      min: [1, "La capacidad debe ser mayor a 0."]
    },
    price: {
      type: Number,
      required: [true, "El precio del evento es obligatorio."],
      min: [0, "El precio no puede ser negativo."]
    },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "finished"],
      default: "draft"
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "El organizador es obligatorio."]
    }
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ category: 1, date: 1 });
eventSchema.index({ location: 1, date: 1 });

export const EventModel = model("events", eventSchema);
