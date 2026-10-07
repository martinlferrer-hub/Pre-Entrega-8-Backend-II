import test from "node:test";
import assert from "node:assert/strict";
import { toAuthenticatedUserDTO, toUserDTO } from "../src/dto/user.dto.js";
import { toEventDTO } from "../src/dto/event.dto.js";
import { toTicketDTO } from "../src/dto/ticket.dto.js";

test("UserDTO nunca expone password", () => {
  const dto = toUserDTO({
    _id: "507f1f77bcf86cd799439011",
    first_name: "Ana",
    last_name: "Pérez",
    email: "ana@mail.com",
    password: "$2b$hash",
    role: "user"
  });

  assert.deepEqual(dto, {
    id: "507f1f77bcf86cd799439011",
    first_name: "Ana",
    last_name: "Pérez",
    email: "ana@mail.com",
    role: "user"
  });
  assert.equal("password" in dto, false);
});

test("AuthenticatedUserDTO devuelve solo identidad segura", () => {
  const dto = toAuthenticatedUserDTO({
    _id: "507f1f77bcf86cd799439011",
    email: "ana@mail.com",
    role: "organizer",
    password: "hash"
  });

  assert.deepEqual(dto, {
    id: "507f1f77bcf86cd799439011",
    email: "ana@mail.com",
    role: "organizer"
  });
});

test("EventDTO filtra la representación del evento", () => {
  const dto = toEventDTO({
    _id: "507f1f77bcf86cd799439012",
    title: "Evento",
    description: "Desc",
    category: "workshop",
    date: new Date("2030-01-01"),
    location: "Playa",
    capacity: 20,
    price: 100,
    status: "published",
    organizer: "507f1f77bcf86cd799439011",
    secretField: "no-debe-salir"
  });

  assert.equal(dto.title, "Evento");
  assert.equal("secretField" in dto, false);
});

test("TicketDTO con populate filtra password del usuario relacionado", () => {
  const dto = toTicketDTO({
    _id: "507f1f77bcf86cd799439013",
    user: {
      _id: "507f1f77bcf86cd799439011",
      first_name: "Ana",
      last_name: "Pérez",
      email: "ana@mail.com",
      role: "user",
      password: "hash-no-debe-salir"
    },
    event: {
      _id: "507f1f77bcf86cd799439012",
      title: "Evento",
      date: new Date("2030-01-01"),
      location: "Playa",
      secretField: "no"
    },
    status: "confirmed",
    quantity: 2,
    reservationCode: "EVT-ABC",
    createdAt: new Date("2026-01-01"),
    cancelledAt: null
  });

  assert.equal(dto.user.email, "ana@mail.com");
  assert.equal("password" in dto.user, false);
  assert.equal("secretField" in dto.event, false);
});
