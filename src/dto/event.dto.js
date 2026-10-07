export const toEventDTO = (event) => {
  if (!event) return null;

  return {
    id: event._id?.toString?.() ?? event.id?.toString?.() ?? event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    date: event.date,
    location: event.location,
    capacity: event.capacity,
    price: event.price,
    status: event.status,
    organizer: event.organizer?._id
      ? event.organizer._id.toString()
      : event.organizer?.toString?.() ?? event.organizer
  };
};
