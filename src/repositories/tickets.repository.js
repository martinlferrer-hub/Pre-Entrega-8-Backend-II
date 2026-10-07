import { ticketsDao } from "../dao/tickets.dao.js";

export const ticketsRepository = {
  createTicket(ticketData) {
    return ticketsDao.create(ticketData);
  },

  findById(id) {
    return ticketsDao.findById(id);
  },

  findActiveTicket(userId, eventId) {
    return ticketsDao.findActiveByUserAndEvent(userId, eventId);
  },

  findUserTickets(userId) {
    return ticketsDao.findByUser(userId);
  },

  findEventTickets(eventId) {
    return ticketsDao.findByEvent(eventId);
  },

  countActiveTickets(eventId) {
    return ticketsDao.sumActiveQuantityByEvent(eventId);
  },

  cancelTicket(id) {
    return ticketsDao.cancelById(id);
  }
};
