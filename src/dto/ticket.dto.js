import { toUserDTO } from "./user.dto.js";

export const toTicketDTO = (ticket) => {
  if (!ticket) return null;

  const userIsPopulated = ticket.user && typeof ticket.user === "object" && ticket.user._id;
  const eventIsPopulated = ticket.event && typeof ticket.event === "object" && ticket.event._id;

  return {
    id: ticket._id?.toString?.() ?? ticket.id?.toString?.() ?? ticket.id,
    user: userIsPopulated ? toUserDTO(ticket.user) : ticket.user?.toString?.() ?? ticket.user,
    event: eventIsPopulated
      ? {
          id: ticket.event._id.toString(),
          title: ticket.event.title,
          date: ticket.event.date,
          location: ticket.event.location
        }
      : ticket.event?.toString?.() ?? ticket.event,
    status: ticket.status,
    quantity: ticket.quantity,
    reservationCode: ticket.reservationCode,
    createdAt: ticket.createdAt,
    cancelledAt: ticket.cancelledAt ?? null
  };
};
