import test from "node:test";
import assert from "node:assert/strict";
import { ticketsService } from "../src/services/tickets.service.js";
import { eventsRepository } from "../src/repositories/events.repository.js";
import { ticketsRepository } from "../src/repositories/tickets.repository.js";

const ids = {
  user: "507f1f77bcf86cd799439011",
  event: "507f1f77bcf86cd799439012",
  ticket: "507f1f77bcf86cd799439013"
};
const user = { id: ids.user, email: "user@mail.com", role: "user" };

const event = {
  _id: ids.event,
  status: "published",
  date: new Date(Date.now() + 86400000),
  capacity: 10,
  organizer: "507f1f77bcf86cd799439014"
};

test("rechaza inscripción cuando no hay cupos suficientes con 409", async () => {
  const originalFind = eventsRepository.findById;
  const originalActive = ticketsRepository.findActiveTicket;
  const originalCount = ticketsRepository.countActiveTickets;

  eventsRepository.findById = async () => event;
  ticketsRepository.findActiveTicket = async () => null;
  ticketsRepository.countActiveTickets = async () => 9;

  try {
    await assert.rejects(
      () => ticketsService.createTicket(ids.event, user, 2),
      { status: 409 }
    );
  } finally {
    eventsRepository.findById = originalFind;
    ticketsRepository.findActiveTicket = originalActive;
    ticketsRepository.countActiveTickets = originalCount;
  }
});

test("rechaza inscripción duplicada activa con 409", async () => {
  const originalFind = eventsRepository.findById;
  const originalActive = ticketsRepository.findActiveTicket;

  eventsRepository.findById = async () => event;
  ticketsRepository.findActiveTicket = async () => ({ _id: ids.ticket, status: "confirmed" });

  try {
    await assert.rejects(
      () => ticketsService.createTicket(ids.event, user, 1),
      { status: 409 }
    );
  } finally {
    eventsRepository.findById = originalFind;
    ticketsRepository.findActiveTicket = originalActive;
  }
});

test("un usuario no puede cancelar un ticket ajeno", async () => {
  const originalFind = ticketsRepository.findById;
  ticketsRepository.findById = async () => ({
    _id: ids.ticket,
    user: "507f1f77bcf86cd799439099",
    status: "confirmed"
  });

  try {
    await assert.rejects(
      () => ticketsService.cancelTicket(ids.ticket, user),
      { status: 403 }
    );
  } finally {
    ticketsRepository.findById = originalFind;
  }
});
