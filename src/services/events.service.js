import mongoose from "mongoose";
import { eventsRepository } from "../repositories/events.repository.js";
import { toEventDTO } from "../dto/event.dto.js";

const EVENT_STATUSES = ["draft", "published", "cancelled", "finished"];
const SORT_FIELDS = new Set(["date", "title", "price", "capacity", "createdAt"]);

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeRequiredString = (value, field) => {
  if (typeof value !== "string" || !value.trim()) {
    throw createError(`El campo ${field} es obligatorio`, 400);
  }
  return value.trim();
};

const validateFutureDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError("La fecha del evento no es válida", 400);
  }
  if (date <= new Date()) {
    throw createError("La fecha del evento debe ser futura", 400);
  }
  return date;
};

const validateCapacity = (capacity) => {
  const numericCapacity = Number(capacity);
  if (!Number.isFinite(numericCapacity) || numericCapacity <= 0) {
    throw createError("La capacidad debe ser mayor a 0", 400);
  }
  return numericCapacity;
};

const validatePrice = (price) => {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    throw createError("El precio no puede ser negativo", 400);
  }
  return numericPrice;
};

const validateStatus = (status) => {
  if (!EVENT_STATUSES.includes(status)) {
    throw createError("El estado del evento no es válido", 400);
  }
};

const buildFilter = (query) => {
  const filter = { status: "published" };

  if (query.status) {
    validateStatus(query.status);
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category.trim().toLowerCase();
  }

  if (query.location) {
    filter.location = { $regex: query.location.trim(), $options: "i" };
  }

  if (query.dateFrom || query.dateTo) {
    filter.date = {};

    if (query.dateFrom) {
      const dateFrom = new Date(query.dateFrom);
      if (Number.isNaN(dateFrom.getTime())) {
        throw createError("dateFrom no es una fecha válida", 400);
      }
      filter.date.$gte = dateFrom;
    }

    if (query.dateTo) {
      const dateTo = new Date(query.dateTo);
      if (Number.isNaN(dateTo.getTime())) {
        throw createError("dateTo no es una fecha válida", 400);
      }
      filter.date.$lte = dateTo;
    }
  }

  return filter;
};

export const eventsService = {
  async listEvents(query = {}) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    const sortParam = query.sort || "date";
    const sortField = sortParam.startsWith("-") ? sortParam.slice(1) : sortParam;

    if (!SORT_FIELDS.has(sortField)) {
      throw createError("Campo de ordenamiento no válido", 400);
    }

    const sort = { [sortField]: sortParam.startsWith("-") ? -1 : 1 };
    const filter = buildFilter(query);
    const total = await eventsRepository.countEvents(filter);
    const totalPages = Math.ceil(total / limit);
    const data = await eventsRepository.findEvents(filter, {
      skip: (page - 1) * limit,
      limit,
      sort
    });

    return {
      data: data.map(toEventDTO),
      page,
      limit,
      total,
      totalPages
    };
  },

  async getEventById(id) {
    if (!mongoose.isValidObjectId(id)) {
      throw createError("Evento no encontrado", 404);
    }

    const event = await eventsRepository.findById(id);
    if (!event || event.status !== "published") {
      throw createError("Evento no encontrado", 404);
    }

    return toEventDTO(event);
  },

  async createEvent(data, user) {
    const title = normalizeRequiredString(data.title, "title");
    const description = normalizeRequiredString(data.description, "description");
    const category = normalizeRequiredString(data.category, "category").toLowerCase();
    const location = normalizeRequiredString(data.location, "location");
    const date = validateFutureDate(data.date);
    const capacity = validateCapacity(data.capacity);
    const price = validatePrice(data.price ?? 0);
    const status = data.status ?? "draft";

    validateStatus(status);

    if (!mongoose.isValidObjectId(user.id)) {
      throw createError("Usuario autenticado inválido", 400);
    }

    if (status === "published" && date <= new Date()) {
      throw createError("No se puede publicar un evento con fecha pasada", 400);
    }

    const event = await eventsRepository.createEvent({
      title,
      description,
      category,
      date,
      location,
      capacity,
      price,
      status,
      organizer: user.id
    });

    return toEventDTO(event);
  },

  async updateEvent(id, data, user) {
    if (!mongoose.isValidObjectId(id)) {
      throw createError("Evento no encontrado", 404);
    }

    const event = await eventsRepository.findById(id);
    if (!event) {
      throw createError("Evento no encontrado", 404);
    }

    if (event.status === "cancelled") {
      throw createError("Los eventos cancelados no pueden modificarse", 400);
    }

    const isAdmin = user.role === "admin";
    const isOwner = event.organizer?.toString() === user.id;

    if (!isAdmin && !isOwner) {
      throw createError("No tenés permisos para modificar este evento", 403);
    }

    const updates = {};

    if (data.title !== undefined) updates.title = normalizeRequiredString(data.title, "title");
    if (data.description !== undefined) updates.description = normalizeRequiredString(data.description, "description");
    if (data.category !== undefined) updates.category = normalizeRequiredString(data.category, "category").toLowerCase();
    if (data.location !== undefined) updates.location = normalizeRequiredString(data.location, "location");
    if (data.capacity !== undefined) updates.capacity = validateCapacity(data.capacity);
    if (data.price !== undefined) updates.price = validatePrice(data.price);

    if (data.date !== undefined) {
      updates.date = validateFutureDate(data.date);
    }

    if (data.status !== undefined) {
      validateStatus(data.status);
      if (data.status === "published" && (event.status === "finished" || event.status === "cancelled")) {
        throw createError("No se puede publicar un evento finalizado o cancelado", 400);
      }
      updates.status = data.status;
    }

    const finalDate = updates.date ?? event.date;
    const finalStatus = updates.status ?? event.status;
    if (finalStatus === "published" && finalDate <= new Date()) {
      throw createError("No se puede publicar un evento con fecha pasada", 400);
    }

    const updatedEvent = await eventsRepository.updateEvent(id, updates);
    return toEventDTO(updatedEvent);
  },

  async updateStatus(id, status, user) {
    if (!mongoose.isValidObjectId(id)) {
      throw createError("Evento no encontrado", 404);
    }

    validateStatus(status);

    const event = await eventsRepository.findById(id);
    if (!event) {
      throw createError("Evento no encontrado", 404);
    }

    if (event.status === "cancelled") {
      throw createError("Los eventos cancelados no pueden cambiar de estado", 400);
    }

    const isAdmin = user.role === "admin";
    const isOwner = event.organizer?.toString() === user.id;

    if (!isAdmin && !isOwner) {
      throw createError("No tenés permisos para modificar este evento", 403);
    }

    if (status === "published" && event.date <= new Date()) {
      throw createError("No se puede publicar un evento con fecha pasada", 400);
    }

    const updatedEvent = await eventsRepository.updateEvent(id, { status });
    return toEventDTO(updatedEvent);
  }
};
