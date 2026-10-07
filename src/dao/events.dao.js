import { EventModel } from "../models/Event.js";

const publicProjection = "title description category date location capacity price status organizer createdAt updatedAt";

export const eventsDao = {
  findPublished() {
    return EventModel.find({ status: "published" }).select(publicProjection).sort({ date: 1 }).lean();
  },

  findById(id) {
    return EventModel.findById(id);
  },

  create(eventData) {
    return EventModel.create(eventData);
  },

  updateById(id, eventData) {
    return EventModel.findByIdAndUpdate(id, eventData, {
      new: true,
      runValidators: true
    });
  },

  findMany(filter, { skip, limit, sort }) {
    return EventModel.find(filter)
      .select(publicProjection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  },

  count(filter) {
    return EventModel.countDocuments(filter);
  }
};
