import { TicketModel } from "../models/Ticket.js";

export const ticketsDao = {
  create(ticketData) {
    return TicketModel.create(ticketData);
  },

  findById(id) {
    return TicketModel.findById(id);
  },

  findActiveByUserAndEvent(userId, eventId) {
    return TicketModel.findOne({
      user: userId,
      event: eventId,
      status: { $in: ["confirmed", "pending"] }
    });
  },

  findByUser(userId) {
    return TicketModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("event", "title date location")
      .lean();
  },

  findByEvent(eventId) {
    return TicketModel.find({ event: eventId })
      .sort({ createdAt: -1 })
      .populate("user", "first_name last_name email role")
      .populate("event", "title date location")
      .lean();
  },

  sumActiveQuantityByEvent(eventId) {
    return TicketModel.aggregate([
      { $match: { event: eventId, status: { $in: ["confirmed", "pending"] } } },
      { $group: { _id: null, quantity: { $sum: "$quantity" } } }
    ]).then((result) => result[0]?.quantity ?? 0);
  },

  cancelById(id) {
    return TicketModel.findByIdAndUpdate(
      id,
      { status: "cancelled", cancelledAt: new Date() },
      { new: true, runValidators: true }
    );
  }
};
