import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import {
  createTicket,
  getMyTickets,
  getEventTickets,
  cancelTicket
} from "../controllers/tickets.controller.js";

const router = Router();

router.post("/events/:eid/tickets", auth, createTicket);
router.get("/tickets/my-tickets", auth, getMyTickets);
router.get(
  "/events/:eid/tickets",
  auth,
  authorize("organizer", "admin"),
  getEventTickets
);
router.patch("/tickets/:tid/cancel", auth, cancelTicket);

export default router;
