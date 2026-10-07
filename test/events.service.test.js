import test from "node:test";
import assert from "node:assert/strict";
import { eventsService } from "../src/services/events.service.js";
import { eventsRepository } from "../src/repositories/events.repository.js";

const futureDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const user = { id: "507f1f77bcf86cd799439011", email: "org@mail.com", role: "organizer" };
const admin = { id: "507f191e810c19729de860ea", email: "admin@mail.com", role: "admin" };
const otherId = "507f1f77bcf86cd799439012";

const baseEvent = {
  _id: "507f1f77bcf86cd799439013",
  title: "Workshop Node",
  description: "Workshop de Node.js",
  category: "workshop",
  date: new Date(futureDate()),
  location: "Playa del Carmen",
  capacity: 50,
  price: 10,
  status: "draft",
  organizer: user.id
};

test("rechaza crear un evento con fecha pasada", async () => {
  await assert.rejects(
    () => eventsService.createEvent({
      title: "Evento",
      description: "Descripción",
      category: "workshop",
      date: new Date(Date.now() - 60_000).toISOString(),
      location: "Playa del Carmen",
      capacity: 10,
      price: 0
    }, user),
    { status: 400, message: "La fecha del evento debe ser futura" }
  );
});

test("rechaza capacity menor o igual a cero", async () => {
  await assert.rejects(
    () => eventsService.createEvent({
      title: "Evento",
      description: "Descripción",
      category: "workshop",
      date: futureDate(),
      location: "Playa del Carmen",
      capacity: 0,
      price: 0
    }, user),
    { status: 400, message: "La capacidad debe ser mayor a 0" }
  );
});

test("un organizer no puede modificar un evento ajeno", async () => {
  const originalFind = eventsRepository.findById;
  eventsRepository.findById = async () => ({ ...baseEvent, organizer: otherId });

  try {
    await assert.rejects(
      () => eventsService.updateEvent(baseEvent._id, { title: "Intento" }, user),
      { status: 403 }
    );
  } finally {
    eventsRepository.findById = originalFind;
  }
});

test("un admin puede modificar un evento ajeno", async () => {
  const originalFind = eventsRepository.findById;
  const originalUpdate = eventsRepository.updateEvent;
  eventsRepository.findById = async () => ({ ...baseEvent, organizer: otherId });
  eventsRepository.updateEvent = async (_id, updates) => ({ ...baseEvent, ...updates, organizer: otherId });

  try {
    const updated = await eventsService.updateEvent(baseEvent._id, { title: "Actualizado" }, admin);
    assert.equal(updated.title, "Actualizado");
  } finally {
    eventsRepository.findById = originalFind;
    eventsRepository.updateEvent = originalUpdate;
  }
});

test("un evento cancelado no puede cambiar de estado", async () => {
  const originalFind = eventsRepository.findById;
  eventsRepository.findById = async () => ({ ...baseEvent, status: "cancelled" });

  try {
    await assert.rejects(
      () => eventsService.updateStatus(baseEvent._id, "published", user),
      { status: 400, message: "Los eventos cancelados no pueden cambiar de estado" }
    );
  } finally {
    eventsRepository.findById = originalFind;
  }
});
