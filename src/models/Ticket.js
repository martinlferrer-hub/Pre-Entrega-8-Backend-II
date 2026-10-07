import { Schema, model } from "mongoose";

const ticketSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "El usuario es obligatorio."]
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "events",
      required: [true, "El evento es obligatorio."]
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed"
    },
    quantity: {
      type: Number,
      required: [true, "La cantidad es obligatoria."],
      min: [1, "La cantidad debe ser mayor a 0."]
    },
    reservationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Una inscripción activa por usuario y evento. Los tickets cancelados no bloquean una nueva inscripción.
ticketSchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["confirmed", "pending"] } }
  }
);

ticketSchema.index({ event: 1, status: 1 });
ticketSchema.index({ user: 1, createdAt: -1 });

export const TicketModel = model("tickets", ticketSchema);
