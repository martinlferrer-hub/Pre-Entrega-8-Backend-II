import { eventsDao } from "../dao/events.dao.js";

export const eventsRepository = {
  findPublishedEvents() {
    return eventsDao.findPublished();
  },

  findById(id) {
    return eventsDao.findById(id);
  },

  createEvent(eventData) {
    return eventsDao.create(eventData);
  },

  updateEvent(id, eventData) {
    return eventsDao.updateById(id, eventData);
  },

  findEvents(filter, pagination) {
    return eventsDao.findMany(filter, pagination);
  },

  countEvents(filter) {
    return eventsDao.count(filter);
  }
};
