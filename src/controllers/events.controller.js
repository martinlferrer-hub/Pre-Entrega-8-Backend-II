import { eventsService } from "../services/events.service.js";

export const getEvents = async (req, res, next) => {
  try {
    const result = await eventsService.listEvents(req.query);
    res.status(200).json({ status: "success", ...result });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await eventsService.createEvent(req.body, req.user);
    res.status(201).json({ status: "success", payload: event });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body, req.user);
    res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    next(error);
  }
};

export const updateEventStatus = async (req, res, next) => {
  try {
    const event = await eventsService.updateStatus(req.params.id, req.body.status, req.user);
    res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    next(error);
  }
};
