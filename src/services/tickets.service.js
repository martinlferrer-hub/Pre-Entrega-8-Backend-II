import mongoose from "mongoose";
import crypto from "node:crypto";
import { eventsRepository } from "../repositories/events.repository.js";
import { ticketsRepository } from "../repositories/tickets.repository.js";
import { usersRepository } from "../repositories/users.repository.js";
import { sendTicketConfirmation } from "../config/mailer.js";
import { toTicketDTO } from "../dto/ticket.dto.js";

const ACTIVE_STATUSES = ["confirmed", "pending"];
const createError = (message, status = 400) => Object.assign(new Error(message), { status });
const ensureObjectId = (id, message) => {
  if (!mongoose.isValidObjectId(id)) throw createError(message, 404);
};
const validateQuantity = (quantity) => {
  const value = Number(quantity);
  if (!Number.isInteger(value) || value <= 0) throw createError("La cantidad debe ser un número entero mayor a 0", 400);
  return value;
};

export const ticketsService = {
  async createTicket(eventId, user, quantity) {
    ensureObjectId(eventId, "Evento no encontrado");
    if (!user?.id || !mongoose.isValidObjectId(user.id)) throw createError("Usuario autenticado inválido", 401);

    const numericQuantity = validateQuantity(quantity);
    const event = await eventsRepository.findById(eventId);
    if (!event) throw createError("Evento no encontrado", 404);
    if (event.status !== "published") throw createError("El evento no está disponible para inscripciones", 400);
    if (event.date <= new Date()) throw createError("El evento ya finalizó y no admite inscripciones", 400);

    if (await ticketsRepository.findActiveTicket(user.id, eventId)) {
      throw createError("Ya tenés una inscripción activa para este evento", 409);
    }

    const occupied = await ticketsRepository.countActiveTickets(eventId);
    const available = event.capacity - occupied;
    if (available < numericQuantity) {
      throw createError(`No hay cupos suficientes. Disponibles: ${Math.max(available, 0)}`, 409);
    }

    const reservationCode = `EVT-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    let ticket;
    try {
      ticket = await ticketsRepository.createTicket({
        user: user.id,
        event: eventId,
        status: "confirmed",
        quantity: numericQuantity,
        reservationCode
      });
    } catch (error) {
      if (error.code === 11000) throw createError("Ya tenés una inscripción activa para este evento", 409);
      throw error;
    }

    try {
      const registeredUser = await usersRepository.findByEmail(user.email);
      await sendTicketConfirmation({
        to: user.email,
        firstName: registeredUser?.first_name,
        event,
        ticket
      });
    } catch {
      // La inscripción confirmada no se revierte si falla el correo.
    }

    return toTicketDTO(ticket);
  },

  async getMyTickets(userId) {
    if (!mongoose.isValidObjectId(userId)) throw createError("Usuario autenticado inválido", 401);
    const tickets = await ticketsRepository.findUserTickets(userId);
    return tickets.map(toTicketDTO);
  },

  async getEventTickets(eventId, user) {
    ensureObjectId(eventId, "Evento no encontrado");
    const event = await eventsRepository.findById(eventId);
    if (!event) throw createError("Evento no encontrado", 404);
    if (user.role !== "admin" && event.organizer?.toString() !== user.id) {
      throw createError("No tenés permisos para consultar las inscripciones de este evento", 403);
    }
    const tickets = await ticketsRepository.findEventTickets(eventId);
    return tickets.map(toTicketDTO);
  },

  async cancelTicket(ticketId, user) {
    ensureObjectId(ticketId, "Ticket no encontrado");
    const ticket = await ticketsRepository.findById(ticketId);
    if (!ticket) throw createError("Ticket no encontrado", 404);

    const isAdmin = user.role === "admin";
    const isOwner = ticket.user?.toString() === user.id;
    if (!isAdmin && !isOwner) throw createError("No tenés permisos para cancelar este ticket", 403);
    if (!ACTIVE_STATUSES.includes(ticket.status)) throw createError("El ticket ya está cancelado", 400);

    return toTicketDTO(await ticketsRepository.cancelTicket(ticketId));
  }
};
