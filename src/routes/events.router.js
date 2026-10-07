import { Router } from "express";
import passport from "../config/passport.config.js";
import { getEvents, getEventById, createEvent, updateEvent, updateEventStatus } from "../controllers/events.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

// Lectura pública: solo eventos publicados.
router.get("/", getEvents);
router.get("/:id", getEventById);

// Creación y modificación: autenticación + autorización por rol.
router.post("/", auth, authorize("organizer", "admin"), createEvent);
router.put("/:id", auth, authorize("organizer", "admin"), updateEvent);
router.patch("/:id/status", auth, authorize("organizer", "admin"), updateEventStatus);

export default router;
